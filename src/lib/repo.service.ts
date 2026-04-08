import { RepoConfig } from './config';
import {
  buildRepoApiUrl,
  fetchJson,
  fetchRepositoryFileText,
  getDefaultRepoOwner,
  GitHubCommitResponse,
  GitHubContributorResponse,
  GitHubRepoResponse
} from './github.service';

/**
 * Coordenadas mínimas para ubicar un repositorio en la API de GitHub.
 */
export interface RepoSlug {
  /** Owner del repositorio dentro de GitHub. */
  owner: string;
  /** Nombre corto del repositorio sin sufijo .git. */
  name: string;
}

/**
 * Contexto resuelto y cacheado de un repositorio remoto.
 */
export interface RepoContext {
  /** Configuración original del repositorio. */
  repo: RepoConfig;
  /** Coordenadas resueltas owner/repo para llamadas HTTP. */
  slug: RepoSlug;
  /** Rama por defecto efectiva usada por el crawler. */
  defaultBranch: string;
  /** Indica si el repositorio es privado según metadata remota. */
  isPrivate: boolean;
}

/** Cache de metadata por id de repositorio para evitar llamadas repetidas. */
const repoContextCache = new Map<string, RepoContext>();
const repoMetricsCache = new Map<string, { expiresAt: number; metrics: RepoMetrics }>();
const REPO_METRICS_TTL_MS = 5 * 60 * 1000;

/** Metricas publicas del repositorio para uso en UI. */
export interface RepoMetrics {
  /** Estrellas del repositorio. */
  stars: number;
  /** Forks del repositorio. */
  forks: number;
  /** Cantidad de contributors identificados. */
  contributors: number;
  /** Fecha ISO del ultimo commit detectado. */
  lastCommitDate: string | null;
}

/**
 * Extrae owner/repo desde una URL SSH o HTTPS de GitHub.
 *
 * @param {string} repoUrl URL del repositorio (SSH o HTTPS).
 * @returns {RepoSlug | null} Coordenadas parseadas o null si la URL no coincide.
 * @example
 * const slug = parseRepoSlug('https://github.com/octocat/hello-world.git');
 */
export function parseRepoSlug(repoUrl: string): RepoSlug | null {
  const sshMatch = repoUrl.match(/github\.com:([^/]+)\/(.+?)(\.git)?$/);
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      name: sshMatch[2].replace(/\.git$/, '')
    };
  }

  const httpsMatch = repoUrl.match(/github\.com\/([^/]+)\/(.+?)(\.git)?/);
  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      name: httpsMatch[2].replace(/\.git$/, '')
    };
  }

  return null;
}

/**
 * Resuelve el slug final aplicando owner override desde `repo.owner` o `GITHUB_REPO_OWNER`.
 *
 * @param {RepoConfig} repo Configuración declarativa del repositorio.
 * @returns {RepoSlug | null} Coordenadas finales para consumir la API.
 * @example
 * const slug = resolveRepoSlug(repoConfig);
 */
function resolveRepoSlug(repo: RepoConfig): RepoSlug | null {
  const parsed = parseRepoSlug(repo.repoUrl);
  if (!parsed) return null;

  const ownerOverride = repo.owner || getDefaultRepoOwner();
  return {
    owner: ownerOverride || parsed.owner,
    name: parsed.name
  };
}

/**
 * Obtiene metadata del repo y la cachea para evitar llamadas duplicadas.
 *
 * @param {RepoConfig} repo Configuración declarativa del repositorio.
 * @returns {Promise<RepoContext | null>} Contexto resuelto o null si falla.
 * @example
 * const context = await getRepoContext(repoConfig);
 */
export async function getRepoContext(repo: RepoConfig): Promise<RepoContext | null> {
  const cacheHit = repoContextCache.get(repo.id);
  if (cacheHit) return cacheHit;

  const slug = resolveRepoSlug(repo);
  if (!slug) {
    console.error(`[repo:${repo.id}] URL de repo invalida: ${repo.repoUrl}`);
    return null;
  }

  const configuredBranch = repo.defaultBranch?.trim();
  const metadata = configuredBranch
    ? null
    : await fetchJson<GitHubRepoResponse>(buildRepoApiUrl(slug.owner, slug.name, ''));

  const context: RepoContext = {
    repo,
    slug,
    defaultBranch: configuredBranch || metadata?.default_branch || 'main',
    isPrivate: metadata?.private ?? false
  };

  repoContextCache.set(repo.id, context);
  return context;
}

/**
 * Descarga el README preferente del repositorio con fallback a Contents API por ruta.
 *
 * @param {RepoConfig} repo Configuración declarativa del repositorio.
 * @param {RepoContext} [context] Contexto precalculado para evitar requests duplicados.
 * @returns {Promise<string | null>} Markdown del README o null si no fue posible leerlo.
 * @example
 * const markdown = await fetchReadme(repoConfig, context);
 */
export async function fetchReadme(repo: RepoConfig, context?: RepoContext): Promise<string | null> {
  const resolvedContext = context || (await getRepoContext(repo));
  if (!resolvedContext) return null;

  const branch = resolvedContext.defaultBranch;
  const { owner, name } = resolvedContext.slug;
  const readmePath = repo.readmePath || 'README.md';
  const contentReadme = await fetchRepositoryFileText(owner, name, readmePath, branch);

  if (contentReadme) {
    return contentReadme;
  }

  console.error(`[repo:${repo.id}] README no disponible en Contents API para rama ${branch}.`);

  return null;
}

/**
 * Obtiene métricas del repositorio con caché temporal para minimizar llamadas a GitHub.
 *
 * @param {RepoConfig} repo Configuración declarativa del repositorio.
 * @param {RepoContext} [context] Contexto precalculado para evitar lecturas duplicadas.
 * @returns {Promise<RepoMetrics>} Métricas listas para mostrar en UI.
 * @example
 * const metrics = await fetchRepoMetrics(repoConfig);
 */
export async function fetchRepoMetrics(repo: RepoConfig, context?: RepoContext): Promise<RepoMetrics> {
  const cacheHit = repoMetricsCache.get(repo.id);
  if (cacheHit && cacheHit.expiresAt > Date.now()) {
    return cacheHit.metrics;
  }

  const resolvedContext = context || (await getRepoContext(repo));
  if (!resolvedContext) {
    return {
      stars: 0,
      forks: 0,
      contributors: 0,
      lastCommitDate: null
    };
  }

  const owner = resolvedContext.slug.owner;
  const name = resolvedContext.slug.name;
  const branch = resolvedContext.defaultBranch;

  const repoUrl = buildRepoApiUrl(owner, name, '');
  const contributorsUrl = `${buildRepoApiUrl(owner, name, '/contributors')}?per_page=100&anon=1`;
  const commitsUrl = `${buildRepoApiUrl(owner, name, '/commits')}?sha=${encodeURIComponent(branch)}&per_page=1`;

  const [repoMetadata, contributors, commits] = await Promise.all([
    fetchJson<GitHubRepoResponse>(repoUrl),
    fetchJson<GitHubContributorResponse[]>(contributorsUrl),
    fetchJson<GitHubCommitResponse[]>(commitsUrl)
  ]);

  const metrics: RepoMetrics = {
    stars: repoMetadata?.stargazers_count ?? 0,
    forks: repoMetadata?.forks_count ?? 0,
    contributors: contributors?.length ?? 0,
    lastCommitDate: commits?.[0]?.commit?.author?.date || repoMetadata?.pushed_at || null
  };

  repoMetricsCache.set(repo.id, {
    metrics,
    expiresAt: Date.now() + REPO_METRICS_TTL_MS
  });

  return metrics;
}
