---
name: angular-performance
title: Angular Performance
description: >-
  Improve Angular runtime and rendering performance by diagnosing bottlenecks
  and applying focused optimizations in change detection, reactivity, and bundle
  usage.
version: 1.0.0
tags:
  - angular
  - performance
repoId: frontend-skills
repoName: Frontend Skills
---

# Angular Performance (Skill)

## Summary
- Diagnoses Angular performance bottlenecks (rendering, change detection, bundle) and proposes targeted, measurable optimizations.
- Complements **Angular Architecture** (lazy boundaries) and **Angular State Governance** (efficient data flow) without altering business rules.

## Goal
Reduce user-perceived latency and rendering cost with measurable, low-risk improvements.

## Single responsibility
Performance diagnosis and optimization only. For shared conventions, use **Angular Engineering Standards**.

## Inputs
- Affected route/component and clear repro steps (including test data if applicable).
- Measured or observed symptoms (LCP/INP, jank, slow scroll, typing lag, bundle size, memory).
- Relevant template, services, and RxJS/signals flows.
- Environment constraints (SSR/hybrid, target browsers, bundle limits, available tooling such as Angular DevTools or Web Vitals).

## Triggers
- Slow interactions, route transitions, or heavy UI rendering.
- Repeated re-renders and change-detection pressure.
- Memory leaks from unmanaged subscriptions.
- Bundle size issues affecting load times.

## Performance workflow
1. Capture baseline symptoms and metrics.
2. Identify root causes in rendering, reactivity, or data flow.
3. Apply minimal fixes with highest impact first.
4. Re-measure and compare against baseline.
5. Confirm whether runtime instrumentation (for example `web-vitals`, profiling overlays, analytics beacons) is approved; if not, surface the recommendation and footprint before touching package.json.

## What to check
### 1) Change detection and templates
- Use `OnPush` where appropriate.
- Avoid expensive template method calls.
- Use `trackBy` for large lists.
- Avoid recreating objects/arrays in bindings.
- For large lists, prefer `@for (...; track ...)` and move calculations into signals/computed values.
- Consider `provideZoneChangeDetection({ eventCoalescing: true })` and `requestAnimationFrameScheduler` for highly interactive apps.

### 2) RxJS and async flow
- Prefer `async` pipe for component subscriptions.
- Use the right flattening operator (`switchMap`/`concatMap`/`exhaustMap`).
- Add debounce/throttle where input streams are noisy.

### 3) Bundle and loading strategy
- Lazy-load features.
- Avoid heavy imports in shared entry points.
- Review third-party package cost.
- Use `@defer` with `@placeholder/@loading` to defer heavy components and improve LCP.
- Leverage `ngOptimizedImage` and CLI asset controls (`preload`/`prefetch`).

## Deliverables
1) Symptoms mapped to root causes.
2) Quick wins (low risk).
3) Targeted refactors (medium risk).
4) Validation plan with before/after metrics.

## Metrics & Validation

### Default KPI set
- Interaction responsiveness (input latency trend).
- Render stability (re-render count in critical components).
- Loading performance (LCP trend for affected route).
- Memory stability (no sustained growth during repeated interaction).
- Collect metrics with Web Vitals (LCP, INP, CLS) and Angular DevTools profiler before/after every intervention.
- For SSR or hybrid apps, validate TTFB and hydration time.

## Symptom to metric to fix
- Slow typing/filtering → input latency, render count → debounce + OnPush + memoized derived state.
- Stutter on list updates → frame drops, render count → `trackBy`, immutable updates, split heavy templates.
- Slow route load → LCP/transfer size → lazy-load, reduce bundle imports, defer non-critical work.
- Gradual slowdown over time → memory trend → subscription cleanup and lifecycle-safe teardown.

### Validation hook
- Capture command approval in **Angular Engineering Standards** (Metrics & Validation section) instead of duplicating lists.
- Append before/after evidence to **Angular Validation & CI** so lint/test/build results stay centralized.
- If perf fixes introduce structural changes (lazy routes, deferrable views), request validation runs only after architecture/state/code-quality owners confirm readiness.
- If instrumentation is optional, log whether it is approved, deferred, or rejected so future contributors know if libraries like `web-vitals` should stay.

## Notes
- Apply global naming/typing/reuse rules from **Angular Engineering Standards**; delegate code-comment expectations to **Angular Documentation**.
- Migration requests: use `Apply migration plan using Angular Performance` when shifting to lazy loading, deferrable views, or new measurement baselines; describe routes/components and metrics to verify.
- Performance helpers and measurement utilities must document purpose and cleanup semantics per **Angular Documentation** so future tuning or removal stays low risk.
