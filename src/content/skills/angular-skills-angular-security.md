---
id: angular-skills-angular-security
name: angular-skills-angular-security
title: Angular Security
description: >-
  Strengthen Angular frontend security by identifying vulnerabilities, reducing
  exploit surface, and proposing prioritized, verifiable remediations.
tags:
  - angular
  - security
repoId: angular-skills
repoName: Angular Skills
---

# Angular Security (Skill)

## Summary
- Identifica y mitiga riesgos de seguridad en el frontend Angular (XSS, manejo de tokens, dependencias) con fixes priorizados y verificables.
- Se coordina con **Angular Standards**, **Angular Architecture** y **Angular Validation & CI** para que las mitigaciones queden integradas en código, estructura y pipeline.

## Goal
Detect and mitigate frontend security risks with prioritized, actionable fixes.

## Single responsibility
Frontend security hardening only. For shared conventions, use **Angular Engineering Standards**.

## Inputs
- Alcance del análisis (módulo/feature, rutas, componentes, interceptores, guards, servicios relacionados con auth/sesión/contenido dinámico).
- Modelo de autenticación y sesión (tokens, cookies, expiración, refresh) y cómo se almacenan/renuevan en el frontend.
- Ficheros, alertas o reportes relevantes (SAST/DAST, `npm audit`, findings de pentest, issues conocidos).
- Objetivo de la revisión: hardening de base o remediación de vulnerabilidades concretas, más restricciones de tiempo y entorno.

## Triggers
- Before release or security review.
- After SAST/DAST alerts.
- Changes touching auth, session, dynamic content, or external integrations.

## Security scope
### 1) Injection and XSS vectors
- Unsafe `innerHTML` usage.
- Misuse of `DomSanitizer.bypassSecurityTrust*`.
- Untrusted URL rendering in `href/src`.

### 2) Token/session handling
- Token storage risks and exposure.
- Logging of sensitive data.
- Weak session lifecycle controls.

### 3) Dependency and build posture
- Vulnerable packages and transitive risk.
- Production build settings (source maps, debug leakage).
- Security headers/CSP alignment with hosting model.

## Severity model
- **Critical:** immediate exploitability or credential/data compromise.
- **High:** realistic attack path with significant impact.
- **Medium:** contextual weakness with moderate impact.
- **Low:** hardening recommendation.

## Deliverables
1. Prioritized findings with evidence
2. Root cause and exploit scenario summary
3. Minimal remediation plan by file
4. Validation checklist

## Remediation SLA defaults
- **Critical:** fix or mitigate within 24 hours.
- **High:** fix or mitigate within 3 business days.
- **Medium:** fix in current or next planned sprint.
- **Low:** include in hardening backlog with owner and target date.

## Lightweight threat model template
- **Asset:** what must be protected (token, profile data, feature action).
- **Entry point:** where untrusted input enters.
- **Threat:** plausible abuse path.
- **Control:** existing or required mitigation.
- **Residual risk:** accepted risk and rationale.

## Metrics & Validation
- `npm audit` (o herramienta equivalente) ejecutado y findings críticos/altos remediados o documentados con owner y fecha objetivo.
- `npm run lint` sin nuevas infracciones relacionadas con seguridad (por ejemplo reglas de `innerHTML`, sanitización, uso de APIs peligrosas).
- `npm run test` para validar que los cambios de seguridad no rompen flujos principales.
- `npm run build` para confirmar que settings de producción (source maps, environment flags, CSP-related configs) permanecen coherentes.

## Notes
- Apply global naming/typing/reuse rules from **Angular Engineering Standards**, and rely on **Angular Documentation** for code-comment coverage.
- Migration requests: trigger `Apply migration plan using Angular Security` when hardening flows (token storage, sanitization, CSP). Provide scope, threats, and files so the plan covers fixes and validation commands.
- Document mitigations directly in the code that enforces them (interceptors, guards, sanitizers) siguiendo las pautas de **Angular Documentation** para describir el activo, la amenaza y el uso seguro, evitando bypasses de nuevos contribuyentes.
