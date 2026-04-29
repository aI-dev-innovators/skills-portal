import { getServerSupabaseClient } from './db/supabase';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Configuración declarativa de un repositorio origen.
 * - repoUrl admite SSH o HTTPS, se normaliza para llamadas HTTP.
 * - defaultBranch y rutas son opcionales; se usan valores por defecto si faltan.
 */
export interface RepoConfig {
  /** Identificador único interno del repo. */
  id: string;
  /** Nombre legible del repo. */
  name: string;
  /** Descripción opcional mostrada en catálogo. */
  description?: string;
  /** Owner opcional para sobreescribir el owner parseado desde repoUrl. */
  owner?: string;
  /** URL SSH o HTTPS al repositorio de origen. */
  repoUrl: string;
  /** Rama por defecto; si falta se usa main. */
  defaultBranch?: string;
  /** Ruta relativa al README (por defecto README.md). */
  readmePath?: string;
  /** Ruta base donde se buscan SKILL.md (por defecto skills). */
  skillsPath?: string;
  /** Tags para clasificar el repo. */
  tags?: string[];
}

const REPOS_CACHE_TTL_MS = 5 * 60 * 1000;
let reposCache: { expiresAt: number; repos: RepoConfig[] } | null = null;

async function readLocalReposFromContent(): Promise<RepoConfig[]> {
  const reposRoot = path.resolve(process.cwd(), 'src/content/repos');
  let entries: string[] = [];

  try {
    entries = await readdir(reposRoot);
  } catch {
    return [];
  }

  const repos = await Promise.all(
    entries.map(async (entry) => {
      const indexPath = path.join(reposRoot, entry, 'index.md');

      try {
        const raw = await readFile(indexPath, 'utf8');
        const parsed = matter(raw);
        const data = parsed.data || {};

        const id = String(data.id || '').trim();
        const name = String(data.name || '').trim();
        const repoUrl = String(data.repoUrl || '').trim();

        if (!id || !name || !repoUrl) {
          return null;
        }

        const repo: RepoConfig = {
          id,
          name,
          repoUrl,
          defaultBranch: String(data.defaultBranch || '').trim() || 'main',
          readmePath: String(data.readmePath || '').trim() || 'README.md',
          skillsPath: String(data.skillsPath || '').trim() || 'skills',
          tags: Array.isArray(data.tags)
            ? data.tags
                .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
                .map((tag) => tag.trim())
            : []
        };

        const description = String(data.description || '').trim();
        if (description) {
          repo.description = description;
        }

        return repo;
      } catch {
        return null;
      }
    })
  );

  return repos.filter((repo): repo is NonNullable<typeof repo> => repo !== null);
}

export function invalidateReposConfigCache(): void {
  reposCache = null;
}

/**
 * Lee el catálogo de repos desde Supabase y devuelve la lista registrada.
 *
 * @returns {RepoConfig[]} Lista de configuraciones de repos.
 * @example
 * const repos = readReposConfig();
 */
export async function readReposConfig(): Promise<RepoConfig[]> {
  if (reposCache && reposCache.expiresAt > Date.now()) {
    return reposCache.repos;
  }

  const supabase = getServerSupabaseClient();
  const localReposPromise = readLocalReposFromContent();

  const [repositoriesResult, tagsResult] = await Promise.all([
    supabase
      .from('repositories')
      .select('repository_id, repository_name, full_name, github_url, description, is_active, created_at')
      .eq('is_active', true)
      .order('repository_name', { ascending: true }),
    supabase.from('repository_tags').select('repository_id, tag')
  ]);

  if (repositoriesResult.error) {
    throw new Error(`No se pudo leer repositories: ${repositoriesResult.error.message}`);
  }

  if (tagsResult.error) {
    throw new Error(`No se pudo leer repository_tags: ${tagsResult.error.message}`);
  }

  const tagsByRepository = new Map<string, string[]>();
  for (const row of tagsResult.data || []) {
    const repositoryId = String(row.repository_id || '').trim();
    const tag = String(row.tag || '').trim();
    if (!repositoryId || !tag) continue;

    const current = tagsByRepository.get(repositoryId) || [];
    if (!current.includes(tag)) {
      current.push(tag);
      tagsByRepository.set(repositoryId, current);
    }
  }

  const repos = (repositoriesResult.data || []).map((repo) => ({
    id: repo.repository_id,
    name: repo.repository_name,
    description: repo.description || undefined,
    repoUrl: repo.github_url,
    defaultBranch: 'main',
    readmePath: 'README.md',
    skillsPath: 'skills',
    tags: tagsByRepository.get(repo.repository_id) || []
  }));

  const localRepos = await localReposPromise;
  const mergedById = new Map<string, RepoConfig>();

  for (const repo of localRepos) {
    mergedById.set(repo.id, repo);
  }
  for (const repo of repos) {
    mergedById.set(repo.id, repo);
  }

  const mergedRepos = Array.from(mergedById.values()).sort((a, b) => a.name.localeCompare(b.name));

  reposCache = {
    repos: mergedRepos,
    expiresAt: Date.now() + REPOS_CACHE_TTL_MS
  };

  return mergedRepos;
}
