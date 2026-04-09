# Skills Portal Roadmap

## Objetivo

Evolucionar el portal desde un lector de README y `SKILL.md` hacia una plataforma de discovery, ranking y referencia técnica para skills de ingeniería, con foco inmediato en `unit-tests-skills`.

## Estado actual

### Portal

- Stack actual: Astro 5 + TypeScript + Lunr + ingestión desde GitHub.
- El catálogo se alimenta desde `config/repos.yaml` y se agrega mediante `scripts/aggregate.ts`.
- La lectura remota usa GitHub Contents API desde `src/lib/github.service.ts`.
- Las skills se normalizan en `src/lib/skill.service.ts`.
- Las páginas actuales priorizan lectura y filtros básicos, pero no ranking, badges ni discovery editorial.

### Repositorio unit-tests-skills

- Tiene estructura fuerte: `README.md`, `SKILL.md`, `examples/`, `templates/`, `scripts/`, `references/`, `evals/`.
- La calidad técnica del contenido es buena y ya está cerca de un catálogo reusable de nivel alto.
- Falta metadata más rica para soportar filtros, navegación avanzada y recomendaciones en el portal.

## Metas de producto

1. Hacer que el portal ayude a elegir una skill, no solo a leerla.
2. Mostrar señales claras de calidad, madurez y popularidad.
3. Integrar métricas reales desde GitHub y métricas derivadas desde el propio portal.
4. Hacer que `unit-tests-skills` sea una referencia central para testing multi-framework.

## Roadmap por fases

### Fase 1. Metadata y discovery base

Objetivo:
estructurar los datos mínimos para soportar filtros reales, badges y tarjetas enriquecidas.

Entregables:

- Ampliar el modelo de skill del portal.
- Leer metadata tanto de `SKILL.md` como de `skill.json`.
- Normalizar campos como framework, nivel y tipo de test.
- Rediseñar la página `/skills` con filtros facetados.

Cambios concretos:

- Extender `SkillDoc` en `src/lib/skill.service.ts` con:
  - `frameworks: string[]`
  - `testTypes: string[]`
  - `level: 'beginner' | 'intermediate' | 'advanced' | 'expert'`
  - `status: 'draft' | 'stable' | 'recommended' | 'deprecated'`
  - `version: string`
  - `estimatedTime: number | null`
  - `hasExamples: boolean`
  - `hasTemplates: boolean`
  - `hasEvals: boolean`
  - `hasScripts: boolean`
  - `recommendedCommands: string[]`
  - `lastUpdated: string | null`
- Actualizar `scripts/aggregate.ts` para persistir esos campos en `src/content/skills/*.md` y `src/data/skills.json`.
- Rediseñar `src/pages/skills/index.astro` para ofrecer filtros por framework, nivel, tipo de test, estado y repo.

Valor esperado:

- mejor búsqueda
- mejor descubrimiento
- mejores cards
- base técnica para ranking y badges

### Fase 2. Integración de métricas GitHub

Objetivo:
enriquecer repos y skills con señales reales de actividad y confianza.

Entregables:

- Métricas de repositorio visibles en `/repos` y en las cards de skills.
- Últimos commits y contributors por repositorio.
- Datos agregados para “recent activity”.

Métricas a integrar:

- stars
- forks
- watchers o subscribers
- pushedAt o último push
- contributors
- lenguajes del repo
- releases si existen
- últimos commits

APIs sugeridas:

- GitHub REST API para contents, contributors y commits.
- GitHub GraphQL API para consultas agregadas de varios repos en una sola llamada.

Cambios concretos:

- Crear `src/lib/github-metrics.service.ts` para desacoplar métricas de la lectura de markdown.
- Extender `RepoJson` y el contenido generado de repos con:
  - `stars`
  - `forks`
  - `contributorsCount`
  - `lastCommitDate`
  - `languages`
- Ampliar `src/pages/repos/index.astro` con cards más ricas y un bloque de actividad reciente.

### Fase 3. Ranking, badges y recomendaciones

Objetivo:
convertir el portal en una herramienta de priorización y curaduría.

Entregables:

- Página `/rankings`.
- Sistema de badges automáticos.
- Recomendaciones relacionadas por skill.
- Landing orientada a colecciones y rutas de aprendizaje.

Badges recomendados:

- `Top Skill`
- `Recommended`
- `Enterprise Ready`
- `Examples Included`
- `Evals Included`
- `Recently Updated`
- `Beginner Friendly`

Reglas iniciales:

- `Examples Included` si existe `examples/`.
- `Evals Included` si existe `evals/`.
- `Enterprise Ready` si tiene examples, evals, templates, scripts y status `stable`.
- `Recently Updated` si el archivo fuente cambió en los últimos 30 días.

Fórmula inicial de score:

$$
score = 0.30 \cdot repoStars + 0.20 \cdot recentActivity + 0.20 \cdot completeness + 0.20 \cdot skillViews + 0.10 \cdot helpfulVotes
$$

Nota:
`skillViews` y `helpfulVotes` requieren telemetría propia del portal.

### Fase 4. Persistencia real de telemetría

Objetivo:
llevar la instrumentación ya implementada en cliente hacia una capa persistente y compartida, usable por ranking, activity feed y señales editoriales reales.

Pendiente:

- Crear endpoints server-side en Astro para registrar eventos del portal.
- Persistir eventos en SQLite o Turso con bajo costo operativo.
- Consolidar métricas agregadas para home, rankings y detalle de skills.
- Alimentar `skillViews` y `helpfulVotes` reales dentro del score de ranking.
- Registrar aperturas hacia fuente externa (`skill_open_source`) además de vistas locales.

Eventos a persistir:

- `skill_view`
- `skill_open_source`
- `search_query`
- `helpful_vote`

Criterios de cierre:

- Las métricas sobreviven recargas, sesiones y dispositivos.
- `/rankings` deja de depender de placeholders para vistas y votos.
- El bloque de recent activity se alimenta desde datos persistidos y no solo desde memoria local del navegador.

## Arquitectura objetivo del portal

## Dirección general

Mantener Astro y evolucionar la arquitectura actual. No hay una razón fuerte para migrar a otro framework mientras el portal siga siendo mayormente documental.

### Capas sugeridas

#### 1. Ingestion layer

Responsabilidad:
leer repos, markdown, metadata y métricas externas.

Módulos:

- `src/lib/github.service.ts`
- `src/lib/github-metrics.service.ts`
- `src/lib/repo.service.ts`
- `src/lib/skill.service.ts`

#### 2. Catalog domain

Responsabilidad:
modelar repos, skills, badges y ranking de forma estable.

Modelos sugeridos:

- `RepoDoc`
- `SkillDoc`
- `SkillMetrics`
- `SkillBadge`
- `SkillCollection`

#### 3. Presentation layer

Responsabilidad:
mostrar la información con componentes reutilizables y jerarquía clara.

Estructura recomendada:

```text
src/
  components/
    portal/
      hero/
      stat-strip/
      section-header/
    repo/
      repo-card/
      repo-metrics/
      repo-activity-list/
    skill/
      skill-card/
      skill-badge/
      skill-meta/
      skill-preview-drawer/
      skill-filters/
      skill-ranking-list/
    search/
      search-input/
      facet-panel/
  pages/
    index.astro
    skills/
      index.astro
      [slug].astro
      recommended.astro
    repos/
      index.astro
      [id].astro
    rankings.astro
    collections/
      [slug].astro
```

## Nueva arquitectura de experiencia

### Home

Secciones recomendadas:

1. Hero con propuesta de valor.
2. KPI strip con totals y activity.
3. Featured collections.
4. Top skills.
5. Explore by framework.
6. Explore by test type.
7. Recent activity.

### Skills index

Secciones recomendadas:

1. Search + facet panel.
2. Sort controls.
3. Skill grid/list switch.
4. Quick preview drawer.
5. Related collections block.

### Skill detail

Secciones recomendadas:

1. Header con metadata y badges.
2. Sidebar con quick facts.
3. Main markdown.
4. Examples / templates summary.
5. Related skills.
6. Latest commits touching the skill.

## Modelo de metadata recomendado

### Frontmatter de SKILL.md

Se recomienda este esquema para todas las skills nuevas o migradas:

```yaml
---
name: angular-jasmine-testing
title: Angular Jasmine Testing Skill
description: Diseña y estandariza pruebas unitarias en Angular con Jasmine y Karma.
version: 1.1.0
frameworks: [angular]
testTypes: [unit, integration]
level: intermediate
status: stable
estimatedTime: 180
prerequisites: []
tags: [angular, testing, jasmine, karma]
badges: [examples-included, evals-included]
maintainers:
  - name: Anthony Fernando Torres
    github: aI-dev-innovators
---
```

### skill.json

Se recomienda usar `skill.json` como complemento verificable y no solo como archivo decorativo.

Campos sugeridos:

```json
{
  "name": "angular-jasmine-testing",
  "title": "Angular Jasmine Testing Skill",
  "description": "Diseña y estandariza pruebas unitarias en Angular con Jasmine y Karma.",
  "version": "1.1.0",
  "frameworks": ["angular"],
  "testTypes": ["unit", "integration"],
  "level": "intermediate",
  "status": "stable",
  "tags": ["angular", "testing", "jasmine", "karma"],
  "estimatedTime": 180,
  "prerequisites": [],
  "includes": {
    "readme": true,
    "examples": true,
    "templates": true,
    "scripts": true,
    "evals": true
  },
  "recommendedCommands": [
    "npm run test",
    "npm run test:coverage"
  ]
}
```

### Reglas de consistencia

- `name` debe coincidir entre `SKILL.md`, `skill.json` y la carpeta del skill.
- `frameworks`, `testTypes`, `level` y `status` deben ser campos normalizados, no deducidos solo desde `tags`.
- `tags` quedan para discovery flexible, no para reglas de negocio.
- `skill.json` debe complementar al frontmatter, no contradecirlo.

## Recomendaciones específicas para unit-tests-skills

### Prioridad alta

1. Agregar metadata estructurada a las dos skills actuales.
2. Exponer claramente si cada skill es `beginner`, `intermediate` o `advanced`.
3. Diferenciar formalmente `testTypes`.
4. Marcar qué assets incluye cada skill.

### Prioridad media

1. Validar que los ejemplos principales estén vigentes.
2. Crear un `definition-of-done` para cada skill.
3. Añadir enlaces entre skills relacionadas.

### Prioridad visual y editorial

1. Posicionar `unit-tests-skills` como colección curada de testing.
2. Mostrar rutas recomendadas:
   - Angular testing path
   - TypeScript testing path
   - CI and coverage path

## Backlog técnico inicial

### Sprint 1

- Extender `SkillDoc`.
- Leer `skill.json`.
- Regenerar `skills.json` con metadata rica.
- Añadir filtros nuevos en `/skills`.

### Sprint 2

- Integrar métricas de GitHub.
- Rediseñar cards de repos y skills.
- Crear home orientada a catálogo.

### Sprint 3

- Añadir badges automáticos.
- Crear ranking inicial.
- Añadir recent activity.

### Sprint 4

- Agregar telemetría mínima.
- Crear wizard de selección.
- Crear colecciones curatoriales.

## Criterios de éxito

- Un usuario puede encontrar una skill correcta en menos de tres interacciones.
- Cada skill muestra framework, nivel, tipo de test y estado.
- El portal muestra actividad real de repositorios.
- `unit-tests-skills` puede destacarse visualmente frente al resto del catálogo.
- Las cards dejan de ser solo decorativas y pasan a comunicar valor, madurez y prioridad.
