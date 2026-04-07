---
id: angular-skills-angular-graphql-clean-architecture
name: angular-skills-angular-graphql-clean-architecture
title: angular-graphql-clean-architecture
description: >-
  Evaluates an Angular project version and structure, then implements GraphQL
  with Apollo Angular in a clean architecture layout. Use when integrating
  GraphQL into Angular, wiring a GraphQL API, adding typed queries/mutations, or
  preserving domain/application/infrastructure/presentation boundaries.
tags: []
repoId: angular-skills
repoName: Angular Skills
---

# Angular GraphQL Clean Architecture

Use this skill to add GraphQL to an Angular project **without breaking clean architecture boundaries**.

Activate this skill when the user wants any of the following:
- Add GraphQL to an Angular app
- Integrate Apollo Angular with a GraphQL API
- Preserve or introduce a clean architecture folder structure
- Generate typed GraphQL operations
- Adapt the implementation to the project's Angular version and app bootstrap style

## Outcome

By the end of this workflow, the project should have:
- Apollo Angular configured in a way compatible with the detected Angular setup
- A GraphQL endpoint integrated through environment/configuration
- Clean architecture separation between domain, application, infrastructure, and presentation
- At least one working example query flow from UI -> facade/use case -> repository/gateway -> GraphQL client
- Typed GraphQL operations when feasible
- A concise implementation summary with follow-up risks and next steps

## Available files

- `scripts/detect-angular-graphql-context.js` - detects Angular version, bootstrap style, package manager, and common architecture folders
- `references/IMPLEMENTATION_BLUEPRINT.md` - recommended folder mapping and implementation order
- `references/APOLLO_AND_CODEGEN_NOTES.md` - Apollo Angular and typed GraphQL guidance
- `references/EXAMPLE_INTEGRATION.md` - example structure using a public GraphQL API
- `references/REVIEW_CHECKLIST.md` - final verification checklist
- `evals/evals.json` - sample evaluation prompts

## Rules

1. Detect the project state first. Do not start by blindly installing packages.
2. Keep framework-specific details in the infrastructure layer.
3. Keep GraphQL documents close to infrastructure or dedicated graphql folders, not in domain entities.
4. Keep domain models framework-agnostic.
5. Put UI orchestration in presentation/facade/application layers according to the repo's conventions.
6. Prefer environment-based endpoint configuration.
7. Prefer typed operations using GraphQL Code Generator when the repo can support it.
8. Do not invent a new architecture if the repo already has one; extend the current clean architecture pattern.
9. If the project uses standalone bootstrap, configure providers in `app.config.ts` or equivalent.
10. If the project uses NgModules, configure Apollo in the root module or a dedicated GraphQL module.

## Workflow

### 1) Detect Angular and architecture context
Run:

```bash
node scripts/detect-angular-graphql-context.js
```

Use the output to determine:
- Angular major version
- standalone bootstrap vs NgModule bootstrap
- package manager
- existing architecture folders such as `core`, `domain`, `application`, `infrastructure`, `presentation`, `features`, `shared`
- whether GraphQL, Apollo Angular, or codegen are already present

If the script cannot determine everything, inspect `package.json`, `angular.json`, `src/main.ts`, `src/app/app.config.ts`, `src/app/app.module.ts`, and the current `src/app` structure manually.

### 2) Choose the integration shape
Use this decision logic:

- **Standalone Angular app** -> configure `provideHttpClient()` and `provideApollo()` in `app.config.ts` or equivalent.
- **NgModule Angular app** -> configure Apollo in `AppModule` or a dedicated `GraphqlModule` imported by the root module.
- **Single GraphQL backend** -> use one default Apollo client.
- **Multiple backends** -> use named Apollo clients and isolate repository adapters per backend.
- **Strict clean architecture repo** -> define interfaces in domain/application and concrete Apollo adapters in infrastructure.

### 3) Add the minimum dependencies
Prefer the package manager already used by the repo.

Core runtime packages typically include:
- `apollo-angular`
- `@apollo/client`
- `graphql`

Typed-codegen packages are recommended when the repo supports generated artifacts:
- `@graphql-codegen/cli`
- `@graphql-codegen/typescript`
- `@graphql-codegen/typescript-operations`
- `@graphql-codegen/typescript-apollo-angular`

Do not pin arbitrary versions unless the repository already pins them or the user explicitly requests version pinning.

### 4) Map GraphQL into clean architecture
Follow the repo's existing names, but prefer this mapping:

- **domain/**
  - entities/value objects
  - repository or gateway interfaces
- **application/**
  - use cases, facades, orchestration services
- **infrastructure/**
  - Apollo config
  - repository implementations
  - GraphQL documents
  - DTO mappers
- **presentation/**
  - Angular components, pages, route containers, signals/observables for UI state

Never place Apollo-specific classes in domain entities.

### 5) Configure Apollo client
For standalone apps, prefer a provider setup similar to:

```ts
provideHttpClient();
provideApollo(() => {
  const httpLink = inject(HttpLink);
  return {
    link: httpLink.create({ uri: environment.graphqlUrl }),
    cache: new InMemoryCache(),
  };
});
```

Adapt auth headers, interceptors, credentials, and named clients only if required by the API.

### 6) Implement one vertical slice first
Before scaling across the app, implement a single end-to-end slice:
- one domain model
- one repository interface
- one infrastructure GraphQL adapter
- one application facade or use case
- one presentation component/page

This keeps the first integration reviewable.

### 7) Prefer typed operations
If the API schema is accessible, create or update a `codegen.ts` and generate typed services or typed operations.

Keep generated files in a predictable place such as:
- `src/app/infrastructure/graphql/generated/`
- `src/graphql/generated/`

Do not hand-maintain large GraphQL response interfaces when codegen is available.

### 8) Add one real API integration
If the user did not specify an API, choose a small public GraphQL API only as a demonstrator and clearly label it as an example. Keep the endpoint configurable so the demo can be swapped later.

### 9) Validate
Run only the minimum relevant checks available in the repo, for example:

```bash
npm run lint
npm run test
npm run build
npm run generate
```

Use the existing package manager and scripts. If codegen is added, ensure the generation script is documented in `package.json`.

### 10) Report back
Summarize:
- detected Angular/project context
- packages added
- files created/updated
- architecture decisions
- any assumptions made
- blockers such as missing schema/auth details

## Implementation preferences

### Recommended file placement
When the repo structure is open-ended, prefer:

```text
src/app/
  domain/
    user/
      user.model.ts
      user.repository.ts
  application/
    user/
      get-users.facade.ts
  infrastructure/
    graphql/
      apollo.config.ts
      generated/
      user/
        user.queries.ts
        user.repository.impl.ts
        user.mapper.ts
  presentation/
    pages/
      users/
        users.page.ts
        users.page.html
```

### Repository boundary example
Domain/application side:

```ts
export abstract class UserRepository {
  abstract getUsers(): Observable<User[]>;
}
```

Infrastructure side:

```ts
@Injectable()
export class GraphqlUserRepository extends UserRepository {
  // inject Apollo or generated service here
}
```

### Endpoint configuration
Prefer `environment.ts` / `environment.development.ts` or the repo's existing app config source. Never hardcode production endpoints inside components.

## Clean architecture review questions

Check these before finishing:
- Are any Apollo-specific imports leaking into domain files?
- Are GraphQL DTOs being exposed directly to the UI instead of mapped models?
- Are queries/mutations colocated with infrastructure instead of scattered across components?
- Is endpoint/auth configuration centralized?
- Does the first vertical slice demonstrate the intended pattern clearly enough for future features?

## Edge cases

### Existing REST + GraphQL hybrid app
Do not replace REST indiscriminately. Add GraphQL only to the target feature slice and keep repository contracts stable.

### Multiple APIs
Use named Apollo clients and isolate adapters by bounded context or upstream API.

### Legacy NgModule app
Avoid forcing a standalone migration as part of GraphQL integration unless the user explicitly asks for it.

### Clean architecture is partial or inconsistent
Mirror the current conventions as closely as possible and tighten boundaries only where the new GraphQL slice is added.

### API requires auth
Prefer Angular HTTP interceptors or per-operation context. Keep tokens out of components and domain logic.

## Example prompts that should activate this skill

- `Usa angular-graphql-clean-architecture para agregar GraphQL a este proyecto Angular y respeta mi clean architecture.`
- `Activa angular-graphql-clean-architecture, detecta la version de Angular, configura Apollo y conecta una query real.`
- `Implementa GraphQL en este repo Angular con una estructura domain/application/infrastructure/presentation.`
- `Usa el skill angular-graphql-clean-architecture y deja un ejemplo funcional con codegen.`
