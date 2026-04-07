---
id: angular-skills-angular-testing
name: angular-skills-angular-testing
title: Angular Testing Strategy
description: >-
  Define a reliable Angular testing strategy across unit, integration, and e2e
  layers with stable execution patterns and clear quality gates.
tags:
  - angular
  - testing
repoId: angular-skills
repoName: Angular Skills
---

# Angular Testing Strategy (Skill)

## Summary
- Define una estrategia de testing equilibrada (unit, integration, e2e) para Angular que aumente la confianza sin frenar la entrega.
- Orquesta runners (Jest/Karma), tipos de pruebas y gates de CI en coordinación con **Angular Standards** y **Angular Validation & CI**.

## Goal
Create a balanced, maintainable test strategy that improves confidence without slowing delivery.

## Single responsibility
Testing strategy and coverage guidance only. For shared conventions, use **Angular Engineering Standards**.

## Inputs
- Setup actual de testing (Jest, Karma, configuración de scripts NPM) y restricciones de CI.
- Módulos/features críticos, flujos de usuario clave y áreas con flaky tests o baja cobertura.
- Objetivos de calidad (por ejemplo, aumentar cobertura en dominio X, estabilizar un suite, definir mix de unit/integration/e2e).
- Comandos de test y lint disponibles que el equipo esté dispuesto a usar en gates.

## Triggers
- New project setup or test strategy reset.
- Flaky/slow suites with low confidence.
- Coverage increase in critical business modules.
- Tooling standardization across Jest/Karma.

## Tooling scope
- Supported test runners/frameworks for this skill: **Jest** and **Karma**.
- Do not propose Cypress/Playwright migration in this skill.
- If e2e coverage is requested, define strategy-level guidance only unless the project already has an approved e2e tool.

## Test execution confirmation (required)
Before running any test command, request explicit confirmation.

### Confirmation prompt
Use this exact gate:
- "Do you want to execute tests now with this skill?"

### Execution rule
- If confirmed: run only the agreed commands (for example `npm run test`, or a scoped Jest/Karma command).
- If not confirmed: provide strategy, findings, and proposed commands without executing them.
- If partially confirmed: run only the approved subset (for example unit tests only).

## Recommended test distribution
- Unit: highest volume, fastest feedback.
- Integration: moderate volume, boundary confidence.
- E2E: limited set, critical journeys only.

## Test matrix by Angular artifact
- **Component:** render behavior, inputs/outputs, accessibility-critical interaction.
- **Service:** business rules, edge cases, error handling.
- **Guard/Resolver:** route decision logic and fallback behavior.
- **Interceptor:** auth headers, error mapping, retry policy.
- **State store/facade:** transitions, selectors/computed outputs, side effects.
- **Standalone component:** verify explicit `imports`, routes (`provideRouter` testing harness), and modern control flow `@if/@for`.
- **Signal store/effect:** validate the initial `signal()`, derived `computed` values, and `effect` teardown via `takeUntilDestroyed()`.

## Anti-flaky policy
- No arbitrary sleeps.
- Stable fixtures and deterministic mock data.
- Controlled clocks/timers when timing matters.
- Isolated test ownership per behavior.

## Deliverables
1. Strategy summary and gaps
2. Prioritized test backlog
3. File-level test templates/examples
4. CI gate proposal

## Domain test-data builder policy
- Prefer reusable builders/factories for domain entities in tests.
- Keep defaults realistic and allow simple overrides per scenario.
- Avoid inline object duplication in repeated test cases.

## Spec generation for existing code
1. Levanta primero un inventario de artefactos Angular sin spec (`component`, `service`, `guard`, `interceptor`, `store/facade`, `signal store`) usando un patrón como `src/**/*.ts` excluyendo `*.spec.ts`.
2. Por cada archivo sin pruebas, crea un `*.spec.ts` en la misma carpeta usando el mismo nombre base (por ejemplo `user-search.component.ts` → `user-search.component.spec.ts`).
3. Para componentes standalone, usa `TestBed.configureTestingModule({ imports: [ComponentUnderTest] })` y arranca con un caso mínimo que verifique la creación del componente y, cuando aplique, un comportamiento clave (render de texto o emisión de output).
4. Para servicios y stores, arranca con tests sobre los métodos públicos principales (happy path + edge/error) en lugar de pruebas vacías que sólo afirmen `toBeTruthy()`.
5. No sobrescribas specs existentes: si un archivo ya tiene `*.spec.ts`, extiende esas pruebas siguiendo la estrategia de este skill en vez de crear un archivo nuevo.
6. Documenta en el README del módulo cualquier decisión de dejar artefactos sin spec (dueño, motivo y fecha objetivo) cuando no sea viable cubrirlos en el mismo esfuerzo.

## Recommended mocking and providers
- `provideHttpClientTesting()` to intercept HTTP calls inside standalone tests.
- `provideRouter()` plus mock routes to test guards/resolvers without NgModules.
- `HttpTestingController` to verify service requests/responses.
- `jest.spyOn(signal, 'set')` or custom helpers to assert against signal stores.

## Minimum quality gates
- Unit tests must cover happy path plus at least one error/edge path per critical unit.
- Integration tests must cover key boundaries (routing, HTTP integration points, interceptors).
- Failing flaky tests must be stabilized before merge.

### Coverage targets
- Cobertura global mínima recomendada: **≥ 85%** en líneas/ramos a nivel de proyecto.
- Cobertura reforzada para dominios críticos (auth, pagos, core banking, etc.): **≥ 95%** en líneas/ramos para sus módulos de tests.
- No sacrificar escenarios importantes sólo para subir coverage: prioriza casos de negocio reales (happy + edge) y errores esperables.
- Excepciones a estos umbrales deben quedar documentadas en el README del módulo con dueño, motivo y fecha objetivo.

## Metrics & Validation
- `npm run test` como comando base de suites, ajustado por proyecto (por ejemplo `npm run test:unit`, `npm run test:integration`).
- `npm run lint` para asegurar que los cambios de tests no rompen reglas de estilo/arquitectura.
- `npm run build` (o equivalente) como verificación final cuando la estrategia implique cambios en configuración de builders o rutas.
- Para Jest con componentes standalone, usar `TestBed.configureTestingModule({ imports: [ComponentUnderTest] })` como patrón recomendado.

### Coverage commands
- Para Angular CLI con Karma: `npm run test -- --watch=false --code-coverage` y revisar el reporte en `coverage/`.
- Para Jest: habilitar `collectCoverage` y umbrales (`coverageThreshold`) en la config, o ejecutar `npm run test -- --coverage`.
- Conectar los umbrales (85% / 95%) en la configuración de la herramienta para que el pipeline falle automáticamente cuando la cobertura baje por debajo del objetivo acordado.

## Notes
- Apply global naming/typing/reuse rules from **Angular Engineering Standards** and hand all code-documentation expectations to **Angular Documentation**.
- Migration requests: request `Apply migration plan using Angular Testing Strategy` when reshaping suites (Jest ↔ Karma, standalone TestBed setup, new coverage goals) and include targets plus CI constraints.
- Testing infrastructure (builders, harnesses, custom renderers) must partner with **Angular Documentation** so TSDoc explains how to exercise new shells and features—mirroring the component specs added to *skill-copilot-app*.
