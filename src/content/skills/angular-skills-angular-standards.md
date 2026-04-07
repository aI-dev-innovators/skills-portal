---
id: angular-skills-angular-standards
name: angular-skills-angular-standards
title: angular-standards
description: >-
  Define shared Angular engineering standards for naming, typing, shared reuse,
  and validation so domain skills can stay focused and avoid duplication.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Angular Engineering Standards (Skill)

## Summary
- Canonical rulebook for naming, typing, control flow, signals, routing, and tooling (all code-documentation specifics live in **Angular Documentation**).
- Establishes anchors (`## Summary`, `## Triggers`, `## Inputs`, `## Deliverables`, `## Metrics & Validation`) that every Angular skill reuses for consistent navigation.

## Triggers
- New engagement kickoff or when another skill reports inconsistent conventions.
- Upgrading Angular/TypeScript versions or introducing new tooling.
- Large-scale refactors that require shared guidance before execution.

## Required inputs
- Project conventions (naming, directory layout, lint/test/build scripts).
- Angular version plus compatibility constraints (SSR, hybrid, legacy modules).
- Mandatory internal rules or regulatory requirements impacting code.

## Deliverables
- Cross-skill checklist summarizing standards adopted in the engagement.
- Migration triggers for replacing legacy syntax (for example `*ngIf` → `@if`).
- Validation command list to hand off to **Angular Validation & CI**.

## Goal
Provide a single source of truth for cross-cutting engineering rules used by every Angular skill.

## Applies to
- Architecture
- Accessibility
- Code Quality
- Performance
- Security
- State Governance
- Testing Strategy
- Validation & CI

## Shared Rules
### 1) Naming conventions
- Use descriptive names; avoid `_` in symbols and filenames.
- DOM-bound handlers always start with `on`, followed by the action and optional target. Treat any DOM event—including `click`, `dblclick`, `keydown`, `keyup`, `keyup.enter`, `keydown.enter`, `input`, `change`, `blur`, `focus`, `focusin`, `focusout`, `submit`, `pointerup`, `pointerdown`, `pointermove`, `wheel`, `touchstart`, `touchend`, `drag`, `drop`, `animationstart`, `animationend`, `transitionend`, `mouseenter`, `mouseleave`, and any other template-supported browser event—as subject to this pattern. Prefer native DOM events (`(submit)`, `(input)`, `(click)`, `(keydown.enter)`) instead of their legacy Angular aliases (`(ngSubmit)`, `(ngModelChange)`, etc.) unless Angular deprecates the native hook. This aligns with the current [Angular event binding guide](https://angular.dev/guide/templates/event-binding), which documents DOM events (including key modifiers) as the canonical approach. When multiple events reuse the same logic, centralize the responsibility in a single action-oriented method (`onToggleFilters`, `onSaveDraft`) instead of duplicating handlers per event.
- Prefer a shared semantic handler when different events trigger the same logic. Example: `onToggleFilters()` can be triggered from both `(click)` and `(keydown.enter)`.
- Templates should call class methods (for example, `(click)="onClickCancelled()"`) rather than emitting events inline; those handlers in turn call `EventEmitter` instances, services, or signals. This keeps templates declarative and makes it easy to instrument logic inside the component class.
- Whenever a template emits directly (for example, `(click)="cancelled.emit()"`), apply the pattern described above: add an `on<Event><Action><Target>()` method in the component and delegate the emission or side effect there. Document the fix in the PR so other teams adopt the same approach.
- Treat every child component output the same way as DOM events: bind it to a dedicated handler that follows the `on<Event><Action><Target>` naming scheme. Whether the output is named `actionTriggered`, `clientSelected`, or `orderSaved`, the template should call a method such as `onActionTriggered($event)` so telemetry, guards, and logging stay in the component class instead of inline expressions.
- Si un componente reexpone la salida de un nieto (`modal` → `footer` → botón), cada salto debe mantener la convención `on<Event><Action><Target>` para evitar eventos “anónimos” difíciles de rastrear. No propagues `EventEmitter` directamente; siempre crea un handler dedicado por nivel.

#### Handler naming examples
| Scenario | Template snippet | Handler name | Notes |
| --- | --- | --- | --- |
| Cancel button | `(click)="onClickCancelled()"` | `onClickCancelled()` | Use the DOM event when a specific event variant matters. |
| Reused logic across events | `(click)="onSaveDraft()"` and `(keydown.enter)="onSaveDraft()"` | `onSaveDraft()` | Action-oriented name since multiple events trigger the same behavior. |
| Input change with data | `(input)="onInputSearchTerm(searchBox.value)"` | `onInputSearchTerm(term: string)` | Mirrors Angular's template syntax guidance to use DOM events rather than `ngModelChange`. |
| Custom child output | `(clientSelected)="onClientSelected($event)"` | `onClientSelected(clientId: number)` | Applies to any DOM or custom event, not just click. |
| Shared child output | `(actionTriggered)="onActionTriggered($event)` or `(orderSaved)="onOrderSaved($event)` | `onActionTriggered(actionId: string)` or `onOrderSaved(order: Order)` | Applies to any custom output; keep the handler naming consistent with DOM events. |

#### Autochequeo rápido
- ¿Todos los templates (DOM y outputs) invocan métodos `on…` en lugar de emitir directamente?
- ¿Cada `EventEmitter` está tipado y documentado según el skill **Angular Documentation**?
- ¿Las propagaciones entre componentes (padre → hijo → nieto) mantienen la convención `on…` en todos los niveles?
| Toggle flag from multiple events | `(click)="onToggleSidebar()"` and `(keyup.enter)="onToggleSidebar()"` | `onToggleSidebar()` | One handler flips the flag regardless of which event fired. |

### 2) Reuse before create
- Check `shared/` or existing libraries before creating new helpers.
- Extract utilities only when stable and broadly useful.
- Avoid duplicating DI tokens, enums, or types.

### 3) Signals and disciplined effects
- Every `effect()` must register `onCleanup` and describe which resource it releases (subscriptions, timers, observers).
- When bridging RxJS and signals use `DestroyRef` + `takeUntilDestroyed` or `toObservable()` with `shareReplay({ refCount: true })` to prevent leaks.
- Expose signals as `readonly` when they leave the component/service and keep setters inside private helpers.
- Effects that trigger IO (HTTP, storage, routing) must validate dependencies and include guards to avoid running during SSR.
- Document in the feature README which signals/stores are sources of truth so other skills can inspect them quickly.

### 4) Secure and accessible templates
- Limit pipe chains to two transformations; if you need more, cache the result with `@let` or derived signals.
- Every `@for` must include an explicit `track` clause and never recreate objects inline; move map/reduce logic into the component.
- Buttons, icons, and touch controls include an `aria-label` or visible text. When the control is icon-only, pair `aria-hidden` with visually hidden helper text.
- Ban inline listeners that call services directly; always route through a component handler to keep instrumentation, logging, and testing simple.
- Prefer conditional class bindings (for example, `[class.is-error]`) instead of concatenating strings in the template markup.

### 5) HTTP contracts and services
- Each HTTP service exposes typed methods (`Observable<ApiResponse>`) and maps DTOs to internal models before the UI consumes them.
- Centralize error handling (for example, `mapApiErrorToToast`) and reuse interceptors for headers, auth, and logging.
- Prevent components from consuming `HttpClient` directly; inject dedicated services and coordinate with **Angular Documentation** to capture any side effects that must be documented in code comments.
- When a call requires feature flags or special builders, record the requirement in the README and the service so future migrations have the full context.

### 6) State mutation rules
- Avoid inline mutations on shared arrays or objects; rely on immutable helpers (`structuredClone`, spread copies, `immer.produce`).
- Define a single "author" per store/signal and document who is allowed to call `set` or `update`; other consumers must use selectors/computed values.
- When working with external stores (NgRx, Akita, ComponentStore) align action/update names with the `featureActionOutcome` convention (`clientsLoadedSuccess`).
- State Governance refactors must start from these principles; if a team needs an exception, document the justification and target date to normalize it.

### 7) Testing expectations
- Shared utilities (pipes, helpers, services) require unit tests that cover both happy paths and error cases; do not accept helpers without baseline coverage.
- Reusable components should expose Harness helpers or `TestbedHarnessEnvironment` so other teams can write tests without touching the real DOM.
- Every significant refactor updates snapshots or relevant integration tests before escalating to **Angular Testing Strategy**.
- When template handlers change, add tests that exercise the full path (event → handler → emitter/service) to catch wiring regressions early.

## Modern Angular Playbook (v17+)
### Standalone-first baseline
- Bootstrap apps with `bootstrapApplication` and `app.config.ts`.
- Use `provideRouter`, `provideHttpClient`, `provideAnimations` instead of root NgModules.
- Import directives/pipes explicitly in each standalone component `imports` array.
- Reserve `importProvidersFrom` for legacy libraries that still expose NgModules.

### Directives and Control Flow
- Prefer the `@` syntax: `@if`, `@for`, `@switch`, `@defer`, `@placeholder`, `@loading`, `@error`, `@let`.
- `@for (item of items; track item.id)` replaces `*ngFor` + `trackBy`.
- Standalone components only need `CommonModule` when legacy directives (`*ngIf`, `*ngFor`) remain.
- Document any scenario that still requires structural directives with `*` (legacy components, third-party libs).
- Reuse shared tracking helpers (`const trackById = (_i, item) => item.id;`).
- Move heavy logic out of templates; pre-compute values in the component using signals/computed.
- Always provide fallbacks (`@else`, `@empty`, `@default`, `@error`) for better UX.
- Use `@let` to cache pipe results or helper outputs inside the template.

#### `@if`, `@else if`, `@else`
```html
@if (user()) {
  <div class="welcome">Hello {{ user().name }}</div>
} @else if (isLoading()) {
  <app-spinner />
} @else {
  <app-login-cta />
}
```

#### `@for` + `@empty`
```html
<ul>
  @for (product of products(); track product.id) {
    <li>{{ product.name }} - {{ product.price | currency }}</li>
  } @empty {
    <li>No products available</li>
  }
</ul>
```

#### `@switch`, `@case`, `@default`
```html
@switch (order().status) {
  @case ('pending') {
    <app-badge type="warning" label="Pending" />
  }
  @case ('shipped') {
    <app-badge type="info" label="In transit" />
  }
  @default {
    <app-badge type="neutral" label="Unknown" />
  }
}
```

#### `@defer`, `@placeholder`, `@loading`, `@error`
```html
@defer (on idle) {
  <app-analytics-panel />
} @placeholder {
  <app-skeleton-panel />
} @loading {
  <p>Loading metrics...</p>
} @error {
  <p>Unable to load metrics</p>
}
```

#### `@let`
```html
@let total = cartTotal() ?? 0;
<p>Total due: {{ total | currency:'USD' }}</p>
```

### Legacy structural directives (compat only)
- `*ngIf`, `*ngFor`, `*ngSwitch`, `*ngSwitchCase`, `*ngSwitchDefault` remain for legacy components.
- `*ngTemplateOutlet` projects reusable templates.
- `*ngComponentOutlet` renders dynamic components (ensure required providers/imports).

```html
<ng-template #emptyState>
  <p>No results</p>
</ng-template>

<section *ngIf="items.length; else emptyState">
  <!-- content -->
</section>
```

```html
<ng-container *ngComponentOutlet="dynamicComponent; injector: customInjector"></ng-container>
```

### Attribute directives
- `[ngClass]` applies conditional classes.
- `[ngStyle]` applies computed styles.
- `ngModel` only in template-driven forms or dedicated bridge components.

```html
<button
  [ngClass]="{ 'is-active': isActive(), 'is-disabled': isDisabled() }"
  [ngStyle]="{ opacity: isDisabled() ? 0.5 : 1 }"
  [(ngModel)]="formState.choice">
  Action
</button>
```

### Signals and reactivity
- Favor `signal`, `computed`, and `effect` for local or page state.
- Use `toSignal`/`toObservable` to bridge RxJS without mixing paradigms.
- Manage side effects within `effect` and dispose using `DestroyRef` or `takeUntilDestroyed`.
- Expose `readonlySignal` to consumers; keep mutating capabilities private.

```ts
const user = signal<User | null>(null);
const greeting = computed(() => user()?.name ?? 'guest');

const loadUser = effect((onCleanup) => {
  const sub = userService.current().subscribe(user.set);
  onCleanup(() => sub.unsubscribe());
});
```

### Router and lazy loading
- Declare routes with `provideRouter` and strongly typed `Route` objects.
- Prefer `loadComponent`/`loadChildren` with dynamic imports.
- Opt into `withComponentInputBinding`, `withPreloading`, `withRouterConfig` as needed.
- Implement guards/resolvers with `inject()` instead of constructor DI.
- Avoid eager imports from sibling features; leverage lazy modules and deferrable views.

### Deferrable views, performance, UX
- Use `@defer` for expensive sections (tables, charts, dialogs).
- Pair with `@placeholder`/`@loading` states and optional `@prefetch`.
- Adopt `ngOptimizedImage` and CLI asset hints (`preload`, `prefetch`).
- Enable `provideZoneChangeDetection({ eventCoalescing: true })` for highly interactive apps.

### Forms and validation
- Prefer typed reactive forms (`FormBuilder.nonNullable`, `FormGroup<{ ... }>`).
- Encapsulate reusable validators and document contracts.
- Do not mix `ngModel` with reactive forms unless wrapped in a compatibility component.
- Use `@if`/`@switch` to display errors without nested `<ng-container>` layers.

### SSR, hydration, deployment
- For SSR or hybrid apps include `provideServerRendering` and `provideClientHydration`.
- Ensure code running during SSR only relies on server-safe APIs.
- Standard pipeline: `ng run app:server` + `ng run app:serve-ssr`.
- Ship critical assets (`manifest.webmanifest`, icons) and configure `@angular/pwa` when applicable.

### Tooling, compatibility, updates
- Run `ng update @angular/core @angular/cli` every major release.
- Keep ESLint aligned with `@angular-eslint` plus internal rules.
- Repository baseline scripts: `npm run lint`, `npm run test`, `npm run build`.
- Document any custom builders (for example `@angular-devkit/build-angular:application`).

### Migration requests
- When you spot an improvement opportunity (for example, migrate `*ngIf` to `@if`, convert a legacy module to standalone, or move logic to signals), explicitly request: `Apply migration plan using <skill-name>`.
- Provide scope, rationale, and affected files so downstream skills can reuse these standards to outline the plan and validations.
- Before adding optional dependencies (for example, `web-vitals` or other observability packages), confirm with the requester that the metric is required. If approval is missing, document the recommendation but do not add the library.

## Metrics & Validation
1. `npm run lint`
2. `npm run test`
3. `npm run build`
4. Security audit when required (`npm audit` or internal tooling)

These metrics are sharable artifacts: downstream skills should reference completion evidence here instead of duplicating command lists.

| Command | Date | Result / hash |
| --- | --- | --- |
| `npm run lint` | 2026-02-20 | OK `3b1c2d1` |
| `npm run test` | 2026-02-20 | OK `chrome-headless` |
| `npm run build` | 2026-02-20 | OK `dist/main.abc123.js` |

> Copy this table for every delivery and replace the values with real evidence (commit hash, log, artifact). If a command remains pending, mark the result as `PENDING` and document who will run it.

### Execution confirmation policy
- Confirm with the requester before running lint/test/build commands.
- If not approved, return the plan plus recommended commands without executing.

## Definition of done
- Domain-specific goal achieved.
- Shared standards honored (naming, typing, documentation, control flow, signals, router, tooling).
- No unnecessary rewrites.
- Validation evidence recorded or explicitly marked as pending with rationale.
