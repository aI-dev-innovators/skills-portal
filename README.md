# skills-portal

Portal de skills con Astro 5 en modo servidor: lee README y SKILL.md desde GitHub con token de solo lectura e integra autenticación con Better Auth + GitHub OAuth para acceso a la plataforma.

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
- `REPOSITORY_MANAGER_EMAILS`: lista separada por comas de correos con permiso para crear/editar/eliminar repositorios (ej. `admin@empresa.com,otro@empresa.com`).
- `BETTER_AUTH_SECRET`: secreto principal de Better Auth (recomendado: 32+ caracteres aleatorios).
- `BETTER_AUTH_URL`: URL canónica pública para resolver callbacks y cookies de autenticación.
- `AUTH_SECRET`: fallback compatible si no defines `BETTER_AUTH_SECRET`.
- `AUTH_URL`: fallback compatible si no defines `BETTER_AUTH_URL`.
- `GITHUB_API_BASE_URL`: base de la API REST de GitHub (default `https://api.github.com`).
- `GITHUB_API_VERSION`: versión de API enviada en `X-GitHub-Api-Version` (default `2026-03-10`).
- `GITHUB_REPO_OWNER`: owner por defecto para sobreescribir el owner parseado de `repoUrl` (opcional).
- `PUBLIC_SUPABASE_URL`: URL del proyecto Supabase (solo lectura pública, usada por cliente y servidor).
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publicable de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave server-only para upserts e inserción de eventos en backend.

Ejemplo de `.env`:

```bash
GITHUB_TOKEN=github_pat_xxx
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxx
ALLOWED_EMAIL_DOMAINS=example.dominio.pe,dominio.pe
REPOSITORY_MANAGER_EMAILS=admin@empresa.com,otro@empresa.com
BETTER_AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BETTER_AUTH_URL=https://skills-portal-one.vercel.app
GITHUB_API_BASE_URL=https://api.github.com
GITHUB_API_VERSION=2026-04-15
GITHUB_REPO_OWNER=atdetquizan
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
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
- Si `REPOSITORY_MANAGER_EMAILS` está definido, solo esos correos reciben el permiso de gestión de repositorios para futuras rutas de alta/edición/eliminación.

URLs útiles en local:

- Home: <http://localhost:4321/>
- Skills: <http://localhost:4321/skills>
- Repos: <http://localhost:4321/repos>

## Features en Skills

- Listado en grilla con 4 columnas en desktop (adaptativo en tablet/móvil).
- Filtros facetados en cliente (repositorio, framework, nivel, tipo de test, estado, búsqueda y toggles).
- Paginación de resultados aplicada sobre el conjunto filtrado para mantener navegación estable.
- Exportación consolidada a Excel desde `/skills` con descarga vía endpoint `GET /api/skills-export/`.

## Analytics con Supabase

- Endpoint de ingesta: `POST /api/analytics/ingest`.
- Catálogo con upsert: `users`, `repositories`, `skills`.
- Eventos append-only: `login_events`, `skill_views`, `repository_views`.
- La autenticación de GitHub ya no usa memoria: Better Auth persiste sesiones y cuentas en PostgreSQL para no perder el login al reiniciar.
- Deduplicación de vistas: misma combinación usuario+skill/repo dentro de 30 segundos no se vuelve a insertar.
- Buffer cliente: agrupa eventos y hace flush cada 25 segundos, en `pagehide`, `beforeunload` y cuando la pestaña se oculta.
- Caché de catálogo en memoria: TTL de 10 minutos para repos/skills y 30 minutos para users.

Archivos principales de analytics:

- `src/lib/db/supabase.ts`
- `src/lib/cache/catalog-cache.ts`
- `src/lib/cache/metrics-buffer.ts`
- `src/lib/services/users.ts`
- `src/lib/services/repositories.ts`
- `src/lib/services/skills.ts`
- `src/lib/services/metrics.ts`
- `src/pages/api/analytics/ingest.ts`
- `docs/supabase-analytics.sql`

Para crear tablas, índices, RLS y funciones SQL para top métricas, ejecutar el script:

- `docs/supabase-analytics.sql`

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
- Variables mínimas en Vercel: `GITHUB_TOKEN` (o `GITHUB_PAT`), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ALLOWED_EMAIL_DOMAINS`.
- Si aparece rechazo de origen o callback en login, revisa `BETTER_AUTH_URL` por ambiente y confirma que ninguna variable de URL de auth apunte a `http://localhost`.

## Depuración

- Verifica el token: `curl -I -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user` debe dar 200.
- Si hay 401/404 en server logs, revisa permisos del token y paths `readmePath/skillsPath` en `config/repos.yaml`.

## Seguridad

- El token solo se usa en el backend; no se envía al cliente.
- Usa tokens de lectura, con alcance mínimo a los repos necesarios.

## Licencia

Uso interno.
