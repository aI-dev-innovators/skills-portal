---
id: angular-skills-analisis-tecnico-pre-migracion-angular
name: angular-skills-analisis-tecnico-pre-migracion-angular
title: analisis-tecnico-pre-migracion-angular
description: >
  Úsalo cuando el usuario solicite un análisis técnico pre-migración de Angular
  o diga "análisis técnico pre-migración angular", "análisis pre-migración
  Angular", "auditoría pre-migración Angular" o "diagnóstico de proyecto
  Angular". Escanea el repositorio, detecta la versión actual, analiza
  dependencias externas e internas, estructura de carpetas, malas prácticas,
  cobertura de tests y genera un reporte accionable hacia Angular 20 con mejoras
  integrales del proyecto.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Análisis Técnico Pre-Migración Angular

## Objetivo

Generar un reporte de análisis técnico completo que sirva como guía para migrar **cualquier** proyecto Angular
desde la versión detectada hasta **Angular 20**, identificando riesgos, dependencias problemáticas, malas prácticas y áreas de mejora.

Este skill es **genérico y reutilizable** para cualquier repositorio Angular.

---

## Instrucciones para el Agente

Cuando el usuario solicite ejecutar este análisis técnico, escanea el workspace actual o el repositorio indicado.
Sigue estos pasos **en orden y de forma exhaustiva**. El reporte final debe generarse como un archivo
Markdown en la raíz del proyecto con el nombre `ANALISIS_TECNICO_PRE_MIGRACION.md`.

---

### PASO 1: Escaneo del Repositorio — Ficha Técnica

Lee `package.json` y `angular.json` del repositorio. Genera una ficha técnica:

```markdown
## 1. Ficha Técnica del Proyecto

| Campo                  | Valor                                              |
|------------------------|----------------------------------------------------|
| Nombre del Repositorio | (leer de package.json → name)                      |
| Fecha de Análisis      | (fecha actual del sistema)                         |
| Angular Detectado      | (leer @angular/core en dependencies)               |
| Angular Destino        | 20.x                                               |
```
**Regla**: Incluir ÚNICAMENTE estos 4 campos. NO agregar filas adicionales (versión de Node, descripción, scripts, etc.).
#### 1.1 Beneficios de Migrar a Angular 20

Genera una tabla con los beneficios clave de migrar desde la versión detectada hasta Angular 20.
Los mensajes deben ser **claros, directos y entendibles para cualquier persona**, incluso sin conocimientos técnicos.
Evitar jerga técnica excesiva. Usar un lenguaje orientado al impacto real y al valor de negocio.

**Estilo de los mensajes** (ejemplos de referencia):
- "Reduce el tamaño de la aplicación hasta en un 40-60%, lo que hace que cargue mucho más rápido para los usuarios"
- "La versión actual tiene vulnerabilidades conocidas. Angular 20 cierra brechas de seguridad críticas"
- "Los desarrolladores pueden trabajar más rápido porque las compilaciones tardan mucho menos"
> ⚠️ La siguiente tabla es un **ejemplo orientativo**. Evalúa el salto de versiones real y prioriza los beneficios más impactantes para ese caso concreto. Si existen beneficios más relevantes que los mostrados aquí, reemplázalos.
```markdown
### 1.1 ¿Por qué migrar de Angular [Detectado] a Angular 20?

| Beneficio | Descripción |
|-----------|-------------|
| 🚀 Aplicación más rápida | (describir mejora de rendimiento en términos simples: carga más rápida, menos peso, mejor experiencia para el usuario final) |
| 🔒 Mayor seguridad | (describir que la versión actual ya no recibe parches de seguridad y Angular 20 protege contra vulnerabilidades conocidas) |
| ⚡ Desarrollo más ágil | (describir que las herramientas modernas permiten compilar y probar más rápido, reduciendo tiempos de entrega) |
| �️ Mantenimiento más sencillo | (describir que el código moderno es más fácil de entender, modificar y corregir para el equipo) |
| 🏢 Soporte oficial activo | (describir que la versión actual ya no tiene soporte del equipo de Angular, mientras que la v20 recibe actualizaciones y correcciones constantes) |
```

**Reglas para esta tabla**:
- Incluir **máximo 5 beneficios**, seleccionando los más relevantes según el salto de versiones detectado
- Adaptar cada beneficio al salto real de versiones (no es lo mismo migrar de v14 a v20 que de v7 a v20)
- Usar lenguaje que un gerente de proyecto o un stakeholder no técnico pueda entender
- No usar siglas sin explicar (ej: no decir "SSR" sin decir "renderizado en servidor")
- Ser específico con datos aproximados cuando sea posible (ej: "hasta un 40-60% más liviana")

---

### PASO 2: Tabla de Dependencias Externas (dependencies + devDependencies)

Analiza TODAS las dependencias del `package.json`. Genera tablas separadas para `dependencies` y `devDependencies`:

```markdown
## 2. Dependencias Externas

### 2.1 dependencies

| Dependencia | Versión Actual | Estado | Versión Angular 20 | Alternativa / Nota |
|-------------|---------------|--------|--------------------|--------------------|
| (cada dependencia) | (versión actual) | (estado) | (versión compatible) | (alternativa si aplica) |

### 2.2 devDependencies

| Dependencia | Versión Actual | Estado | Versión Angular 20 | Alternativa / Nota |
|-------------|---------------|--------|--------------------|--------------------|
| (cada dependencia) | (versión actual) | (estado) | (versión compatible) | (alternativa si aplica) |
```

**Estados posibles**:
- 🔴 **Obsoleta**: La versión actual es incompatible con Angular 20, requiere actualización major
- 🔴 **Deprecada**: La librería ya no se mantiene, requiere reemplazo por otra
- 🔴 **Eliminar**: Ya no es necesaria en Angular moderno
- 🟡 **Legacy**: Funciona pero existe una mejor alternativa moderna
- 🟢 **Compatible**: Actualización menor requerida o ya es compatible

**Criterios de alternativas conocidas** muy utilizados en la comunidad frontend para Angular 20:


**Reglas**:
- NO incluir dependencias propias de Angular (`@angular/*`, `@angular-devkit/*`, `@angular-eslint/*`). Estas se gestionan por separado en el proceso de migración
- NO incluir conteos totales
- Sí incluir la versión específica recomendada para Angular 20
- Si la librería está deprecada, proporcionar la alternativa moderna específica
- Si no se conoce alternativa, indicar "Verificar compatibilidad en npm"
- Cuando una dependencia deba reemplazarse por otra diferente y tenga dependencias relacionadas/companion que también desaparecen junto a ella (plugins, adaptadores, integraciones), incluir ÚNICAMENTE la dependencia principal a reemplazar. NO listar sus dependencias relacionadas de forma individual

---

### PASO 3: Tabla de Dependencias Internas (Librerías privadas / Widgets)

Identifica dependencias con scope privado/organizacional. Son aquellas que:
- Tienen un scope que no es de un publisher público conocido (`@angular`, `@types`, `@apollo`, etc.)
- Son paquetes sin scope que no existen en el registro público de npm (nombres específicos del proyecto)

```markdown
## 3. Dependencias Internas (Librerías Corporativas / Widgets)

| Dependencia | Versión Actual |
|-------------|---------------|
| (cada dependencia interna) | (versión) |
```

**Reglas**:
- Incluir ÚNICAMENTE las columnas `Dependencia` y `Versión Actual`
- NO incluir conteos totales

---

### PASO 4: Detección de Malas Prácticas y Posibles Issues

Escanea **todo** el código fuente (`.ts`, `.html`, `.json` de configuración) buscando los patrones problemáticos.
Genera una sub-sección con tabla para **cada categoría donde se encuentren hallazgos**. Si una categoría no tiene hallazgos, no la incluyas.

#### 4.1 Uso de `any` (Pérdida de Type Safety)

Buscar `: any`, `as any`, `<any>` en archivos `.ts` (excluir `node_modules` y `.spec.ts`).

| Archivo | Línea | Contexto | Corrección Sugerida |
|---------|-------|----------|---------------------|
| (ruta relativa) | (número) | (fragmento de código) | (tipo sugerido o interfaz a crear) |

#### 4.2 Uso de `console.log/warn/error` en código productivo

Buscar `console.log`, `console.warn`, `console.error` en `.ts` (excluir `.spec.ts` y archivos de test).

| Archivo | Línea | Contexto | Corrección Sugerida |
|---------|-------|----------|---------------------|
| (ruta relativa) | (número) | (fragmento) | Usar servicio de logging del proyecto o eliminarlo |

#### 4.3 Patrones Deprecados de Angular

Buscar en todo el proyecto:

| Patrón a buscar | Deprecado desde | Qué buscar | Corrección |
|----------------|-----------------|------------|------------|
| `entryComponents` | Angular 13 (removed) | En decoradores `@NgModule` | Eliminar, no necesario con Ivy |
| `extractCss` | Angular 11 | En `angular.json` | Eliminar, es comportamiento por defecto |
| `--prod` flag | Angular 12 | En scripts de `package.json` | Usar `--configuration production` |
| `target: "es5"` | — | En `tsconfig.json` | Actualizar a `es2022` o superior |
| `tslint.json` | Angular 12 | Archivo en raíz | Migrar a ESLint con angular-eslint |
| `ViewEncapsulation.Native` | Angular 10 | En componentes | Usar `ViewEncapsulation.ShadowDom` |
| `@angular/http` | Angular 4 | En imports | Usar `@angular/common/http` |
| `Renderer` (v1) | Angular 4 | En inyecciones | Usar `Renderer2` |
| `emitDecoratorMetadata` | Angular 13+ | En tsconfig | Eliminar si se usa Ivy |
| `experimentalDecorators` | Angular futuro | En tsconfig | Evaluar decoradores TC39 nativos |

Reportar cada hallazgo con archivo y línea:

| Archivo | Patrón Deprecado | Desde Versión | Corrección |
|---------|-----------------|---------------|------------|
| (ruta relativa) | (patrón encontrado) | (versión) | (acción concreta) |

#### 4.4 Complejidad y Diseño

Buscar:
- Componentes con más de 40 propiedades/métodos (archivo `.ts` excesivamente largo)
- Strings hardcodeados en event bus, rutas de API, nombres de canales
- Archivos duplicados o mal nombrados (ej: `*.copy.ts`, `* copy.ts`, `*.bak`)
- Carpetas vacías sin contenido funcional
- Servicios con lógica que debería estar en un componente o viceversa

| Componente/Archivo | Issue | Detalle | Sugerencia |
|--------------------|-------|---------|------------|
| (ruta relativa) | (tipo de issue) | (descripción) | (acción sugerida) |

#### 4.5 Suscripciones RxJS sin gestión de ciclo de vida

Buscar `.subscribe(` en componentes (no en servicios singleton) y verificar si existe `takeUntil`, `take`, `first`,
`DestroyRef`, `takeUntilDestroyed` o `async` pipe para la gestión del ciclo de vida.

| Archivo | Línea | Patrón | Riesgo | Corrección |
|---------|-------|--------|--------|------------|
| (ruta) | (línea) | `.subscribe()` sin teardown | Memory leak | Agregar `takeUntil` o usar `async` pipe |

**Reglas generales del Paso 4**:
- Escanear EXHAUSTIVAMENTE todo el código, no solo muestras
- Cada hallazgo debe tener archivo y línea exactos
- Solo incluir sub-secciones donde haya hallazgos reales
- NO generar conteos totales ni resúmenes estadísticos

---

### PASO 5: Análisis de Tests Unitarios

#### 5.1 Configuración Actual de Testing

Leer `karma.conf.js` (o `jest.config.*`, `vitest.config.*`) y reportar:

| Aspecto | Valor Actual | Recomendación Angular 20 |
|---------|-------------|-------------------------|
| Framework de Unit Tests | (detectar: Jasmine+Karma, Jest, Vitest, etc.) | Jest o Web Test Runner (Vitest) |
| Framework E2E | (detectar: Protractor, Cypress, Playwright, ninguno) | Playwright o Cypress |
| Coverage Global | (leer thresholds de karma/jest config) | Mínimo 80% |
| Coverage por Archivo | (leer thresholds) | Mínimo 60% |
| Reporter CI/CD | (detectar: sonarqube, cobertura, etc.) | Mantener integración con nuevo runner |

#### 5.2 Componentes/Servicios SIN Test (Requieren cobertura)

Comparar todos los `.component.ts`, `.service.ts`, `.pipe.ts`, `.directive.ts`, `.presenter.ts`, `.guard.ts`
del proyecto con los `.spec.ts` existentes. Listar los que NO tienen test:

| Componente/Servicio | Ubicación | Prioridad | Justificación |
|---------------------|-----------|-----------|---------------|
| (nombre) | (ruta relativa) | 🔴 Alta / 🟡 Media / 🟢 Baja | (por qué necesita test) |

**Criterios de prioridad**:
- 🔴 **Alta**: Presenters, servicios con lógica de negocio, guards, interceptors, error handlers, servicios de autenticación
- 🟡 **Media**: Componentes con lógica en el `.ts`, servicios de datos, validadores, modales con lógica
- 🟢 **Baja**: Componentes puramente de vista (template-only), modelos/clases de datos, pipes simples

**Reglas**:
- NO incluir conteos totales ni porcentajes generales
- Sí indicar para cada faltante qué tipo de test se sugiere (unit, integration, component)

---

## Formato del Reporte Final

El reporte generado debe guardarse como `ANALISIS_TECNICO_PRE_MIGRACION.md` en la raíz del proyecto con esta estructura:

```markdown
# Análisis Técnico Pre-Migración Angular

## 1. Ficha Técnica del Proyecto
(tabla del Paso 1)

### 1.1 ¿Por qué migrar de Angular [Detectado] a Angular 20?
(tabla de beneficios del Paso 1)

## 2. Dependencias Externas
### 2.1 dependencies
(tabla del Paso 2)
### 2.2 devDependencies
(tabla del Paso 2)

## 3. Dependencias Internas
(tabla del Paso 3)

## 4. Malas Prácticas y Issues Detectados
(sub-secciones del Paso 4 — solo las que tengan hallazgos)

## 5. Análisis de Tests Unitarios
### 5.1 Configuración Actual
### 5.2 Componentes/Servicios sin Test
(tablas del Paso 5)
```

---

## Reglas Generales

1. **NO generar conteos totales** (total de dependencias, total de issues, etc.) — no aportan valor a la migración
2. **NO generar estados generales** ("el proyecto está en estado X") — solo evidencia específica
3. **NO generar plan de migración** — este skill es solo de análisis técnico y diagnóstico
4. **SÍ generar evidencia concreta** con archivo, línea y contexto para cada hallazgo
5. **SÍ generar alternativas específicas** para cada librería deprecada u obsoleta
6. **SÍ generar versiones específicas** compatibles con Angular 20
7. **Cada hallazgo debe ser accionable**: debe quedar claro QUÉ hacer, DÓNDE hacerlo y POR QUÉ
8. **Escanear exhaustivamente**: no limitarse a muestras, revisar TODO el código fuente
9. **Priorizar por impacto en migración**: 🔴 Bloquea migración > 🟡 Requiere ajustes > 🟢 Mejora sugerida
10. **El skill es genérico**: no debe contener datos hardcodeados de ningún proyecto específico
