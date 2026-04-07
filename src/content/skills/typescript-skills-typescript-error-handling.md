---
id: typescript-skills-typescript-error-handling
name: typescript-skills-typescript-error-handling
title: typescript-error-handling
description: >-
  Regla canonica para modelar, propagar y observar errores en proyectos
  TypeScript sin perder tipado ni trazabilidad.
tags: []
repoId: typescript-skills
repoName: TypeScript Skills
---

# TypeScript Error Handling (Skill)

## Summary
- Usa errores tipados o resultados (`Result/Either`) para mantener contratos claros y evitar `throw` sin contexto.
- Separa errores operacionales vs de programacion, captura observabilidad y evita silencios (`void` swallow, `catch` vacios).

## Goal
Garantizar que los flujos de error estan modelados, tipeados y observados para que el runtime no falle en silencio ni degrade la experiencia.

## Single responsibility
Manejo de errores y observabilidad minima. No cubre arquitectura ni docs.

## Inputs
- Target runtime: Node, edge (deno/cloudflare), navegador, CLI.
- Librerias de transporte/logging: pino, winston, consola, Sentry, OpenTelemetry.
- Estrategia actual (exceptions, `Result`, `Either`, promesas). Comandos de CI (`npm run lint`, `npm run test`).
- Contratos externos (HTTP, colas, FS) y sus codigos/casos de error.

## Triggers
- `catch` vacios o logs sin contexto.
- Errores serializados sin stack (`throw 'msg'`).
- Promesas sin `await` que silencian rechazos (`no-floating-promises`).
- APIs publicas que lanzan tipos heterogeneos (`string | Error | number`).

## Practicas clave
1. Modela errores: usa clases que extienden `Error` con `name`, `code`, `cause`. Evita lanzar strings.
2. Para flujos controlados, usa `Result`/`Either` (`{ ok: true; value } | { ok: false; error }`). Define helpers `isOk`, `unwrap`, `mapError`.
3. Separacion: errores operacionales (IO, timeout) vs programacion (asserts fallan). Solo los primeros se recuperan.
4. Observabilidad: log estructurado con `context` y `correlationId`; envia a tracing/metrics si aplica.
5. En limites IO, convierte errores a contratos estables (HTTP status + body tipado, eventos con codigo).
6. En APIs asincronas, documenta cancelacion (`AbortSignal`) y timeouts. Propaga `signal` a dependencias.

## Playbook de remediacion
- Busca `throw` sin tipo o `throw new Error(message)` generico; reemplaza con clases especificas o `Result`.
- Revisa `catch (e)` sin manejo: agrega log estructurado y rethrow o mapping.
- Activa lint: `@typescript-eslint/no-throw-literal`, `no-floating-promises`, `@typescript-eslint/only-throw-error`.
- Asegura que `Promise` devuelta se espera o se gestiona (`void` safe handlers con `.catch(log)` explicitamente).
- Crea modulo `errors.ts` por bounded context con codigos/documentacion y tests.

## Contratos de error (HTTP/CLI)
- HTTP: traduce `Error` a { status, code, message, details? }. Mantén mapping centralizado.
- CLI: salidas con exit codes claros y mensajes accionables. Evita stack en stdout; usa stderr para diagnostico.
- Eventos/colas: payload incluye `code` y `retryable` para consumidores.

## Checklist por PR
- Nuevas funciones publicas documentan errores esperados o devuelven `Result`.
- No hay `catch` silencioso ni `console.error` sin estructura.
- Promesas sin `await` justificadas (listeners) con comentario o helper `void handle().catch(report)`.
- Errores lanzados son instancias de `Error` con `name/code/cause` o `Result` tipado.
- Mappings de error a transporte (HTTP/CLI) estan testeados.

## Tooling recomendado
- ESLint: `no-floating-promises`, `@typescript-eslint/no-throw-literal`, `@typescript-eslint/only-throw-error`.
- Logging estructurado: pino/consola/winston con serializers.
- Observabilidad: OpenTelemetry/Sentry/Honeycomb con span events en errores operacionales.
- Tests: usa `rejects.toThrow` y tests de mapping a respuestas HTTP/CLI.
