---
id: angular-skills-analizador-de-flujos
name: angular-skills-analizador-de-flujos
title: analizador-de-flujos
description: >
  Actúa como un QA Engineer para certificar que la lógica de negocio de un
  sistema se mantiene íntegra y consistente frente a cualquier cambio
  tecnológico en el proyecto. Analiza el proyecto para identificar flujos de
  usuario, reglas de negocio, casos de uso y escenarios críticos que deben
  seguir funcionando igual independientemente de los cambios tecnológicos
  aplicados. Usar este skill SIEMPRE que el usuario mencione: qué flujos
  existen, qué flujos tiene el sistema, casos de uso del sistema, genera casos
  de prueba, comportamiento esperado, reglas de negocio, validar que sigue
  funcionando igual, o cualquier variante de aseguramiento de calidad durante un
  cambio.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Analizador de Flujos — QA de Lógica de Negocio

Actúa como un QA Engineer senior. El objetivo no es entender la tecnología, sino entender
**qué hace el sistema para el usuario** y certificar que ese comportamiento se mantiene
íntegro ante cualquier cambio tecnológico en el proyecto.

---

## Propósito

Ante cualquier cambio tecnológico en el proyecto (de librería, de arquitectura, de versión,
de framework), lo que más importa no es cómo está construido el sistema, sino
**qué promesas le hace a sus usuarios**.

Este skill extrae esas promesas en forma de flujos y reglas de negocio, para que sirvan como
contrato de verificación: si el sistema actualizado cumple todos estos flujos con los mismos
resultados, el cambio tecnológico fue exitoso.

---

## Paso 1 — Inferir el sistema desde lo que hay disponible

No hacer preguntas al usuario. Inferir todo a partir de la información entregada:
código, estructura de carpetas, nombres de rutas, pantallas, descripciones o cualquier
otro insumo proporcionado.

### Qué inferir y cómo

| Qué inferir | Dónde buscarlo |
|-------------|---------------|
| Propósito del sistema | Nombres de rutas, pantallas principales, nombre del proyecto |
| Actores | Rutas con prefijos como `/admin`, `/user`, `/guest`; roles mencionados en lógica condicional |
| Flujos principales | Nombres de vistas, formularios, botones de acción, llamadas a APIs |
| Reglas de negocio | Validaciones, condiciones antes de acciones, mensajes de error existentes, cálculos |
| Integraciones | Llamadas a servicios externos, pasarelas de pago, envío de correos |

Si la información es insuficiente para inferir un flujo con certeza, documentarlo como
⚠️ **Flujo inferido — requiere confirmación**, y describir el comportamiento más probable
basado en el contexto disponible.

---

## Paso 2 — Identificar los flujos de usuario

Listar todos los flujos del sistema desde la perspectiva del usuario. Cada flujo describe
una intención del usuario y lo que el sistema debe responder.

### Template de flujo

```
FLUJO: [Nombre en lenguaje de negocio, ej: "Iniciar sesión", "Agregar producto al carrito"]
ACTOR: [quién lo ejecuta]
CUÁNDO OCURRE: [condición o acción que lo dispara]

PASOS:
1. El usuario [acción observable]
2. El sistema [respuesta esperada]
3. El usuario [siguiente acción]
4. El sistema [resultado final]

RESULTADO ESPERADO: [qué debe ocurrir si todo sale bien]

CASOS QUE NO DEBEN FALLAR (reglas de negocio):
- [ej: No se puede comprar si el stock es 0]
- [ej: El descuento no puede superar el 100%]
- [ej: Solo el dueño de la cuenta puede ver sus pedidos]

FLUJOS ALTERNATIVOS CRÍTICOS:
- Si [condición]: el sistema debe [comportamiento]
- Si [error]: el sistema debe [comportamiento, no simplemente "mostrar error"]
```

### Categorías de flujos a buscar siempre

Identificar cuáles de estos existen en el sistema y documentarlos:

| Categoría | Ejemplos típicos |
|-----------|-----------------|
| Acceso y seguridad | Iniciar sesión, cerrar sesión, recuperar contraseña, acceso por roles |
| Datos del usuario | Registrarse, editar perfil, eliminar cuenta |
| Flujo principal del negocio | Hacer un pedido, completar un pago, enviar un formulario, generar un reporte |
| Consulta y búsqueda | Filtrar resultados, buscar por criterio, paginar resultados |
| Notificaciones y feedback | Confirmaciones, mensajes de error, alertas, estados de carga |
| Integraciones externas | Pagos, envío de correos, conexión con APIs de terceros |
| Flujos de administración | Gestión de usuarios, configuración del sistema, auditoría |

---

## Paso 3 — Documentar las reglas de negocio críticas

Las reglas de negocio son las restricciones y condiciones que el sistema debe respetar
siempre, independientemente de cómo esté implementado. Son el corazón de lo que no puede
cambiar sin importar qué tecnología se use.

### Template de regla de negocio

```
REGLA: [nombre corto]
DESCRIPCIÓN: [qué restringe o garantiza esta regla]
CUÁNDO APLICA: [en qué flujo o pantalla]
COMPORTAMIENTO ESPERADO:
  - SI [condición]: [resultado correcto]
  - SI NO [condición]: [qué debe pasar, bloqueo, mensaje, redirección]
RIESGO EN CAMBIO TECNOLÓGICO: [qué podría romperse si esta regla no se valida]
```

### Señales para detectar reglas de negocio en el código

Buscar estas señales (sin necesidad de entender la implementación):

- Validaciones en formularios → revelan restricciones de datos
- Condiciones antes de llamadas al backend → revelan permisos o estados requeridos
- Redirecciones condicionales → revelan flujos de acceso y roles
- Cálculos sobre precios, fechas, cantidades → revelan lógica de negocio numérica
- Mensajes de error específicos → revelan casos límite que el sistema ya conoce

---

## Paso 4 — Lista de verificación para el cambio tecnológico

Generar una lista de verificación que el QA puede usar para certificar que el cambio
tecnológico no afectó la lógica de negocio. Cada ítem debe poder responderse con ✅ o ❌.

### Template de lista de verificación

```
CERTIFICACIÓN DE INTEGRIDAD DE NEGOCIO — [Nombre del sistema]

FLUJOS CRÍTICOS (deben funcionar exactamente igual):
□ [Flujo 1]: El usuario puede [acción] y el sistema responde con [resultado esperado]
□ [Flujo 2]: ...

REGLAS DE NEGOCIO (deben seguir siendo respetadas):
□ [Regla 1]: Verificar que [condición] sigue siendo validada
□ [Regla 2]: ...

CASOS LÍMITE (situaciones que suelen romperse ante cambios tecnológicos):
□ ¿Qué pasa si el usuario tiene sesión expirada y navega a una ruta protegida?
□ ¿Qué pasa si el formulario se envía con datos inválidos?
□ ¿Qué pasa si la llamada al servidor tarda más de lo normal?
□ ¿Qué pasa si el usuario no tiene permisos para una acción?
□ [Caso específico del sistema analizado]

COMPORTAMIENTO DE ERRORES (el sistema debe seguir comunicando errores claramente):
□ Los mensajes de error siguen siendo comprensibles para el usuario
□ El sistema no queda en estado inconsistente tras un error
□ Las redirecciones ante errores llevan al lugar correcto
```

---

## Notas de Uso

- **El lenguaje siempre es de negocio**, no técnico. En vez de "el componente llama al servicio",
  escribir "el sistema consulta si hay stock disponible".
- Si el usuario sube código, inferir los flujos de negocio a partir de los nombres de rutas,
  pantallas y acciones — no de la implementación interna.
- Si algo es ambiguo, documentarlo como ⚠️ flujo inferido en lugar de preguntar.
- Marcar con ⚠️ los flujos donde el cambio tecnológico tiene mayor riesgo de introducir regresiones.
- El entregable principal es la **lista de verificación del Paso 4**: es lo que el QA
  usará para certificar que la integridad del negocio se mantiene tras el cambio tecnológico.
