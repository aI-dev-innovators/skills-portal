---
id: angular-skills-angular-control-flow-upgrade
name: angular-skills-angular-control-flow-upgrade
title: angular-control-flow-upgrade
description: >-
  Migrate Angular templates from deprecated CommonModule control flow directives
  such as *ngIf, *ngFor, [ngSwitch], *ngSwitchCase, and *ngSwitchDefault to
  built-in control flow blocks like @if, @for, @switch, @case, and @default. Use
  when upgrading Angular 20+ codebases, preparing Angular v21/v22 migrations,
  reducing deprecated template syntax, or safely cleaning up CommonModule
  imports after control-flow migration.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Angular Control Flow Upgrade

## When to use this skill

Use this skill when the request is about any of the following:

- upgrading Angular templates away from deprecated `*ngIf`, `*ngFor`, `[ngSwitch]`, `*ngSwitchCase`, or `*ngSwitchDefault`
- preparing a codebase for Angular v21 or v22
- applying Angular built-in control flow syntax (`@if`, `@for`, `@switch`)
- auditing or reducing `CommonModule` imports after control-flow migration
- reviewing a PR or repository for deprecated template control-flow usage

Do **not** assume `CommonModule` itself is deprecated. It is still stable and may still be required for pipes or other directives.

## Outcome

Produce a safe migration with these goals:

1. Replace deprecated control-flow directives with built-in control-flow blocks.
2. Preserve behavior, aliases, track semantics, and empty states.
3. Remove `CommonModule` imports only where that is clearly safe.
4. Validate the result with the smallest relevant build and test commands already defined by the repository.
5. Report changed files, risky cases, and any manual follow-up required.

## Preferred workflow

### 1) Confirm Angular compatibility

First determine the Angular version from `package.json`, the lockfile, or the local CLI. If the workspace is below Angular 17, stop and explain that built-in control flow is not available yet.

### 2) Run the bundled audit before editing

Use the bundled audit script to find deprecated usages and `CommonModule` imports:

```bash
node scripts/audit-control-flow.js --root . --pretty
```

This produces structured JSON so you can identify the affected files before making changes.

### 3) Prefer the official Angular migration first

If the workspace is on Angular 17 or newer, prefer the official schematic from the workspace root:

```bash
npx ng generate @angular/core:control-flow
```

If the repository uses a workspace-local wrapper command instead of `npx ng`, use the local project convention. Do not install Angular CLI globally.

### 4) Re-run the audit and manually fix leftovers

Run the audit again after the schematic. If any deprecated patterns remain, fix them manually using the rules in [references/MIGRATION_MAP.md](references/MIGRATION_MAP.md) and the validation checklist in [references/CHECKLIST.md](references/CHECKLIST.md).

### 5) Clean up `CommonModule` conservatively

After converting templates:

- In **standalone components**, remove `CommonModule` only if the component no longer relies on any exports from it.
- In **NgModules**, remove `CommonModule` only if none of that module's declarations still depend on any of its directives or pipes.
- If the file still uses `AsyncPipe`, `DatePipe`, `JsonPipe`, `NgClass`, `NgStyle`, `NgTemplateOutlet`, or other `CommonModule` exports, keep `CommonModule` or replace it with explicit imports only if the repository already prefers that style.
- Do not perform broad import churn unless the user asked for it.

### 6) Validate with repository-native commands

Inspect `package.json`, project targets, and CI configuration. Use the smallest relevant validation commands already defined by the repo, for example:

- targeted unit tests for the touched project or library
- the main build for the affected app
- lint if the repository enforces template or unused-import checks

Prefer existing scripts over inventing new commands.

### 7) Deliver a migration summary

At the end, report:

- files changed
- directives converted
- `CommonModule` imports removed, retained, or replaced
- any risky semantic differences or manual follow-up items
- the validation commands run and their outcome

## Manual conversion rules

### `*ngIf` -> `@if`

- Preserve simple conditions.
- Preserve `else` branches.
- Preserve `as` aliasing.
- If an `ng-template` branch is reused elsewhere, do **not** inline it blindly. Keep the reusable template and use `ngTemplateOutlet` if needed.

### `*ngFor` -> `@for`

- `@for` requires a `track` expression. Never omit it.
- If the old code used `trackBy`, invoke the tracking function in the `track` clause instead of passing the function reference.
- Prefer a stable unique identifier such as `item.id` or `item.uuid`.
- Use `track $index` only for static collections.
- Use `track item` only as a fallback when no better key exists.
- Preserve aliases like `index as i`, `first as isFirst`, `odd as oddRow` using `let i = $index`, `let isFirst = $first`, and so on.
- Preserve empty states. Convert an adjacent empty-list pattern to `@empty` only when the behavior clearly matches.

### `[ngSwitch]`, `*ngSwitchCase`, `*ngSwitchDefault` -> `@switch`, `@case`, `@default`

- Preserve the switch expression.
- Preserve the default branch.
- If multiple legacy `*ngSwitchCase` blocks can intentionally match and all render, flag this for manual review. `NgSwitch` can render all matching cases, while `@switch` selects one matching case block.
- If several case values should render the same block, use consecutive `@case (...)` lines for the same block.

## High-risk semantic checks

Review these carefully before finalizing:

1. **`@for` view reuse:** if a tracked property changes in place while the object reference stays the same, `@for` updates bindings instead of remounting the element. This differs from some `*ngFor` + `trackBy` remount behavior.
2. **Reusable `ng-template` blocks:** avoid deleting named templates that are referenced elsewhere.
3. **Switch semantics:** legacy `NgSwitchCase` can display all matching cases; `@switch` chooses one case block.
4. **Import cleanup:** avoid removing `CommonModule` where pipes or other remaining exports are still needed.

## Available resources

- [references/MIGRATION_MAP.md](references/MIGRATION_MAP.md) - concrete before/after template patterns
- [references/CHECKLIST.md](references/CHECKLIST.md) - final review checklist
- `scripts/audit-control-flow.js` - structured audit of deprecated usages and `CommonModule` imports

## Example requests that should activate this skill

- "Upgrade this Angular 21 repo away from deprecated `*ngIf`, `*ngFor`, and `ngSwitch` syntax."
- "Migrate CommonModule control flow directives to built-in Angular control flow and clean safe imports."
- "Audit this repository for deprecated Angular template directives and fix them."
- "Prepare this Angular app for v22 by replacing deprecated control-flow directives."
