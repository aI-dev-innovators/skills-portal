---
id: angular-skills-angular-validation-ci
name: angular-skills-angular-validation-ci
title: Angular Validation & CI
description: >-
  Validate Angular delivery readiness with reproducible install, lint, tests,
  build, and actionable failure diagnostics.
tags:
  - angular
  - ci
repoId: angular-skills
repoName: Angular Skills
---

# Angular Validation & CI (Skill)

## Summary
- Orquesta los comandos de validación (install, lint, tests, build, audit) para certificar que un cambio Angular está listo para merge.
- Centraliza evidencia de CI reutilizable por otras skills (Architecture, Code Quality, State, Performance, Security, Documentation).

## Goal
Ensure every change is merge-ready through reproducible, observable validation checks.

## Single responsibility
Validation and CI diagnostics only. For shared conventions, use **Angular Engineering Standards**.

## Inputs
- Scripts actuales de `package.json` para install, lint, test, build y audit (si aplica), más toolchain (Node, npm/pnpm/yarn).
- Reglas de CI existentes y logs de fallos recientes (incluyendo extractos de consola/pipeline).
- Objetivos de calidad (por ejemplo, endurecer gates, reducir tiempo de pipeline, unificar comandos).
- Entornos donde corren los pipelines (local, CI principal, entornos secundarios) y restricciones de ejecución.

## Triggers
- Pre-merge validation.
- CI pipeline failures.
- Release readiness checks.
- Baseline quality enforcement rollout.

## Recommended pipeline stages
1. Install (`npm ci`)
2. Lint (`npm run lint`)
3. Unit/Integration tests (`npm run test`)
4. Build (`npm run build`)
5. Optional security audit (`npm audit`)

## Reusable command matrix
| Stage | Command | Typical producer | Skills that reuse evidence |
| --- | --- | --- | --- |
| Install | `npm ci` | Validation & CI | Architecture (ensure deps added), State Governance (store additions) |
| Lint | `npm run lint` | Standards or Code Quality | All skills reference the same lint status rather than re-running |
| Tests | `npm run test -- --watch=false` (or scoped variant) | Testing Strategy | Performance, Accessibility, Security consume the result |
| Build | `npm run build` | Validation & CI | Architecture (lazy routes), Performance (bundle metrics) |
| Security audit | `npm audit --production` | Security | Validation & CI tracks mitigation follow-up |

When another skill needs validation, link back to this matrix instead of duplicating the command list. Capture command approval (date, requester) so Copilot can decide whether to re-run or reuse.

## Execution confirmation (required)
Before running CI validation commands, request explicit confirmation.

### Confirmation prompt
- "Do you want to execute CI validation commands now?"

### Execution rule
- If confirmed: run only approved stages.
- If not confirmed: provide diagnosis plan and command sequence without execution.
- If partially confirmed: run only selected stages.

## Failure report contract
For each failing stage include:
- command
- symptom
- probable root cause
- exact remediation action
- re-validation step

## CI stability guidance
- Pin Node and package manager versions.
- Use lockfile-based installs.
- Cache dependencies safely.
- Keep warnings policy explicit (fail or allowlist with expiry).

## Deliverables
1. Stage-by-stage status (OK/FAIL)
2. Root-cause analysis
3. Ordered recovery plan
4. Follow-up hardening tasks

## Standard PR report template
- **Stage:** install | lint | test | build | audit
- **Status:** OK | FAIL
- **Primary error:** short summary
- **Root cause:** concise explanation
- **Fix:** exact next action
- **Re-check:** command to validate

## Quality gate defaults
- Lint: zero errors in changed scope.
- Tests: no new failing tests y cobertura ≥ 85% global (con objetivos mayores por módulo definidos en **Angular Testing Strategy**).
- Build: production build succeeds.
- Audit (if enabled): no unresolved critical vulnerabilities in changed scope.

## Notes
- Apply global naming/typing/reuse rules from **Angular Engineering Standards**, delegating code-documentation specifics to **Angular Documentation**.
- Migration requests: when overhauling pipelines or validation workflows, trigger `Apply migration plan using Angular Validation & CI`, specifying stages, environments, and evidence needed.
- Pipeline helpers, scripts, and task definitions must include the inline commentary required by **Angular Documentation** (parameters, environment requirements, failure-handling) so re-runs stay transparent.

## Latest validation – skill-copilot-app (2026-02-19)
| Stage | Command | Status | Notes |
| --- | --- | --- | --- |
| Lint | `npm run lint` | ✅ | All files passed after Standards/Architecture migrations. |
| Test | `npm run test -- --watch=false --browsers=ChromeHeadless` | ✅ | Specs for App + features succeeded; Karma logged a disconnect after success but process exited with code 0. |
| Build | `npm run build` | ✅ | Production bundle 242.51 kB initial, 3 lazy feature chunks under 6 kB each. |
