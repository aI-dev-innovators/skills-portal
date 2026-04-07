---
id: angular-skills-angular-forms
name: angular-skills-angular-forms
title: angular-forms
description: >-
  Diseñar e implementar formularios escalables, tipados y de alto rendimiento
  usando Reactive Forms, ControlValueAccessor, validadores asíncronos y
  renderizado dinámico.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Angular Forms Architecture (Skill)

## Summary
- Define los estándares para la creación, validación y optimización de formularios en Angular, asegurando tipado estricto y alto rendimiento.
- Proporciona guías claras para desacoplar la lógica de presentación del estado del formulario mediante `ControlValueAccessor` y arquitecturas dinámicas.

## Goal
Implement robust, type-safe, and highly performant forms that scale easily with complex business rules and dynamic data structures.

## Single responsibility
Form state management, validation, custom control bridging, and form performance. For UI component styling, use **Angular Engineering Standards**.

## Inputs
- Modelo de datos o DTO esperado por la capa de aplicación/infraestructura.
- Reglas de validación (síncronas, asíncronas, cross-field).
- Esquemas JSON o metadatos (si es un Dynamic Form).
- Cuellos de botella de rendimiento actuales (ej. demasiadas re-evaluaciones en cada pulsación de tecla).

## Triggers
- Creación de formularios complejos, anidados o largos.
- Necesidad de encapsular inputs UI de terceros o nativos complejos (CVA).
- Formularios construidos a partir de respuestas del backend (Dynamic Forms).
- Lentitud en la UI al escribir o interactuar con formularios grandes.

## Core Form Strategies

### 1. Reactive Forms Avanzados
- **Strict Typing:** Uso obligatorio de Typed Forms (`FormControl<T>`, `FormGroup`, `FormRecord`, `FormArray`). Evitar `any` o tipos implícitos.
- **Non-Nullable Controls:** Usar `{ nonNullable: true }` o el `NonNullableFormBuilder` para evitar que los controles se reseteen a `null` cuando el dominio espera cadenas vacías o valores por defecto.
- **Form Models vs Domain Models:** Nunca vincular el modelo de dominio directamente a la vista. El formulario (Form Model) debe mapearse hacia/desde el DTO o Domain Model en la capa de Aplicación.
- **Form Arrays & Form Records:** Usar `FormArray` para colecciones iterables estandarizadas y `FormRecord` para objetos con claves dinámicas pero valores del mismo tipo.

### 2. Custom Form Controls (ControlValueAccessor)
- **Encapsulación:** Cualquier componente de UI complejo (date pickers, custom selects, toggles) debe implementar la interfaz `ControlValueAccessor` (CVA) para hablar nativamente con la API de Angular Forms.
- **NG_VALUE_ACCESSOR:** Proveer el token correctamente usando `forwardRef` o a nivel de directiva standalone.
- **Implementación estricta:**
  - `writeValue(value: T)`: Actualizar la vista de forma segura sin emitir eventos hacia atrás.
  - `registerOnChange(fn)`: Llamar a `fn(value)` cada vez que el usuario interactúa, asegurando que el modelo de Angular se entere del cambio.
  - `registerOnTouched(fn)`: Llamar a `fn()` en el evento `blur` para marcar el control como *touched* y disparar validadores visuales.
  - `setDisabledState(isDisabled: boolean)`: Reaccionar a `control.disable()` deshabilitando elementos nativos en el DOM.

### 3. Dynamic Forms
- **Config-Driven Architecture:** Generar formularios iterando sobre un array de metadatos (ej. JSON recibido del backend) usando el nuevo control flow de Angular (`@for` y `@switch`).
- **Factory Components:** Para casos muy dinámicos, usar `ViewContainerRef` o `ngComponentOutlet` para instanciar dinámicamente el componente de input correspondiente según el tipo definido en el esquema.
- **Validadores Dinámicos:** Asignar `Validators` y `AsyncValidators` en tiempo de ejecución mapeando strings del esquema JSON a las funciones de validación reales.

### 4. Validadores Async
- **Aislamiento:** Mantener las validaciones asíncronas separadas de las síncronas para no bloquear la evaluación del formulario.
- **Eficiencia con RxJS:** Es obligatorio usar operadores como `timer()` y `switchMap()` para hacer *debounce* de las llamadas a la API (ej. verificar si un email existe) y cancelar peticiones en vuelo previas.
- **Manejo de Errores:** Usar `catchError` para retornar un observable válido con el objeto de error (ej. `{ emailTaken: true }`) o `null` si falla el endpoint temporalmente, garantizando que el stream no muera.
- **Estado PENDING:** Reaccionar en la vista al estado `control.status === 'PENDING'` para mostrar indicadores de carga (spinners).

### 5. Form Performance Optimization
- **Estrategia de Actualización:** En formularios grandes o con validaciones costosas, cambiar la estrategia por defecto configurando `updateOn: 'blur'` o `updateOn: 'submit'` a nivel de `FormControl` o `FormGroup`.
- **ChangeDetectionStrategy.OnPush:** Todos los componentes que rendericen formularios deben usar `OnPush`.
- **Suscripciones seguras:** Si es necesario reaccionar a `valueChanges` o `statusChanges`, se debe usar RxJS interopible con Signals (ej. `toSignal(form.valueChanges)`) o limpiar estrictamente las suscripciones usando `takeUntilDestroyed()`.
- **Evitar getters pesados:** No usar llamadas a métodos en el template para evaluar estados (ej. `*ngIf="checkIfValid()"`). Exponer *Signals* calculados o variables planas actualizadas por eventos.

## Deliverables
1. Definición del `FormGroup` tipado y validadores.
2. Implementaciones de `ControlValueAccessor` para componentes UI encapsulados.
3. Configuración de esquemas e iteradores para Dynamic Forms.
4. Estrategia de optimización aplicada (OnPush, updateOn, debouncing).

## Metrics & Validation
- Validar que `npm run lint` apruebe sin advertencias de tipos implícitos o falta de tipos en los `FormControl`.
- Pruebas unitarias deben instanciar el componente, setear valores en el formulario mediante `control.setValue()`, y simular eventos DOM para probar el flujo completo.
- Para los CVA, las pruebas deben verificar explícitamente que la función proveida por `registerOnChange` se ejecuta tras la interacción del usuario.

## Notes
- En arquitecturas hexagonales/DDD, las reglas de validación complejas deben vivir en la capa `core/domain` e inyectarse en los validadores de Angular, no escribirse directamente en el componente.
- Para migraciones desde Template-Driven Forms hacia Reactive Forms, solicita "Apply migration plan using Angular Forms Architecture" para mapear la estrategia y conversiones de tipo paso a paso.
