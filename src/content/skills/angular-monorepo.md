---
name: angular-monorepo
title: angular-monorepo
description: >-
  Generar un monorepo estructurado desde cero usando Turbo Workspaces. Configura
  e inicializa dinámicamente las capas de apps (Shells), projects (Remotes),
  libs y shared (incluyendo Mono CLI) usando siempre Angular 20 y una versión de
  Node.js compatible.
tags: []
repoId: frontend-skills
repoName: Frontend Skills
---

# Angular Monorepo Workspace

## Summary
- Inicializa un workspace de Turbo estructurado para arquitecturas empresariales.
- Orquesta la creación de proyectos bajo la organización estricta de:
  - `apps/` (Hosts / Shells)
  - `projects/` (Microfrontends Remotes)
  - `libs/` (Librerías Angular empaquetables)
  - `shared/` (Utilidades / tooling interno, incluyendo Mono CLI)
- Fuerza el uso exclusivo de **Angular 20** (CLI + deps) y el uso de **Native Federation**.
- Configura automáticamente un **Mono CLI** con `commander` y `prompts` para gestión interna del monorepo.
- Asegura ejecución no-interactiva (sin bloqueos por prompts) y configuración lista para CI.

## Hard Constraints (Reglas No Negociables)
1. Angular: TODO lo que se genere con Angular debe quedar en Angular 20.
2. Node.js: el entorno debe cumplir compatibilidad con Angular 20 (Node soportado por Angular 20). (Ver tabla oficial de compatibilidad de Angular para Node/TS/RxJS.)
3. Turbo 2.x: NUNCA usar la clave `pipeline` en `turbo.json`. Las tareas deben vivir SOLO en `"tasks"`. (Doc oficial de Turborepo.)
4. Native Federation:
   - Shell (host) debe inicializar federation usando el manifest por defecto `/assets/federation.manifest.json`.
   - El manifest mapea remotos a `remoteEntry.json` (no `remoteEntry.js`).
5. Routing:
   - REGLA ESTRICTA: al cargar remotos con `loadComponent`, el `then(...)` debe resolver estrictamente a `m.App`.
     Ej: `loadComponent: () => loadRemoteModule('...', './Component').then(m => m.App)`

## Execution Instructions (Agentic Flow)
El asistente DEBE actuar como un AGENTE interactivo y seguir estos 3 pasos de forma estricta:

----------------------------------------------------------------------
1) Recopilación de Requisitos (Prompt Inicial)
----------------------------------------------------------------------

Antes de generar código, el asistente debe preguntar al usuario qué elementos desea crear.
DEBES usar exactamente este texto:

"Para inicializar el monorepo, por favor especifica los nombres de los proyectos que deseas generar en cada capa:
- `apps/` (Tus Aplicaciones principales / Shells. Ej: ccd-backoffice-shell-web)
- `projects/` (Tus Microfrontends remotos. Ej: ccd-access-backoffice-mfe)
- `libs/` (Tus Librerías compartidas. Ej: ccd-styles-backoffice-lib)
- `shared/` (Tus utilidades. Ej: mono-cli)"

Luego, el asistente debe: 
- Detectar duplicados.
- Confirmar si el usuario quiere:
  - SSR (sí/no) para shells/remotes (opcional, por defecto NO).
  - estilo `scss` o `css` (opcional, por defecto `scss`).
  - test runner (opcional; por defecto el del CLI).

NOTA: si el usuario no especifica SSR/estilo/test-runner, usa defaults seguros sin preguntar (no bloquear el flujo).

----------------------------------------------------------------------
2) Preparación del Entorno + Inicialización del Workspace Base
----------------------------------------------------------------------

2.1 Preflight (Falla rápido si algo no cumple)
- Verifica versión de Node.js y asegúrate de que sea compatible con Angular 20 (según tabla oficial).
- Verifica que el package manager exista (npm/pnpm/yarn/bun) y detecta versión.
- Crea un archivo de “runtime config” del generador en raíz:
  - `.mono/registry.json` (o `mono.registry.json`) para persistir:
    - lista de shells/remotes/libs/shared
    - asignación de puertos
    - paths y nombres
    - timestamp del scaffolding

2.2 Bloqueo de Interrupciones (No-interactive)
Antes de cualquier comando `ng`:
- Ejecuta `ng analytics disable --global` o exporta `NG_CLI_ANALYTICS=false`.
- Fuerza modo no-interactivo en generación:
  - `--defaults` (deshabilita prompts con defaults)
  - `--interactive=false`
- RECOMENDADO: ejecutar con `CI=true` en contextos de pipeline.

2.3 Estructura base del repo
Crea (o asegura) la estructura:
- `apps/`
- `projects/`
- `libs/`
- `shared/`
- `.mono/` (metadatos internos: puertos, registry, etc.)

Asegura que carpetas vacías queden versionables:
- Crea `.gitkeep` dentro de cada carpeta (y subcarpetas necesarias).

2.4 Root package.json (Workspaces)
Crea `package.json` raíz con:
- `"private": true`
- `"workspaces": ["apps/*", "projects/*", "libs/*", "shared/*"]`
- `"packageManager": "npm@10.8.0"` (o la versión detectada del PM del entorno)
- Scripts mínimos recomendados (IMPORTANTE: `dev` con filtros):
  - `"dev": "turbo run dev --parallel --filter=./apps/* --filter=./projects/*"`
  - `"build": "turbo run build"`
  - `"lint": "turbo run lint"`
  - `"test": "turbo run test"`
  - `"format": "turbo run format"`
  - `"clean": "turbo run clean"`
  - `"clean:caches": "mono clean:caches"`
  - `"ensure:gitkeep": "mono ensure:gitkeep"`
  - `"mono": "mono --help"`

DevDependencies recomendadas en root:
- `turbo`
- `prettier`
- `eslint` (si quieres estándar transversal)
- `rimraf` (o equivalente cross-platform)

IMPORTANTE:
- Turborepo usa el `packageManager` field para estabilizar el repo y su cache; mantenlo siempre presente.

2.5 turbo.json (Turbo 2.x)
Crea `turbo.json` en root.
REGLA ESTRICTA: NO usar `pipeline`. Usa `tasks`.

Ejemplo recomendado:
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "coverage/**", ".angular/cache/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "format": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}

2.6 Archivos “de calidad” (recomendado)
Crea en root:
- `.gitignore` (node_modules, dist, .angular, .turbo, coverage, etc.)
- `.editorconfig`
- `.prettierrc` y `.prettierignore`
- `.npmrc` (opcional: `fund=false`, `audit=false`)
- `.nvmrc` (o `.node-version`) con un Node compatible con Angular 20

----------------------------------------------------------------------
3) Generación Autónoma y Estructuración
----------------------------------------------------------------------

3.1 Estrategia de puertos (determinística y persistente)
- Asignación sugerida:
  - Shells (`apps/`) arrancan en 4200, 4201, ...
  - Remotes (`projects/`) arrancan en 4300, 4301, ...
- Persistir asignación en `.mono/registry.json` para que:
  - el CLI “mono” pueda reutilizar los mismos puertos al regenerar
  - evitar colisiones en futuros additions

3.2 Generación en apps/ (Shells / Hosts)
Por cada shell en `apps/`:
1) Genera el proyecto Angular 20 en `apps/<shellName>`:
   - Debe usar flags no-interactivos:
     - `--defaults --interactive=false`
   - Debe ser standalone y zoneless:
     - `--standalone --zoneless`
   - Evitar installs repetidos:
     - `--skip-install`
   - Evitar git init por paquete:
     - `--skip-git`

   Nota: la opción `zoneless` existe en `ng new` (CLI). Igual para `standalone`.

2) Agrega Native Federation como dynamic-host:
   - `ng add @angular-architects/native-federation --project <shellName> --type dynamic-host --port <puertoShell>`

3) Verificación/normalización post-schematic:
   - Asegura que `main.ts` inicializa federation usando el manifest:
     - `initFederation('/assets/federation.manifest.json')`
   - Asegura que el manifest exista y sea el punto único de verdad para remotes.
   - Nota: el manifest mapea a `remoteEntry.json`.

4) Configura rutas para remotes en `app.routes.ts`:
   - Por cada remote, agrega una ruta lazy con `loadComponent` y regla de retorno `m.App`:

   {
     path: '<remoteName>',
     loadComponent: () => loadRemoteModule('<remoteName>', './Component').then(m => m.App)
   }

   REGLA: `then(m => m.App)` es obligatorio (no `m.default`, no `m.AppComponent`, no otra cosa).

3.3 Generación en projects/ (Remotes)
Por cada remote en `projects/`:
1) Genera el proyecto Angular 20 en `projects/<remoteName>` con los mismos flags:
   - `--standalone --zoneless --defaults --interactive=false --skip-install --skip-git`

2) Agrega Native Federation como remote:
   - `ng add @angular-architects/native-federation --project <remoteName> --type remote --port <puertoRemote>`

3) Verifica exposición:
   - Debe existir `federation.config.js` (o equivalente) exponiendo al menos `./Component` apuntando al componente principal.
   - El remote debe servir `remoteEntry.json`.

3.4 Enlace Shell <-> Remotes (Manifest)
- Para cada shell:
  - Actualiza `/assets/federation.manifest.json` para incluir todos los remotes seleccionados:
    {
      "<remoteName>": "http://localhost:<puertoRemote>/remoteEntry.json"
    }
- La fuente de verdad de remotes en runtime debe ser el manifest (no hardcode en código).

3.5 Generación en libs/ (Angular Libraries)
Objetivo: cada lib en `libs/<libName>` debe ser un paquete workspace independiente y buildable.

Por cada lib:
1) Crea un Angular workspace vacío (Angular 20) dentro de `libs/<libName>`:
   - `ng new <libName> --create-application=false --directory libs/<libName> --defaults --interactive=false --skip-install --skip-git`

2) Dentro de ese workspace, genera la library en el root del paquete:
   - `ng generate library <libName> --project-root . --defaults --interactive=false --skip-install`

3) Scripts del paquete (mínimos):
   - `"build": "ng build <libName>"`
   - `"lint": "ng lint"`
   - `"test": "ng test --watch=false"` (o equivalente)
   - `"dev": "echo \"No dev server for libs\""`
   - `"format": "npx prettier -w ."`
   - `"clean": "npx rimraf dist .angular/cache"`

3.6 Generación en shared/ (Mono CLI y utilidades)
- Para cualquier shared module:
  - Crear paquete Node simple workspace.
- Caso especial: si el usuario incluye CLI (ej. `mono-cli`), DEBES ejecutar de forma autónoma:

  1) `mkdir -p shared/<cliName> && cd shared/<cliName>`
  2) `npm init -y`
  3) `npm install commander prompts`
  4) Crear `bin/index.js` con:
     - shebang: `#!/usr/bin/env node`
     - `// @ts-check` y JSDoc typings para “tipado fuerte” sin TS compile.
     - Comandos base (todos):
       - `create:lib`
       - `create:app`
       - `create:project`
       - `lint`
       - `format`
       - `build`
       - `dev`
       - `clean:caches`
       - `ensure:gitkeep`

     Comportamiento recomendado del CLI:
     - Leer `.mono/registry.json`
     - Si no existe, inicializarlo.
     - Calcular puertos libres y persistirlos.
     - Ejecutar comandos del workspace usando turbo:
       - `turbo run build|dev|lint|format|test`
     - `clean:caches` debe borrar:
       - `.turbo/`
       - `**/.angular/cache/`
       - `**/dist/`
     - `ensure:gitkeep` debe recrear `.gitkeep` en carpetas vacías.

  5) Modificar el `package.json` del CLI para incluir:
     - `"bin": { "mono": "./bin/index.js" }`

3.7 Normalización final (una sola instalación)
Al terminar de generar TODO:
- Ejecuta instalación en root UNA sola vez:
  - `npm install` (o el PM detectado)
- (Opcional recomendado) `npm dedupe` para reducir duplicados.
- Verifica que TODO esté en Angular 20:
  - si algún paquete quedó con Angular 21+ por accidente, corregir versiones.

3.8 Scripts por paquete (convergencia con Turbo)
Para que Turbo corra bien:
- Cada paquete (apps/projects/libs/shared/mono-cli) debe tener scripts:
  - `dev`, `build`, `lint`, `format`, `test`, `clean`
- Si un paquete no requiere una tarea, el script debe existir y ser “no-op” explícito (ej. `echo`).

3.9 README y “DX”
Genera `README.md` en root (mínimo):
- estructura de carpetas
- cómo correr todo:
  - `npm run dev`, `npm run build`, etc.
- tabla de puertos
- ubicación y formato del manifest:
  - `apps/<shell>/src/assets/federation.manifest.json`

## Notas opcionales (SSR)
Si el usuario pide SSR:
- Se recomienda el orden:
  1) `ng add @angular/ssr --project <name>`
  2) `ng add @angular-architects/native-federation --project <name> --type ... --port ...`
(Esto evita fricción con schematics y bootstrap server.)

## Goal
Establecer un ecosistema de desarrollo unificado (Monorepo) altamente cohesivo, estandarizando:
- Microfrontends con Angular 20
- Native Federation (dynamic host + remotes)
- Manifest runtime (`/assets/federation.manifest.json` -> `remoteEntry.json`)
- Turbo Workspaces con `tasks` (Turbo 2.x)
- Un CLI propio (Mono CLI) para mantenimiento y generación incremental
