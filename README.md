# skills-portal

Portal de skills con Astro 5 en modo servidor: lee README y SKILL.md desde GitHub con token de solo lectura e integra autenticación con GitHub OAuth para acceso a la plataforma.

## Requisitos rápidos

- Node 20 o 22.
- Archivo `.env` en la raíz con el token de GitHub.
- Repos configurados en `config/repos.yaml` (campos: id, name, repoUrl, defaultBranch opcional, readmePath opcional, skillsPath opcional).

## Variables de entorno

- `GITHUB_TOKEN` o `GITHUB_PAT`: token de lectura usado en build y runtime para pedir README/SKILL.md.
  - Token fine-grained: Permissions → Contents: Read y Metadata: Read sobre los repos necesarios.
  - Token clásico: scope `repo` de lectura.
- `GITHUB_CLIENT_ID`: Client ID de la GitHub OAuth App.
- `GITHUB_CLIENT_SECRET`: Client Secret de la GitHub OAuth App.
- `ALLOWED_EMAIL_DOMAINS`: lista separada por comas de dominios permitidos para login (ej. `example.dominio.pe,dominio.pe`).
- `AUTH_SECRET`: secreto para firmar sesión/cookies de Auth.js.
- `AUTH_URL`: URL canónica pública de Auth.js (ej. `https://skills-portal-one.vercel.app`).
  - Recomendado en Vercel para evitar que Auth resuelva `localhost` en cookies `callback-url`.
- `AUTH_TRUST_HOST`: usar `true` detrás de proxy/plataformas gestionadas.
- `GITHUB_API_BASE_URL`: base de la API REST de GitHub (default `https://api.github.com`).
- `GITHUB_API_VERSION`: versión de API enviada en `X-GitHub-Api-Version` (default `2026-03-10`).
- `GITHUB_REPO_OWNER`: owner por defecto para sobreescribir el owner parseado de `repoUrl` (opcional).

Ejemplo de `.env`:

```bash
GITHUB_TOKEN=github_pat_xxx
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxx
ALLOWED_EMAIL_DOMAINS=example.dominio.pe,dominio.pe
AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AUTH_URL=https://skills-portal-one.vercel.app
AUTH_TRUST_HOST=true
GITHUB_API_BASE_URL=https://api.github.com
GITHUB_API_VERSION=2026-04-15
GITHUB_REPO_OWNER=atdetquizan
```

## Uso

- `npm install` (o `npm ci` en CI; usa `--legacy-peer-deps` solo si algún peer falla).
- `npm run dev` — servidor local en <http://localhost:4321/>.
- `npm run build` — genera el bundle servidor en `dist/`.
- `npm run preview` — prueba el build generado.

## Login con GitHub

- Configura una OAuth App en GitHub con callback URL: `http://localhost:4321/api/auth/callback/github`
- Para producción usa: `https://<tu-dominio>/api/auth/callback/github`
- El acceso a rutas de la plataforma queda protegido por middleware; sin sesión se redirige a `/login/`.
- Si `ALLOWED_EMAIL_DOMAINS` está definido, solo ingresan usuarios con email de esos dominios.

URLs útiles en local:

- Home: <http://localhost:4321/>
- Skills: <http://localhost:4321/skills>
- Repos: <http://localhost:4321/repos>

## Features en Skills

- Listado en grilla con 4 columnas en desktop (adaptativo en tablet/móvil).
- Filtros facetados en cliente (repositorio, framework, nivel, tipo de test, estado, búsqueda y toggles).
- Paginación de resultados aplicada sobre el conjunto filtrado para mantener navegación estable.
- Exportación consolidada a Excel desde `/skills` con descarga vía endpoint `GET /api/skills-export/`.

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
- En Vercel, el proyecto ahora usa el adapter oficial de Vercel automáticamente cuando detecta `VERCEL=true`.
- Si aparece `404: NOT_FOUND` en Vercel, revisa que el deployment sea de este repo/rama y que no esté apuntando a un output estático antiguo.
- Variables mínimas en Vercel: `GITHUB_TOKEN` (o `GITHUB_PAT`), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`, `ALLOWED_EMAIL_DOMAINS`.
- Si aparece `Cross-site POST form submissions are forbidden`, revisa `AUTH_URL`/`NEXTAUTH_URL` por ambiente y confirma que ninguna variable apunte a `http://localhost`.

## Depuración

- Verifica el token: `curl -I -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user` debe dar 200.
- Si hay 401/404 en server logs, revisa permisos del token y paths `readmePath/skillsPath` en `config/repos.yaml`.

## Seguridad

- El token solo se usa en el backend; no se envía al cliente.
- Usa tokens de lectura, con alcance mínimo a los repos necesarios.

## Licencia

Uso interno.
