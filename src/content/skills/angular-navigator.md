---
name: angular-navigator
title: Angular Skill Navigator
description: >-
  Provide a quick index that links requests to the correct Angular Engineering
  skill and clarifies how each skill complements the others.
version: 1.0.0
tags:
  - angular
  - navigator
repoId: frontend-skills
repoName: Frontend Skills
---

# Angular Skill Navigator

## Summary
- Central index that routes requests to the right Angular skill and explains how skills relate.
- Reduces noise by guiding contributors toward Architecture, State, Code Quality, Performance, etc., based on the work type.

## Goal
Help contributors pick the correct Angular Engineering skill (or combination) for any engagement and understand how the skills interoperate.

## Inputs
- Primary engineering intent (architecture, state, quality, performance, security, etc.).
- Scope of change (feature/module, routes, services, stores, templates).
- Urgency and type of work (diagnosis, migration, localized refactor, new feature).
- Evidence available (CI errors, metrics, screenshots, links to tickets or PRs).

## Triggers
- Intake triage for new requests.
- Clarifying which skill owns a given concern.
- Planning multi-skill engagements (for example, Architecture + Code Quality).

## Skill map
| Concern | Use this skill | Typical triggers | Complementary skills |
| --- | --- | --- | --- |
| Cross-cutting standards, control flow, signals, tooling | Angular Standards | Need shared rules, modern Angular guidance, validation workflow | All other skills reference this playbook |
| Architecture boundaries, feature extraction, dependency rules | Angular Architecture | Feature redesign, circular imports, modularization | Standards for naming/control flow; State Governance for data flows |
| State ownership, Signals/RxJS/NgRx decisions | Angular State Governance | Conflicting sources of truth, store design, effect isolation | Architecture (placement), Code Quality (refactor safety) |
| Maintainability and scoped refactors | Angular Code Quality | Large methods, inconsistent APIs, template clean-up | Standards (patterns), Architecture (structural constraints) |
| Runtime and rendering performance | Angular Performance | LCP/INP regressions, heavy lists, change-detection pressure | State Governance (efficient state), Architecture (lazy boundaries) |
| Documentation coverage (TSDoc, READMEs/ADRs) | Angular Documentation | Missing comments, unclear contracts, outdated validation notes | Standards (control flow), Validation & CI (command log), Code Quality (refactors) |
| Frontend security posture | Angular Security | Token handling, innerHTML usage, dependency risk | Standards (typing/naming), Validation & CI (automation) |
| Accessibility and WCAG alignment | Angular Accessibility | Keyboard/focus issues, screen reader defects | Code Quality (template refactors), Testing Strategy (a11y tests) |
| Testing layers and tooling | Angular Testing Strategy | Flaky suites, coverage gaps, runner alignment | Standards (control flow), Validation & CI (pipeline) |
| Validation, CI, readiness checks | Angular Validation & CI | Pre-merge verification, failing pipelines | Testing Strategy (test mix), Security (audit), Standards (commands) |

## Engagement recipe
1. Start with **Angular Standards** for baseline rules, control-flow expectations, and validation commands.
2. Identify the primary concern using the table above.
3. For multi-faceted requests, stack skills explicitly (for example, Architecture + State Governance) and define hand-offs.
4. Reuse findings and validations between skills—avoid duplicating lint/test/build steps when the navigator can share results.

## Deliverables
- Reference this navigator in request templates so stakeholders know which skill is engaged.
- Each skill report should note related skills when cross-cutting risks are found.

## Metrics & Validation
- Requests triaged with an explicit primary skill (and complementary skills when needed).
- Fewer hand-offs between skills because triggers and the concern map are clear.
- Validation commands referenced once in **Angular Standards**/**Angular Validation & CI** and reused by other skills.

## Maintenance
- Update the table whenever a new Angular skill is added.
- Keep descriptions short and action-oriented to stay useful during triage.
