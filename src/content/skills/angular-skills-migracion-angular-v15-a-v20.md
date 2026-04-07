---
id: angular-skills-migracion-angular-v15-a-v20
name: angular-skills-migracion-angular-v15-a-v20
title: migracion-angular-v15-a-v20
description: >
  Guía paso a paso para migrar proyectos Angular desde la versión 15 hasta la
  20, pasando por cada versión intermedia (15→16→17→18→19→20). Úsalo cuando el
  usuario mencione migración de Angular, actualización de versiones Angular, ng
  update, o quiera actualizar su proyecto de Angular a una versión más reciente.
  Actívalo también si el usuario menciona errores tras actualizar Angular o
  quiere saber qué cambió entre versiones.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Skill de Migración Angular (v15 → v16 → v17 → v18 → v19 → v20)

## Instrucciones de ejecución

Este skill ejecuta la migración de forma incremental, paso a paso. Para cada salto de versión:

1. Hacer commit de todo el código actual
2. Ejecutar `ng update` de forma controlada
3. **Modificar los archivos** de configuración indicados en cada paso (tsconfig, angular.json, webpack, etc.)
4. Correr tests (`ng test`) y build (`ng build`) tras cada paso para confirmar que el proyecto sigue funcionando
5. **Verificar las reglas de negocio** revisando el checklist de `ANALISIS_FLUJOS.md`
6. **Hacer commit** con el mensaje `chore: migración Angular vX → vY` al completar cada paso
7. **No generar reportes ni planes** — ejecutar cada acción sobre el proyecto real

> El agente debe detectar y confirmar cambios pendientes antes de empezar, ejecutar un paso
> completo, confirmar que el proyecto compila, los tests pasan y las reglas de negocio se
> mantienen, hacer commit, y solo entonces avanzar al siguiente paso.
> Si un paso falla, detener y reportar el error antes de continuar.

---

## PASO 1 — Angular 15 → 16

### Ejecutar actualización del core
```bash
ng update @angular/core@16 @angular/cli@16
```

### Cambios clave
- **Signals (Developer Preview)**: introducción de `signal()`, `computed()`, `effect()`.
- **Required inputs**: `@Input({ required: true })`.
- **Standalone components estables**: ya no necesitan `NgModule` para declararse.
- **esbuild (developer preview)**: nuevo builder más rápido.
- **Jest support (experimental)** como alternativa a Karma.
- **DestroyRef**: nuevo helper para manejar el ciclo de vida sin `ngOnDestroy`.

### Aplicar cambios manuales en el proyecto
- Revisar y actualizar imports de `RouterModule` si se migra a standalone routing.
- Reemplazar `ComponentFactoryResolver` (deprecated) por `ViewContainerRef` en los archivos que lo usen.

---

## PASO 2 — Angular 16 → 17

### Ejecutar actualización del core
```bash
ng update @angular/core@17 @angular/cli@17
```

### Cambios clave
- **Nueva sintaxis de control flow** (`@if`, `@for`, `@switch`) — reemplaza `*ngIf`, `*ngFor`, `*ngSwitch`.
- **Deferrable views** (`@defer`, `@placeholder`, `@loading`, `@error`): lazy loading declarativo.
- **esbuild + Vite estable** para desarrollo (`ng serve` ahora usa Vite por defecto).
- **Standalone por defecto**: los nuevos proyectos ya no generan `AppModule`.
- **SSR mejorado**: nuevo paquete `@angular/ssr` (reemplaza `@nguniversal`).

### Aplicar cambios manuales en el proyecto
- Ejecutar el schematic de migración de control flow sobre el proyecto:
```bash
  ng generate @angular/core:control-flow
```
- Si el proyecto usa `@nguniversal`, ejecutar la migración a `@angular/ssr`.

---

## PASO 3 — Angular 17 → 18

### Ejecutar actualización del core
```bash
ng update @angular/core@18 @angular/cli@18
```

### Cambios clave
- **Signals estables**: `signal()`, `computed()`, `effect()` salen de developer preview.
- **Zoneless (experimental)**: posibilidad de correr Angular sin `zone.js`.
- **`@let` en templates** (developer preview): declarar variables locales en el HTML.
- **Form events**: nuevo observable `events` en `AbstractControl`.
- **Material 3 estable**.
- **`ng-content` con `select` mejorado**.

### Aplicar cambios manuales en el proyecto
- Buscar y revisar usos de `NgZone` en el código si se planea migrar a zoneless.
- Si el proyecto usa `@angular/material`, ejecutar:
```bash
  ng update @angular/material@18
```

---

## PASO 4 — Angular 18 → 19

### Ejecutar actualización del core
```bash
ng update @angular/core@19 @angular/cli@19
```

### Cambios clave
- **Standalone por defecto en todos los schematics**: `ng generate component` ya no agrega `standalone: true` explícitamente (es implícito).
- **Incremental hydration** (developer preview): hidratación parcial de componentes SSR.
- **`linkedSignal`** (developer preview): signal derivado que se puede escribir.
- **`resource()` API** (experimental): manejo de datos asíncronos con signals.
- **Hot module replacement (HMR)** para estilos y templates activado por defecto.
- **`effect()` sin `allowSignalWrites`** ya no requiere opción especial.

### Aplicar cambios manuales en el proyecto
- Buscar y actualizar componentes que aún declaren `standalone: false` explícitamente.
- Evaluar y reemplazar patrones `HttpClient` + `BehaviorSubject` con la API `resource()` donde corresponda.

---

## PASO 5 — Angular 19 → 20

### Ejecutar actualización del core
```bash
ng update @angular/core@20 @angular/cli@20
```

### Cambios clave (basados en roadmap/RC a la fecha)
- **Signals API completamente estable**: `linkedSignal`, `resource()` salen de preview.
- **Zoneless estable o en RC**.
- **`@let` estable** en templates.
- **Signal-based forms** (signal inputs + reactive forms unificados).
- **Performance improvements** en SSR e hydration.

### Aplicar cambios manuales en el proyecto
- Si el proyecto aún usa `zone.js`, aplicar la migración zoneless modificando el bootstrap:
```typescript
  bootstrapApplication(AppComponent, {
    providers: [provideExperimentalZonelessChangeDetection()]
  });
```
- Eliminar `zone.js` de `polyfills` en `angular.json` si se migra a zoneless.

---

## Verificación obligatoria tras cada paso

Antes de avanzar al siguiente paso, ejecutar y confirmar que todo pasa:

```bash
ng build --configuration production
ng test
ng lint
```

- Si `ng build` falla: corregir los errores antes de continuar
- Si `ng test` falla: corregir los tests antes de continuar
- Si hay deprecation warnings: documentarlos y decidir si corregir ahora o en el próximo paso
- Si todo pasa técnicamente: ejecutar la verificación de reglas de negocio antes del commit

### Verificación de integridad de lógica de negocio

Antes de hacer commit, leer `ANALISIS_FLUJOS.md` en la raíz del proyecto y recorrer
su sección **"Certificación de Integridad de Negocio"** validando cada ítem:

| Sección | Qué valida |
|---------|-----------|
| Flujos críticos | El wizard de apertura (individual y mancomunado) funciona de principio a fin |
| Reglas de negocio | Bloqueo por fraude, omisión del paso de dirección, titular único, seguro, errores |
| Casos límite | Recarga de página, doble envío, navegación directa por URL |
| Comportamiento de errores | Mensajes, modales y snackbars siguen apareciendo correctamente |
| Integraciones externas | Llamadas al backend (fraude, expediente, apertura, seguro) responden correctamente |

- Si todos los ítems pasan ✅: hacer commit y avanzar al siguiente paso
- Si algún ítem falla ❌: identificar qué cambio del paso actual lo causó, corregirlo,
  volver a ejecutar `ng build` + `ng test` y repetir esta verificación antes del commit

---

## Referencias rápidas

- Guía oficial interactiva: https://update.angular.io/
- CHANGELOG Angular: https://github.com/angular/angular/blob/main/CHANGELOG.md
- Schematics de migración automática: siempre correr `ng update` antes de cambios manuales
