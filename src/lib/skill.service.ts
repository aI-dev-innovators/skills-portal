import path from 'node:path';
import matter from 'gray-matter';
import { RepoConfig } from './config';
import { buildContentsUrl, fetchJson, fetchRepositoryFileText, GitHubContentEntry } from './github.service';
import { getRepoContext, RepoContext } from './repo.service';

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
  /** Nombre del repositorio origen. */
  repoName: string;
  /** Ruta interna del portal para el detalle del skill. */
  url: string;
  /** Contenido markdown original del SKILL.md. */
  content: string;
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

/** Tiempo de vida de la cache por repositorio en milisegundos. */
const SKILLS_TTL_MS = 5 * 60 * 1000;
/** Cache en memoria de skills por id de repositorio. */
const skillsCache = new Map<string, { expiresAt: number; skills: SkillDoc[] }>();

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
  const branch = context.defaultBranch;
  const skillsPath = context.repo.skillsPath || 'skills';
  const apiUrl = (p: string) => buildContentsUrl(context.slug.owner, context.slug.name, p, branch);

  async function walk(pathSegment: string): Promise<string[]> {
    const entries = await fetchJson<GitHubContentEntry[]>(apiUrl(pathSegment));
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

async function fetchSkillJson(context: RepoContext, skillFilePath: string): Promise<SkillJsonMetadata | null> {
  const skillDir = path.posix.dirname(skillFilePath);
  const listUrl = buildContentsUrl(context.slug.owner, context.slug.name, skillDir, context.defaultBranch);
  const entries = await fetchJson<GitHubContentEntry[]>(listUrl);
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
  const listUrl = buildContentsUrl(context.slug.owner, context.slug.name, skillDir, context.defaultBranch);
  const entries = await fetchJson<GitHubContentEntry[]>(listUrl);
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
export async function collectSkillsFromRemote(repo: RepoConfig): Promise<SkillDoc[]> {
  const cacheHit = skillsCache.get(repo.id);
  if (cacheHit && cacheHit.expiresAt > Date.now()) {
    return cacheHit.skills;
  }

  const context = await getRepoContext(repo);
  if (!context) {
    console.error(`[skills:${repo.id}] No se pudo resolver metadata del repo.`);
    return [];
  }

  const files = await listSkillFiles(context);
  console.log(`[skills:${repo.id}] archivos SKILL.md detectados: ${files.length}`);
  const usedIds = new Set<string>();

  const skills = await mapLimit(files, 5, async (filePath) => {
    const raw = await fetchSkillFile(context, filePath);
    if (!raw) {
      console.error(`[skills:${repo.id}] No se pudo descargar ${filePath}`);
      return null;
    }

    const [skillJson, assets] = await Promise.all([fetchSkillJson(context, filePath), readSkillAssetFlags(context, filePath)]);

    const parsed = matter(raw);
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

    return {
      id: skillId,
      title: String(frontmatter.title || baseValue),
      description: String(frontmatter.description || 'Descripcion pendiente'),
      tags: (frontmatter.tags as string[]) || [],
      repoId: repo.id,
      repoName: repo.name,
      url: `/skills/${skillId}`,
      content: parsed.content,
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
      recommendedCommands
    } satisfies SkillDoc;
  });

  const cleanSkills = skills.filter((skill): skill is SkillDoc => Boolean(skill));
  skillsCache.set(repo.id, { skills: cleanSkills, expiresAt: Date.now() + SKILLS_TTL_MS });
  return cleanSkills;
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
  const perRepo = await Promise.all(
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

  return perRepo.flat();
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
