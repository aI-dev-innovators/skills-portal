---
id: typescript-skills-typescript-architecture
name: typescript-skills-typescript-architecture
title: typescript-architecture
description: >-
  Regla canonica para organizar proyectos TypeScript: capas, modulos,
  dependencias y contratos publicos.
tags: []
repoId: typescript-skills
repoName: TypeScript Skills
---

# TypeScript Architecture (Skill)

## Summary
- Enfoca el proyecto en capas y modulos con dependencias unidireccionales, sin ciclos ni imports absolutos fuera de contratos publicos.
- Define fronteras (domain, application, infrastructure, interfaces) y la raiz de composicion para mantener reemplazabilidad y testabilidad.

## Goal
Mantener proyectos TypeScript modulares, sin acoplamientos accidentales, con contratos publicos estables y dependencias controladas.

## Single responsibility
Arquitectura de modulos y dependencias. No cubre documentacion o testing (ver skills dedicadas).

## Inputs
- Tipo de artefacto: libreria, servicio backend, CLI o SDK.
- Diagrama actual de modulos/capas y usos de path aliases (`paths` en tsconfig).
- Reglas de lint/CI: `import/no-cycle`, `import/order`, `boundaries`, `knip`, `ts-prune`.
- Mapa de contratos publicos (entrypoints expuestos, exports principales).

## Triggers
- Ciclos de dependencias o imports circulares.
- Modulos que acceden a infraestructura desde dominio o viceversa.
- Falta una composicion central (bootstrap) o se inicializan dependencias en sitios aleatorios.
- Paquetes con exports indiscriminados o leakage de tipos internos.

## Arquitectura y modularidad
1. Define capas: domain (reglas puras), application (casos de uso), infrastructure (IO/adapters), interfaces (controllers/cli).
2. Establece contratos publicos por paquete: exports desde `src/index.ts` o entrypoints dedicados (`./http`, `./cli`). Nada fuera de ahi es publico.
3. Configura `paths` y `baseUrl` en tsconfig para imports estables; prohíbe rutas relativas profundas (`../../../../`).
4. Habilita guardrails: `eslint-plugin-boundaries`, `import/no-cycle`, `import/no-restricted-paths` con mapa de capas.
5. Mantén composicion en un solo archivo (composition root) que ensambla infraestructura y la inyecta en application/domain.

## Playbook de remediacion
- Inventario: `npx knip` o `npx ts-prune` para detectar exports sin uso y dependencias no declaradas.
- Cortar ciclos: mueve contratos a interfaces comunes o split de modulos; usa inyeccion de dependencias.
- Extraccion de infraestructura: mueve IO (HTTP, FS, DB, colas) fuera de dominio. Dominios solo dependen de puertos/abstracciones.
- Contratos publicos: agrega `index.ts` con exports intencionales y marca internos con `@internal` o sin exportar.
- Revisar path aliases: consolidar en `tsconfig.base.json` y alinear bundler/test runner.

## Patrones recomendados
- Interfaces de puerto/adaptador (hexagonal): `Port` en domain, `Adapter` en infrastructure.
- Factories puras en domain; wiring en infrastructure/cli.
- DTO/Schema para limites IO (zod/io-ts) en interfaces, no en dominio.
- Evita singletons globales; usa contenedores ligeros o factories.

## Reglas de lint sugeridas
- `import/no-cycle`: error.
- `boundaries/element-types`: mapa de capas (domain no depende de infra).
- `import/no-relative-parent-imports`: opcional, si usas path aliases.
- `@typescript-eslint/no-floating-promises`: evita side effects sin await en infraestructura.

## Checklist por PR
- Existe `composition root` unico y testeable.
- Los entrypoints publicos son claros (exports desde `index.ts` o subpath exports).
- No hay ciclos (`npm run lint` con `import/no-cycle`).
- Dominios no importan infraestructura ni frameworks.
- Los path aliases coinciden entre tsconfig, bundler y tests.
- No hay exports accidentales; tipos internos permanecen internos.

## Tooling recomendado
- `eslint-plugin-import`, `eslint-plugin-boundaries`, `knip`, `ts-prune`.
- Diagramas rapidos con `npx madge --circular src` para ciclos.
- CI: `npm run lint` + `npm run test` + `npx knip`/`npx ts-prune` en PRs.
