import 'dotenv/config';

/** Token de GitHub usado para autenticación Bearer. */
const TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || '';
/** Media type recomendado para respuestas JSON de GitHub API. */
const GITHUB_API_ACCEPT = 'application/vnd.github+json';
/** Media type para descargar contenido raw desde Contents API. */
const GITHUB_RAW_ACCEPT = 'application/vnd.github.raw+json';
/** Versión de API REST de GitHub enviada en cabecera. */
const GITHUB_API_VERSION = process.env.GITHUB_API_VERSION || '2026-03-10';
/** Base URL de la API GitHub validada y normalizada. */
const GITHUB_API_BASE_URL = resolveApiBaseUrl(process.env.GITHUB_API_BASE_URL);
/** Owner por defecto para resolver slugs cuando no venga en config. */
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || '';

/**
 * Elimina barras finales y espacios para normalizar una base URL.
 *
 * @param {string} url URL de entrada a normalizar.
 * @returns {string} URL normalizada sin barras finales.
 * @example
 * const baseUrl = normalizeApiBaseUrl('https://api.github.com/');
 */
function normalizeApiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Resuelve la base URL efectiva de la API con validación y fallback.
 *
 * @param {string | undefined} value Valor crudo de entorno para base URL.
 * @returns {string} Base URL válida para solicitudes HTTP.
 * @example
 * const baseUrl = resolveApiBaseUrl(process.env.GITHUB_API_BASE_URL);
 */
function resolveApiBaseUrl(value?: string): string {
  const fallback = 'https://api.github.com';
  const normalized = normalizeApiBaseUrl(value || fallback);

  try {
    const parsed = new URL(normalized);
    const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (!isHttp) throw new Error('Protocol must be http/https');
    return normalized;
  } catch {
    console.warn('[github] GITHUB_API_BASE_URL invalida, se usara https://api.github.com');
    return fallback;
  }
}

/**
 * Oculta valores sensibles (tokens) antes de imprimir logs.
 *
 * @param {string} value Texto original potencialmente sensible.
 * @returns {string} Texto sanitizado sin secretos explícitos.
 * @example
 * const safe = redactSecrets('Bearer ghp_xxx');
 */
function redactSecrets(value: string): string {
  const tokenLikePatterns = [
    /github_pat_[A-Za-z0-9_]+/g,
    /ghp_[A-Za-z0-9]+/g,
    /gho_[A-Za-z0-9]+/g,
    /Bearer\s+[A-Za-z0-9._-]+/gi
  ];

  return tokenLikePatterns.reduce((acc, pattern) => acc.replace(pattern, '[REDACTED]'), value);
}

/** Opciones base para solicitudes HTTP contra GitHub. */
export interface RequestOptions {
  /** Media type de cabecera Accept. */
  accept?: string;
  /** Método HTTP a utilizar (por defecto GET). */
  method?: string;
  /** Cabeceras extra para la solicitud. */
  headers?: Record<string, string>;
}

/** Respuesta mínima del endpoint GET /repos/{owner}/{repo}. */
export interface GitHubRepoResponse {
  /** Id numérico interno del repositorio en GitHub. */
  id: number;
  /** Nombre corto del repositorio. */
  name: string;
  /** Nombre completo owner/repo. */
  full_name: string;
  /** Indica si el repositorio es privado. */
  private: boolean;
  /** Rama por defecto configurada en el repositorio. */
  default_branch: string;
  /** Numero de estrellas del repositorio. */
  stargazers_count: number;
  /** Numero de forks del repositorio. */
  forks_count: number;
  /** Fecha del ultimo push al repositorio. */
  pushed_at?: string;
}

/** Entrada minima de contributor retornada por GitHub API. */
export interface GitHubContributorResponse {
  /** Login del contributor. */
  login?: string;
  /** Numero de contribuciones registradas por GitHub. */
  contributions?: number;
}

/** Entrada minima de commit retornada por GitHub API. */
export interface GitHubCommitResponse {
  /** Payload del commit con metadatos de autoria. */
  commit?: {
    /** Autor del commit segun metadata interna de Git. */
    author?: {
      /** Fecha ISO del commit. */
      date?: string;
    };
  };
}

/** Entrada de archivo/directorio retornada por Contents API. */
export interface GitHubContentEntry {
  /** Tipo de nodo retornado por GitHub. */
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  /** Ruta relativa del nodo dentro del repositorio. */
  path: string;
  /** Nombre del archivo o directorio. */
  name: string;
  /** URL temporal de descarga directa para el contenido. */
  download_url?: string | null;
  /** Tamaño del contenido en bytes. */
  size?: number;
}

/** Respuesta de archivo para Contents API incluyendo payload opcional. */
export interface GitHubContentFileResponse extends GitHubContentEntry {
  /** Tipo restringido para respuestas de archivo/symlink. */
  type: 'file' | 'symlink';
  /** Contenido codificado según `encoding` cuando aplica. */
  content?: string;
  /** Tipo de codificación del campo `content` (p.ej. base64). */
  encoding?: string;
  /** URL temporal de descarga directa para el contenido. */
  download_url?: string | null;
}

/** Formato objeto (`application/vnd.github.object+json`) de Contents API. */
export interface GitHubContentsObjectResponse {
  /** Lista de entradas cuando la ruta consultada es directorio. */
  entries?: GitHubContentEntry[];
}

interface GitHubRequestErrorContext {
  /** URL asociada al error HTTP. */
  url: string;
  /** Código HTTP (0 para errores de red locales). */
  status: number;
  /** Texto de estado HTTP o marcador local de error. */
  statusText: string;
  /** Mensaje detallado del error. */
  message: string;
}

/**
 * Devuelve el owner por defecto configurado en entorno.
 *
 * @returns {string} Owner global configurable para repos de GitHub.
 * @example
 * const owner = getDefaultRepoOwner();
 */
export function getDefaultRepoOwner(): string {
  return GITHUB_REPO_OWNER;
}

/**
 * Construye una URL de la API REST para un endpoint de repositorio.
 *
 * @param {string} owner Owner del repositorio.
 * @param {string} repo Nombre del repositorio.
 * @param {string} endpoint Endpoint relativo dentro de /repos/{owner}/{repo}.
 * @returns {string} URL completa hacia la API de GitHub.
 * @example
 * const url = buildRepoApiUrl('octocat', 'hello-world', '/readme');
 */
export function buildRepoApiUrl(owner: string, repo: string, endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : endpoint.length > 0 ? `/${endpoint}` : '';
  return `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${cleanEndpoint}`;
}

function encodeContentPath(contentPath: string): string {
  return contentPath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/**
 * Construye la URL del endpoint de Contents API para archivo/directorio.
 *
 * @param {string} owner Owner del repositorio.
 * @param {string} repo Nombre del repositorio.
 * @param {string} contentPath Ruta del contenido dentro del repositorio.
 * @param {string} [ref] Rama/tag/commit a consultar.
 * @returns {string} URL completa hacia `/repos/{owner}/{repo}/contents/{path}`.
 * @example
 * const url = buildContentsUrl('octocat', 'hello-world', 'README.md', 'main');
 */
export function buildContentsUrl(owner: string, repo: string, contentPath: string, ref?: string): string {
  const encodedPath = encodeContentPath(contentPath);
  const url = new URL(buildRepoApiUrl(owner, repo, `/contents/${encodedPath}`));
  if (ref) {
    url.searchParams.set('ref', ref);
  }
  return url.toString();
}

/**
 * Indica si hay token configurado para llamadas autenticadas.
 *
 * @returns {boolean} true si existe token en entorno.
 * @example
 * if (!hasGitHubToken()) console.warn('Token ausente');
 */
export function hasGitHubToken(): boolean {
  return Boolean(TOKEN);
}

/**
 * Exige token configurado para flujos que requieren acceso privado.
 *
 * @returns {void} No retorna valor; lanza error si falta token.
 * @example
 * requireToken();
 */
export function requireToken(): void {
  if (!TOKEN) {
    throw new Error('Falta GITHUB_TOKEN o GITHUB_PAT para leer repos privados.');
  }
}

function describeStatus(status: number): string {
  if (status === 401) return 'Token invalido o expirado.';
  if (status === 403) return 'Permisos insuficientes o rate limit alcanzado.';
  if (status === 404) return 'Recurso no encontrado.';
  return 'Solicitud fallida.';
}

/**
 * Registra errores HTTP/red sanitizando cualquier secreto visible.
 *
 * @param {GitHubRequestErrorContext} context Contexto estructurado del fallo.
 * @returns {void} No retorna valor.
 * @example
 * logHttpError({ url, status: 404, statusText: 'Not Found', message: 'Recurso no encontrado.' });
 */
function logHttpError(context: GitHubRequestErrorContext): void {
  const safeUrl = redactSecrets(context.url);
  const safeMessage = redactSecrets(context.message);
  console.error(
    `[github] ${context.status} ${context.statusText} ${safeUrl} :: ${safeMessage}`
  );
}

/**
 * Extrae mensaje de error desde la respuesta HTTP de GitHub.
 *
 * @param {Response} res Respuesta HTTP no exitosa.
 * @returns {Promise<string>} Mensaje de error normalizado.
 * @example
 * const message = await parseErrorMessage(response);
 */
async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    if (typeof body?.message === 'string' && body.message.trim().length > 0) {
      return `${describeStatus(res.status)} ${body.message}`;
    }
  } catch {
    // No-op: algunos endpoints no devuelven JSON en error.
  }
  return describeStatus(res.status);
}

/**
 * Ejecuta fetch con cabeceras estándar y token opcional.
 *
 * @param {string} url URL destino.
 * @param {RequestOptions} [options] Opciones HTTP complementarias.
 * @returns {Promise<Response>} Respuesta cruda de fetch.
 * @example
 * const response = await fetchWithAuth('https://api.github.com/zen');
 */
async function fetchWithAuth(url: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: options.accept || GITHUB_API_ACCEPT,
    'User-Agent': 'skills-portal-aggregator'
  };
  if (url.startsWith(GITHUB_API_BASE_URL)) {
    headers['X-GitHub-Api-Version'] = GITHUB_API_VERSION;
  }
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  return fetch(url, {
    method: options.method || 'GET',
    headers
  });
}

/**
 * Obtiene contenido de archivo o directorio via Contents API.
 *
 * @param {string} owner Owner del repositorio.
 * @param {string} repo Nombre del repositorio.
 * @param {string} contentPath Ruta del archivo o directorio dentro del repo.
 * @param {string} [ref] Rama/tag/commit a consultar.
 * @returns {Promise<GitHubContentEntry[] | GitHubContentFileResponse | null>} Objeto de archivo, listado o null en error.
 * @example
 * const content = await fetchRepositoryContent('octocat', 'hello-world', 'README.md', 'main');
 */
export async function fetchRepositoryContent(
  owner: string,
  repo: string,
  contentPath: string,
  ref?: string
): Promise<GitHubContentEntry[] | GitHubContentFileResponse | null> {
  const url = buildContentsUrl(owner, repo, contentPath, ref);
  const response = await fetchJson<GitHubContentEntry[] | GitHubContentFileResponse | GitHubContentsObjectResponse>(
    url,
    {
      accept: 'application/vnd.github.object+json'
    }
  );

  if (!response) return null;
  if (Array.isArray(response)) return response;
  if ('entries' in response && Array.isArray(response.entries)) {
    return response.entries;
  }
  if ('type' in response) {
    return response;
  }
  return null;
}

/**
 * Descarga texto de un archivo del repositorio usando Contents API.
 *
 * @param {string} owner Owner del repositorio.
 * @param {string} repo Nombre del repositorio.
 * @param {string} contentPath Ruta del archivo dentro del repositorio.
 * @param {string} [ref] Rama/tag/commit a consultar.
 * @returns {Promise<string | null>} Contenido textual o null cuando no está disponible.
 * @example
 * const markdown = await fetchRepositoryFileText('octocat', 'hello-world', 'README.md', 'main');
 */
export async function fetchRepositoryFileText(
  owner: string,
  repo: string,
  contentPath: string,
  ref?: string
): Promise<string | null> {
  const content = await fetchRepositoryContent(owner, repo, contentPath, ref);
  if (!content || Array.isArray(content)) {
    return null;
  }

  if (content.encoding === 'base64' && typeof content.content === 'string') {
    return Buffer.from(content.content, 'base64').toString('utf8');
  }

  if (content.download_url) {
    return fetchText(content.download_url, { accept: 'application/vnd.github.raw+json' });
  }

  return null;
}

/**
 * Ejecuta un GET autenticado y devuelve texto plano.
 *
 * @param {string} url URL a consultar.
 * @param {RequestOptions} [options] Opciones de solicitud HTTP.
 * @returns {Promise<string | null>} Cuerpo de texto o null si falla.
 * @example
 * const text = await fetchText('https://api.github.com/zen');
 */
export async function fetchText(url: string, options: RequestOptions = {}): Promise<string | null> {
  try {
    const res = await fetchWithAuth(url, { ...options, accept: options.accept || GITHUB_RAW_ACCEPT });
    if (!res.ok) {
      const message = await parseErrorMessage(res);
      logHttpError({
        url,
        status: res.status,
        statusText: res.statusText,
        message
      });
      return null;
    }

    return await res.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido de red.';
    logHttpError({
      url,
      status: 0,
      statusText: 'NETWORK_ERROR',
      message
    });
    return null;
  }
}

/**
 * Ejecuta un GET autenticado y devuelve JSON tipado.
 *
 * @param {string} url URL a consultar.
 * @param {RequestOptions} [options] Opciones de solicitud HTTP.
 * @returns {Promise<T | null>} JSON tipado o null si falla.
 * @example
 * const repo = await fetchJson<GitHubRepoResponse>('https://api.github.com/repos/octocat/hello-world');
 */
export async function fetchJson<T>(url: string, options: RequestOptions = {}): Promise<T | null> {
  try {
    const res = await fetchWithAuth(url, { ...options, accept: options.accept || GITHUB_API_ACCEPT });
    if (!res.ok) {
      const message = await parseErrorMessage(res);
      logHttpError({
        url,
        status: res.status,
        statusText: res.statusText,
        message
      });
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido de red.';
    logHttpError({
      url,
      status: 0,
      statusText: 'NETWORK_ERROR',
      message
    });
    return null;
  }
}
