import { marked } from 'marked';

/**
 * Convierte markdown en HTML usando marked.
 *
 * @param {string} md Texto markdown de entrada.
 * @returns {string} HTML serializado para inyectar en server-render.
 * @example
 * const html = mdToHtml('# Hola mundo');
 */
export function mdToHtml(md: string): string {
  return String(marked.parse(md ?? ''));
}
