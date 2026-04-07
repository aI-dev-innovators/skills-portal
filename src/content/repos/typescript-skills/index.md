---
id: typescript-skills
name: TypeScript Skills
description: ''
tags:
  - frontend
  - typescript
repoUrl: 'git@github.com:aI-dev-innovators/typescript-skills.git'
defaultBranch: main
---
# typescript-skills

Repositorio de catálogo de skills para proyectos TypeScript puros, con criterios evaluables y buenas prácticas. Incluye metadata en cada `SKILL.md` para que herramientas como `private-skills` puedan listar y buscar las skills.

## Agrupamientos

- TypeScript: todas las skills bajo `skills/typescript-*` (arquitectura, seguridad de tipos, manejo de errores, pruebas, documentación).

## Resumen de skills disponibles

- Arquitectura: [skills/typescript-architecture/SKILL.md](skills/typescript-architecture/SKILL.md)
- Seguridad de tipos: [skills/typescript-type-safety/SKILL.md](skills/typescript-type-safety/SKILL.md)
- Manejo de errores: [skills/typescript-error-handling/SKILL.md](skills/typescript-error-handling/SKILL.md)
- Pruebas: [skills/typescript-testing/SKILL.md](skills/typescript-testing/SKILL.md)
- Documentación: [skills/typescript-documentation/SKILL.md](skills/typescript-documentation/SKILL.md)

## Estructura y metadata

- Cada carpeta bajo `skills/` contiene un `SKILL.md` con el criterio de evaluación y prácticas recomendadas.
- Metadata mínima en el frontmatter de cada `SKILL.md` para que el CLI muestre título y descripción:
  - `name`: identificador único (slug)
  - `title`: título legible (ej. "TypeScript Architecture")
  - `description`: resumen corto para el listado
  - Opcionales: `version`, `tags`, `internal: true|false`, `maintainers` [{ name, email }]
- Ejemplo de frontmatter recomendado:

  ```yaml
  ---
  name: typescript-architecture
  title: TypeScript Architecture
  description: Define límites, capas y dependencias limpias en proyectos TypeScript.
  version: 1.0.0
  tags: [typescript, architecture]
  internal: false
  maintainers:
    - name: Equipo TypeScript
      email: ts@example.com
  ```

## Uso con `private-skills`

1. Instala el CLI (ejemplo local):

```bash
npm install -g <ruta-o-registro-del-cli>
```

1. Agrega este repo (SSH o HTTPS):

```bash
private-skills add git@github.com:aI-dev-innovators/typescript-skills.git --name typescript-skills
# o
# private-skills add https://github.com/aI-dev-innovators/typescript-skills.git --name typescript-skills
```

1. Lista las skills instaladas:

```bash
private-skills list
```

1. Busca por término:

```bash
private-skills search architecture
```

1. Elimina las skills de este repo en bloque:

```bash
private-skills remove-repo git@github.com:aI-dev-innovators/typescript-skills.git
# o la URL HTTPS si así lo agregaste
```

## Convenciones

- Usa `name` estables (no cambian entre versiones) y títulos claros para UX de listado.
- Mantén `description` breve (1 línea) enfocada al objetivo de la skill.
- Usa `tags` para búsquedas rápidas (ej. `typescript`, `architecture`, `testing`).
- Marca con `internal: true` las skills que no deban mostrarse por defecto; el CLI requiere `--internal` para verlas.
- Incluye `version` cuando cambien los criterios de evaluación de manera relevante.
