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

Ejemplo de `.env`:

```bash
GITHUB_TOKEN=github_pat_xxx
```

## Uso

- `npm install` (o `npm ci` en CI; usa `--legacy-peer-deps` solo si algún peer falla).
- `npm run dev` — servidor local en <http://localhost:4321/skills-portal> (respeta la base `skills-portal`).
- `npm run build` — genera `dist/` estático (base `/skills-portal` para GitHub Pages).
- `npm run preview` — prueba el build generado.

URLs útiles en local:
- Home: <http://localhost:4321/skills-portal>
- Skills: <http://localhost:4321/skills-portal/skills>
- Repos: <http://localhost:4321/skills-portal/repos>

## Comportamiento de datos

- Build: páginas `/skills`, `/skills/:slug`, `/repos`, `/repos/:id` consumen la GitHub API/RAW con `Authorization: Bearer <token>` al compilar.
- Cache en memoria por repo (TTL 5 min) para SKILL.md y concurrencia limitada (5 fetches simultáneos) para evitar latencias altas cuando hay muchos repos.
- Errores de red/GitHub se loguean con `[github] fetchText/fetchJson ... -> <status>`.

## Configuración de entorno

- `.env` se lee al arrancar; si cambias el valor, reinicia `npm run dev`.

## Estructura relevante

- `config/repos.yaml` — registro de repos y paths.
- `src/lib/github.ts` — fetch autenticado de README/skills.
- `src/lib/skills.ts` — listado, caché y parseo de SKILL.md.
- `src/pages/skills/*` y `src/pages/repos/*` — rutas SSR.

## Notas de despliegue

- Base de la app: `/skills-portal` (configurada en `astro.config.mjs`) para GitHub Pages.
- Workflows: `.github/workflows/build.yml` valida build y `.github/workflows/deploy.yml` publica en Pages (usa `npm ci`, cache npm y requiere `GITHUB_TOKEN`).

## Depuración

- Verifica el token: `curl -I -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user` debe dar 200.
- Si hay 401/404 en server logs, revisa permisos del token y paths `readmePath/skillsPath` en `config/repos.yaml`.

## Seguridad

- El token solo se usa en el backend; no se envía al cliente.
- Usa tokens de lectura, con alcance mínimo a los repos necesarios.

## Licencia

Uso interno.
