import path from 'node:path';
import matter from 'gray-matter';
import { RepoConfig } from './config';
import { fetchJson, fetchText, parseRepoSlug } from './github';

/**
 * Modelo en memoria de un SKILL.md parseado.
 */
export interface SkillDoc {
  id: string;
  title: string;
  description: string;
  tags: string[];
  repoId: string;
  repoName: string;
  url: string;
  content: string;
}

/** Tiempo de vida de la cache de skills por repo (ms). */
const SKILLS_TTL_MS = 5 * 60 * 1000;
/** Cache en memoria de skills por repo (clave: repo.id). */
const skillsCache = new Map<string, { expiresAt: number; skills: SkillDoc[] }>();

/**
 * Elimina claves con valor undefined de un objeto.
 * @param {T} obj Objeto de entrada.
 * @returns {Partial<T>} Objeto sin claves undefined.
 */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) clean[key] = value;
  });
  return clean as Partial<T>;
}

/**
 * Normaliza un texto a slug en minúsculas y sin caracteres no alfanuméricos.
 * @param {string} value Texto a convertir.
 * @returns {string} Slug sanitizado.
 */
function safeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'skill';
}

/**
 * Lista rutas de archivos SKILL.md en un repo usando la API de contenidos.
 * @param {RepoConfig} repo Configuración del repo origen.
 * @returns {Promise<string[]>} Rutas de archivos SKILL.md.
 */
async function listSkillFiles(repo: RepoConfig): Promise<string[]> {
  const slug = parseRepoSlug(repo.repoUrl);
  if (!slug) return [];
  const branch = repo.defaultBranch || 'main';
  const skillsPath = repo.skillsPath || 'skills';
  const apiUrl = (p: string) => `https://api.github.com/repos/${slug.owner}/${slug.name}/contents/${p}?ref=${branch}`;

  async function walk(pathSegment: string): Promise<string[]> {
    const entries = await fetchJson<Array<{ path: string; type: string; name: string }>>(apiUrl(pathSegment));
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
 * Descarga un archivo SKILL.md bruto desde raw.githubusercontent.com.
 * @param {RepoConfig} repo Configuración del repo origen.
 * @param {string} filePath Ruta relativa del archivo.
 * @returns {Promise<string | null>} Contenido del archivo o null si falla.
 */
async function fetchSkillFile(repo: RepoConfig, filePath: string): Promise<string | null> {
  const slug = parseRepoSlug(repo.repoUrl);
  if (!slug) return null;
  const branch = repo.defaultBranch || 'main';
  const url = `https://raw.githubusercontent.com/${slug.owner}/${slug.name}/${branch}/${filePath}`;
  return fetchText(url);
}

/**
 * Devuelve los skills de un repo, con cache en memoria y concurrencia limitada.
 * @param {RepoConfig} repo Configuración del repo origen.
 * @returns {Promise<SkillDoc[]>} Lista de skills parseados.
 */
export async function collectSkillsFromRemote(repo: RepoConfig) {
  const cacheHit = skillsCache.get(repo.id);
  if (cacheHit && cacheHit.expiresAt > Date.now()) {
    return cacheHit.skills;
  }

  const files = await listSkillFiles(repo);
  const skills = await mapLimit(files, 5, async (filePath) => {
    const raw = await fetchSkillFile(repo, filePath);
    if (!raw) return null;
    const parsed = matter(raw);
    const slug = safeSlug(parsed.data?.name || path.basename(path.dirname(filePath)) || path.basename(filePath));
    const frontmatter = compact({
      name: parsed.data?.name || slug,
      title: parsed.data?.title || slug,
      description: parsed.data?.description || 'Descripción pendiente',
      version: parsed.data?.version,
      tags: parsed.data?.tags || [],
      repoId: repo.id,
      repoName: repo.name
    });

    return {
      id: slug,
      title: frontmatter.title as string,
      description: frontmatter.description as string,
      tags: (frontmatter.tags as string[]) || [],
      repoId: repo.id,
      repoName: repo.name,
      url: `/skills/${slug}`,
      content: parsed.content
    } satisfies SkillDoc;
  });

  const cleanSkills = skills.filter((s): s is SkillDoc => Boolean(s));
  skillsCache.set(repo.id, { skills: cleanSkills, expiresAt: Date.now() + SKILLS_TTL_MS });
  return cleanSkills;
}

/**
 * Reúne los skills de todos los repos en paralelo.
 * @param {RepoConfig[]} repos Lista de repos configurados.
 * @returns {Promise<SkillDoc[]>} Lista plana de skills de todos los repos.
 */
export async function collectAllSkills(repos: RepoConfig[]) {
  const perRepo = await Promise.all(repos.map((repo) => collectSkillsFromRemote(repo)));
  return perRepo.flat();
}

/**
 * Busca un skill por slug recorriendo repos registrados.
 * @param {RepoConfig[]} repos Lista de repos configurados.
 * @param {string} slug Identificador del skill.
 * @returns {Promise<SkillDoc | null>} Skill encontrado o null.
 */
export async function fetchSkillBySlug(repos: RepoConfig[], slug: string) {
  for (const repo of repos) {
    const skills = await collectSkillsFromRemote(repo);
    const skill = skills.find((s) => s.id === slug);
    if (skill) return skill;
  }
  return null;
}

/**
 * mapLimit: aplica una función async con límite de concurrencia.
 * @param {T[]} items Colección a procesar.
 * @param {number} limit Máximo de tareas simultáneas.
 * @param {(item: T) => Promise<R>} fn Función async a ejecutar por item.
 * @returns {Promise<R[]>} Resultados en mismo orden de entrada.
 */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (limit < 1) return Promise.all(items.map(fn));
  const results: R[] = [];
  let index = 0;
  const workers = Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (index < items.length) {
        const current = index++;
        results[current] = await fn(items[current]);
      }
    });
  await Promise.all(workers);
  return results;
}
