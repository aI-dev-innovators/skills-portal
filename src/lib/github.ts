import 'dotenv/config';
import { RepoConfig } from './config';

/** Token de lectura para llamadas autenticadas a GitHub (Bearer). */
const TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || '';

/**
 * Garantiza que haya un token de GitHub disponible antes de acceder a repos privados.
 */
export function requireToken() {
  if (!TOKEN) {
    throw new Error('Falta GITHUB_TOKEN o GITHUB_PAT para leer repos privados.');
  }
}

/**
 * Extrae owner y repo desde una URL SSH o HTTPS de GitHub.
 * @param {string} repoUrl URL SSH o HTTPS del repositorio.
 * @returns {{ owner: string; name: string } | null} { owner, name } o null si no matchea.
 */
export function parseRepoSlug(repoUrl: string): { owner: string; name: string } | null {
  const sshMatch = repoUrl.match(/github\.com:([^/]+)\/(.+?)(\.git)?$/);
  if (sshMatch) return { owner: sshMatch[1], name: sshMatch[2].replace(/\.git$/, '') };
  const httpsMatch = repoUrl.match(/github\.com\/([^/]+)\/(.+?)(\.git)?/);
  if (httpsMatch) return { owner: httpsMatch[1], name: httpsMatch[2].replace(/\.git$/, '') };
  return null;
}

/**
 * Wrapper de fetch con cabecera Accept y Authorization opcional.
 * @param {string} url Destino a solicitar.
 * @param {string} accept Valor de la cabecera Accept.
 * @returns {Promise<Response>} Respuesta HTTP sin procesar.
 */
async function fetchWithAuth(url: string, accept: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: accept };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return fetch(url, { headers });
}

/**
 * Obtiene texto bruto (por defecto RAW) con autenticación opcional.
 * @param {string} url Endpoint a descargar.
 * @param {string} [accept] Cabecera Accept (por defecto RAW).
 * @returns Texto o null si falla.
 */
export async function fetchText(url: string, accept = 'application/vnd.github.raw'): Promise<string | null> {
  const res = await fetchWithAuth(url, accept);
  if (!res.ok) {
    console.error(`[github] fetchText ${url} -> ${res.status}`);
    return null;
  }
  return await res.text();
}

/**
 * Obtiene JSON desde la API de GitHub con autenticación opcional.
 * @param {string} url Endpoint a descargar.
 * @returns {T | null} Objeto tipado o null si falla.
 */
export async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetchWithAuth(url, 'application/vnd.github+json');
  if (!res.ok) {
    console.error(`[github] fetchJson ${url} -> ${res.status}`);
    return null;
  }
  return (await res.json()) as T;
}

/**
 * Intenta leer el README de un repo: primero via API (base64) y fallback a RAW.
 * @param {RepoConfig} repo Configuración del repo origen.
 * @returns {Promise<string | null>} Contenido markdown del README o null.
 */
export async function fetchReadme(repo: RepoConfig): Promise<string | null> {
  const slug = parseRepoSlug(repo.repoUrl);
  if (!slug) return null;
  const branch = repo.defaultBranch || 'main';

  const apiUrl = `https://api.github.com/repos/${slug.owner}/${slug.name}/readme?ref=${branch}`;
  const json = await fetchJson<{ content: string; encoding: string }>(apiUrl);
  
  if (json?.encoding === 'base64' && json.content) {
    return Buffer.from(json.content, 'base64').toString('utf8');
  }

  const readmePath = repo.readmePath || 'README.md';
  const rawUrl = `https://raw.githubusercontent.com/${slug.owner}/${slug.name}/${branch}/${readmePath}`;
  return fetchText(rawUrl);
}
