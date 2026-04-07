---
id: typescript-skills-typescript-type-safety
name: typescript-skills-typescript-type-safety
title: typescript-type-safety
description: >-
  Regla canonica para maximizar seguridad de tipos en proyectos TypeScript
  (strict, tipos explicitos, ningun any accidental).
tags: []
repoId: typescript-skills
repoName: TypeScript Skills
---

# TypeScript Type Safety (Skill)

## Summary
- Fuerza `strict` completo y elimina `any`/`unknown` accidentales mediante lint y generacion de tipos.
- Usa contratos tipados para IO (schemas), evita castings amplios y documenta excepciones con duenio/fecha.

## Goal
Lograr que las invariantes de dominio y los contratos externos esten modelados en tipos, evitando errores en runtime y falsos positivos del compilador.

## Single responsibility
Seguridad de tipos y configuracion estricta. Testing, docs y arquitectura se tratan en skills aparte.

## Inputs
- `tsconfig` actual (flags `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`).
- Resultado de `npm run lint` y conteo de `any`/`unknown` actuales.
- Fuentes de tipos generados (OpenAPI, GraphQL, Protobuf) y pipelines de generacion.
- Librerias runtime de validacion (zod, valibot, io-ts) disponibles.

## Triggers
- Errores en runtime por propiedades indefinidas o narrowing incorrecto.
- Uso frecuente de `as any`, `as unknown as`, `!` o castings dobles.
- Flags de strict deshabilitados en tsconfig o overrides laxos por paquete.
- Datos externos sin validacion de runtime o sin tipos generados.

## Estrategia de endurecimiento
1. Enciende `strict` y flags avanzados: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`.
2. Activa ESLint: `@typescript-eslint/no-explicit-any`, `no-unsafe-argument`, `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-return`, `strict-boolean-expressions`.
3. Sustituye `any` por tipos reales o `unknown` con refinamientos (`asserts`, type guards). Registra excepciones en README con duenio/fecha.
4. Modela IO con schemas: valida entrada/salida y deriva tipos (`z.infer`). Sin validacion no hay confianza en los tipos.
5. Genera tipos desde fuentes contractuales: `openapi-typescript`, `graphql-codegen`, `protoc --ts_out`. Versiona el artefacto generado.
6. Evita `as` amplio: prefiere type guards, `satisfies`, narrows por discriminantes y exhaustividad en `switch` con `never`.

## Playbook de remediacion
- Inventario de `any`: `rg "any" src` + `eslint --rule '@typescript-eslint/no-explicit-any: error'`.
- Cambia `Record<string, any>` a mapas tipados o `Record<string, unknown>` con parser.
- Reemplaza `!` con inicializacion segura o narrow checks.
- Para libs de terceros sin tipos: crea `types/vendor.d.ts` con definicion minima y agrega tests de integracion.
- Añade type guards reutilizables para primitivas y DTOs.

## Contratos de IO
- Entradas externas deben pasar por schema runtime (zod/io-ts/valibot) antes de llegar a dominio.
- Exponer funciones publicas que reciban tipos validados, no `unknown`.
- Serializacion/deserializacion documentada con tipos y tests.

## Checklist por PR
- `tsconfig` con `strict` activo y sin overrides laxos nuevos.
- Conteo de `any`/`unknown` disminuye o se justifica con fecha/duenio.
- Nuevos endpoints/handlers usan schema runtime y tipos derivados.
- No hay `as` amplio ni `!` introducido; si se mantiene, queda documentado.
- Nuevos genericos tienen `extends` y defaults razonables.

## Tooling recomendado
- `@typescript-eslint/eslint-plugin` con reglas `no-explicit-any` y `no-unsafe-*` activas.
- `tsc --noEmit` en CI con `incremental` opcional.
- `openapi-typescript`, `graphql-code-generator`, `zod`, `valibot` para contratos.
- `ts-auto-guard` o `typescript-is` solo si se requiere y con cautela.
