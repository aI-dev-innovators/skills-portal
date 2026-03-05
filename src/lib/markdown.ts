import { marked } from 'marked';

/**
 * Convierte markdown en HTML usando marked.
 * @param {string} md Texto markdown de entrada.
 * @returns HTML seguro para inyectar en server-render.
 */
export function mdToHtml(md: string) {
  return marked.parse(md ?? '');
}
