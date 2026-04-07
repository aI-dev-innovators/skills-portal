# skills-portal

Portal de skills con Astro 5 (build estático): lee README y SKILL.md desde GitHub al compilar o servir, usando un token de solo lectura. Incluye caché en memoria y concurrencia limitada para responder rápido.

## Requisitos rápidos

- Node 20 o 22.
- Archivo `.env` en la raíz con el token de GitHub.
- Repos configurados en `config/repos.yaml` (campos: id, name, repoUrl, defaultBranch opcional, readmePath opcional, skillsPath opcional).

## Variables de entorno

- `GITHUB_TOKEN` o `GITHUB_PAT`: token de lectura usado en build y runtime para pedir README/SKILL.md.
  - Token fine-grained: Permissions → Contents: Read y Metadata: Read sobre los repos necesarios.
  - Token clásico: scope `repo` de lectura.
- `GITHUB_API_BASE_URL`: base de la API REST de GitHub (default `https://api.github.com`).
- `GITHUB_API_VERSION`: versión de API enviada en `X-GitHub-Api-Version` (default `2026-03-10`).
- `GITHUB_REPO_OWNER`: owner por defecto para sobreescribir el owner parseado de `repoUrl` (opcional).

Ejemplo de `.env`:

```bash
GITHUB_TOKEN=github_pat_xxx
GITHUB_API_BASE_URL=https://api.github.com
GITHUB_API_VERSION=2026-03-10
GITHUB_REPO_OWNER=atdetquizan
```

## Uso

- `npm install` (o `npm ci` en CI; usa `--legacy-peer-deps` solo si algún peer falla).
- `npm run dev` — servidor local en <http://localhost:4321/>.
- `npm run build` — genera `dist/` estático con base `/`.
- `npm run preview` — prueba el build generado.

URLs útiles en local:

- Home: <http://localhost:4321/>
- Skills: <http://localhost:4321/skills>
- Repos: <http://localhost:4321/repos>

## Comportamiento de datos

- Build: páginas `/skills`, `/skills/:slug`, `/repos`, `/repos/:id` consumen la GitHub API con `Authorization: Bearer <token>` al compilar.
- Obtención de archivos: se usa `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}` (por ejemplo `.../contents/README.md`).
- Cache en memoria por repo (TTL 5 min) para SKILL.md y concurrencia limitada (5 fetches simultáneos) para evitar latencias altas cuando hay muchos repos.
- Errores de red/GitHub se loguean con `[github] fetchText/fetchJson ... -> <status>`.

## Configuración de entorno

- `.env` se lee al arrancar; si cambias el valor, reinicia `npm run dev`.

## Estructura relevante

- `config/repos.yaml` — registro de repos y paths.
- `src/lib/github.service.ts` — cliente HTTP de GitHub y utilidades de Contents API.
- `src/lib/repo.service.ts` — resolución de metadata/branch y lectura de README.
- `src/lib/skill.service.ts` — listado, caché y parseo de SKILL.md.
- `src/pages/skills/*` y `src/pages/repos/*` — rutas SSR.

## Notas de despliegue

- Base de la app: `/` (configurada en `astro.config.mjs`).
- Workflows: `.github/workflows/build.yml` valida build y `.github/workflows/deploy.yml` publica en Pages (usa `npm ci`, cache npm y requiere `GITHUB_TOKEN`).

## Depuración

- Verifica el token: `curl -I -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user` debe dar 200.
- Si hay 401/404 en server logs, revisa permisos del token y paths `readmePath/skillsPath` en `config/repos.yaml`.

## Seguridad

- El token solo se usa en el backend; no se envía al cliente.
- Usa tokens de lectura, con alcance mínimo a los repos necesarios.

## Licencia

Uso interno.
