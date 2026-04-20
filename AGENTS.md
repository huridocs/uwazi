# Agents context

## Project Overview

Uwazi is a flexible database application to capture and organise collections of information with a particular focus on document management. HURIDOCS started Uwazi and is supporting dozens of human rights organisations globally to use the tool.

## Backend

### Tech Stack

Backend is in `app/api`

- NodeJS
- Express

### Commands

- **Install:** `yarn install`
- **Test:** `yarn test app/api`
- **Run:** `yarn hot`

### Architecture Status

The backend is currently a mix of V1 (legacy) and V2 (new core) code. The migration is in progress.

#### V1

- Legacy, CRUD-centric architecture with no clear separation of concerns.
- Business rules, persistence logic, and HTTP concerns are mixed in the same modules.
- Batch operations trigger single sequential updates, causing performance bottlenecks.
- Example: `app/api/entities`

#### V2

- Located in `app/api/core`
- Hexagonal/DDD architecture: business logic in a clean core, persistence and delivery as adapters.
- The core covers the basic data model: entities, templates, files, thesauri, relationships.
- Some V2 modules still depend on the legacy layer via `app/api/core/v1_layer/` — this is intentional and temporary during the transition.

### Design Principles

- **Hexagonal architecture** — domain logic is independent of persistence and delivery mechanisms.
- **CQRS** — use cases as commands; queries as services or simple controller implementations depending on complexity.
- **`core` must not depend on external modules** — only on itself.
- **Domain models encapsulate business rules** — validation, state changes, and invariants live in the domain layer, not in services or controllers.
- **Use cases as clear entry points** — each use case represents a complete application action. Reading a single use case file should tell the full story of that action. Use cases may trigger async jobs when operations are too expensive to handle synchronously.
- **Adapters bridge domain and infrastructure** — repositories (DataSources) hide persistence details; controllers, jobs, and CLI scripts act as delivery mechanisms without leaking infrastructure concerns.
- **Contracts define external boundaries** — schemas and TypeScript types define the interface between the application layer and the outside world.

### Current `app/api/core` Structure

```
app/api/core/
 ├─ domain/                   ← domain models (Entity, Template, Thesaurus, File, ...)
 ├─ application/
 │    ├─ contracts/           ← repository/service interfaces
 │    └─ ...                  ← use cases and application services
 ├─ infrastructure/
 │    ├─ mongodb/             ← repository implementations
 │    ├─ elasticSearch/       ← search adapter
 │    ├─ express/             ← HTTP controllers
 │    ├─ jobs/                ← async job implementations
 │    ├─ factories/           ← dependency wiring
 │    └─ ...
 ├─ libs/                     ← internal shared libraries (queue, logger, eventEmitter, shell, ...)
 ├─ testing/                  ← shared test helpers
 └─ v1_layer/                 ← temporary bridge to legacy code during migration
```

### Testing Strategy

Three tiers of tests apply in V2:

1. **Domain tests (unit)** — validate correctness of domain model rules: validation, calculations, state changes, invariants. Fast, no database.

2. **Use case tests (integration)** — end-to-end correctness of application actions, side effects, and business flows. Should be independent of the database where possible; assertions use domain models. The only exception is the action output (DTO).

Examples: 
 - app/api/core/application/specs/DeleteTemplate.spec.ts
 - app/api/core/application/specs/MultiUpdateEntity.spec.ts

3. **Contract/adapter tests** — verify communication with external services and API consumers. Tests for driving adapters (controllers, jobs) are only needed when they contain meaningful logic (e.g. error handling, retry decisions), not for simple pass-through behavior.

### Known Constraints

- **Migrations must be decoupled from deployments.** New versions must be backward-compatible with the previous schema. Migrations run as scheduled async jobs, not blocking deployments.
