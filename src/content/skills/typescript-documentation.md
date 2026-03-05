---
name: typescript-documentation
title: typescript-documentation
description: >-
  Regla canónica para documentar librerías y SDKs TypeScript con TSDoc, READMEs
  y trazabilidad CI.
tags: []
repoId: frontend-skills
repoName: Frontend Skills
---

# TypeScript Documentation (Skill)

## Summary
- Regla canónica de TSDoc para librerías/SDKs TypeScript: funciones, clases, interfaces, enums, type guards, generics y módulos.
- Integra README/ADR y validación continua para mantener contratos públicos e invariantes privados trazables.

## Goal
Garantizar que cada símbolo relevante en una librería TypeScript (exportado o privado con reglas de negocio) tenga documentación TSDoc útil, ejecutable y fácil de mantener.

## Single responsibility
Documentación y trazabilidad. Las reglas de código base viven en **Angular Engineering Standards** cuando aplique; aquí solo se define cómo documentar TypeScript.

## Inputs
- Alcance del paquete o módulo (APIs públicas, helpers internos, tipos compartidos) y si es nuevo o legado.
- Archivos TypeScript relevantes (`src/**/*.ts`) donde viven contratos públicos e invariantes internos.
- Estado actual de documentación (TSDoc, README, ADRs) y tabla de brechas si existe.
- Comandos disponibles (`npm run lint`, `npm run test`, `npm run build`, `npm run docs:coverage`, `npx tsdoc`) y restricciones de CI/CD.

## Triggers
- Librerías/SDKs sin TSDoc o con contratos públicos ambiguos.
- Faltan README/ADR que expliquen decisiones clave o flags de build.
- Revisiones con violaciones `jsdoc/*` o `tsdoc`.
- Antes de entregar un paquete a otro equipo o publicar una versión.

## Documentation workflow
1. Define el alcance: funciones, clases, interfaces, enums, type guards, factories, builders y puntos de entrada del paquete.
2. Haz inventario de símbolos con `rg -n "export" src` (o `ts-morph`) y arma una tabla de brechas (`archivo | símbolo | estado`). Úsala como checklist.
3. Ejecuta `npm run lint` **y** `npm run docs:coverage`; corrige cada regla `jsdoc/*`/`tsdoc`. No silencies advertencias sin registrar dueño/fecha en README o ADR.
4. Escribe/actualiza TSDoc siguiendo https://tsdoc.org. Regla: agrega `@example` en cualquier API pública o flujo no trivial (validaciones, IO, side effects, flags). Solo omite en getters/setters triviales. Usa tipos explícitos en todas las etiquetas (`@param {Tipo}`, `@returns {Tipo}`) aunque el compilador los infiera.
5. Documenta decisiones (errores esperados, protocolos, flags) en README/ADR con fecha, owners, trade-offs y links a fuentes.
6. Actualiza el log de validación (Validation & CI) con comandos y resultados relevantes.
7. Comparte la tabla de brechas antes/después en el PR para demostrar cobertura completa.

## Remediation playbook
1. Inventario completo de símbolos exportados y miembros críticos (privados o `protected`) con lógica de negocio.
2. Elimina comentarios heredados que no cumplan TSDoc; reescribe con resumen accionable, `@param`, `@returns`, `@remarks`, `@throws` y `@example` cuando aplique.
3. Si un bloque supera tres párrafos o depende de decisiones externas, mueve el detalle a README/ADR y enlaza con `@see`.
4. Automatiza cobertura: `npm run lint`, `npm run test`, `npm run build`, `npm run docs:coverage`, `npx tsdoc`. Registra evidencias en Validation & CI.
5. En código legado, trabaja por paquete: actualiza TSDoc de lo tocado, sincroniza la tabla “Documentation contracts” del README y documenta excepciones `jsdoc/*` con dueño/fecha.
6. Prioriza APIs públicas y tipos compartidos; luego expande al resto de `src`. Si hay falsos positivos en `docs:coverage`, documenta el caso y abre issue.

## Estándar mínimo TSDoc
- **Cobertura**: 100% de símbolos exportados y miembros privados que gobiernan reglas de negocio (constructores, factories, caches, validadores, invariantes).
- **Estructura**: resumen en una línea (qué hace y por qué existe) + etiquetas obligatorias (`@param`, `@returns`, `@remarks`, `@example`, `@throws`, `@defaultValue` según aplique). Un solo idioma por bloque y ejemplos en el mismo idioma. `@param/@returns` siempre con tipo explícito.
- **Contratos reactivos/eventos**: documenta flujos `EventEmitter`, `Observable`, `Promise` y callbacks: cuándo emiten, qué payload llevan y qué garantiza el handler.
- **Dependencias**: registra efectos secundarios, IO y servicios externos en `@remarks`; enlaza decisiones mayores con `@see docs/...`.
- **Clases y tipos**: clases públicas e interfaces base llevan bloque TSDoc en la declaración con `@remarks` (invariantes, dependencias) y `@example` de uso real. Documenta miembros `protected` que encapsulan negocio.

| Tipo de símbolo | Etiquetas mínimas |
| --- | --- |
| Funciones/métodos públicos | `@param`, `@returns`, `@throws` (si aplica), `@remarks` para side effects |
| Clases/constructores | Resumen + `@remarks` (invariantes/recursos) + `@see` a README/ADR |
| Interfaces, tipos, enums | Resumen + `@remarks` (campos obligatorios, unidades) |
| Type guards | `@param`, `@returns {x is Y}` con explicación del estrechamiento |
| Eventos/Observables/Promises | `@remarks` (ciclo de vida) + `@example` (suscripción/await) + payload descrito |

### Plantilla base
```ts
/**
 * Qué hace el símbolo y por qué es relevante.
 * @param payload Dominio, unidades y validaciones.
 * @returns Forma del dato emitido o efectos secundarios clave.
 * @remarks Menciona dependencias externas, cachés o flags.
 * @example
 * const result = processWidget({ id: 'w-1', retries: 2 });
 */
export function processWidget(payload: WidgetPayload): WidgetResult {
  // implementación
}
```

## Guía de estilo de documentación
- **Voz activa** y enfocada en reglas: “valida el token y devuelve claims”, no repetir el nombre del símbolo.
- **Consistencia**: un solo idioma por módulo/README.
- **Temporalidad**: documenta cuándo ocurre (lazy init, caché, expiración, reintentos) y qué pasa si falla.
- **Referencias cruzadas**: usa `@see` hacia README/ADR, protocolos, métricas o contratos externos.
- **Edge cases**: defaults, rangos válidos, límites (ej. “rechaza montos > 10_000 USD”).
- **Ejemplos ejecutables**: `@example` copiable (import real, firma real, entradas/salidas reales). Nada de pseudocódigo; usa el mismo idioma que el archivo.
- **Tipos explícitos**: anota tipos en etiquetas (`@param {string} userId`, `@returns {Promise<Response>}`) y aclara si estrecha tipos o aplica unidades.
  - Usa tipos también en ejemplos cuando ayuden a clarificar (`const client: HttpClient = ...`).

### Lista rápida “Do & Don’t”
- ✅ Explica reglas y dependencias (“usa `fetch` con `AbortController` y reintentos exponenciales”).
- ✅ Documenta errores esperados con `@throws` y motivo.
- ✅ Incluye unidades/formato en `@param` (ms, ISO date, currency, base64).
- ❌ No repitas el nombre del método como descripción.
- ❌ No mezcles idiomas ni dejes comentarios obsoletos.
- ❌ No uses `@example` genéricos sin contexto real.

## Checklist por PR
- Actualiza la tabla de brechas y adjunta snapshot en el PR (antes/después).
- Aplica bloques TSDoc requeridos; enlaza README/ADR cuando el bloque exceda tres párrafos.
- Ejecuta `npm run lint`, `npm run test`, `npm run build`, `npm run docs:coverage`, `npx tsdoc`; registra el resumen en Validation & CI.
- Actualiza README del paquete con “Documentation contracts” y excepciones `jsdoc/*` (dueño/fecha).
- Verifica que los `@example` compilan con imports y firmas reales.
- Añade notas de seguimiento si quedan falsos positivos o deuda.
- ¿Todos los `@param/@returns` llevan tipo? (regla obligatoria)
- ¿Todas las funciones públicas con lógica tienen `@example`? ¿El ejemplo compila con imports reales?
- ¿`docs:coverage` y `npx tsdoc` pasaron?
- ¿`npm run docs:coverage` incluye `jsdoc/require-example` para APIs públicas?
- ¿Side effects y dependencias quedaron en `@remarks`?
 - ¿Se omitió algún `@example`? Documentar quién/por qué/fecha en README/ADR.

## Tabla de brechas ejemplo
| Archivo | Símbolo | Estado | Acción |
| --- | --- | --- | --- |
| src/lib/http/retry.ts | `retryFetch` | Sin `@throws` | Documentar errores de red y backoff |
| src/lib/cache/memory-cache.ts | `MemoryCache` | Falta `@remarks` | Explicar TTL y política de eviction |

Usa la tabla como checklist vivo; marca “Completado” o enlaza al commit que lo resolvió.

## Tooling recomendado
- **Inventario**: `rg -n "export" src` o scripts `ts-morph` para generar tabla de brechas.
- **Cobertura**: `npm run docs:coverage` (ESLint + reglas `jsdoc/*`) y `npx tsdoc` para sintaxis.
- **Guardrails**: hook `pre-push` con `pnpm exec lint-staged --config lint-staged.docs.cjs` para archivos modificados.
- **Reportes**: registra hashes/logs en Validation & CI o README del paquete.

**Lint/coverage concreto**
- Activa `jsdoc/require-example` (eslint-plugin-jsdoc) condicionada a funciones/métodos públicos (`publicOnly: true` u overrides que apliquen a símbolos exportados/CLI). Inclúyela en `npm run docs:coverage`.
- Activa también `jsdoc/require-param-type` y `jsdoc/require-returns-type` (tipos obligatorios en etiquetas).
- Ejemplo de comando `npm run docs:coverage`: `eslint --ext .ts src --rule 'jsdoc/require-example: ["error", { "publicOnly": true }]' --rule 'jsdoc/require-param-type: "error"' --rule 'jsdoc/require-returns-type: "error"'`.

**Reglas automáticas sugeridas**
- Habilita `eslint-plugin-jsdoc` con `jsdoc/require-param-type`, `jsdoc/require-returns-type` y `jsdoc/require-example` (limitada a exportados/CLI con `publicOnly: true`).
- `npm run docs:coverage`: debe fallar si falta el tipo en `@param/@returns`, falta el bloque o falta `@example` en APIs públicas. Ejecutar en CI y en `pre-push`.

## Plantilla para README del paquete
Incluye estas secciones cuando una librería toca documentación:

1. **Contexto y alcance**: descripción corta, owners, fecha de última actualización.
2. **Documentation contracts** (tabla):

| Símbolo | Archivo | Propósito | Última revisión |
| --- | --- | --- | --- |
| `retryFetch` | src/lib/http/retry.ts | Reintenta peticiones con backoff exponencial | 2026-03-03 |
| `MemoryCache` | src/lib/cache/memory-cache.ts | Cache en memoria con TTL y eviction LRU | 2026-03-03 |

3. **Decisiones/ADR**: enlaces (`docs/adr/...`) con impacto y símbolos afectados.
4. **Validación**: comandos ejecutados (`npm run lint`, `npm run docs:coverage`, `npx tsdoc`, etc.) con hash o log corto.
5. **Excepciones**: tabla de símbolos pendientes, dueño y fecha comprometida (`símbolo | deuda | responsable | ETA`).

## What to document
Documentación completa abarca **todos los archivos TypeScript del proyecto** (`src/**/*.ts`), no solo los exportados. Cada símbolo debe tener TSDoc válido. **Público** = exportado desde el paquete o invocado/inyectado desde CLI/scripts externos; sobre ellos `@example` es obligatorio salvo getters/setters triviales.

### 1) Symbol coverage
- 100% de símbolos exportados (funciones, clases, interfaces, type aliases, enums, factories, builders).
- Type guards, validadores y parsers describen qué estrechan/validan y qué error lanzan.
- Métodos públicos y handlers internos que gobiernan reglas de negocio deben documentar side effects, invariantes y errores.
- Miembros privados/`protected` que protegen invariantes (cachés, mutex, pools) requieren resumen de propósito.
- Campos de config y defaults: explica origen, unidades y cuándo puede sobrescribirse.

**Métodos públicos/privados (regla clara)**
- Todo método `public` documenta propósito, argumentos, retornos y errores esperados.
- Todo método `protected` o `private` se documenta si protege una invariante, ejecuta validaciones, coordina IO o afecta flujo; helpers triviales (por ejemplo, setters directos sin lógica) pueden omitirse.
- Usa `@remarks` para detallar dependencias internas y contratos que no se exponen al consumidor.

**Checklist rápida métodos**
- Público: propósito + `@param` + `@returns`/`@remarks` + `@throws` si aplica + `@example` obligatorio salvo getter/setter trivial; todos los `@param/@returns` llevan tipo.
- Protegido/privado con lógica: propósito + qué invariante protege + efectos secundarios (IO, caché, locks) + errores esperados; `@param/@returns` tipados.
- Privado trivial (set/get sin lógica): puede omitirse; si controla defaults o valida, documenta con tipos.

**Checklist por PR (métodos)**
| Archivo | Clase | Método | Visibilidad | Estado |
| --- | --- | --- | --- | --- |
| src/lib/foo.ts | `FooService` | `doWork` | public | ✅ Con `@param/@returns/@throws` |
| src/lib/foo.ts | `FooService` | `_ensureReady` | protected | ✅ Con `@remarks` (invariante) |
| src/lib/bar.ts | `Bar` | `_setValue` | private | ➖ Omitido (setter trivial) |

### 2) Detailed contracts
- Describe cada argumento con `@param` (tipo, unidades, rango, formato).
- Usa `@returns` para la forma del snapshot o efectos resultantes; para `void`, documenta efectos en `@remarks`.
- `@throws` para rutas de error esperadas (timeouts, validación, IO, parsing).
- Documenta flags de build y scripts para reproducir entornos (SSR, bundlers, targets).
- Para type guards: `@returns {value is Foo}` y explica el estrechamiento.
- Para APIs asincrónicas: tiempos máximos, reintentos, cancelación (`AbortSignal`).

**Tipos en etiquetas (obligatorio)**
- Usa tipos explícitos en `@param`/`@returns` incluso si TS los infiere. Ejemplo: `@param {RegistryFile} file Entrada normalizada`.
- Anti-ejemplo (incorrecto): `@param file Entrada` sin tipo.
- Mantén un solo idioma en cada archivo; si usas español, que los ejemplos y etiquetas estén en español.

### 3) Eventos, Observables y callbacks
- Tipar explícitamente `EventEmitter`, callbacks y `Observable`/`Subject` (`Observable<Message>`, `(event: Message) => Promise<void>`).
- Documentar cuándo se emite, qué payload viaja y qué garantías ofrece el handler (orden, deduplicación, reintentos).
- Ejemplos cortos que muestren suscripción o uso: `events.on('ready', ...)`, `observable.subscribe(...)`, `await handler(message)`.

```ts
/**
 * Emite cuando el cliente obtiene un token válido.
 * @remarks Garantiza orden FIFO y se completa al revocar el token.
 * @example
 * authEvents.on('tokenIssued', (token) => cache.set(token.id, token));
 */
export const authEvents = new EventEmitter<Readonly<Token>>();
```

### 4) Executable examples
- Usa `@example` con imports reales y llamadas válidas.
- Prefiere escenarios que clarifiquen entradas/salidas y errores esperados.
- Para APIs genéricas, muestra cómo infiere tipos o cómo se parametriza.

### 5) Estructura y profundidad
- Cada bloque responde **qué hace**, **cuándo se usa** y **limitaciones/validaciones**.
- Usa bullets dentro del bloque para listar efectos secundarios o reglas.
- Mantén consistencia de idioma; evita mezclar inglés/español salvo literales de código.
- Señala dependencias externas (HTTP, cola, FS) o contratos compartidos.

### 6) Auditoría automatizada y reporte
- `npm run docs:coverage` debe fallar si falta documentación requerida.
- Incluye en el PR o README mini tabla `archivo | símbolo | corrección`.
- Documenta falsos positivos con símbolo, motivo, dueño, fecha límite.
- Integra `docs:coverage` en CI y opcionalmente en `pre-push`.

### 7) Idioma y trazabilidad cruzada
- Define idioma principal por paquete y documéntalo en el README.
- Usa `@see` hacia README/ADR u otros módulos cuando exista dependencia.
- TSDoc debe enlazar señales, stores o servicios con contratos compartidos (p. ej. kernels, cachés, pipelines).

## TSDoc tag conventions

| Tag | Obligatorio cuando | Notas |
| --- | --- | --- |
| `@param` | Toda función/método con argumentos, incluyendo setters y callbacks. | Describe dominio, unidades, validaciones; usa `@param options.label` en objetos de config. |
| `@returns` | Funciones que devuelven valor, factories, `computed`, type guards. | Resume forma/trazas; para `void` describe efectos en `@remarks`. |
| `@remarks` | APIs con contexto adicional (dependencias, side effects, flags, invariantes). | Documenta IO, cachés, telemetría, cancelación. |
| `@example` | Uso no trivial o contrato público. | Llamadas reales, imports reales. |
| `@throws` | Métodos que lanzan errores o rechazan promesas. | Condiciones y códigos asociados. |
| `@defaultValue` | Campos/config con defaults relevantes. | Razón del default y cómo sobrescribir. |
| `@deprecated`/`@beta` | APIs sujetas a retiro o en vista previa. | Incluye fecha objetivo y alternativa. |
| `@see` | README/ADR/code sample relacionado. | Rutas relativas en el repo. |
| `@public`/`@internal` | Librerías compartidas. | Marca visibilidad esperada. |

- Para type guards usa `@returns {value is Foo}` y explica el estrechamiento.
- Para APIs genéricas, documenta parámetros de tipo (`@template T`) si aplica.
- Si un bloque excede tres párrafos, mueve detalle a README y deja `@see`.

## Pattern gallery

### Función exportada con errores controlados
```ts
/**
 * Reintenta una petición HTTP con backoff exponencial y cancelación.
 * @param {() => Promise<Response>} request Petición a ejecutar (fetch-compatible).
 * @param {{ maxRetries: number; baseDelayMs: number; signal?: AbortSignal }} options Configuración de reintentos.
 * @param {number} options.maxRetries Número de reintentos (>= 0).
 * @param {number} options.baseDelayMs Retardo inicial en ms; se multiplica por 2 en cada intento.
 * @param {AbortSignal} [options.signal] Señal opcional para abortar.
 * @returns {Promise<Response>} Respuesta final si se logra antes del abort.
 * @throws Error Si se agotan los reintentos o se aborta la señal.
 * @example
 * const response = await retryFetch(() => fetch(url), { maxRetries: 3, baseDelayMs: 200 });
 */
export async function retryFetch(
  request: () => Promise<Response>,
  options: { maxRetries: number; baseDelayMs: number; signal?: AbortSignal }
): Promise<Response> {
  // implementación
}
```

 
 **Correcto (tipado en etiquetas)**
 ```ts
 /**
  * Normaliza y persiste un registro en el repositorio.
  * @param {RegistryFile} file Archivo ya validado.
  * @returns {Promise<RegistryId>} Identificador asignado.
  */
 export async function saveFile(file: RegistryFile): Promise<RegistryId> {
   // implementación
 }
 ```
 
 **Incorrecto (sin tipo en etiquetas)**
 ```ts
 /**
  * Normaliza y persiste un registro en el repositorio.
  * @param file Archivo ya validado.
  */
 export async function saveFile(file: RegistryFile): Promise<RegistryId> {
   // implementación
 }
 ```


**Correcto (`@example` con import real)**
```ts
import { createHttpClient } from './http/client';

/**
 * Envía un ping de salud y devuelve latencia.
 * @param {HttpClient} client Cliente HTTP configurado.
 * @returns {Promise<number>} Latencia en milisegundos.
 * @example
 * const client = createHttpClient({ baseUrl: 'https://api.example.com', timeoutMs: 1000 });
 * const latency = await ping(client);
 */
export async function ping(client: HttpClient): Promise<number> {
  const start = Date.now();
  await client.send({ path: '/health', method: 'GET' });
  return Date.now() - start;
}
```

**Incorrecto (`@example` sin contexto ni import)**
```ts
/**
 * Envía un ping de salud.
 * @example
 * ping(); // ???
 */
export async function ping(client: HttpClient): Promise<number> {
  const start = Date.now();
  await client.send({ path: '/health', method: 'GET' });
  return Date.now() - start;
}
```

### Interface y type alias
```ts
/**
 * Configuración requerida para inicializar el SDK.
 * @remarks Incluye timeouts y claves; mantén los valores sensibles fuera del repo.
 */
export interface SdkConfig {
  /** Host base en formato URL (https). */
  readonly baseUrl: string;
  /** Timeout total en milisegundos para cada petición. */
  readonly timeoutMs: number;
  /** Token opcional de servicio para llamadas autenticadas. */
  readonly serviceToken?: string;
}

/**
 * Resultado de autenticación con claims tipadas.
 * @remarks Incluye expiración en segundos desde época UNIX.
 */
export type AuthResult = Readonly<{
  subject: string;
  claims: Readonly<Record<string, string | number | boolean>>;
  expiresIn: number;
}>;
```


### Genérico avanzado con `@template`
```ts
/**
 * Adapta una función a un contexto asegurando tipos preservados.
 * @template T Input genérico.
 * @template R Resultado devuelto por el adaptador.
 * @param {(context: T, ...args: readonly unknown[]) => R} fn Función a adaptar.
 * @param {T} context Contexto parcial que se inyecta en la llamada.
 * @returns {(...args: readonly unknown[]) => R} Nueva función que aplica el contexto y delega en `fn`.
 * @example
 * const withCtx = bindContext((ctx, x: number) => ctx.base + x, { base: 10 });
 * const result = withCtx(5); // 15
 */
export function bindContext<T, R>(
  fn: (context: T, ...args: readonly unknown[]) => R,
  context: T
): (...args: readonly unknown[]) => R {
  return (...args: readonly unknown[]) => fn(context, ...args);
}
```
### Enum documentado
```ts
/**
 * Estados soportados para un job asíncrono.
 * @remarks `Failed` implica reintentos manuales; `Completed` cierra el ciclo.
 */
export enum JobState {
  Pending = 'pending',
  Running = 'running',
  Failed = 'failed',
  Completed = 'completed',
}
```

### Clase con invariantes y miembros privados
```ts
/**
 * Cache en memoria con expiración y política LRU.
 * @remarks No es segura para concurrencia multiproceso; usa en proceso único o sincroniza externamente.
 * @example
 * const cache = new MemoryCache<string>({ ttlMs: 5_000, maxEntries: 1000 });
 * cache.set('token', 'abc');
 */
export class MemoryCache<T> {
  /**
   * TTL en milisegundos aplicado a cada entrada.
   * @defaultValue 60000
   */
  public readonly ttlMs: number;

  /**
   * Rastrea el orden de uso para eviction LRU.
   * @remarks Mantiene la invariante de tamaño máximo; no exponer externamente.
   */
  protected readonly usage = new Map<string, number>();

  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(options: { ttlMs?: number; maxEntries?: number }) {
    // implementación
  }

  /**
   * Guarda un valor y reinicia su TTL.
   * @param {string} key Clave única.
   * @param {T} value Valor a almacenar.
   */
  set(key: string, value: T): void {
    // implementación
  }
}
```

### Clase con métodos públicos y privados documentados
```ts
/**
 * Gestiona credenciales efímeras con rotación automática.
 * @remarks Expone lectura segura y encapsula renovación privada.
 */
export class EphemeralCredentials {
  /**
   * Devuelve la credencial vigente o fuerza su renovación.
   * @returns {Promise<Credential>} Credencial activa lista para usar.
   * @throws Error Si la renovación falla.
   */
  public async getActive(): Promise<Credential> {
    if (this.isExpired()) {
      await this.refresh();
    }
    return this.current;
  }

  /**
   * Determina si la credencial expiró según timestamp interno.
   * @returns {boolean} `true` cuando la credencial está expirada.
   * @remarks No expone el clock; se usa sólo para control interno.
   */
  private isExpired(): boolean {
    return Date.now() >= this.current.expiresAt;
  }

  /**
   * Renueva la credencial consultando el proveedor configurado.
   * @throws Error Si el proveedor devuelve un estado inválido.
   */
  private async refresh(): Promise<void> {
    this.current = await this.provider.issue();
  }

  constructor(
    private current: Credential,
    private readonly provider: { issue: () => Promise<Credential> }
  ) {}
}
```

### Miembro `@internal` en librería compartida
```ts
/**
 * Export público para emitir métricas de uso.
 */
export class UsageMetrics {
  /**
   * @internal Cola interna; no depende del contrato público.
   * @remarks Protege la invariante de orden FIFO antes de flush.
   */
  protected readonly buffer: MetricEvent[] = [];

  /**
   * Agrega un evento y lo deja listo para flush.
   * @param {MetricEvent} event Evento a registrar.
   * @remarks No envía de inmediato; requiere `flush()` explícito.
   */
  public enqueue(event: MetricEvent): void {
    this.buffer.push(event);
  }

  /**
   * Envía todos los eventos en orden de inserción.
   * @throws Error Si el transporte falla.
   */
  public async flush(): Promise<void> {
    // implementación
  }
}
```

### Métodos con argumentos y constructor documentado (con tipos en etiquetas)
```ts
/**
 * Orquesta la ejecución de tareas con límite de concurrencia.
 * @remarks Usa una cola interna y reintentos exponenciales.
 */
export class TaskRunner {
  /**
   * @param {number} concurrencySlots Máximo de tareas concurrentes (>= 1).
   * @param {number} baseDelayMs Retardo inicial para backoff en ms.
   */
  constructor(
    private readonly concurrencySlots: number,
    private readonly baseDelayMs: number
  ) {}

  /**
   * Ejecuta una tarea tipada respetando el límite de concurrencia.
   * @param {() => Promise<T>} task Tarea asincrónica a ejecutar.
   * @returns {Promise<T>} Resultado de la tarea.
   * @throws Error Si la tarea rechaza o el runner se encuentra saturado.
   */
  public async run<T>(task: () => Promise<T>): Promise<T> {
    // implementación
  }
}
```

### Objeto de opciones con `@param options.*` y `@defaultValue`
```ts
/**
 * Configura el cliente de colas con valores predeterminados seguros.
 * @param {object} options Bolsa de opciones.
 * @param {string} [options.endpoint] URL del broker; por defecto `amqp://localhost`.
 * @param {number} [options.prefetch] Mensajes máximos en vuelo.
 * @param {boolean} [options.dlxEnabled] Activa DLX para mensajes fallidos.
 * @defaultValue endpoint = 'amqp://localhost'; prefetch = 10; dlxEnabled = true
 * @returns {QueueClient} Cliente listo para publicar y consumir.
 */
export function createQueueClient(options: {
  endpoint?: string;
  prefetch?: number;
  dlxEnabled?: boolean;
} = {}): QueueClient {
  const {
    endpoint = 'amqp://localhost',
    prefetch = 10,
    dlxEnabled = true,
  } = options;
  // implementación
  return new QueueClient({ endpoint, prefetch, dlxEnabled });
}
```

### Visibilidad explícita `@public` / `@internal`
```ts
/**
 * @public Cliente HTTP estable para consumidores externos.
 */
export class HttpClient {
  /**
   * @internal Pool compartido no estable; su forma puede cambiar.
   * @remarks No dependas de esta propiedad fuera del paquete.
   */
  protected readonly pool: ConnectionPool;

  /**
   * Envía una petición y devuelve la respuesta parseada.
     * @param {HttpRequest} request Petición tipada.
     * @returns {Promise<T>} Respuesta parseada como JSON.
   * @throws Error Si el transporte o el parseo fallan.
   */
  public async send<T>(request: HttpRequest): Promise<T> {
    // implementación
  }
}
```

### Builder/factory con validación
```ts
/**
 * Construye un cliente HTTP tipado con reintentos y cancelación.
 * @param {SdkConfig} config Configuración del cliente (host https y timeout >= 100ms).
 * @returns {HttpClient} Instancia lista para usar.
 * @throws Error Si el `baseUrl` no es https o el `timeoutMs` es inválido.
 * @example
 * const http = createHttpClient({ baseUrl: 'https://api.example.com', timeoutMs: 1000 });
 */
export function createHttpClient(config: SdkConfig): HttpClient {
  // implementación
}
```

### Type guard
```ts
/**
 * Verifica si el valor es un `Error` con código tipado.
 * @param candidate Valor a validar.
 * @returns {candidate is CodedError} `true` si incluye `code` string.
 * @remarks Útil para estrechar antes de mapear errores a respuestas HTTP.
 */
export function isCodedError(candidate: unknown): candidate is CodedError {
  return !!candidate && typeof candidate === 'object' && 'code' in candidate;
}
```

### Type guard con valores permitidos
```ts
/**
 * Valida si el valor es un entorno soportado.
 * @param env Cadena recibida de configuración.
 * @returns {env is 'dev' | 'staging' | 'prod'} `true` cuando coincide con entornos válidos.
 */
export function isSupportedEnv(env: string): env is 'dev' | 'staging' | 'prod' {
  return env === 'dev' || env === 'staging' || env === 'prod';
}
```

### Helper genérico
```ts
/**
 * Crea un map inmutable a partir de tuplas clave-valor.
 * @param {Iterable<readonly [K, V]>} entries Colección de tuplas `[K, V]`.
 * @returns {ReadonlyMap<K, V>} Mapa inmutable que preserva inserciones.
 * @example
 * const map = toReadonlyMap([
 *   ['id', 1],
 *   ['name', 'alice'],
 * ]);
 */
export function toReadonlyMap<K, V>(entries: Iterable<readonly [K, V]>): ReadonlyMap<K, V> {
  return new Map(entries);
}
```

### Genérico con restricción y default
```ts
/**
 * Ensambla una lista ordenada aplicando un selector de clave.
 * @param {readonly T[]} items Elementos a ordenar.
 * @param {(item: T) => K} selector Función que extrae la clave comparable.
 * @returns {T[]} Lista ordenada ascendente.
 * @example
 * const sorted = sortBy(users, (u) => u.id);
 */
export function sortBy<T, K extends string | number | bigint>(
  items: readonly T[],
  selector: (item: T) => K
): T[] {
  return [...items].sort((a, b) => {
    const ak = selector(a);
    const bk = selector(b);
    return ak < bk ? -1 : ak > bk ? 1 : 0;
  });
}
```

### Clase de error
```ts
/**
 * Error controlado para timeouts de red.
 * @param {string} message Mensaje descriptivo.
 * @param {number} timeoutMs Tiempo límite alcanzado en ms.
 * @example
 * throw new NetworkTimeoutError('Upstream timed out', 1500);
 */
export class NetworkTimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'NetworkTimeoutError';
  }
}
```

### Flujo Observable / Promise
```ts
/**
 * Devuelve un stream de heartbeats hasta que se cancele.
 * @param {number} intervalMs Intervalo entre pulsos en ms (>= 100).
 * @returns {Observable<number>} Observable que emite timestamps y se completa al cancelar.
 * @example
 * const sub = heartbeat(500).subscribe((t) => console.log(t));
 * sub.unsubscribe();
 */
export function heartbeat(intervalMs: number): Observable<number> {
  // implementación
}
```

### Callback y promesa documentados
```ts
/**
 * Procesa mensajes de una cola llamando a un handler asíncrono.
 * @param {readonly T[]} messages Lote de mensajes a procesar.
 * @param {(message: T) => Promise<void>} handler Callback que recibe cada mensaje y puede lanzar.
 * @returns {Promise<void>} Promesa resuelta cuando todo el lote finaliza.
 * @throws Error Si algún handler lanza sin capturarse.
 * @example
 * await processBatch(events, async (event) => await save(event));
 */
export async function processBatch<T>(
  messages: readonly T[],
  handler: (message: T) => Promise<void>
): Promise<void> {
  for (const message of messages) {
    await handler(message);
  }
}
```

### API marcada como `@deprecated` y `@beta`
```ts
/**
 * @deprecated Usa `retryFetch` con backoff configurable.
 * @beta Sujeta a cambios de firma en versiones mayores.
 * @param {string} url Recurso HTTP a solicitar.
 * @returns {Promise<string>} Texto plano de la respuesta.
 */
export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  return res.text();
}
```

### Módulo de constantes
```ts
/**
 * Cabeceras HTTP estándar usadas por el SDK.
 * @remarks Útil para tests y clientes externos; no mutar en runtime.
 */
export const STANDARD_HEADERS = Object.freeze({
  json: 'application/json',
  authScheme: 'Bearer',
});
```

## Syntax playbook
Apégate a https://tsdoc.org. Argumentos opcionales al final. Documenta objetos de opciones para evitar firmas ambiguas.

```ts
/**
 * Formatea un mensaje para logs estructurados.
 * @param level Nivel de log (`info` | `warn` | `error`).
 * @param message Mensaje principal.
 * @param context Metadatos opcionales.
 * @returns Cadena serializada lista para stdout.
 */
export function formatLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Readonly<Record<string, unknown>> = {}
): string {
  // implementación
}
```

## Metrics & Validation
- `npm run lint` (enforce `jsdoc/require-jsdoc`, `jsdoc/require-param`, `jsdoc/require-returns`, reglas del repo).
- `npm run test` para asegurar que ejemplos y contratos reflejan el comportamiento real.
- `npm run build` para validar tipos y compatibilidad.
- `npm run docs:coverage` para fallar si falta TSDoc en `.ts` relevantes.
- `npx tsdoc` para validar sintaxis de etiquetas.

## Deliverables
1. Gap report con archivos/líneas afectadas.
2. PR o plan de remediación que agrega TSDoc, README o ADR.
3. Entrada en Validation & CI con comandos ejecutados y resultados (incluye `docs:coverage`).
4. Snapshot del comando `docs:coverage` (o artefacto CI) y tabla de brechas.

## Feature doc alignment
- Cada paquete mantiene un README/ADR con decisiones, flags y owners; enlaza desde TSDoc con `@see` cuando dependan de esas decisiones.
- Tablas grandes (permisos, esquemas) se resumen en TSDoc y se enlazan al detalle en README para evitar desactualización.
- Usa la sección “Documentation contracts” del README para listar símbolos clave y archivos con TSDoc correspondiente; actualízala en el mismo PR que modifica comentarios.
- ADRs deben incluir “Símbolos impactados” y referencias cruzadas a bloques TSDoc a actualizar si la decisión cambia.

## Notes
- Sigue naming/typing desde **Angular Engineering Standards** cuando aplique a TypeScript puro.
- Toda excepción a `jsdoc/*` debe documentarse en el README del paquete con dueño y fecha límite.
- Si capturas decisiones arquitectónicas extensas, crea un ADR corto con opciones, impacto y métricas vinculadas.
