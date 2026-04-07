import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

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

/** Directorio raíz de ejecución (se usa para resolver paths relativos). */
const ROOT = process.cwd();
/** Ruta absoluta al archivo YAML de repos. */
const CONFIG_PATH = path.join(ROOT, 'config/repos.yaml');

/**
 * Lee config/repos.yaml y devuelve la lista de repos registrados.
 * Retorna [] si el archivo no existe o no contiene el nodo repos.
 *
 * @returns {RepoConfig[]} Lista de configuraciones de repos.
 * @example
 * const repos = readReposConfig();
 */
export function readReposConfig(): RepoConfig[] {
  if (!fs.existsSync(CONFIG_PATH)) return [];
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const parsed = YAML.parse(raw);
  return Array.isArray(parsed?.repos) ? parsed.repos : [];
}
