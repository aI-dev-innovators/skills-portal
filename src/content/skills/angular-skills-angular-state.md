---
id: angular-skills-angular-state
name: angular-skills-angular-state
title: Angular State Governance
description: >-
  Define and enforce scalable Angular state ownership using Signals, RxJS, or
  NgRx with one source of truth and predictable side-effect isolation.
tags:
  - angular
  - state
repoId: angular-skills
repoName: Angular Skills
---

# Angular State Governance (Skill)

## Summary
- Defines state ownership policy in Angular using Signals, RxJS, or NgRx with a single source of truth per domain.
- Aligns state decisions with hexagonal/DDD layering (domain, application, infrastructure) to prevent business rules leaking into UI or ad-hoc services.

## Goal
Establish clear state ownership and predictable state transitions at component, feature, and app levels.

## Single responsibility
State design and governance only. For shared conventions, use **Angular Engineering Standards**.

## Inputs
- Feature scope (routes, components, services, stores, effects) and affected domain (for example `user`, `auth`).
- Current state location (components, singleton services, domain stores, NgRx slices) and sharing model.
- Key flows depending on that state (navigation, forms, banners, permissions) and current issues (duplication, leaks, race conditions).
- Available tooling (Signals-only, RxJS, NgRx) and migration/compatibility constraints.

## Triggers
- Scattered state across services/components.
- Duplicate sources of truth.
- Side effects mixed into components.
- Unclear choice between Signals, RxJS, and NgRx.

## Core rules
1. One authoritative owner per domain value.
2. Scope state to the smallest effective level.
3. Keep side effects outside components.
4. Compute derived state; avoid storing duplicates.
5. Enforce immutable updates and typed contracts.

### Layer placement
- Domain state lives in stores or services in the application layer (`core/application`), not in components or infrastructure.
- `core/domain` holds types and pure rules; it does not hold mutable state and does not depend on Angular.
- Components (`components/`, `pages/`) consume state via readonly signals/selectors/observables and emit events to the store; they do not own shared sources of truth.
- Infrastructure services (`core/infrastructure`) may read/write APIs/storage but must delegate state authority to the application layer.

## Decision matrix
- **Signals-first store:** best for local/feature state with straightforward async complexity.
- **RxJS facade store:** suitable for stream-heavy features without full NgRx overhead.
- **NgRx slice:** for complex multi-team domains and advanced effect orchestration.
- Signals-first stores expose `readonlySignal` to consumers and encapsulate writes (for example `updateState()`), avoiding direct `signal.set` outside the store.
- Declare `effect()` with `DestroyRef` or `takeUntilDestroyed()` so subscriptions clean up automatically.

## NgRx confirmation (required before NgRx-specific tasks)
- Confirm NgRx presence before NgRx work: deps (`@ngrx/store`, `@ngrx/effects`, etc.), code usage (`createAction`, `createReducer`, `createFeature`, `Effects`, `Store`), or folders (`state/`, `store/`, `reducers/`, `effects/`).
- If NgRx is absent, do not add it unless explicitly requested; prefer Signals-first or RxJS facade.
- If adoption is requested, include migration scope, dependency additions, and rollout plan before implementation.

## Anti-patterns
- Service as mutable global state without a clear API boundary.
- Components calling `.next()` on shared subjects.
- Duplicating derived values in multiple stores/components.
- Feature state coupled directly to API DTO shape.

## Deliverables
1) Current-state audit (owners, flows, leaks).
2) Target pattern choice with rationale.
3) Incremental refactor plan.
4) Verification checklist (tests/lint/build).

## Handoff and interlocks
| Concern | Owner skill | Ready-to-engage signal |
| --- | --- | --- |
| Moving state boundaries alters feature shells or routing | Angular Architecture | Architecture report aligns new module boundaries with state owners |
| Component/service refactors needed to align APIs with the new store | Angular Code Quality | Specific files and functions identified for cleanup before migrating state |
| Reactivity adjustments aimed at lowering render cost | Angular Performance | Baseline metrics captured and candidate components enumerated |
| Accessibility-impacting state changes (focus, announcements, ARIA) | Angular Accessibility | UX flows that depend on state updates listed for a11y review |
| Signals or store changes require updated validation evidence | Angular Validation & CI | Lint/test/build commands approved once the new state paths are in place |

Document which downstream skill consumes the state-governance plan so Copilot can chain migrations without re-triage.

## State migration playbook template
1. Baseline current owners and duplicated sources of truth.
2. Choose target pattern (Signals, RxJS facade, or NgRx) with rationale.
3. Move write operations to one authoritative state API.
4. Replace component orchestration with selectors/computed reads.
5. Isolate side effects and validate behavior parity.

## Ownership policy defaults
- Keep state local when only one component needs it.
- Use feature state when multiple components in one domain share it.
- Use global state only for cross-feature concerns (session, user, global settings).

## Metrics & Validation
- `npm run lint` with no new violations in state artifacts (stores, effects, services) and respecting architecture rules.
- `npm test` or domain-specific tests to validate state transitions.
- `npm run build` to ensure provider/store/effect changes do not break wiring.
- Optional performance measurement (when coordinated with **Angular Performance**) to confirm the new state strategy does not introduce unnecessary renders.

## Notes
- Apply global naming/typing/reuse rules from **Angular Engineering Standards**; delegate code-comment specifics to **Angular Documentation**.
- Align control flow, signals, and reactivity with the Modern Angular (v17+) playbook in Standards.
- Migration requests: use `Apply migration plan using Angular State Governance` when moving state between components/stores or adopting Signals/RxJS/NgRx; include scope and validation needs.
- Every state artifact touched (stores, facades, signals, effects) must coordinate with **Angular Documentation** so ownership, transition rules, and side effects are documented.
