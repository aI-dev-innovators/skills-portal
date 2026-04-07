---
id: angular-skills-angular-component-docs-typedoc
name: angular-skills-angular-component-docs-typedoc
title: angular-component-docs-typedoc
description: >-
  Document Angular runtime TypeScript files with TSDoc and TypeDoc using
  version-aware Angular rules, automatic clean architecture detection, and smart
  vs dumb component classification. Excludes test files and enforces real
  examples and maintainable documentation.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Purpose

Produce high-quality documentation for Angular runtime code with strong TypeDoc compatibility.

This skill must:
- inspect the Angular version before documenting
- document only runtime `.ts` files
- ignore tests and generated artifacts
- adapt to legacy Angular decorators and modern signal-based APIs
- detect clean architecture structure when present
- classify Angular components as smart or dumb before writing docs
- add real examples in HTML and TypeScript
- avoid decorative or low-value comments

This skill behaves like a senior Angular maintainer, a technical writer, and a DX reviewer.

# Scope

Document these file types when relevant:
- `*.component.ts`
- `*.directive.ts`
- `*.pipe.ts`
- feature-level facade or container files when they are part of UI orchestration
- related types, interfaces, and top-level helpers in runtime `.ts` files

Ignore:
- `*.spec.ts`
- `*.test.ts`
- storybook files
- mocks
- generated files
- migration outputs
- e2e files

# Non-Negotiable Rules
 Place the class-level TSDoc **after all imports and before the Angular decorator** (`@Component`, `@Directive`, `@Injectable`, etc.). Avoid dropping TSDoc above imports.

- Do not add `//` comments as final documentation.
- Do not add `/* ... */` placeholder comments.
- Do not write vague comments like "handles data" or "component for UI".
- Do not rewrite APIs unless the user explicitly requests migration.
- Do not change behavior, names, visibility, or logic only to make docs easier.
- Do not document test code.
- Do not pretend TypeDoc fully documents local variables inside method bodies.


## Always do this

- Use `/** ... */` TSDoc blocks.
- Document the declaration itself, not nearby lines.
- Include at least one usage example for every component or directive.
- Add a second example in TypeScript when the component has non-trivial inputs.
- Preserve the real Angular API style already used in the file.
- Mention architectural responsibility when it is detectable.
- Prefer concise, specific descriptions over generic prose.
- Document public and protected members that affect consumers; document private helpers only when they encapsulate meaningful logic (validation, fallbacks, side-effects, caching) and skip trivial pass-throughs.
- Document protected/private properties when they hold meaningful state or configuration (avoid noise for trivial flags or view-model mirrors).
- Ensure method parameters are explicitly typed before adding TSDoc; avoid `any` and prefer concrete types so docs stay accurate.
- Document private readonly dependencies (services, routers, facades, stores) when they influence behavior or side-effects; describe su rol (logout, navegación, sincronía de estado) en vez de repetir el nombre del tipo. Omite DI no utilizada.
- Documenta propiedades public/protected/readonly que mantengan estado de vista (flags de UI, signals, formularios, colecciones) cuando afecten renderizado o flujo; omite ruido para duplicados triviales de valores constantes.
- Documenta helpers/utilidades compartidas (funciones puras, parsers, mappers) con TSDoc incluyendo `@param` y `@returns` explícitos; sé conciso y enfocado en edge cases y contratos de entrada/salida.
- Documenta interfaces y tipos exportados propiedad por propiedad: describe el propósito de cada atributo, su obligatoriedad u opcionalidad y el tipo esperado (incluye significados de uniones o literales cuando existan).
- When documenting functions/methods, include `@param` (and `@returns`) with explicit types using TSDoc/JSDoc-style `{Type}` annotations and concise intent; avoid undocumented parameters or implicit `any`.
- Golden rule for Inputs/Outputs/Signals/model():
  - Inputs: place TSDoc immediately above the decorated property; describe what it receives and why; include one HTML binding example and one TypeScript data example showing the parent variable.
  - Outputs: place TSDoc immediately above the decorated property; describe what it emits, when it fires, and the payload type; include an HTML example wiring the event and a brief TypeScript handler snippet showing the payload usage.
  - model(): mention two-way binding, place TSDoc immediately above the property, and show `[(value)]` usage with a TypeScript backing field.

# Workflow

## Step 1: Detect project context

Before editing docs, inspect the repo and determine:
- Angular major version
- whether the project uses standalone components or NgModules
- whether the file uses legacy APIs such as `@Input` and `@Output`
- whether the file uses modern APIs such as `input()`, `output()`, `model()`, `@if`, `@for`, and `@switch`
- whether the project follows clean architecture or a similar layered structure
- whether the component acts as smart or dumb

Use folder names, imports, injected dependencies, and public API shape as evidence.

## Step 2: Detect clean architecture automatically

Look for these folder or naming signals:
- `domain`
- `application`
- `infrastructure`
- `presentation`
- `features`
- `shared`
- `ui`
- `containers`
- `facades`

Infer the layer conservatively.

### Suggested architectural labels

- `presentation/ui`: visual and reusable, low orchestration
- `presentation/container`: screen or shell orchestration
- `application`: use-case coordination, facades, state coordination
- `domain`: business models, domain rules, value objects
- `infrastructure`: API clients, adapters, mappers

When documenting a component, mention the layer only if the evidence is clear.

## Step 3: Classify smart vs dumb components

Classify every Angular component before documenting it.

### Dumb or presentational component

Usually has these signals:
- receives data via inputs
- emits user interactions via outputs
- minimal or no service injection
- no direct API calls
- limited local UI logic
- reusable visual section or widget

Documentation wording should emphasize:
- visual responsibility
- expected inputs and outputs
- reuse across screens
- stateless or near-stateless behavior

### Smart or container component

Usually has these signals:
- injects facades, services, stores, router, dialogs, or state managers
- coordinates data loading or transformations
- owns orchestration logic
- maps domain data into UI view models
- composes child presentational components

Documentation wording should emphasize:
- orchestration responsibility
- feature or page coordination
- dependencies and state sources
- child component composition

### Classification output

When documentation is added, the class summary should explicitly reflect one of these roles:
- `Presentational component`
- `Container component`
- `Feature shell component`
- `Reusable UI component`

If unclear, prefer `UI component` instead of guessing.

## Step 4: Document in this order

For each runtime `.ts` file, document in this order when applicable:
1. top-level exported types or interfaces
2. top-level non-exported constants or helpers that matter to reading the file
3. Angular class summary
4. Angular inputs, outputs, model signals, and important readonly signals
5. public methods
6. meaningful protected or private helpers
7. non-exported top-level functions when they carry business or formatting meaning

### Guidance for private/protected items

- Add TSDoc to private/protected methods when they perform validation, manage fallbacks (e.g., SSR-safe storage), handle encryption, or have side-effects that influence public behavior.
- For trivial getters/setters or single-line wrappers, omit TSDoc to avoid noise.
- When documenting private helpers, focus on invariants, edge cases, and why the helper exists rather than restating code mechanically.
- For protected/private properties, document only when they store meaningful state (e.g., view mode, cache, feature flags) or configuration used across methods.
- For private readonly dependencies, describe their role (e.g., logout flow, navigation, state sync) and avoid repeating the type name.
- For method docs, prefer `@param` tags for every argument and `@returns` when non-void; use `@remarks` for invariants/edge cases instead of long prose.

## Step 5: Version-aware Angular rules

Document what exists in the file.

### Legacy Angular style
- `@Input`
- `@Output`
- lifecycle hooks
- structural directives in templates referenced by the component

### Modern Angular style
- `input()`
- `output()`
- `model()`
- `computed()`
- `effect()`
- signal-driven view state

Do not claim the file uses modern Angular APIs if it does not.
Do not rewrite legacy code just to modernize the docs.

## Step 6: TypeDoc alignment

Write comments that are useful for TypeDoc.

Best targets:
- classes
- types and interfaces
- properties
- methods
- top-level functions
- top-level constants

For complex internal method logic:
- use `@remarks`
- document parameters and return values
- document edge cases or invariants
- avoid trying to document every local variable inside a function body

## Step 7: Examples policy

Every documented component must include:
- one HTML usage example
- one TypeScript data example when inputs are non-trivial

If the component is a container, examples may show child composition.
If the component is presentational, examples should show parent binding usage.

# Writing Standards

## Class summary template

Use a structure similar to this and adapt it to the file:

```ts
/**
 * Presentational component that renders a list of quick links.
 *
 * This component belongs to the presentation layer and is intended to be
 * reused in empty states, dashboards, and contextual help sections.
 *
 * It receives display data from a parent container and does not fetch data
 * directly.
 *
 * @example Basic usage
 * ```html
 * <vf-quick-links [links]="links"></vf-quick-links>
 * ```
 *
 * @example Input data
 * ```ts
 * links: QuickLink[] = [
 *   { label: 'Home', route: '/home' },
 *   { label: 'Support', route: '/support' }
 * ];
 * ```
 */
```

## Input and output template

```ts
/**
 * Quick links rendered by the component.
 *
 * Each item should include a visible label and a valid internal route.
 */
@Input() links: QuickLink[] = [];
```

```ts
/**
 * Emits when the user selects a quick link.
 */
selected = output<QuickLink>();
```

## Type and interface template

```ts
/**
 * Navigation shortcut displayed to the user.
 */
export interface QuickLink {
  /** Visible link label shown in the UI. */
  label: string;

  /** Internal route used for application navigation. */
  route: string;
}
```

## Method template

```ts
/**
 * Builds the final list of items displayed in the UI.
 *
 * @param links Source links provided by the parent or facade.
 * @returns Normalized links ready for rendering.
 *
 * @remarks
 * Invalid routes are filtered out to avoid broken navigation options.
 */
private normalizeLinks(links: QuickLink[]): QuickLink[] {
  ...
}
```

# Architecture-aware wording guide

## For presentational components

Prefer phrases like:
- renders
- displays
- presents
- receives data from a parent
- emits interaction events
- reusable UI section
- visual building block

## For container components

Prefer phrases like:
- coordinates
- orchestrates
- composes child sections
- maps feature state into UI state
- interacts with facade or service dependencies
- handles page-level or feature-level flow

# TypeDoc Configuration Suggestion

If TypeDoc is not configured, suggest a config like this:

```json
{
  "entryPoints": ["src/app"],
  "entryPointStrategy": "expand",
  "exclude": [
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/*.stories.ts",
    "**/__mocks__/**",
    "**/generated/**"
  ],
  "tsconfig": "tsconfig.json",
  "plugin": ["typedoc-plugin-markdown"],
  "out": "docs"
}
```

# References

- TypeDoc handbook: https://typedoc.org
- TypeDoc options (tsconfig/entryPointStrategy/exclude): https://typedoc.org/options/configuration
- TypeDoc plugin: Markdown output plugin reference https://typedoc.org/plugins/typedoc-plugin-markdown/
- JSDoc/TSDoc tags supported by TypeDoc: https://typedoc.org/guides/doccomments/

# Review Checklist

Before finishing, verify:
- no inline decorative comments were introduced
- exported declarations are documented when relevant
- component class summary reflects actual responsibility
- clean architecture layer is mentioned only when evidence is clear
- smart vs dumb classification is explicit or conservatively omitted
- examples are realistic and compile conceptually
- TypeDoc-oriented tags are useful and not noisy
- tests and generated files were ignored
- no logic was changed

# Expected Output

Deliver documentation that is:
- TypeDoc-friendly
- Angular-version-aware
- architecture-aware
- explicit about smart vs dumb responsibilities
- rich in practical examples
- useful for maintainers, reviewers, and new team members
