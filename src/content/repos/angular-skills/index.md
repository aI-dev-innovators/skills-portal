---
id: angular-skills
name: Angular Skills
description: ''
tags:
  - frontend
  - angular
repoUrl: 'git@github.com:aI-dev-innovators/angular-skills.git'
defaultBranch: main
---
# angular-skills

Repositorio de catálogo de skills para proyectos Angular, con criterios evaluables y buenas prácticas. Incluye metadata en cada `SKILL.md` para que herramientas como `private-skills` puedan listar y buscar las skills.

## Agrupamientos

- Angular: todas las skills bajo `skills/angular-*` (accesibilidad, arquitectura, calidad de código, forms, monorepo, federation, navegación, performance, seguridad, estándares, estado, testing, upgrade, validación y CI, documentación).

## Resumen de skills disponibles

| Skill | Descripción | Acceso |
|-------|-------------|--------|
| Angular Accessibility | Garantiza que las aplicaciones Angular cumplan estándares de accesibilidad alineados con WCAG: markup semántico, soporte de teclado, gestión del foco y compatibilidad con lectores de pantalla. | [skills/angular-accessibility/SKILL.md](skills/angular-accessibility/SKILL.md) |
| Angular Architecture | Refuerza arquitecturas Angular mantenibles validando límites, dirección de dependencias, ownership de módulos y contratos de integración (DDD / hexagonal). | [skills/angular-architecture/SKILL.md](skills/angular-architecture/SKILL.md) |
| Angular BEM + SCSS/HTML | Aplica y valida la metodología BEM en plantillas y archivos SCSS de componentes Angular, incluyendo uso de `:host` y alineación entre `.component.html` y `.component.scss`. | [skills/angular-bem-scss-html/SKILL.md](skills/angular-bem-scss-html/SKILL.md) |
| Angular Code Quality | Mejora la mantenibilidad de código Angular y TypeScript mediante refactors seguros: legibilidad, eliminación de duplicados, tipado más estricto y organización consistente. | [skills/angular-code-quality/SKILL.md](skills/angular-code-quality/SKILL.md) |
| Angular Component Docs (TSDoc/TypeDoc) | Documenta ficheros TypeScript de Angular con TSDoc y TypeDoc aplicando reglas por versión, detección de arquitectura limpia y clasificación smart/dumb de componentes. | [skills/angular-component-docs-typedoc/SKILL.md](skills/angular-component-docs-typedoc/SKILL.md) |
| Angular Control Flow Upgrade | Migra plantillas Angular desde directivas de `CommonModule` (`*ngIf`, `*ngFor`, `[ngSwitch]`) a los bloques de control flow nativos (`@if`, `@for`, `@switch`) de Angular 17+. | [skills/angular-control-flow-upgrade/SKILL.md](skills/angular-control-flow-upgrade/SKILL.md) |
| Angular Forms Architecture | Diseña e implementa formularios escalables, tipados y de alto rendimiento usando Reactive Forms, `ControlValueAccessor`, validadores asíncronos y renderizado dinámico. | [skills/angular-forms/SKILL.md](skills/angular-forms/SKILL.md) |
| Angular GraphQL Clean Architecture | Evalúa la versión y estructura del proyecto Angular e implementa GraphQL con Apollo Angular preservando las capas domain/application/infrastructure/presentation. | [skills/angular-graphql-clean-architecture/SKILL.md](skills/angular-graphql-clean-architecture/SKILL.md) |
| Angular Input/Output Modernization | Migra las APIs `@Input`/`@Output` basadas en decoradores al estilo moderno `input()` y `output()`, preservando aliases, flags `required`, transforms y límites de arquitectura limpia. | [skills/angular-input-output-modernization/SKILL.md](skills/angular-input-output-modernization/SKILL.md) |
| Angular Monorepo Workspace | Genera un monorepo estructurado desde cero con Turbo Workspaces, configurando dinámicamente capas de apps (Shells), projects (Remotes), libs y shared con Angular 20+. | [skills/angular-monorepo/SKILL.md](skills/angular-monorepo/SKILL.md) |
| Angular Native Federation | Configura microfrontends con Native Federation gestionando dependencias, roles Shell/Remote y comunicación entre aplicaciones en proyectos Angular. | [skills/angular-native-federation/SKILL.md](skills/angular-native-federation/SKILL.md) |
| Angular Skill Navigator | Índice central que enruta solicitudes hacia la skill Angular correcta y explica cómo se complementan entre sí, reduciendo fricción al identificar el punto de entrada adecuado. | [skills/angular-navigator/SKILL.md](skills/angular-navigator/SKILL.md) |
| Angular Performance | Diagnóstica cuellos de botella de rendimiento en Angular (renderizado, change detection, bundle) y propone optimizaciones enfocadas y medibles. | [skills/angular-performance/SKILL.md](skills/angular-performance/SKILL.md) |
| Angular Security | Fortalece la seguridad del frontend Angular identificando vulnerabilidades (XSS, gestión de tokens, dependencias) y proponiendo remediaciones priorizadas y verificables. | [skills/angular-security/SKILL.md](skills/angular-security/SKILL.md) |
| Angular Engineering Standards | Define los estándares compartidos de ingeniería Angular: nomenclatura, tipado, reutilización y validación, para que las demás skills puedan mantenerse enfocadas y sin duplicación. | [skills/angular-standards/SKILL.md](skills/angular-standards/SKILL.md) |
| Angular State Governance | Define y aplica la propiedad de estado escalable en Angular usando Signals, RxJS o NgRx con una única fuente de verdad y aislamiento de efectos secundarios. | [skills/angular-state/SKILL.md](skills/angular-state/SKILL.md) |
| Angular Testing Strategy | Define una estrategia de testing confiable en Angular (unit, integration, e2e) con patrones de ejecución estables y quality gates claros para CI. | [skills/angular-testing/SKILL.md](skills/angular-testing/SKILL.md) |
| Angular UI/UX Component Designer | Diseña y maqueta interfaces modernas en Angular con enfoque UI/UX: componentización, reutilización de secciones, accesibilidad, responsive y consistencia visual. | [skills/angular-ui-ux-component-designer/SKILL.md](skills/angular-ui-ux-component-designer/SKILL.md) |
| Angular Upgrade | Planifica y ejecuta migraciones desde apps Angular antiguas (ej. v7/v9 con TSLint) hacia versiones actuales con riesgo mínimo, cubriendo secuenciación, TSLint→ESLint y cambios disruptivos. | [skills/angular-upgrade/SKILL.md](skills/angular-upgrade/SKILL.md) |
| Angular Validation & CI | Valida la preparación de entregas Angular con install, lint, tests, build y diagnósticos accionables de fallos, centralizando evidencia de CI reutilizable por otras skills. | [skills/angular-validation-ci/SKILL.md](skills/angular-validation-ci/SKILL.md) |
| Análisis Técnico Pre-Migración Angular | Escanea el repositorio, detecta la versión actual, analiza dependencias, estructura, malas prácticas y cobertura de tests, y genera un reporte accionable hacia Angular 20. | [skills/analisis-tecnico-pre-migracion-angular/SKILL.md](skills/analisis-tecnico-pre-migracion-angular/SKILL.md) |
| Analizador de Flujos | Actúa como QA Engineer para certificar que la lógica de negocio permanece íntegra frente a cambios tecnológicos, identificando flujos, reglas de negocio y escenarios críticos. | [skills/analizador-de-flujos/SKILL.md](skills/analizador-de-flujos/SKILL.md) |
| Migración Angular v15 → v20 | Guía paso a paso para migrar proyectos Angular desde la versión 15 hasta la 20, cubriendo cada versión intermedia (15→16→17→18→19→20) con instrucciones de `ng update`. | [skills/migracion-angular-v15-a-v20/SKILL.md](skills/migracion-angular-v15-a-v20/SKILL.md) |

## Estructura y metadata

- Cada carpeta bajo `skills/` contiene un `SKILL.md` con el criterio de evaluación y prácticas recomendadas.
- Metadata mínima en el frontmatter de cada `SKILL.md` para que el CLI muestre título y descripción:
  - `name`: identificador único (slug)
  - `title`: título legible (ej. "Angular Accessibility")
  - `description`: resumen corto para el listado
  - Opcionales: `version`, `tags`, `internal: true|false`, `maintainers` [{ name, email }]
- Ejemplo de frontmatter recomendado:

  ```yaml
  ---
  name: angular-accessibility
  title: Angular Accessibility
  description: Ensure Angular applications meet WCAG-aligned accessibility standards.
  version: 1.0.0
  tags: [angular, accessibility, wcag]
  internal: false
  maintainers:
    - name: Equipo Frontend
      email: frontend@example.com
  ---
  ```

## Uso con `private-skills`

1. Instala el CLI (ejemplo local):

```bash
npm install -g <ruta-o-registro-del-cli>
```

1. Agrega este repo (SSH o HTTPS):

```bash
private-skills add git@github.com:aI-dev-innovators/angular-skills.git --name angular-skills
# o
# private-skills add https://github.com/aI-dev-innovators/angular-skills.git --name angular-skills
```

1. Lista las skills instaladas:

```bash
private-skills list
```

1. Busca por término:

```bash
private-skills search forms
```

1. Elimina las skills de este repo en bloque:

```bash
private-skills remove-repo git@github.com:aI-dev-innovators/angular-skills.git
# o la URL HTTPS si así lo agregaste
```

## Convenciones

- Usa `name` estables (no cambian entre versiones) y títulos claros para UX de listado.
- Mantén `description` breve (1 línea) enfocada al objetivo de la skill.
- Usa `tags` para búsquedas rápidas (ej. `angular`, `a11y`, `testing`).
- Marca con `internal: true` las skills que no deban mostrarse por defecto; el CLI requiere `--internal` para verlas.
- Incluye `version` cuando cambien los criterios de evaluación de manera relevante.
