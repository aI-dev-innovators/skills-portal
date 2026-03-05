---
name: angular-accessibility
title: Angular Accessibility
description: >-
  Ensure Angular applications meet WCAG-aligned accessibility standards through
  semantic markup, keyboard support, focus management, and screen-reader
  compatibility.
version: 1.0.0
tags:
  - angular
  - accessibility
  - wcag
repoId: frontend-skills
repoName: Frontend Skills
---

# Angular Accessibility (Skill)

## Goal
Ensure accessible UX in Angular features with practical, testable a11y improvements.

## Single responsibility
Accessibility compliance and usability only. For shared conventions, use **Angular Engineering Standards**.

## When to use
- PR review of forms, menus, dialogs, tables, or navigation.
- Keyboard-only interaction defects.
- Screen-reader, focus order, or semantics issues.
- WCAG AA remediation work.

## What to check
### 1) Semantics and interactive controls
- Prefer native elements (`button`, `a`, `input`, `select`) over `div/span` for interaction.
- Use ARIA only when semantics are not available natively.
- Ensure labels, names, and roles are accurate.

### 2) Keyboard accessibility
- All interactive elements are reachable with `Tab`.
- Activation works with `Enter` and `Space` where applicable.
- Escape closes dialogs/menus and restores focus correctly.

### 3) Focus management
- Dialogs trap focus and restore it on close.
- Dropdowns and popovers keep predictable focus flow.
- No unexpected focus jumps on re-render.

### 4) Forms and error states
- Every form control has an accessible label.
- Error/help text is connected via `aria-describedby`.
- Validation feedback is announced and understandable.

## Outputs
1. Prioritized accessibility findings (Critical/High/Medium/Low)
2. Minimal fix plan by file
3. Snippet-level recommendations
4. Verification checklist (keyboard + screen reader)

## Component-specific quick checks
- **Dialog:** focus trap, initial focus, escape behavior, restore focus.
- **Menu:** arrow key support (if ARIA menu pattern), close behavior, active item semantics.
- **Form:** label association, error announcements, required-state clarity.
- **Table:** header associations and meaningful row/column context.

## Validation guidance
- Keyboard-only walkthrough.
- Basic screen-reader pass (VoiceOver/NVDA).
- Optional automated checks (`axe-core`) plus manual verification.

## Validation hook
- Attach keyboard/screen-reader evidence to the Angular Validation & CI report so lint/test/build results stay centralized.
- Request only the necessary validation stages (for example, targeted component tests) and reuse approvals tracked in Angular Engineering Standards.
- If accessibility fixes touch routing, forms, or state, note the upstream skills engaged to keep the navigator synchronized.

## Notes
- Apply global naming/typing/reuse rules from **Angular Engineering Standards**, while **Angular Documentation** owns the code-comment requirements.
- Migration requests: when refactoring UI to meet WCAG (semantics, focus, ARIA), ask for `Apply migration plan using Angular Accessibility`, detailing components/pages and expected criteria.
- Accessibility-specific utilities (focus managers, announcers, keyboard handlers) must coordinate with **Angular Documentation** so TSDoc blocks describe supported interactions and ARIA contracts, preventing regressions such as the navigation shell changes seen in the skill-copilot-app work.
