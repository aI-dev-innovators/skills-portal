---
id: angular-skills-angular-bem-scss-html
name: angular-skills-angular-bem-scss-html
title: angular-bem-scss-html
description: >-
  Apply and enforce BEM methodology specifically for Angular component templates
  and SCSS files. Focus on Angular component structure, :host usage, reusable
  sections, component-level styling, and alignment between .component.html and
  .component.scss without changing behavior.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Purpose

Refactor and enforce **BEM** only for **Angular components**.

This skill is for:
- `*.component.html`
- `*.component.scss`
- Angular UI sections inside feature or shared components

This skill is **not** for:
- generic HTML outside Angular
- global CSS architecture redesign
- backend templates
- non-Angular projects

---

# Angular-Only Scope

Work only with Angular component structure:

- align `component.ts`, `component.html`, and `component.scss`
- preserve Angular bindings like:
  - `*ngIf`
  - `*ngFor`
  - `@if`
  - `@for`
  - `[class.foo]`
  - `[ngClass]`
  - `(click)`
  - `[routerLink]`
  - `[attr.*]`
- keep styles at component level
- favor reusable section/component composition

Do not convert the project to another styling strategy.
Do not rewrite Angular logic unless explicitly requested.

---

# Strict Rules

## Always
- Use one clear **block** per Angular component or section
- Use `block__element--modifier`
- Keep class names synchronized between `.component.html` and `.component.scss`
- Prefer component-level BEM naming over generic names like `container`, `box`, `item`, `wrapper`
- Preserve current Angular behavior
- Keep selectors, bindings, and structural directives intact
- Respect standalone or NgModule Angular structure already present

## Never
- Do not rename Angular selectors
- Do not change `@Component(...)` metadata unless necessary for consistency notes
- Do not change TypeScript logic just to satisfy BEM
- Do not add global classes when the concern belongs to a component
- Do not over-nest SCSS
- Do not mix unrelated blocks inside one component unless the template clearly contains multiple reusable sub-blocks

---

# Workflow

## Step 1 — Detect Angular Component Context

Identify:
- component name
- selector
- template file
- style file
- whether the component is:
  - page/container component
  - reusable presentational component
  - section component
  - shared UI component

Infer the best BEM block name from:
- selector
- component responsibility
- visible UI purpose

Example:
- selector: `app-user-card` → block: `user-card`
- selector: `vf-quick-links` → block: `quick-links`

---

## Step 2 — Define the Block

Choose a block name that:
- matches the Angular component responsibility
- is reusable
- is readable
- avoids vague names

Good:
- `user-card`
- `quick-links`
- `dashboard-banner`
- `empty-state`

Avoid:
- `content`
- `wrapper`
- `box`
- `container`
- `item`

---

## Step 3 — Map Elements

Turn inner parts of the template into clear BEM elements.

Examples:
- title → `block__title`
- list → `block__list`
- item → `block__item`
- icon → `block__icon`
- actions → `block__actions`

Use modifiers only when there is a true visual or semantic variation:
- `block--compact`
- `block__item--active`
- `block__badge--warning`

---

## Step 4 — Preserve Angular Template Semantics

Refactor classes without breaking Angular syntax.

Examples:
- keep `(click)` handlers
- keep `[routerLink]`
- keep `@if`, `@for`, `*ngIf`, `*ngFor`
- keep interpolation and bindings

Example:
```html
<section class="quick-links">
  @if (links().length) {
    <ul class="quick-links__list">
      @for (link of links(); track link.route) {
        <li class="quick-links__item">
          <a class="quick-links__link" [routerLink]="link.route">
            {{ link.label }}
          </a>
        </li>
      }
    </ul>
  }
</section>
```

---

# Step 5 — SCSS Rules for Angular

In `*.component.scss`:

- use the component block as root
- keep nesting shallow
- prefer:
  - `.block { }`
  - `.block__element { }`
  - `.block--modifier { }`
- use `:host` only for host-level layout/state concerns
- do not put BEM names inside `:host` unless needed

Good:
```scss
:host {
  display: block;
}

.quick-links {
  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
  }

  &__link {
    text-decoration: none;
  }

  &--compact {
    font-size: 0.875rem;
  }
}
```

Avoid:
```scss
:host {
  .wrapper {
    .item {
      .link {
      }
    }
  }
}
```

---

# Step 6 — Angular Componentization Guidance

When the template is too large, suggest componentization using Angular boundaries.

Examples:
- split hero/banner into its own section component
- split cards list into reusable item component
- split FAQ entries into reusable accordion item

Use BEM per component, not one giant block for the whole page.

Preferred structure:
- page component
- section components
- shared UI components

---

# Step 7 — Output Format

For each Angular component reviewed, provide:

1. Detected block name
2. Elements
3. Modifiers
4. Suggested HTML refactor
5. Suggested SCSS refactor
6. Notes about componentization or reuse opportunities

---

# Review Checklist

- [ ] Angular selector kept intact
- [ ] BEM block matches component purpose
- [ ] HTML and SCSS are aligned
- [ ] Angular bindings preserved
- [ ] No unnecessary SCSS nesting
- [ ] Modifiers are meaningful
- [ ] Reuse/componentization opportunities identified
- [ ] No global-style leakage introduced

---

# Prompting Notes

When invoked, act like:
**Senior Angular UI engineer + design system maintainer + SCSS reviewer**

Prioritize:
- Angular component boundaries
- maintainability
- BEM consistency
- reusable sections
- readability
