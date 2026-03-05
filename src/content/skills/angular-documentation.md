---
name: angular-documentation
title: angular-documentation
description: >-
  Centralize Angular documentation rules for TSDoc, feature READMEs, ADRs, and
  validation logs so teams capture intent and usage alongside the code.
tags: []
repoId: frontend-skills
repoName: Frontend Skills
---

# Angular Documentation (Skill)

## Summary
- Regla canónica para TSDoc, READMEs de feature, ADRs y logs de validación que mantiene intención y uso alineados con el código.
- Se coordina con **Angular Engineering Standards** y **Angular Validation & CI** para exigir contratos de documentación completos antes de cerrar un cambio.

## Goal
Ensure every critical symbol and feature carries TSDoc-compliant documentation that is useful, executable, and easy to maintain across all TypeScript sources.

## Single responsibility
Documentation and traceability only. Baseline coding rules continue to live inside **Angular Engineering Standards**.

## Inputs
- Alcance del feature o módulo (rutas, componentes, servicios, stores, guards, efectos) y si es nuevo o legado.
- Archivos TypeScript relevantes (`src/**/*.ts`) donde viven los contratos públicos y handlers de plantilla.
- Estado actual de documentación (TSDoc, README, ADRs) y tabla de brechas si existe.
- Comandos de validación disponibles (`npm run lint`, `npm run test`, `npm run build`, `npm run docs:coverage`, `npx tsdoc`) y restricciones de CI/CD.

## Triggers
- Migrations where TSDoc is missing or the public contract is unclear.
- Features lacking README/ADR notes that explain key decisions or build flags.
- Reviews where `npm run lint` reports `jsdoc/*` violations.
- Before handing work to another team so every API boundary is well understood.

## Documentation workflow
1. Identify the scope (components, services, signals, guards, effects, helpers) and determine which symbols are exported or consumed publicly.
2. Inventory all TypeScript files (`src/**/*.ts`) and highlight undocumented symbols before touching code. Prefer a short gap table with file, line, and missing context.
  - Si alguna sección del proyecto no cumple el estándar descrito aquí, reemplaza o actualiza la documentación completa de ese módulo (no solo el archivo tocado) hasta que todos los símbolos se alineen con las reglas vigentes.
3. Run `npm run lint` **and** `npm run docs:coverage`; fix every `jsdoc/*` rule (these enforce the TSDoc contract). Do not suppress warnings unless the feature README records the exception plus owner/date.
4. Write or update TSDoc using the official syntax from https://tsdoc.org and add examples whenever behavior is non-trivial. Reference real template bindings so consumers can trace the data flow.
5. Capture architecture/state/performance decisions in the feature README or ADR with date, owners, trade-offs, and links to the source files touched.
6. Update the validation log (`Angular Validation & CI`) con los comandos que certifican la cobertura, incluyendo hashes o fragmentos relevantes del análisis de brechas.
7. Share the before/after gap table in your PR description so reviewers can confirm 100% coverage.

## Remediation playbook
1. Levanta un inventario completo de símbolos usando `rg -n "export" src` (o la herramienta que prefieras) y conviértelo en una tabla de brechas (`archivo | símbolo | estado`). Usa esa tabla como checklist y adjunta el antes/después en tu PR.
2. Normaliza cada bloque de TSDoc siguiendo este skill: antes de escribir la versión correcta, **elimina por completo los comentarios heredados** que no cumplan el estándar para evitar contradicciones; luego agrega el bloque nuevo con resumen accionable, `@param`, `@returns`, `@remarks` para efectos y `@example` cuando exista binding de plantilla o contrato público. Señales `input()`/`output()` y `EventEmitter` deben documentar el flujo reactivo y emitir cargas tipadas.
3. Si un bloque supera tres párrafos o captura decisiones arquitectónicas extensas, mueve el detalle al README o ADR del feature y enlázalo con `@see`, manteniendo un idioma único por módulo.
4. Automatiza la cobertura ejecutando `npm run lint`, `npm run test`, `npm run build`, `npm run docs:coverage` y `npx tsdoc` antes de cada PR. Registra los comandos y hashes relevantes en `Angular Validation & CI` para trazabilidad.
5. En código legado, trabaja por feature: actualiza TSDoc del código tocado, sincroniza la tabla “Documentation contracts” del README y documenta excepciones temporales (dueño + fecha) cuando un `jsdoc/*` no pueda resolverse en el mismo cambio.
6. Prioriza módulos públicos y stores compartidos; después expande al resto de la carpeta `src`. Si detectas falsos positivos en `docs:coverage`, documenta el caso y abre un issue de seguimiento.

## Estándar mínimo TSDoc
- **Cobertura**: 100% de símbolos exportados y miembros privados con reglas de negocio. Componentes standalone, servicios `@Injectable`, stores, signals y handlers de plantilla deben publicar un bloque TSDoc.
- **Estructura**: usa un encabezado de una línea (qué hace y por qué existe), seguido de etiquetas obligatorias (`@param`, `@returns`, `@remarks`, `@example`, `@throws`, `@defaultValue` según aplique). No mezcles idiomas en un mismo bloque.
- **Contrato reactivo**: inputs tipo `input.required()`, `@Input()` y outputs basados en signals o `EventEmitter` describen el flujo de datos y el evento que dispara `emit`. Incluye snippets de plantilla reales.
- **Dependencias**: documenta side effects, telemetría y servicios externos en `@remarks` y enlaza decisiones mayores con `@see docs/...`.
- **Clases públicas**: componentes y servicios requieren un bloque TSDoc en la declaración de la clase que incluya `@remarks` (flujo, dependencias) y `@example` con el selector real. Documenta también miembros `protected` que gobiernan lógica de negocio.

| Tipo de símbolo | Etiquetas mínimas |
| --- | --- |
| Funciones/métodos públicos | `@param`, `@returns`, `@throws` (si aplica), `@remarks` para side effects |
| Componentes/servicios/export default | Resumen + `@remarks` (dependencias) + `@see` hacia README/ADR |
| Inputs/Outputs/Signals | `@remarks` (ciclo de vida) + `@example` (binding) + `@eventProperty` o explicación del `emit` |
| Stores/effects/guards | `@returns` (forma del snapshot) + `@throws` cuando abortan navegación u operaciones |

### Plantilla base
```ts
/**
 * Qué hace el símbolo y por qué es relevante para el feature.
 * @param payload Dominio, unidades y validaciones.
 * @returns Forma del dato emitido o efectos secundarios clave.
 * @remarks Menciona dependencias compartidas, telemetría o flags.
 * @example
 * <app-widget (save)="onSave($event)" />
 */
export function processWidget(payload: WidgetPayload): WidgetResult {
  // implementación
}
```

## Guía de estilo de documentación
- **Voz y enfoque**: escribe en voz activa, evitando repetir el nombre del símbolo. Enuncia reglas de negocio (“valida permisos `clients:write` antes de emitir `save`”), no solo el tipo de dato.
- **Consistencia**: respeta el idioma declarado en el README del feature. Si el módulo está en español, mantén todos los bloques en español salvo literales de código.
- **Claridad temporal**: cuando un handler depende de un ciclo de vida, documenta explícitamente cuándo se ejecuta y qué pasa si falla (`@remarks Se ejecuta antes de persistir para bloquear inputs inválidos`).
- **Referencias cruzadas**: agrega `@see` o `@link` a ADRs, READMEs, métricas o flujos de telemetría relevantes. La documentación debe permitir navegar la arquitectura sin saltar al código.
- **Cobertura de edge cases**: describe valores por defecto, argumentos opcionales y límites (por ejemplo, “rechaza importes mayores a 10 000 USD”).
- **Ejemplos ejecutables**: cada `@example` debe ser copiable, usando bindings reales (`(submitOrder)="onSubmit($event)"`). Evita pseudocódigo que no compile.
- **Integridad**: cuando exista flujo reactivo (signals, stores, efectos), documenta cómo se sincroniza con otras fuentes de estado y qué sucede en SSR o zoneless CD.
- **Tipos explícitos**: aunque TypeScript provea la definición, anota el tipo en cada etiqueta (`@param {string} actionId`, `@returns {boolean}`). Describe si la función estrecha el tipo (`narrows to ShellActionId`) o aplica unidades específicas.

### Lista rápida “Do & Don’t”
- ✅ Explica reglas y dependencias (“usa `SalesKernelService` para loggear telemetría”).
- ✅ Documenta errores esperados con `@throws` y describe el motivo.
- ✅ Incluye unidades/formatos en cada `@param` (ms, ISO date, currency, etc.).
- ❌ No repitas el nombre del método como descripción (“`saveClient` guarda un cliente”).
- ❌ No mezcles idiomas ni copies/pegues comentarios obsoletos.
- ❌ No uses `@example` genéricos (“`doSomething()`”) sin contexto real.

## Checklist por PR
- Confirma que la tabla de brechas esté actualizada y adjunta el snapshot en la descripción del PR (antes/después).
- Aplica los bloques TSDoc requeridos y enlaza READMEs/ADRs cuando el bloque exceda tres párrafos o depende de decisiones externas.
- Ejecuta `npm run lint`, `npm run test`, `npm run build`, `npm run docs:coverage` y `npx tsdoc` (si el repo lo habilita); pega el resumen de salida o hash en `Angular Validation & CI`.
- Actualiza el README del feature con la tabla “Documentation contracts” y registra cualquier excepción `jsdoc/*` con dueño/fecha.
- Verifica que los ejemplos TSDoc compilan mentalmente con el template real (`(save)="onSave($event)"`, `[client]="selectedClient()"`).
- Añade notas de seguimiento (issue/ticket) si quedan falsos positivos o deuda documentada.

## Tabla de brechas ejemplo
| Archivo | Símbolo | Estado | Acción |
| --- | --- | --- | --- |
| src/app/clients/client-card.component.ts | `ClientCardComponent.openDetail` | Sin `@example` | Añadir snippet con `(openDetail)` y documentar payload |
| src/app/clients/stores/client.store.ts | `updateClient` | Falta `@throws` | Documentar error cuando la API devuelve 409 |

Utiliza esta tabla como checklist vivo: marca “Completado” o enlaza al commit donde se resolvió. Incluye la tabla en el PR para que revisores puedan auditar cobertura sin leer cada archivo.

## Tooling recomendado
- **Inventario**: `rg -n "export" src` (o scripts propios con `ts-morph`) para obtener la tabla de brechas y mantenerla en el README/PR.
- **Cobertura**: `npm run docs:coverage` (ESLint + reglas `jsdoc/*`) y `npx tsdoc` para validar sintaxis de etiquetas.
- **Guardrails**: agrega un hook `pre-push` con `pnpm exec lint-staged --config lint-staged.docs.cjs` para ejecutar sólo sobre archivos modificados cuando el repo sea grande.
- **Reportes**: adjunta en `Angular Validation & CI` o en el README del feature los hashes/logs de los comandos ejecutados para que otros equipos puedan auditarlos.

## Plantilla para README del feature
Incluye estas secciones cada vez que una feature toca documentación:

1. **Contexto y alcance**: descripción corta del feature, owners y fecha de la última actualización.
2. **Documentation contracts** (tabla):

| Símbolo | Archivo | Propósito | Última revisión |
| --- | --- | --- | --- |
| `ClientCardComponent` | src/app/clients/client-card.component.ts | Renderiza tarjeta resumen y emite `openDetail` | 2026-02-20 |
| `ClientStore` | src/app/clients/data/client.store.ts | Centraliza cache y telemetría | 2026-02-20 |

3. **Decisiones/ADR**: lista de enlaces (`docs/adr/...`) con resumen de impacto y símbolos afectados.
4. **Validación**: comandos ejecutados (`npm run lint`, `npm run docs:coverage`, `npx tsdoc`, etc.) con hash o log corto.
5. **Excepciones**: tabla con símbolos pendientes, dueño y fecha comprometida para cerrar la brecha (`símbolo | deuda | responsable | ETA`).

## What to document
Documentación completa significa abarcar **todos los archivos TypeScript del proyecto** (`src/**/*.ts`), no solo los exportados en cada módulo, y cada símbolo debe describirse usando bloques TSDoc válidos. Cada entrega debe revisar la carpeta completa para evitar que resurjan huecos entre features.
### 1) Symbol coverage
- 100% of exported symbols (components, services, models, helpers).
- Signals, effects, and stores (for example, helpers built with `computed`, `signal`, or `Store`) always explain how they derive or mutate state.
- Methods/event handlers bound to templates describe side effects, emissions, and prerequisite validation.
- Inline handlers created during refactors (such as the `CrudStore` helpers in *skill-copilot-app*) must also include TSDoc.
- Inputs, outputs, and public fields require context, not only a short label. Describe what sets them, how they influence rendering, and any validation rules or SSR constraints. Prefer multi-line comments when the default value or type alias needs justification.
- Signals declarados con `input()`, `output()`, `model()` o `viewChild()` deben documentar el flujo reactivo igual que los decoradores tradicionales, especificando qué evento dispara el cambio y cómo sincroniza con el resto del árbol.
- Private members that gate behavior (for example `protected readonly clientForm`) also need coverage when they embody business rules. Summaries should mention why the member exists, not just restate the type.

### 2) Detailed contracts
- Describe every argument with `@param` and include the domain type, units, and valid ranges.
- Use `@returns` to document the returned shape or resulting effects.
- Add `@throws` whenever callers should expect an error path.
- Document build flags, builders, and scripts required to reproduce the environment.
- Para type guards, usa `@returns {boolean}` y explica qué tipo se estrecha (`narrows to ShellActionId`) para que los consumidores entiendan el contrato.
- For inputs/outputs, specify lifecycle guarantees (`@Input() client` patched on `ngOnChanges`, `@Output() save` emits only when the form is valid). Tie the documentation to real template usage so consumers can trace the data flow without reading the implementation.

### 3) EventEmitters y outputs tipados
- Tipar explícitamente cada `EventEmitter` (`EventEmitter<Client['id']>`, `EventEmitter<void>`) para que el contrato se verifique en tiempo de compilación.
- Documentar con TSDoc cuándo se dispara la salida, qué payload emite y qué garantías ofrece el handler asociado.
- Si un componente reexpone la salida de un hijo o nieto, cada nivel debe añadir su propia descripción TSDoc explicando el propósito del reenvío y cualquier lógica adicional (telemetría, guards, side effects).
- Incluir ejemplos cortos que muestren cómo consumir el output desde el template (`(clientSelected)="onClientSelected($event)"`) y qué método `on…` lo procesa.
- Cuando se use la API basada en signals (`output()`/`input()`), documenta la señal generada (por ejemplo `readonly save = output<Client>()`) y explica cómo/ cuándo se llama `emit`. Incluye `@example` tanto para la sintaxis de template como para el flujo reactivo (`component.save.emit(payload)`).

```ts
/**
 * Emite el identificador del cliente seleccionado desde la lista lateral.
 * @example
 * <app-client-list (clientSelected)="onClientSelected($event)" />
 */
@Output() clientSelected = new EventEmitter<Client['id']>();

/**
 * Reemite la confirmación del modal y registra telemetría antes de propagarla.
 * @param event Tiempo de confirmación capturado en milisegundos.
 */
@Output() confirmed = new EventEmitter<number>();

protected onModalConfirmed(timestamp: number): void {
  this.telemetry.track('modal_confirmed', { timestamp });
  this.confirmed.emit(timestamp);
}
```

### 4) Executable examples
- Use `@example` to show real calls or executable pseudo-code.
- Prefer concise scenarios that clarify expected inputs and outputs.
- When documenting inputs or derived signals, include an `@example` snippet that mirrors the template binding (`[client]="selectedClient()"`). This clarifies expectations and discourages superficial comments.

### 5) Estructura y profundidad
- Cada bloque TSDoc debe responder **qué hace**, **cuándo se usa**, y **qué limitaciones o validaciones aplica** (no basta con repetir “Draft client…”).
- Usa frases completas y, cuando aplique, bullets dentro del bloque para listar efectos secundarios, reglas de negocio o edge cases.
- Documenta formularios y stores indicando qué campos se inicializan, quién puede mutarlos, y cómo se sincronizan con señales/handlers (por ejemplo: "`clientForm` controla los campos del CRUD y sólo `onSubmitForm` debe leer `getRawValue()` para mantener validaciones alineadas").
- Mantén consistencia en el idioma y evita mezclar inglés/español dentro del mismo bloque salvo nombres propios o literales de código.
- Señala dependencias externas o contratos compartidos (por ejemplo, "este servicio publica métricas a `SalesKernelService`"), de modo que otras skills tengan trazabilidad sin revisar la implementación.

### 6) Auditoría automatizada y reporte
- Ejecuta `npm run docs:coverage` en cada PR. El comando debe fallar si existe un símbolo sin documentación requerida.
- Anexa en la descripción del PR o README de la skill una mini tabla con `archivo | símbolo | corrección` para demostrar cobertura completa.
- Si `docs:coverage` encuentra falsos positivos, documenta la excepción en el README del feature con: símbolo, motivo, dueño y fecha límite para resolverlo.
- Integra `docs:coverage` en pipelines CI/CD y como `pre-push` opcional para detectar regresiones antes de abrir un PR.

### 7) Idioma y trazabilidad cruzada
- Define un idioma principal por feature y documenta dicho acuerdo en el README del módulo. Evita mezclar español/inglés dentro del mismo bloque salvo literales de código o nombres propios.
- Cuando un componente u operador depende de decisiones capturadas en un ADR/README, agrega `@see` apuntando al archivo correspondiente (`@see docs/adr/2024-07-14-shell-layout.md`).
- TSDoc es el punto de entrada; utilízalo para enlazar señales, stores y servicios con los contratos compartidos (`@remarks Depende de SalesKernelService para publicar métricas`).
- Los bloques deben explicar cómo sincronizarse con otras habilidades (por ejemplo, especificar qué `EventEmitter` expone telemetría para Security), reduciendo la necesidad de revisar múltiples archivos.

## TSDoc tag conventions

| Tag | Obligatorio cuando | Notas |
| --- | --- | --- |
| `@param` | Toda función/método con argumentos, incluyendo `@Input()` setters y handlers inline. | Describe dominio, unidades y validaciones; usa `@param options.label` para objetos de configuración. |
| `@returns` | Funciones que devuelven un valor, señales derivadas, `computed`, factories. | Resume la forma/trazas; para métodos `void` aclara efectos secundarios en `@remarks`. |
| `@remarks` | APIs con contexto adicional (dependencias, side effects, flags). | Útil para documentar telemetría, coordinación con stores o limitaciones SSR. |
| `@example` | Cuando el uso no es trivial, existe binding de plantilla o contrato público. | Replica llamadas reales (`(save)="onSave($event)"`) para asegurar trazabilidad. |
| `@throws` | Métodos que lanzan errores o rechazan promesas. | Explica condiciones y códigos asociados. |
| `@defaultValue` | Inputs, signals o providers con valores iniciales relevantes. | Documenta la razón del default y quién puede sobreescribirlo. |
| `@deprecated`/`@beta` | APIs sujetas a retiro o en vista previa. | Incluye fecha objetivo y alternativa. |
| `@see` | Cuando exista README/ADR/code sample relacionado. | Usa rutas relativas dentro del repo para navegación rápida. |

- Aplica `@public`, `@internal`, `@alpha` según la visibilidad esperada, especialmente en librerías compartidas.
- Para `EventEmitter`, usa `@eventProperty` si el tooling lo soporta; de lo contrario deja claro en `@remarks` cuándo se dispara y por qué.
- Para la API de señales (`input()`/`output()`/`model()`), documenta tanto la señal de lectura como el método `emit`, indicando si existe validación previa.
- Si un bloque supera los tres párrafos, muévelo a un README y deja un resumen con `@see`.

## Pattern gallery

### Standalone components con `@Input`/`@Output`
```ts
@Component({
  selector: 'app-client-card',
  standalone: true,
  templateUrl: './client-card.component.html'
})
export class ClientCardComponent {
  /**
   * Cliente mostrado en la tarjeta derecha.
   * @remarks El valor se parchea en `ngOnChanges` para mantener alineado el formulario inline.
   */
  @Input({ required: true }) client!: Client;

  /**
   * Emite cuando el usuario solicita abrir el detalle completo.
   * @eventProperty
   * @example
   * <app-client-card (openDetail)="onOpenDetail($event)" />
   */
  @Output() openDetail = new EventEmitter<Client['id']>();
}
```

### Componentes con `input()` / `output()` basados en signals
```ts
@Component({
  selector: 'app-order-form',
  standalone: true,
  templateUrl: './order-form.component.html'
})
export class OrderFormComponent {
  /**
   * Pedido que se edita mediante signal-based inputs para habilitar zoneless CD.
   * @defaultValue orderInput.required()
   */
  readonly order = input.required<Order>();

  /**
   * Señal de salida que emite el pedido validado.
   * @eventProperty
   * @example
   * <app-order-form (submitOrder)="onSubmit($event)" />
   */
  readonly submitOrder = output<Order>();

  protected onSubmit(): void {
    this.submitOrder.emit(this.order());
  }
}
```

### Componentes con documentación extendida
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SalesKernelService } from './sales-kernel.service';
import { Product } from './sales.models';

/**
 * Renderiza el catálogo de productos y permite ajustar inventario en línea.
 * @remarks
 * - Usa `ChangeDetectionStrategy.OnPush` para minimizar renders.
 * - Depende de {@link SalesKernelService} como única fuente de verdad.
 * - Expone el estado reactivo mediante signals para plantillas zoneless.
 * @example
 * ```html
 * <app-product-catalog />
 * ```
 */
@Component({
  selector: 'app-product-catalog',
  standalone: true,
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCatalogComponent {
  /**
   * Referencia al kernel que sincroniza los cambios con el store canónico.
   * @remarks Usamos `inject()` para evitar inyectores intermedios y mantener el contrato de testing.
   */
  protected readonly kernel = inject(SalesKernelService);

  /**
   * Signal con el catálogo vigente para evitar lecturas repetidas del servicio.
   * @remarks Mantiene la reactividad con OnPush y simplifica el template.
   */
  protected readonly products = this.kernel.products;

  /**
   * Procesa los eventos `change` provenientes del control numérico.
   * @param {number} productId Identificador del SKU editado.
   * @param {Event} event Evento DOM emitido por el input de stock.
   * @remarks
   * - Ignora targets inválidos o valores `NaN` restaurando el valor anterior.
   * - Evita llamadas redundantes cuando el valor no cambia.
   * - Solo invoca `updateProductStock` cuando la edición es válida.
   */
  protected onChangeStock(productId: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }
    const nextStock = Number(input.value);
    const product = this.findProduct(productId);
    if (!product) {
      return;
    }
    if (Number.isNaN(nextStock)) {
      input.value = product.stock.toString();
      return;
    }
    if (product.stock === nextStock) {
      return;
    }
    this.kernel.updateProductStock(productId, nextStock);
  }

  /**
   * Recupera un producto del catálogo local para sincronizar la edición.
   * @param {number} productId Id emitido por el template.
   * @returns {Product | undefined} Producto encontrado o `undefined` si el SKU no existe.
   * @internal Evita exponer el catálogo a consumidores externos.
   */
  private findProduct(productId: number): Product | undefined {
    return this.products().find((product) => product.id === productId);
  }
}
```

### Signals, `computed` y efectos
```ts
@Injectable({ providedIn: 'root' })
export class InventoryStore {
  private readonly stockState = signal<Record<number, number>>({});

  /**
   * Lectura reactiva del inventario por SKU.
   * @returns Snapshot inmutable que se actualiza cuando `stockState` cambia.
   */
  readonly stockBySku = computed(() => this.stockState());

  /**
   * Registra un nuevo inventario y propaga notificaciones de telemetría.
   * @param sku Identificador numérico del producto.
   * @param units Cantidad disponible expresada en piezas.
   * @throws Error Si `units` es negativo.
   */
  updateStock(sku: number, units: number): void {
    if (units < 0) {
      throw new Error('Units cannot be negative');
    }
    this.stockState.update((current) => ({ ...current, [sku]: units }));
  }
}
```

### Servicios inyectables y helpers compartidos
```ts
/**
 * Publica métricas de ventas en tiempo real.
 * @remarks Coordina emisiones con `SalesKernelService` para evitar duplicados.
 */
@Injectable({ providedIn: 'root' })
export class SalesMetricsService {
  constructor(private readonly kernel: SalesKernelService) {}

  /**
   * Notifica un hito de ventas y devuelve el identificador de telemetría generado.
   * @param payload Datos del hito incluyendo `orderId` y `amount`.
   * @returns Identificador correlacionado que otras skills pueden consultar.
   * @example
   * const metricId = this.salesMetrics.trackOrder({ orderId: 102, amount: 450 });
   */
  trackOrder(payload: { orderId: number; amount: number }): string {
    return this.kernel.pushMetric(payload);
  }
}
```

### SSR y controladores Express/Node
```ts
/**
 * Maneja solicitudes GET para `/api/orders` dentro del servidor Express.
 * @param req Request de Express con los parámetros de filtro.
 * @param res Response que entrega el JSON paginado.
 * @throws HttpError Cuando el kernel no está inicializado.
 */
export function handleOrders(req: Request, res: Response): void {
  const status = req.query['status'];
  const orders = kernel.fetchOrders({ status });
  res.json({ orders });
}

/**
 * Bootstrap SSR compatible con Angular CLI y funciones serverless.
 * @param context `BootstrapContext` emitido por `@angular/ssr`.
 * @returns Promesa resuelta cuando los providers han sido cargados.
 */
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context);
```

### Guards, efectos y rutas
```ts
export const canActivateClients: CanActivateFn = () => {
  /**
   * Valida que el usuario tenga la bandera `clients:read` o redirige al dashboard.
   * @returns `true` cuando la navegación continúa; `UrlTree` de fallback en otro caso.
   */
  return inject(AuthService).hasClaim('clients:read')
    ? true
    : inject(Router).createUrlTree(['/dashboard']);
};
```

### Type guards y helpers privados
```ts
/**
 * Type guard que valida si el identificador emitido pertenece a acciones soportadas.
 * @param {string} actionId Valor recibido desde la barra de acciones del shell.
 * @returns {actionId is ShellActionId} `true` cuando la acción se reconoce y estrecha el tipo.
 */
private isShellActionId(actionId: string): actionId is ShellActionId {
  return actionId in this.actionHandlers;
}
```

## Syntax playbook
Align with the official TSDoc standard: https://tsdoc.org. Optional or defaulted arguments belong at the end of the signature. Avoid ambiguous signatures by documenting option objects whenever multiple optional parameters exist.

```ts
import type { Pet } from './types';

/**
 * Logs the selected pet walking routine.
 * @param pet Domain model imported from the shared types barrel.
 * @example
 * walkPet(pets().at(0));
 */
function walkPet(pet: Pet): void {
  console.log(`Walking ${pet.name}...`);
}

/**
 * Formats user messaging for the toast hub.
 * @param title Required message title shown in the UI.
 * @param subtitle Optional subtitle typed with the `?` modifier for idiomatic Angular code.
 * @param body Optional body argument using standard TSDoc syntax and TypeScript optional type.
 * @param tone Optional tone with default value documented inline.
 * @returns Concatenated string ready for the toast component.
 */
function buildToastMessage(
  title: string,
  tone: 'info' | 'warning' | 'success',
  subtitle?: string,
  body?: string
): string {
  return `${title}::${subtitle ?? ''}::${body ?? ''}::${tone}`;
}

/**
 * Tracks an analytics metric making sure optional parameters appear last.
 * @param eventName Required event identifier.
 * @param value Required numeric value attached to the metric.
 * @param retryDelayMs Optional retry delay (defaults to 1000ms) defined before the metadata bag because it acts as a required tuning parameter with a sensible default.
 * @param metadata Optional metadata bag keyed by dimension.
 */
function trackMetric(
  eventName: string,
  value: number,
  retryDelayMs: number = 1000,
  metadata?: Readonly<Record<string, string>>
): void {
  console.log('metric', { eventName, value, metadata, retryDelayMs });
}

/**
 * Demonstrates multiple optional arguments with destructuring to keep call sites readable.
 * @param options.label Optional button label (defaults to `Accept`).
 * @param options.icon Optional icon name.
 * @param options.accent Optional accent color token.
 * @example
 * buildButtonConfig({ label: 'Cancel', icon: 'close' });
 */
function buildButtonConfig(options: {
  label?: string;
  icon?: string;
  accent?: 'primary' | 'neutral' | 'danger';
} = {}): { label: string; icon?: string; accent?: 'primary' | 'neutral' | 'danger' } {
  return {
    label: options.label ?? 'Accept',
    icon: options.icon,
    accent: options.accent,
  };
}
```

## Metrics & Validation
- `npm run lint` (enforces `jsdoc/require-jsdoc`, `jsdoc/require-param`, `jsdoc/require-returns`, and repo-specific rules).
- `npm run test` to ensure examples/documentation match real behavior.
- `npm run build` to confirm annotations do not introduce typing/compilation errors.
- `npm run docs:coverage` to ejecutar el script dedicado que analiza todos los `.ts` del workspace y falla si encuentra miembros sin TSDoc. Este script vive en `package.json` y encadena `npx eslint "src/**/*.ts" --rule "jsdoc/require-jsdoc:error" --rule "jsdoc/require-param:error" --rule "jsdoc/require-returns:error"` (se puede ajustar conforme evolucionen las reglas internas).
- Para proyectos que requieren validación sintáctica estricta, agrega `npx tsdoc` (https://github.com/microsoft/tsdoc) al pipeline. Ejecuta `npx tsdoc --init` una vez y corre `npx tsdoc` junto con `docs:coverage` para detectar etiquetas inválidas o bloques mal formados que ESLint no alcance.

## Deliverables
1. Gap report with affected files/lines.
2. Pull request or remediation plan that adds TSDoc, READMEs, or ADRs.
3. Entry in `Angular Validation & CI` showing commands executed and results, incluyendo la evidencia de `npm run docs:coverage` para que otras skills tengan un único punto de referencia.
4. Snapshot del comando `docs:coverage` (o enlace al artefacto CI) y tabla de gaps para auditorías futuras.

## Feature doc alignment
- Cada feature debe mantener un README (o ADR) con decisiones de arquitectura, flags y owners; enlaza dicho documento desde los bloques TSDoc que dependen de esas decisiones mediante `@see`.
- Cuando existan tablas o catálogos extensos (por ejemplo, matriz de permisos), describe el resumen en TSDoc y redirige el detalle al README para evitar comentarios desactualizados.
- Usa un apartado “Documentation contracts” en cada README para listar símbolos clave y archivos donde reside la TSDoc correspondiente; actualiza esta tabla en el mismo PR que modifica los comentarios.
- En ADRs, incluye una sección “Impacted symbols” y haz referencia cruzada a los bloques TSDoc que deberán actualizarse si la decisión cambia.

## Notes
- Follow the naming/typing/template-handler rules from **Angular Engineering Standards**.
- Every exception to `jsdoc/*` rules must be described in the feature README with an owner and target date to close the gap.
- When documentation captures architectural decisions, write a short ADR outlining the options considered, impact, and linked metrics.
