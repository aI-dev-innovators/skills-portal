---
name: angular-code-quality
title: Angular Code Quality
description: >-
  Improve Angular and TypeScript maintainability through safe refactoring,
  readability improvements, reduced duplication, stronger typing, and consistent
  organization.
version: 1.0.0
tags:
  - angular
  - quality
  - refactor
repoId: frontend-skills
repoName: Frontend Skills
---

# Angular Code Quality (Skill)

## Summary
- Refuerza la legibilidad y mantenibilidad del código Angular y TypeScript mediante refactors seguros que respetan los límites arquitectónicos.
- Trabaja sobre la estructura hexagonal/DDD definida en **Angular Architecture** (core/domain/application/infrastructure, components, pages, providers) sin mover lógica a capas incorrectas.

## Goal
Increase readability and maintainability without changing intended behavior.

## Single responsibility
Code quality refactoring only. For shared conventions, use **Angular Engineering Standards**.

## Inputs
- Módulo/feature objetivo (`shared`, `user`, etc.) y archivos concretos a revisar.
- Objetivos de calidad (reducción de complejidad, duplicación, reordenar código, fortalecer tipos) y restricciones de comportamiento (si debe permanecer 100% igual).
- Contexto arquitectónico vigente (por ejemplo, uso de `core/domain`, `core/application`, `core/infrastructure`, repositorios vía `InjectionToken`).
- Comandos de validación disponibles (`npm run lint`, `npm test`, `npm run build`, `npm run format`) y tiempo/alcance permitido para el refactor.

## Triggers
- Large methods, duplicated logic, or low readability.
- Inconsistent method structure and naming.
- Missing typing or unclear API intent.
- Risky refactors that need a minimal-scope plan.

## Refactor checklist
1. Identify duplication and cohesion issues.
2. Extract focused helpers and reduce nesting.
3. Replace magic values with constants/enums where justified.
4. Tighten types and API contracts.
5. Reorder methods for scanability.

## Quality guardrails
- Preserve behavior unless change is explicitly requested.
- Keep refactor scoped; avoid unrelated rewrites.
- Prefer small, reversible steps.
- Finish every refactor by syncing with **Angular Documentation** so new helpers, extracted constants, and reorganized classes get the required TSDoc summaries (see the CRUD component cleanups in *skill-copilot-app* for baseline expectations).

### Layer-aware refactors
- Cuando extraigas lógica de dominio, muévela hacia `core/domain` (modelos, reglas puras, interfaces) en lugar de dejarla en componentes o servicios de infraestructura.
- Cuando aisles acceso a APIs o integraciones, centraliza la lógica en `core/infrastructure` y expón contratos claros hacia `core/application`.
- Mantén la orquestación de casos de uso en `core/application`; los componentes (`components/`, `pages/`) sólo deberían delegar en servicios de aplicación y presentar estado.
- Evita que refactors orientados a “limpiar” terminen mezclando capas (por ejemplo, mover lógica de negocio al componente para reducir líneas en un servicio).

## Suggested method order
1. Imports
2. Constants/types
3. Class fields and DI
4. Directives and control flow
	- Use the modern control flow (`@if`, `@for`, etc.) in templates to improve readability and performance.
	- Prevent missing-directive errors by importing needed standalone directives (legacy `*` variants require `CommonModule`).
	- Refactor legacy templates to the modern syntax whenever scope allows.
	- For implementation details and examples, reference **Angular Engineering Standards**。
5. Lifecycle hooks
6. Public API
7. Event handlers
8. Private helpers

## Deliverables
1. Findings and rationale
2. Refactor actions by file
3. Risk notes
4. Validation commands and results

## Quality gates (default)
- Max method length target: 40 lines (exceptions must be justified).
- Cyclomatic complexity target: 10 or less per method.
- Duplication target: remove obvious copy/paste logic in touched scope.

## Refactor definition of done
- Behavior remains unchanged unless explicitly approved.
- Public API compatibility is preserved or migration notes are included.
- Touched files pass agreed validation commands.

## Metrics & Validation
- `npm run lint` sin nuevas advertencias/errores en los archivos tocados (incluyendo reglas de arquitectura cuando apliquen).
- `npm test` o pruebas específicas del módulo para comprobar que el refactor mantiene el comportamiento.
- `npm run build` para garantizar que cambios en tipos, imports o providers no rompen el pipeline.
- `npm run format` (o el comando equivalente de formateo) aplicado a los archivos modificados.

## Notes
- Apply global naming/typing/reuse rules from **Angular Engineering Standards**; rely on **Angular Documentation** for code-comment requirements.
- Migration requests: when a refactor requires broader template or class restructuring, request `Apply migration plan using Angular Code Quality` specifying the files and expected scope so we can outline steps and validations.
