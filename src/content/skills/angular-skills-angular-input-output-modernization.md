---
id: angular-skills-angular-input-output-modernization
name: angular-skills-angular-input-output-modernization
title: angular-input-output-modernization
description: >-
  Evaluates an Angular project and migrates decorator-based @Input and @Output
  APIs to the modern input() and output() style, preserving aliases, required
  flags, transforms, and clean architecture boundaries. Use when modernizing
  Angular components/directives, preparing for newer Angular versions, or
  standardizing component APIs.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Angular Input/Output Modernization

Use this skill to modernize Angular component and directive APIs by replacing decorator-based `@Input` and `@Output` with the newer `input()` and `output()` APIs when the project version and code patterns make the migration safe.

Important:
- `input()` is signal-based.
- `output()` is the modern output API, but **it is not a signal**.
- If the repo relies on two-way bindings like `[(value)]`, evaluate whether `model()` is a better fit than migrating only to `input()` plus `output()`.

Activate this skill when the user wants any of the following:
- Migrate `@Input` to `input()`
- Migrate `@Output` to `output()`
- Standardize component inputs/outputs across an Angular repo
- Prepare an Angular codebase for newer idioms and future migrations
- Keep migrations ordered and consistent with an existing clean architecture structure

## Outcome

By the end of this workflow, the project should have:
- A clear assessment of the Angular version and whether the migration is appropriate now
- An inventory of `@Input`, `@Output`, `EventEmitter`, and likely `[(...)]` usage
- Automated migration commands selected when safe
- Manual follow-up changes applied only where necessary
- Template and TypeScript references updated correctly
- A concise report of changed files, skipped cases, risks, and next steps

## Available files

- `scripts/detect-input-output-context.js` - detects Angular version, bootstrap style, common input/output patterns, and risky migration cases
- `references/MIGRATION_BLUEPRINT.md` - recommended migration order and decision tree
- `references/PATTERN_MAP.md` - common before/after examples
- `references/REVIEW_CHECKLIST.md` - final verification checklist
- `evals/evals.json` - sample evaluation prompts

## Rules

1. Detect the Angular version and project state first.
2. Prefer the official Angular schematics for the first pass.
3. Do not claim that `output()` is a signal; it is not.
4. Preserve aliases, required input flags, and input transforms.
5. Keep public template API compatibility unless the migration explicitly changes it.
6. Update all TypeScript, template, and host binding references when an `input()` migration changes reads to function calls.
7. Treat writable inputs, setter-based inputs, and decorator metadata arrays (`inputs`, `outputs`) as review-heavy cases.
8. For two-way component APIs, evaluate `model()` before locking in separate `input()` and `output()` members.
9. If the repo uses clean architecture, do not move presentation concerns into domain or application layers.
10. Report skipped cases clearly instead of forcing unsafe rewrites.

## Workflow

### 1) Detect Angular and migration context
Run:

```bash
node scripts/detect-input-output-context.js
```

Use the output to determine:
- Angular major version
- standalone bootstrap vs NgModule bootstrap
- package manager
- whether the repo already uses `signal`, `input`, `output`, or `model`
- approximate count of `@Input`, `@Output`, `EventEmitter`, and `[(...)]` usage
- whether there are likely risky cases such as setter inputs or code that writes to inputs

If the script cannot determine everything, inspect:
- `package.json`
- `angular.json`
- `src/main.ts`
- `src/app/app.config.ts`
- `src/app/app.module.ts`
- representative components/directives that declare `@Input` and `@Output`

### 2) Decide whether to migrate now
Use this decision logic:

- **Angular v19+** -> `input()` and `output()` are a strong candidate for standardization.
- **Angular v17.3 to v18** -> APIs exist, but validate team readiness and tooling first.
- **Older Angular** -> do not force the migration until the Angular version supports the target APIs appropriately.

If the user asked to migrate regardless, still report version constraints and proceed only as far as the current version safely allows.

### 3) Run the official migrations first
For inputs, Angular provides an official migration:

```bash
ng generate @angular/core:signal-input-migration --insert-todos
```

For outputs, Angular provides an official migration:

```bash
ng generate @angular/core:output-migration
```

Use `--path` to limit scope when the user wants an incremental migration.

If the repo is large or risky, migrate one feature area first instead of the entire workspace.

### 4) Review skipped and risky cases
Pay special attention to these patterns:
- inputs written from inside the class
- getter/setter `@Input` declarations
- inherited inputs/outputs declared in `@Component({ inputs: [...] })` or `outputs: [...]`
- `EventEmitter.next()` or `complete()` usage
- custom wrappers around `EventEmitter`
- components using banana-in-a-box syntax `[(value)]` that may be better modeled with `model()`
- code that reads a migrated input without invoking it as a signal

Do not blindly rewrite these cases. Fix them deliberately.

### 5) Preserve API compatibility
When migrating:
- `@Input({ alias: 'x' })` should preserve the alias through `input(..., { alias: 'x' })`
- `@Input({ required: true })` should become `input.required<T>()` when appropriate
- `@Input({ transform })` should preserve the transform in the `input()` config
- `@Output('valueChanged') changed = new EventEmitter<T>()` should preserve the alias using `output<T>({ alias: 'valueChanged' })`

Avoid renaming template-facing bindings unless the user explicitly requests an API cleanup.

### 6) Evaluate two-way bindings
If the repo uses a paired API such as:

```ts
@Input() value!: string;
@Output() valueChange = new EventEmitter<string>();
```

consider whether Angular `model()` is a better long-term replacement than separate `input()` and `output()` members.

Only introduce `model()` when it clearly matches the current public API and the user wants that modernization level.

### 7) Keep clean architecture boundaries
This migration belongs primarily to the presentation layer:
- components
n- directives
- UI adapters

Do not introduce Angular-specific signal APIs into domain entities or pure application models.

If the repo is organized by feature with domain/application/infrastructure/presentation folders, confine most changes to presentation and framework adapter layers.

### 8) Validate
Run the minimum relevant checks already present in the repo, for example:

```bash
npm run lint
npm run test
npm run build
```

If the repo uses a different package manager or task runner, respect it.

### 9) Report back
Summarize:
- detected Angular/project context
- migration commands run
- files changed
- risky files skipped or partially migrated
- whether `model()` opportunities were found
- any assumptions and blockers

## Implementation preferences

### Preferred migration order
1. Audit usage
2. Migrate a small feature slice
3. Run official schematics
4. Fix skipped/manual cases
5. Validate build/tests
6. Expand to the rest of the repo

### Recommended interpretation rules
- Reading a migrated `input()` in TypeScript becomes `this.someInput()`
- Reading a migrated `input()` in templates becomes `someInput()`
- Writing directly to an input usually blocks safe migration and needs redesign
- Emitting from `output()` remains `this.someOutput.emit(value)`
- Programmatic subscriptions should use the `OutputRef` API after migration where relevant

### Example scope selection
When the repo is large, prefer a path-scoped rollout first:

```bash
ng generate @angular/core:signal-input-migration --path src/app/features/orders --insert-todos
ng generate @angular/core:output-migration --path src/app/features/orders
```

## Success criteria

The migration is complete only when:
- no intended `@Input` / `@Output` cases remain in the target scope
- migrated input references are invoked correctly
- aliases, transforms, and required semantics are preserved
- `EventEmitter` leftovers are intentional and documented
- the project builds and the affected tests pass

## Notes for the assistant

When applying this skill:
- be explicit that `input()` is signal-based but `output()` is not
- use the official migrations first whenever available
- do not oversell full automation; some cases need review
- prefer incremental, path-based rollout for enterprise Angular repos
