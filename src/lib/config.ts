import { getServerSupabaseClient } from './db/supabase';

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

  reposCache = {
    repos,
    expiresAt: Date.now() + REPOS_CACHE_TTL_MS
  };

  return repos;
}
