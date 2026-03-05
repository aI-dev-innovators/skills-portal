---
name: angular-architecture
title: angular-architecture
description: >-
  Enforce maintainable Angular architecture by validating boundaries, dependency
  direction, module ownership, and integration contracts.
tags: []
repoId: frontend-skills
repoName: Frontend Skills
---

# Angular Architecture (Skill)

## Summary
- Keeps Angular codebases scalable by enforcing boundaries, dependency direction, and clear ownership per module.
- Reinforces DDD-style layering (core/domain/application/infrastructure) and repository abstractions via `InjectionToken`.

## Goal
Maintain a scalable architecture with clean boundaries and correct dependency flow.

## Single responsibility
Architecture governance only. For shared conventions, rely on **Angular Engineering Standards**.

## Inputs
- Feature/module scope (for example `shared`, `user`) and root folder under `src/app`.
- Current folder tree: especially `core/domain`, `core/application`, `core/infrastructure`, `components`, `pages`, `providers`.
- Route map and TypeScript path aliases (`@shared/*`, `@user/*`, `@environments/*`, `@src/*`).
- Declared architectural constraints (hexagonal, DDD, repository tokens, providers per environment) and migration goals.

## Triggers
- Feature/module design or refactor.
- Boundary violations and circular dependencies.
- Domain leakage into UI or infrastructure leakage into domain.
- Large feature extraction or modularization.

## What to check
### 1) Layering and dependency direction
- UI depends on application APIs, not infrastructure details.
- Domain stays framework-agnostic under `core/domain` (models, repository interfaces, pure rules).
- Application (`core/application`) orchestrates use cases and injects repositories via `InjectionToken`.
- Infrastructure (`core/infrastructure`) implements contracts without leaking framework details upward.

### 2) Module ownership
- Each feature owns its routes, pages, and use cases.
- `shared/` only contains reusable cross-feature elements.

### 3) Integration contracts
- Map DTOs before reaching domain/UI.
- Ports/adapters isolate external dependencies; expose interfaces in `core/domain` and implementations in `core/infrastructure`.
- Use `InjectionToken` to abstract repositories (for example `AUTH_REPOSITORY`, `USER_SEARCH_REPOSITORY`) and select real/mock implementations via providers.

### 4) Boundary enforcement
- Identify forbidden import directions.
- Recommend rule-based enforcement (Nx tags, ESLint boundaries, dependency-cruiser).

### 5) Hexagonal/DDD module structure (baseline)
```
src/app/
├── shared/                    # Cross-cutting concerns
│   ├── core/
│   │   ├── domain/           # Shared domain models and repository interfaces
│   │   ├── application/      # Shared application services
│   │   └── infrastructure/   # External service implementations
│   ├── components/           # Reusable UI components
│   ├── guards/               # Route guards
│   └── providers/            # DI configuration
└── [module]/                 # Feature modules (user, auth, etc.)
    ├── core/
    │   ├── domain/          # Module-specific domain logic
    │   ├── application/     # Use cases (for example search-users/)
    │   └── infrastructure/  # External integrations
    ├── components/          # Module components
    ├── pages/               # Route components
    ├── pipes/               # Module-specific pipes
    └── providers/           # Module DI providers
```

### 6) Repository pattern via InjectionToken
- Define repository interfaces and tokens in `core/domain/repositories`.
- Implement adapters in `core/infrastructure` (for example `UserApiService`, `UserApiMockService`).
- Configure providers in `providers/` selecting implementations by environment.
- Inject repositories only through the token in application services.

### 7) Routing & lazy loading
- Each module defines its routes under `pages/`; avoid other modules importing internal components directly.
- Use `loadChildren` with dynamic imports for feature modules, keeping routes self-contained.
- Shared guards live in `shared/guards`; module-specific guards can live in `[module]/core/application` or `[module]/guards`, never in `pages/`.
- Keep routing free from infrastructure coupling: routes should reference `pages/` components and, optionally, resolvers/guards from application layer.

## Deliverables
1. Violations by severity.
2. Target structure proposal.
3. Import dependency fixes.
4. Incremental migration steps.

## Handoff and interlocks
| Concern | Owner skill | Ready-to-engage signal |
| --- | --- | --- |
| Control-flow or naming fixes found during boundary review | Angular Standards | Standards checklist updated and shared with the feature team |
| State lives in the wrong layer (UI storing domain rules, infra mutating UI state) | Angular State Governance | Ownership diagram produced and scope for Signals/RxJS/NgRx clarified |
| Implementation details require refactors beyond boundary adjustments | Angular Code Quality | Architecture findings mapped to specific files/methods needing refactor |
| Performance or accessibility regressions introduced by architectural change (lazy loading, shell restructuring) | Angular Performance / Angular Accessibility | Target feature ready for measurement pass, impacted routes listed |
| Lint/test/build evidence after restructuring | Angular Validation & CI | Updated command matrix attached to the architecture report |

## Module extraction decision matrix
- Keep in feature folder when scope is local and reused by one route/domain.
- Extract to shared library when reused by multiple features with a stable API.
- Extract to domain library when business rules must be framework-agnostic.
- Extract to data-access library when external integration and adapters are shared.

## Forbidden import examples
- UI components importing infrastructure adapters.
- Domain services importing Angular-specific tokens (`@angular/forms`, `HttpClient`).
- Feature A internals imported directly by Feature B.
- Shared UI libraries importing feature-specific state.
- Standalone components requiring legacy `*ngIf/*ngFor` without `CommonModule` (modern `@` directives do not need it).
- `core/domain` importing from `components/`, `pages/`, or any `@angular/*` package.
- `core/application` consuming `HttpClient` directly instead of repository tokens.
- Components in `components/` or `pages/` reaching into `core/infrastructure` instead of application services.
- Code under `shared/` depending on feature-specific modules.

## Migration playbook (new or refactor)
1. Create the module folder structure (`core/domain`, `core/application`, `core/infrastructure`, `components`, `pages`, `pipes`, `providers`).
2. Define domain models and repository interfaces in `core/domain` with no Angular or infrastructure dependencies.
3. Implement application services in `core/application`, injecting repositories via `InjectionToken` and orchestrating use cases.
4. Add real/mock adapters in `core/infrastructure` and configure providers in `providers/` per environment.
5. Build components in `components/` and `pages/`, connect them only to application services, and keep routes lazy-loaded.
6. Run agreed validation commands and document any architectural exceptions in the module README.

## Metrics & Validation
- `npm run lint` with boundary rules (Nx tags, ESLint boundaries, dependency-cruiser) without warnings for forbidden imports.
- `npm test` to ensure layer refactors do not break flows.
- `npm run build` to confirm provider, token, and routing changes respect environment configuration.
- `npm run format` to keep style consistent on touched files.

## Notes
- Apply global naming/typing/reuse rules from **Angular Engineering Standards** and defer code-comment requirements to **Angular Documentation**.
- Use modern control flow (`@if/@for/@switch`) with standalone imports; `CommonModule` only when legacy `*ngIf/*ngFor` remain.
- When architecture changes require documentation, coordinate with **Angular Documentation** so helpers/constants receive the required TSDoc coverage before handoff.
