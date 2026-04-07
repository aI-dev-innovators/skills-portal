---
id: typescript-skills-typescript-testing
name: typescript-skills-typescript-testing
title: typescript-testing
description: >-
  Regla canonica para probar proyectos TypeScript con tipado estricto, piramide
  de pruebas y fixtures tipadas.
tags: []
repoId: typescript-skills
repoName: TypeScript Skills
---

# TypeScript Testing (Skill)

## Summary
- Piramide clara: unit (rapidas, puras), integration (IO/controlado), contract/fixtures tipadas y e2e minimales.
- Tipado en tests: sin `any`, utilidades reutilizables, generadores/fixtures tipados y asserts exhaustivos.

## Goal
Asegurar que el comportamiento de modulos TypeScript quede cubierto con pruebas tipadas, estables y observables en CI.

## Single responsibility
Testing en proyectos TypeScript. No cubre arquitectura ni documentacion.

## Inputs
- Runner y libs: vitest/jest/node:test/uvu, testing-library, supertest, playwright.
- Config de tsconfig para tests (paths, moduleResolution, jsx) y transforms (ts-jest/esbuild/ts-node).
- Comandos CI (`npm run test`, `npm run test:watch`, `npm run lint`).
- Requerimientos de cobertura y SLOs de suites.

## Triggers
- Flakes frecuentes o suites lentas sin profiling.
- Tests con `any` o mocks sin tipo que rompen al refactorizar.
- Fixtures desalineadas con schemas de entrada/salida.
- Falta `ts-jest`/`ts-node`/`esbuild` configurado para tests TypeScript.

## Estrategia de pruebas
1. Usa runner moderno (vitest recomendado) con soporte ESM/CJS segun proyecto.
2. Configura tsconfig de tests con `strict` y `paths` alineados al proyecto; evita compilar dos veces.
3. Prioriza unitarias puras: sin IO, sin sleep. Usa factories/fixtures tipadas (`makeUser()` devuelve tipo real).
4. Integracion: prueba limites IO con real adapters (HTTP/DB/FS) en entorno controlado; valida schemas.
5. Contratos: usa snapshots tipados o `expectTypeOf` para validar firmas publicas y regressions de tipos.
6. E2E solo para rutas criticas; paraleliza y usa `--runInBand` solo cuando sea necesario.

## Patrones recomendados
- Factories/fixtures tipadas con defaults; evita objetos literales inline repetidos.
- Test helpers con generics (`assertResultOk`, `expectRejectedWithCode`).
- Usa `satisfies` para validar objetos contra tipos exportados sin forzar casting.
- Mocks esbeltos: prefiere `vi.fn`/`jest.fn` con firmas reales; evita `as unknown as`.
- Asserts: `expectTypeOf`, `asserts` functions, `await expect(promise).rejects.toThrow(new CustomError(...))`.

## Playbook de remediacion
- Reemplaza `any` en tests por tipos concretos o builders.
- Limpia `jest.spyOn`/`vi.spyOn` sin restaurar: usa `afterEach(vi.restoreAllMocks)`.
- Mueve configuracion comun a `test/setup.ts` y registra side effects ahi.
- Acelera suites: usa `--runInBand` solo para IO; para el resto, parallel.
- Añade `testTimeout` especifico por suite en vez de timeout global alto.

## Checklist por PR
- Nuevas APIs tienen pruebas unitarias y, si exponen IO, pruebas de integracion con schemas reales.
- No se introducen `any`/casts amplios en tests.
- Fixtures reutilizables viven en `tests/fixtures` o helpers y usan `satisfies` o tipos exportados.
- Mocks restaurados y sin leaks entre casos (`afterEach`).
- Cobertura minima cumplida y reporte en CI.

## Tooling recomendado
- Runner: vitest (preferido) o jest; node:test para utilidades pequenas.
- Tipado: `expectTypeOf`, `tsd` o `tsd-check` para pruebas de tipos en paquetes.
- Cobertura: `c8`/`nyc` integrado al runner.
- CI: `npm run lint`, `npm run test -- --runInBand` para integracion, `npm run test:types` si se usa `tsd`.
