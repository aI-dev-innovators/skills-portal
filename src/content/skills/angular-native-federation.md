---
name: angular-native-federation
title: angular-native-federation
description: >-
  Configurar y estructurar un proyecto Angular para usar microfrontends con
  Native Federation, gestionando dependencias, configuraciones para roles
  Shell/Remoto y comunicación entre ellos.
tags: []
repoId: frontend-skills
repoName: Frontend Skills
---

# Angular Native Federation (Skill)

## Summary
- Automatiza la integración de `@angular-architects/native-federation`.
- Genera configuraciones específicas para contenedores (Shell) o microfrontends (Remoto).
- Configura automáticamente el enrutamiento (usando loadComponent con promesas) y el manifiesto dinámico en aplicaciones Shell.

## Execution Instructions (Agentic Flow)
El asistente DEBE actuar como un AGENTE y seguir estos 3 pasos de forma directa y fluida:

1. **Recopilación y Ejecución Autónoma:** Pregunta si el proyecto es **Shell** o **Remoto**, el **puerto** a usar, y solicita el `package.json`.
   - Si no existe `@angular-architects/native-federation`, **TÚ DEBES EJECUTAR EL COMANDO DIRECTAMENTE** en la terminal: `npx ng add @angular-architects/native-federation --project [nombre] --port [puerto] --type [dynamic-host|remote]`. ESTÁ PROHIBIDO pedirle al usuario que lo ejecute manualmente. Espera a que termine.

2. **Configuración Base (Generación por partes):**
   - Modifica `main.ts` (y `main.server.ts` si aplica) y pide al usuario que escriba "continuar".

3. **Enrutamiento y Manifiesto (Solo si es Host/Shell):**
   - Pregunta al usuario: *"Para configurar la conexión, ¿cuál es el **nombre del Remoto**, el **nombre del módulo/componente expuesto** (ej. './Component'), en qué **puerto** se ejecuta, y **qué ruta (path)** deseas usar para mostrarlo?"*
   - Con esa información, modifica el archivo `federation.manifest.json`: PRIMERO elimina cualquier URL por defecto generada por el CLI (ejemplo: `"mfe1": "http://localhost:3000/remoteEntry.json"`), y LUEGO agrega la clave y la URL del remoto indicado (ej. `"nombre-remoto": "http://localhost:[puerto]/remoteEntry.json"`).
   - Modifica `app.routes.ts` importando `loadRemoteModule` y creando la ruta perezosa usando EXACTAMENTE esta estructura:
     ```typescript
     import { loadRemoteModule } from '@angular-architects/native-federation';
     import { Routes } from '@angular/router';

     export const routes: Routes = [
         {
             path: 'ruta-deseada',
             loadComponent: () =>
                 loadRemoteModule('nombre-del-remoto', './NombreExpuesto').then((m) => m.App),
         },
     ];
     ```

## Goal
Establish a robust Microfrontend architecture using standard Web technologies through Native Federation, ensuring seamless integration between Shells and Remotes with minimal manual intervention.

## Core Configuration Strategies

### 1. Configuración del Shell (Dynamic Host)
- **Manifest:** Usar `federation.manifest.json` para evitar hardcodear URLs.
- **Bootstrapping:** Inicializar la app en `main.ts` usando `initFederation()`.
- **Routing:** Configurar `loadRemoteModule()` en `app.routes.ts` usando el nombre definido en el manifiesto, resolviendo la promesa para extraer la clase del componente (ej. `.then((m) => m.App)`).

### 2. Configuración del Remoto (Microfrontend)
- **Exposición:** Mapear componentes standalone en la propiedad `exposes` del `federation.config.js`.

### 3. Shared Dependencies & Communication
- Compartir librerías core (`@angular/core`, `@angular/router`, etc.) con `singleton: true` y `strictVersion: true`.
- Fomentar el uso de **Signals** o `BehaviorSubject` dentro de una librería compartida (`shared` workspace library) para la comunicación entre microfrontends.

## Deliverables
1. Comando de instalación `ng add` listo para ejecutar.
2. `federation.config.js` y `main.ts` adaptados.
3. (Si es Shell) `federation.manifest.json` y `app.routes.ts` configurados con la sintaxis estricta de `loadComponent` y promesas.

## Notes
- Native Federation utiliza el builder basado en esbuild (`@angular-devkit/build-angular:application`). Si el proyecto usa un builder antiguo, se debe advertir al usuario sobre la necesidad de migrar.
