import path from 'node:path';
import matter from 'gray-matter';
import { RepoConfig } from './config';
import { buildContentsUrl, fetchJson, fetchRepositoryFileText, GitHubContentEntry } from './github.service';
import { getRepoContext, RepoContext, fetchRepoMetrics } from './repo.service';
import { getServerSupabaseClient } from './db/supabase';
import type { BadgeType } from './badge.service';
import { generateBadges } from './badge.service';
import { calculateSkillScore } from './ranking.service';
import { logSupabaseError } from './services/supabase-errors';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type SkillStatus = 'draft' | 'stable' | 'recommended' | 'deprecated';

/** Documento de skill normalizado para renderizado y búsqueda. */
export interface SkillDoc {
  /** Identificador único estable del skill dentro del portal. */
  id: string;
  /** Título visible del skill. */
  title: string;
  /** Descripción breve del skill. */
  description: string;
  /** Etiquetas de clasificación temáticas. */
  tags: string[];
  /** Id del repositorio origen. */
  repoId: string;
  /** Nombre técnico de la skill (frontmatter.name o fallback de carpeta). */
  name: string;
  /** Nombre del repositorio origen. */
  repoName: string;
  /** Ruta interna del portal para el detalle del skill. */
  url: string;
  /** Contenido markdown original del SKILL.md. */
  content: string;
  /** Ruta relativa del archivo SKILL.md dentro del repositorio origen. */
  sourcePath: string;
  /** Frameworks principales de la skill para filtros. */
  frameworks: string[];
  /** Tipos de prueba soportados por la skill. */
  testTypes: string[];
  /** Nivel de complejidad estimado para consumo. */
  level: SkillLevel;
  /** Estado editorial de la skill. */
  status: SkillStatus;
  /** Version declarada por frontmatter o skill.json. */
  version: string;
  /** Tiempo estimado de adopcion en minutos. */
  estimatedTime: number | null;
  /** Indica si el skill incluye ejemplos. */
  hasExamples: boolean;
  /** Indica si el skill incluye plantillas. */
  hasTemplates: boolean;
  /** Indica si el skill incluye evaluaciones. */
  hasEvals: boolean;
  /** Indica si el skill incluye scripts de apoyo. */
  hasScripts: boolean;
  /** Comandos sugeridos para ejecutar o validar la skill. */
  recommendedCommands: string[];
  /** Badges automáticos generados basados en qualidad y activos. */
  badges: BadgeType[];
  /** Score numérico para ranking (0-1). */
  score: number;
  /** Estrellas del repositorio origen. */
  repoStars: number;
  /** Fecha de última actualización (ISO string). */
  lastUpdated: string | null;
}

interface SkillJsonMetadata {
  frameworks?: unknown;
  testTypes?: unknown;
  level?: unknown;
  status?: unknown;
  version?: unknown;
  estimatedTime?: unknown;
  recommendedCommands?: unknown;
  recommended_commands?: unknown;
  tags?: unknown;
}

interface SkillAssetFlags {
  hasExamples: boolean;
  hasTemplates: boolean;
  hasEvals: boolean;
  hasScripts: boolean;
}

interface CollectSkillsOptions {
  refresh?: boolean;
}

/** Tiempo de vida de la cache por repositorio en milisegundos. */
const SKILLS_TTL_MS = 5 * 60 * 1000;
/** Cache en memoria de skills por id de repositorio. */
const skillsCache = new Map<string, { expiresAt: number; skills: SkillDoc[] }>();
const skillsInFlight = new Map<string, Promise<SkillDoc[]>>();
const skillCountCache = new Map<string, { expiresAt: number; count: number }>();
const skillCountInFlight = new Map<string, Promise<number>>();
let aggregateSkillsCache: { key: string; expiresAt: number; skills: SkillDoc[] } | null = null;
const aggregateSkillsInFlight = new Map<string, Promise<SkillDoc[]>>();
const CATALOG_ALLOW_REMOTE_FALLBACK =
  (process.env.CATALOG_ALLOW_REMOTE_FALLBACK || 'false').trim().toLowerCase() === 'true';

export function invalidateSkillsCatalogCache(repoId?: string): void {
  if (!repoId) {
    skillsCache.clear();
    skillsInFlight.clear();
    skillCountCache.clear();
    skillCountInFlight.clear();
    aggregateSkillsInFlight.clear();
    aggregateSkillsCache = null;
    return;
  }

  skillsCache.delete(repoId);
  skillsInFlight.delete(repoId);
  skillCountCache.delete(repoId);
  skillCountInFlight.delete(repoId);
  aggregateSkillsInFlight.clear();
  aggregateSkillsCache = null;
}

interface SkillCatalogEntryRecord {
  skill_id: string;
  repository_id: string;
  skill_name: string;
  title: string;
  description: string;
  tags: string[];
  repo_name: string;
  source_path: string;
  url: string;
  content: string;
  frameworks: string[];
  test_types: string[];
  level: SkillLevel;
  status: SkillStatus;
  version: string;
  estimated_time: number | null;
  has_examples: boolean;
  has_templates: boolean;
  has_evals: boolean;
  has_scripts: boolean;
  recommended_commands: string[];
  badges: string[];
  score: number;
  repo_stars: number;
  last_updated: string | null;
  is_active?: boolean;
}

interface ParsedSkillMarkdown {
  data: Record<string, unknown>;
  content: string;
}

/**
 * Elimina propiedades con valor undefined en un objeto plano.
 *
 * @param {T} obj Objeto de entrada.
 * @returns {Partial<T>} Objeto sin claves undefined.
 * @example
 * const clean = compact({ title: 'Skill', description: undefined });
 */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) clean[key] = value;
  });
  return clean as Partial<T>;
}

function toStringArray(value: unknown, lowerCase = true): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => {
      const normalized = entry.trim();
      return lowerCase ? normalized.toLowerCase() : normalized;
    });
}

function toPlainString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function toNullableString(value: unknown): string | null {
  const normalized = toPlainString(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toSkillLevel(value: unknown): SkillLevel {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'beginner') return 'beginner';
  if (normalized === 'advanced') return 'advanced';
  if (normalized === 'expert') return 'expert';
  return 'intermediate';
}

function toSkillStatus(value: unknown): SkillStatus {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'draft') return 'draft';
  if (normalized === 'recommended') return 'recommended';
  if (normalized === 'deprecated') return 'deprecated';
  return 'stable';
}

function toEstimatedTime(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return null;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function inferFrameworks(repo: RepoConfig, tags: string[]): string[] {
  const candidates = unique([...(repo.tags || []).map((tag) => tag.toLowerCase()), ...tags]);
  const frameworks = candidates.filter((tag) => ['angular', 'typescript', 'react', 'node', 'vue', 'svelte'].includes(tag));
  if (frameworks.length > 0) return frameworks;
  if (repo.id.includes('angular')) return ['angular'];
  if (repo.id.includes('typescript')) return ['typescript'];
  return ['testing'];
}

function inferTestTypes(tags: string[]): string[] {
  const known = tags.filter((tag) => ['unit', 'integration', 'e2e', 'contract', 'performance', 'unit-testing'].includes(tag));
  if (known.includes('unit-testing') && !known.includes('unit')) {
    known.push('unit');
  }
  return unique(known.length ? known : ['unit']);
}

function skillCatalogCacheKey(repositoryId: string): string {
  return `skill-catalog:${repositoryId}`;
}

function buildSkillPortalUrl(repo: RepoConfig, skillId: string, skillName: string): string {
  const query = new URLSearchParams({
    repo: repo.repoUrl,
    skill: skillName
  });

  return `/skills/${skillId}/?${query.toString()}`;
}

function serializeSkillDoc(skill: SkillDoc): SkillCatalogEntryRecord {
  return {
    skill_id: skill.id,
    repository_id: skill.repoId,
    skill_name: skill.name,
    title: skill.title,
    description: skill.description,
    tags: skill.tags,
    repo_name: skill.repoName,
    source_path: skill.sourcePath,
    url: skill.url,
    content: skill.content,
    frameworks: skill.frameworks,
    test_types: skill.testTypes,
    level: skill.level,
    status: skill.status,
    version: skill.version,
    estimated_time: skill.estimatedTime,
    has_examples: skill.hasExamples,
    has_templates: skill.hasTemplates,
    has_evals: skill.hasEvals,
    has_scripts: skill.hasScripts,
    recommended_commands: skill.recommendedCommands,
    badges: skill.badges,
    score: skill.score,
    repo_stars: skill.repoStars,
    last_updated: skill.lastUpdated,
    is_active: true
  };
}

function deserializeSkillDoc(record: SkillCatalogEntryRecord): SkillDoc {
  return {
    id: toPlainString(record.skill_id),
    title: toPlainString(record.title),
    description: toPlainString(record.description),
    tags: toStringArray(record.tags, false),
    repoId: toPlainString(record.repository_id),
    name: toPlainString(record.skill_name),
    repoName: toPlainString(record.repo_name),
    url: toPlainString(record.url),
    content: toPlainString(record.content),
    sourcePath: toPlainString(record.source_path),
    frameworks: toStringArray(record.frameworks),
    testTypes: toStringArray(record.test_types),
    level: toSkillLevel(record.level),
    status: toSkillStatus(record.status),
    version: toPlainString(record.version, '1.0.0'),
    estimatedTime: record.estimated_time ?? null,
    hasExamples: toBoolean(record.has_examples),
    hasTemplates: toBoolean(record.has_templates),
    hasEvals: toBoolean(record.has_evals),
    hasScripts: toBoolean(record.has_scripts),
    recommendedCommands: toStringArray(record.recommended_commands, false),
    badges: toStringArray(record.badges, false) as BadgeType[],
    score: toNumber(record.score),
    repoStars: toNumber(record.repo_stars),
    lastUpdated: toNullableString(record.last_updated)
  };
}

async function readCachedSkillsFromDatabase(repo: RepoConfig): Promise<SkillDoc[] | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('skill_catalog_entries')
    .select('*')
    .eq('repository_id', repo.id)
    .eq('is_active', true)
    .order('skill_name', { ascending: true });

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return null;
    logSupabaseError({ operation: 'readCachedSkillsFromDatabase', table: 'skill_catalog_entries', payload: { repositoryId: repo.id } }, error);
    return null;
  }

  if (!data?.length) return null;
  return (data as SkillCatalogEntryRecord[]).map(deserializeSkillDoc);
}

async function readCachedSkillsByRepoFromDatabase(repos: RepoConfig[]): Promise<Map<string, SkillDoc[]>> {
  if (repos.length === 0) return new Map<string, SkillDoc[]>();

  const supabase = getServerSupabaseClient();
  const repoIds = repos.map((repo) => repo.id);
  const { data, error } = await supabase
    .from('skill_catalog_entries')
    .select('*')
    .in('repository_id', repoIds)
    .eq('is_active', true)
    .order('skill_name', { ascending: true });

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return new Map<string, SkillDoc[]>();
    logSupabaseError(
      { operation: 'readCachedSkillsByRepoFromDatabase', table: 'skill_catalog_entries', payload: { repositories: repoIds } },
      error
    );
    return new Map<string, SkillDoc[]>();
  }

  const grouped = new Map<string, SkillDoc[]>();
  for (const row of (data as SkillCatalogEntryRecord[]) || []) {
    const item = deserializeSkillDoc(row);
    const current = grouped.get(item.repoId) || [];
    current.push(item);
    grouped.set(item.repoId, current);
  }

  return grouped;
}

async function readSkillCountsByRepoFromDatabase(repos: RepoConfig[]): Promise<Record<string, number>> {
  const counts = repos.reduce<Record<string, number>>((acc, repo) => {
    acc[repo.id] = 0;
    return acc;
  }, {});

  if (repos.length === 0) return counts;

  const supabase = getServerSupabaseClient();
  const repoIds = repos.map((repo) => repo.id);
  const { data, error } = await supabase
    .from('skill_catalog_entries')
    .select('repository_id')
    .in('repository_id', repoIds)
    .eq('is_active', true);

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return counts;
    logSupabaseError(
      { operation: 'readSkillCountsByRepoFromDatabase', table: 'skill_catalog_entries', payload: { repositories: repoIds } },
      error
    );
    return counts;
  }

  for (const row of (data as Array<{ repository_id: string }>) || []) {
    const repositoryId = String(row.repository_id || '').trim();
    if (!repositoryId || !(repositoryId in counts)) continue;
    counts[repositoryId] += 1;
  }

  return counts;
}

async function persistSkillsToDatabase(repo: RepoConfig, skills: SkillDoc[]): Promise<void> {
  if (skills.length === 0) return;

  const supabase = getServerSupabaseClient();
  const payload = skills.map((skill) => serializeSkillDoc(skill));
  const { error } = await supabase.from('skill_catalog_entries').upsert(payload, { onConflict: 'skill_id' });

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205' || error.code === '23503') return;
    logSupabaseError({ operation: 'persistSkillsToDatabase', table: 'skill_catalog_entries', payload: { repositoryId: repo.id, count: skills.length } }, error);
  }
}

function stripFrontmatterBlock(raw: string): string {
  return raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
}

function parseSkillMarkdown(raw: string, repoId: string, filePath: string): ParsedSkillMarkdown {
  try {
    const parsed = matter(raw);
    return {
      data: (parsed.data as Record<string, unknown>) || {},
      content: parsed.content
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de parseo desconocido';
    console.warn(`[skills:${repoId}] Frontmatter invalido en ${filePath}. Se aplicara fallback. ${message}`);
    return {
      data: {},
      content: stripFrontmatterBlock(raw)
    };
  }
}

/**
 * Genera un slug seguro en minúsculas para URLs.
 *
 * @param {string} value Texto de entrada para convertir a slug.
 * @returns {string} Slug normalizado apto para URL.
 * @example
 * const slug = safeSlug('Angular Accessibility');
 */
function safeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'skill';
}

/**
 * Crea un id de skill único por repositorio evitando colisiones.
 *
 * @param {string} repoId Id del repositorio origen.
 * @param {string} baseValue Valor base para slug (nombre o carpeta).
 * @param {Set<string>} usedIds Conjunto de ids ya reservados.
 * @returns {string} Id único final para el skill.
 * @example
 * const id = createUniqueSkillId('angular-skills', 'accessibility', new Set());
 */
function createUniqueSkillId(repoId: string, baseValue: string, usedIds: Set<string>): string {
  const baseSlug = `${safeSlug(repoId)}-${safeSlug(baseValue)}`;
  let candidate = baseSlug;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

/**
 * Lista recursivamente todos los archivos SKILL.md de un repositorio.
 *
 * @param {RepoContext} context Contexto resuelto del repositorio.
 * @returns {Promise<string[]>} Rutas relativas de todos los SKILL.md encontrados.
 * @example
 * const files = await listSkillFiles(context);
 */
async function listSkillFiles(context: RepoContext): Promise<string[]> {
  return listSkillFilesWithCache(context, new Map<string, Promise<GitHubContentEntry[] | null>>());
}

async function listSkillFilesWithCache(
  context: RepoContext,
  dirCache: Map<string, Promise<GitHubContentEntry[] | null>>
): Promise<string[]> {
  const branch = context.defaultBranch;
  const skillsPath = context.repo.skillsPath || 'skills';

  const readDirEntries = async (pathSegment: string): Promise<GitHubContentEntry[] | null> => {
    const key = `${context.slug.owner}/${context.slug.name}:${branch}:${pathSegment}`;
    const cached = dirCache.get(key);
    if (cached) {
      return cached;
    }

    const promise = fetchJson<GitHubContentEntry[]>(
      buildContentsUrl(context.slug.owner, context.slug.name, pathSegment, branch)
    );
    dirCache.set(key, promise);
    return promise;
  };

  async function walk(pathSegment: string): Promise<string[]> {
    const entries = await readDirEntries(pathSegment);
    if (!entries) return [];

    const collected: string[] = [];
    for (const entry of entries) {
      if (entry.type === 'file' && entry.name.toLowerCase() === 'skill.md') {
        collected.push(entry.path);
      } else if (entry.type === 'dir') {
        const nested = await walk(entry.path);
        collected.push(...nested);
      }
    }
    return collected;
  }

  return walk(skillsPath);
}

/**
 * Descarga el contenido textual de un archivo SKILL.md remoto.
 *
 * @param {RepoContext} context Contexto resuelto del repositorio.
 * @param {string} filePath Ruta relativa del archivo remoto.
 * @returns {Promise<string | null>} Texto del archivo o null si no está disponible.
 * @example
 * const markdown = await fetchSkillFile(context, 'skills/angular/SKILL.md');
 */
async function fetchSkillFile(context: RepoContext, filePath: string): Promise<string | null> {
  return fetchRepositoryFileText(context.slug.owner, context.slug.name, filePath, context.defaultBranch);
}

async function fetchSkillJson(
  context: RepoContext,
  skillFilePath: string,
  dirCache?: Map<string, Promise<GitHubContentEntry[] | null>>
): Promise<SkillJsonMetadata | null> {
  const skillDir = path.posix.dirname(skillFilePath);
  const cacheKey = `${context.slug.owner}/${context.slug.name}:${context.defaultBranch}:${skillDir}`;
  const entriesPromise = dirCache?.get(cacheKey) || fetchJson<GitHubContentEntry[]>(buildContentsUrl(context.slug.owner, context.slug.name, skillDir, context.defaultBranch));
  if (dirCache && !dirCache.has(cacheKey)) {
    dirCache.set(cacheKey, entriesPromise);
  }
  const entries = await entriesPromise;
  if (!entries?.length) return null;

  const skillJsonEntry = entries.find(
    (entry) => entry.type === 'file' && entry.name.toLowerCase() === 'skill.json'
  );

  if (!skillJsonEntry) return null;

  const raw = await fetchRepositoryFileText(
    context.slug.owner,
    context.slug.name,
    skillJsonEntry.path,
    context.defaultBranch
  );
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SkillJsonMetadata;
  } catch {
    console.warn(`[skills:${context.repo.id}] skill.json invalido en ${skillJsonEntry.path}`);
    return null;
  }
}

async function readSkillAssetFlags(context: RepoContext, skillFilePath: string): Promise<SkillAssetFlags> {
  const skillDir = path.posix.dirname(skillFilePath);
  return readSkillAssetFlagsWithCache(context, skillDir);
}

async function readSkillAssetFlagsWithCache(
  context: RepoContext,
  skillDirOrFilePath: string,
  dirCache?: Map<string, Promise<GitHubContentEntry[] | null>>
): Promise<SkillAssetFlags> {
  const skillDir = skillDirOrFilePath.endsWith('.md') ? path.posix.dirname(skillDirOrFilePath) : skillDirOrFilePath;
  const cacheKey = `${context.slug.owner}/${context.slug.name}:${context.defaultBranch}:${skillDir}`;
  const entriesPromise = dirCache?.get(cacheKey) || fetchJson<GitHubContentEntry[]>(buildContentsUrl(context.slug.owner, context.slug.name, skillDir, context.defaultBranch));
  if (dirCache && !dirCache.has(cacheKey)) {
    dirCache.set(cacheKey, entriesPromise);
  }
  const entries = await entriesPromise;
  const folders = new Set((entries || []).filter((entry) => entry.type === 'dir').map((entry) => entry.name.toLowerCase()));

  return {
    hasExamples: folders.has('examples'),
    hasTemplates: folders.has('templates'),
    hasEvals: folders.has('evals'),
    hasScripts: folders.has('scripts')
  };
}

/**
 * Recolecta y normaliza los SKILL.md de un repositorio remoto.
 *
 * @param {RepoConfig} repo Configuración declarativa del repositorio.
 * @returns {Promise<SkillDoc[]>} Skills normalizados para renderizado y búsqueda.
 * @example
 * const skills = await collectSkillsFromRemote(repoConfig);
 */
export async function collectSkillsFromRemote(repo: RepoConfig, options: CollectSkillsOptions = {}): Promise<SkillDoc[]> {
  const inFlight = skillsInFlight.get(repo.id);
  if (inFlight) return inFlight;

  const job = collectSkillsFromRemoteInternal(repo, options);
  skillsInFlight.set(repo.id, job);

  try {
    return await job;
  } finally {
    skillsInFlight.delete(repo.id);
  }
}

async function collectSkillsFromRemoteInternal(repo: RepoConfig, options: CollectSkillsOptions): Promise<SkillDoc[]> {
  const cacheHit = skillsCache.get(repo.id);
  if (cacheHit && cacheHit.expiresAt > Date.now()) {
    return cacheHit.skills;
  }

  const cachedSkills = await readCachedSkillsFromDatabase(repo);
  if (!options.refresh && cachedSkills && cachedSkills.length > 0) {
    skillsCache.set(repo.id, { skills: cachedSkills, expiresAt: Date.now() + SKILLS_TTL_MS });
    return cachedSkills;
  }

  const context = await getRepoContext(repo);
  if (!context) {
    console.error(`[skills:${repo.id}] No se pudo resolver metadata del repo.`);
    if (cachedSkills && cachedSkills.length > 0) {
      skillsCache.set(repo.id, { skills: cachedSkills, expiresAt: Date.now() + SKILLS_TTL_MS });
      return cachedSkills;
    }
    return [];
  }

  // Fetch repo metrics once for all skills
  const metrics = await fetchRepoMetrics(repo, context);
  const dirCache = new Map<string, Promise<GitHubContentEntry[] | null>>();

  const files = await listSkillFilesWithCache(context, dirCache);
  console.log(`[skills:${repo.id}] archivos SKILL.md detectados: ${files.length}`);

  if (files.length === 0 && cachedSkills && cachedSkills.length > 0) {
    skillsCache.set(repo.id, { skills: cachedSkills, expiresAt: Date.now() + SKILLS_TTL_MS });
    return cachedSkills;
  }

  const usedIds = new Set<string>();

  const skills = await mapLimit(files, 5, async (filePath) => {
    const raw = await fetchSkillFile(context, filePath);
    if (!raw) {
      console.error(`[skills:${repo.id}] No se pudo descargar ${filePath}`);
      return null;
    }

    const [skillJson, assets] = await Promise.all([
      fetchSkillJson(context, filePath, dirCache),
      readSkillAssetFlagsWithCache(context, filePath, dirCache)
    ]);

    const parsed = parseSkillMarkdown(raw, repo.id, filePath);
    const fallback = path.basename(path.dirname(filePath)) || path.basename(filePath);
    const baseValue = String(parsed.data?.name || fallback);
    const skillId = createUniqueSkillId(repo.id, baseValue, usedIds);
    const frontmatterTags = toStringArray(parsed.data?.tags);
    const jsonTags = toStringArray(skillJson?.tags);
    const tags = unique([...frontmatterTags, ...jsonTags]);
    const frameworks = unique([
      ...toStringArray(parsed.data?.frameworks),
      ...toStringArray(skillJson?.frameworks),
      ...inferFrameworks(repo, tags)
    ]);
    const testTypes = unique([
      ...toStringArray(parsed.data?.testTypes),
      ...toStringArray(skillJson?.testTypes),
      ...inferTestTypes(tags)
    ]);
    const recommendedCommands = unique([
      ...toStringArray(parsed.data?.recommendedCommands, false),
      ...toStringArray(skillJson?.recommendedCommands, false),
      ...toStringArray(skillJson?.recommended_commands, false)
    ]);
    const level = toSkillLevel(parsed.data?.level || skillJson?.level);
    const status = toSkillStatus(parsed.data?.status || skillJson?.status);
    const version = String(parsed.data?.version || skillJson?.version || '1.0.0');
    const estimatedTime = toEstimatedTime(parsed.data?.estimatedTime || skillJson?.estimatedTime);
    const frontmatter = compact({
      title: parsed.data?.title || baseValue,
      description: parsed.data?.description || 'Descripcion pendiente',
      tags
    });

    // Create temporary skill object for badge/score calculation
    const tempSkill = {
      id: skillId,
      name: baseValue,
      title: String(frontmatter.title || baseValue),
      description: String(frontmatter.description || 'Descripcion pendiente'),
      tags: (frontmatter.tags as string[]) || [],
      repoId: repo.id,
      repoName: repo.name,
      url: buildSkillPortalUrl(repo, skillId, baseValue),
      content: parsed.content,
      sourcePath: filePath,
      frameworks,
      testTypes,
      level,
      status,
      version,
      estimatedTime,
      hasExamples: assets.hasExamples,
      hasTemplates: assets.hasTemplates,
      hasEvals: assets.hasEvals,
      hasScripts: assets.hasScripts,
      recommendedCommands,
      // Ranking fields
      repoStars: metrics.stars || 0,
      lastUpdated: metrics.lastCommitDate || null
    };

    // Generate badges
    const badges = generateBadges(tempSkill);
    const badgeTypes = badges.map(b => b.type);

    // Calculate score
    const scoreData = calculateSkillScore(tempSkill);
    const score = scoreData.score;

    return {
      ...tempSkill,
      badges: badgeTypes,
      score
    } satisfies SkillDoc;
  });

  const cleanSkills = skills.filter((skill): skill is SkillDoc => Boolean(skill));

  if (cleanSkills.length === 0 && cachedSkills && cachedSkills.length > 0) {
    skillsCache.set(repo.id, { skills: cachedSkills, expiresAt: Date.now() + SKILLS_TTL_MS });
    return cachedSkills;
  }

  skillsCache.set(repo.id, { skills: cleanSkills, expiresAt: Date.now() + SKILLS_TTL_MS });
  await persistSkillsToDatabase(repo, cleanSkills);
  return cleanSkills;
}

async function countSkillsFromRemote(repo: RepoConfig): Promise<number> {
  const cacheHit = skillCountCache.get(repo.id);
  if (cacheHit && cacheHit.expiresAt > Date.now()) {
    return cacheHit.count;
  }

  const inFlight = skillCountInFlight.get(repo.id);
  if (inFlight) {
    return inFlight;
  }

  const job = (async () => {
    const repoSkillsCache = skillsCache.get(repo.id);
    if (repoSkillsCache && repoSkillsCache.expiresAt > Date.now()) {
      const count = repoSkillsCache.skills.length;
      skillCountCache.set(repo.id, { count, expiresAt: Date.now() + SKILLS_TTL_MS });
      return count;
    }

    const cachedSkills = await readCachedSkillsFromDatabase(repo);
    if (cachedSkills && cachedSkills.length > 0) {
      skillCountCache.set(repo.id, { count: cachedSkills.length, expiresAt: Date.now() + SKILLS_TTL_MS });
      return cachedSkills.length;
    }

    const context = await getRepoContext(repo);
    if (!context) {
      skillCountCache.set(repo.id, { count: 0, expiresAt: Date.now() + SKILLS_TTL_MS });
      return 0;
    }

    const dirCache = new Map<string, Promise<GitHubContentEntry[] | null>>();
    const files = await listSkillFilesWithCache(context, dirCache);
    const count = files.length;
    skillCountCache.set(repo.id, { count, expiresAt: Date.now() + SKILLS_TTL_MS });
    return count;
  })();

  skillCountInFlight.set(repo.id, job);

  try {
    return await job;
  } finally {
    skillCountInFlight.delete(repo.id);
  }
}

export async function collectSkillCountsByRepo(repos: RepoConfig[]): Promise<Record<string, number>> {
  const dbCounts = await readSkillCountsByRepoFromDatabase(repos);
  const hasCatalogData = Object.values(dbCounts).some((count) => count > 0);

  if (hasCatalogData || !CATALOG_ALLOW_REMOTE_FALLBACK) {
    return dbCounts;
  }

  const results = await Promise.all(
    repos.map(async (repo) => {
      try {
        const count = await countSkillsFromRemote(repo);
        return [repo.id, count] as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`[skills:${repo.id}] Error contando skills: ${message}`);
        return [repo.id, 0] as const;
      }
    })
  );

  return results.reduce<Record<string, number>>((acc, [repoId, count]) => {
    acc[repoId] = count;
    return acc;
  }, {});
}

/**
 * Reúne skills de todos los repositorios configurados en paralelo.
 *
 * @param {RepoConfig[]} repos Lista de repositorios configurados.
 * @returns {Promise<SkillDoc[]>} Lista plana de skills de todos los repos.
 * @example
 * const catalog = await collectAllSkills(repos);
 */
export async function collectAllSkills(repos: RepoConfig[]): Promise<SkillDoc[]> {
  const cacheKey = repos
    .map((repo) => repo.id)
    .sort((a, b) => a.localeCompare(b))
    .join('|');

  if (aggregateSkillsCache && aggregateSkillsCache.key === cacheKey && aggregateSkillsCache.expiresAt > Date.now()) {
    return aggregateSkillsCache.skills;
  }

  const inFlight = aggregateSkillsInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const job = collectAllSkillsInternal(repos, cacheKey);
  aggregateSkillsInFlight.set(cacheKey, job);

  try {
    return await job;
  } finally {
    aggregateSkillsInFlight.delete(cacheKey);
  }
}

async function collectAllSkillsInternal(repos: RepoConfig[], cacheKey: string): Promise<SkillDoc[]> {
  const cachedByRepo = await readCachedSkillsByRepoFromDatabase(repos);
  const hasCatalogData = Array.from(cachedByRepo.values()).some((skills) => skills.length > 0);

  let perRepo: SkillDoc[][];
  if (hasCatalogData || !CATALOG_ALLOW_REMOTE_FALLBACK) {
    perRepo = repos.map((repo) => cachedByRepo.get(repo.id) || []);
  } else {
    perRepo = await Promise.all(
      repos.map(async (repo) => {
        try {
          return await collectSkillsFromRemote(repo);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido';
          console.error(`[skills:${repo.id}] Error inesperado: ${message}`);
          return [];
        }
      })
    );
  }

  const allSkills = perRepo.flat();
  const dedupedSkills = dedupeCatalogSkills(allSkills);
  aggregateSkillsCache = {
    key: cacheKey,
    skills: dedupedSkills,
    expiresAt: Date.now() + SKILLS_TTL_MS
  };
  return dedupedSkills;
}

function normalizeCatalogKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9-_ ]+/g, '');
}

function buildCatalogDedupKey(skill: SkillDoc): string {
  const title = normalizeCatalogKey(skill.title || '');
  if (title) return `title:${title}`;

  const name = normalizeCatalogKey(skill.name || '');
  if (name) return `name:${name}`;

  const description = normalizeCatalogKey((skill.description || '').slice(0, 180));
  if (description) return `desc:${description}`;

  const pathTail = normalizeCatalogKey(skill.sourcePath.split('/').slice(-2).join('/'));
  return `path:${pathTail}`;
}

function compareSkillPriority(a: SkillDoc, b: SkillDoc): SkillDoc {
  const statusWeight = (value: SkillDoc['status']): number => {
    if (value === 'recommended') return 4;
    if (value === 'stable') return 3;
    if (value === 'draft') return 2;
    return 1;
  };

  const aWeight = statusWeight(a.status);
  const bWeight = statusWeight(b.status);
  if (aWeight !== bWeight) return aWeight > bWeight ? a : b;

  if (a.score !== b.score) return a.score > b.score ? a : b;
  if (a.hasExamples !== b.hasExamples) return a.hasExamples ? a : b;
  if (a.repoStars !== b.repoStars) return a.repoStars > b.repoStars ? a : b;

  return a.repoName.localeCompare(b.repoName) <= 0 ? a : b;
}

function dedupeCatalogSkills(skills: SkillDoc[]): SkillDoc[] {
  const byKey = new Map<string, SkillDoc>();

  for (const skill of skills) {
    const key = buildCatalogDedupKey(skill);
    const previous = byKey.get(key);
    if (!previous) {
      byKey.set(key, skill);
      continue;
    }

    byKey.set(key, compareSkillPriority(previous, skill));
  }

  return Array.from(byKey.values());
}

/**
 * Busca un skill por slug recorriendo cada repositorio en orden.
 *
 * @param {RepoConfig[]} repos Lista de repositorios configurados.
 * @param {string} slug Slug único del skill solicitado.
 * @returns {Promise<SkillDoc | null>} Skill encontrado o null cuando no existe.
 * @example
 * const skill = await fetchSkillBySlug(repos, 'angular-accessibility');
 */
export async function fetchSkillBySlug(repos: RepoConfig[], slug: string): Promise<SkillDoc | null> {
  for (const repo of repos) {
    const skills = await collectSkillsFromRemote(repo);
    const skill = skills.find((entry) => entry.id === slug);
    if (skill) return skill;
  }
  return null;
}

/**
 * Ejecuta una función async con límite de concurrencia y preserva el orden de salida.
 *
 * @param {T[]} items Colección de entrada a procesar.
 * @param {number} limit Máximo de tareas concurrentes.
 * @param {(item: T) => Promise<R>} fn Función async aplicada por elemento.
 * @returns {Promise<R[]>} Resultados en el mismo orden de `items`.
 * @example
 * const squares = await mapLimit([1, 2, 3], 2, async (value) => value * value);
 */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (limit < 1) {
    return Promise.all(items.map(fn));
  }

  const results: R[] = [];
  let index = 0;
  const workers = Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (index < items.length) {
        const current = index;
        index += 1;
        results[current] = await fn(items[current]);
      }
    });

  await Promise.all(workers);
  return results;
}
