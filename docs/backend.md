# Backend

# Commands
- **New migration:** `yarn add-migration schema|data <name> <description>`

The backend is a mix of V1 (legacy) and V2 (new core) code; the migration to V2 is in progress.

**New backend work goes in V2 (`app/api/core`).**

## V1 (legacy)

- Legacy, CRUD-centric architecture with no clear separation of concerns.
- Business rules, persistence logic, and HTTP concerns are mixed in the same modules.
- Batch operations trigger single sequential updates, causing performance bottlenecks.
- Example: `app/api/entities`

## V2 (target)

- Examples in `app/api/core`, `app/api/csv.v2` etc...
- Hexagonal/DDD architecture: business logic in a clean core, persistence and delivery as adapters.
- The core covers the basic data model: entities, templates, files, thesauri, relationships.
- **Multi-tenant:** each tenant has its own data and feature flags. Access the current tenant via `ExecutionContext.tenant` (legacy code uses `tenants.current()`).
- **Feature flags:** the Mongo→Postgres migration is gated by tenant feature flags (`postgresEntities`, `postgresTemplates`). `isPostgresEntitiesActive()` (`libs/featureFlags.ts`) tells you which DB is the source of truth.
- `app/api/core/v1_layer/` provides façades for legacy entrypoints (e.g. `thesauris.js`) that other modules still import; they delegate to V2. Temporary during the transition.
- Add a `v1_layer` façade only when a legacy module still needs an old entrypoint; prefer updating the caller to use V2 directly.

## Design Principles

- **Hexagonal architecture** — domain logic is independent of persistence and delivery mechanisms.
- **CQRS** — mutations are use cases (commands); reads go through query services (e.g. `EntitiesQueryService`) or query use cases (e.g. `GetRelationshipTypes`).
- **`core` must not depend on external modules** — only on itself.
- **Domain models encapsulate business rules** — validation, state changes, and invariants live in the domain layer, not in services or controllers.
- **Use cases as clear entry points** — each use case represents a complete application action. Reading a single use case file should tell the full story of that action. Use cases may trigger async jobs when operations are too expensive to handle synchronously.
- **Use cases cannot run use cases** — when logic needs to be shared across use cases, extract it into a service (e.g. `EntitiesService`, `FilesService`).
- **Adapters bridge domain and infrastructure** — repositories (DataSources) hide persistence details; controllers, jobs, and CLI scripts act as delivery mechanisms without leaking infrastructure concerns.
- **Contracts define external boundaries** — schemas and TypeScript types define the interface between the application layer and the outside world.

## Layer map (`app/api/core`)

- `domain/` — domain models; business rules, validation, invariants live here.
- `application/` — use cases (entry points) + `jobs/` (job use cases) + `contracts/` (interfaces, e.g. DataSources, `Dispatcher`).
- `infrastructure/` — adapters: `mongodb/`, `postgresql/`, `express/`, `jobs/` (job handlers), `factories/` (dependency wiring).
- `libs/` — internal shared libraries (queue, logger, eventEmitter, shell, UseCase, ExecutionContext).
- `v1_layer/` — façades for legacy entrypoints (e.g. `thesauris.js`) that other modules still import; delegate to V2. Temporary.
- `testing/` — test fixtures only; the `testingEnvironment` helper lives in `app/api/utils/`.

## Building Blocks

Tests are co-located in `specs/` directories next to the code they test.

### Domain models

- Business rules, validation, and invariants live here.
- **Testing:** unit tests, DB-free — no `testingEnvironment`.

### Permissions

- Two systems coexist: legacy `permissionsContext` (`app/api/permissions/`, global `appContext` user) and the V2 domain model (`domain/entityAccessPolicy/`). Target the V2 model for new work.
- `AccessContext` answers "who is accessing": `forActor(actor)` enforces permissions (normal path); `system()` bypasses them (system processes, migrations, CLI).
- Admin/editor roles are privileged and bypass checks (`User.isPrivileged()`).
- `PermissionSpec` adds an intent level (Read/Write); `EntityAccessPolicy` holds an entity's grants; `EntityPermissionChecker` (infrastructure) turns these into DB query filters.
- DB queries are safe by default and based on `AccessContext` - Postgres via RLS, Mongo via the query builder.

### Domain events & Listeners

- Events extend `Event` (`libs/eventEmitter/`); listeners extend `Listener<TEvent, Deps>` and self-register via `EventEmitterFactory.registry.register(...)`.
- Add new listeners to `infrastructure/listeners/Listeners.ts` (side-effect import) so they register at startup.
- Emitting an event dispatches its listeners as async jobs — **must be emitted inside a transaction** (`AsyncEventEmitter` throws otherwise).
- Two event systems coexist: `eventBus` (`EventsBus`) is the legacy V1 sync system (still in use); `eventEmitter` (`AsyncEventEmitter`) is the V2 async system, target it for new work.

### ExecutionContext

- Holds shared dependencies, tenant, and actor.
- **Only usable within factories** — no direct access from other layers.

### Factories

- Standardize creation of core objects with dependency wiring.
- Examples: `app/api/core/infrastructure/factories/DeleteTemplateUseCaseFactory.ts`, `app/api/core/infrastructure/factories/EntitiesServiceFactory.ts`

### Use Cases

- Entry points to the application; each orchestrates a full application action.
- Extend `AbstractUseCase<Input, Output, Deps>` from `core/libs/UseCase.ts` (provides actor/tenant and shared deps, wired via the factory).
- **Transaction control:** wrap DB operations in `this.transactionManager.run()`.
- **Testing:**
  - Use `testingEnvironment.runWithContext(() => Factory.default())`.
  - Async job boundary: only assert the job was _dispatched_, not the full flow.
  - Test permissions by passing different actors to `runWithContext()`.
- Examples: `app/api/core/application/CreateEntity.ts`, `app/api/core/application/MultiUpdateEntity.ts`

### Services

- Encapsulate logic shared across use cases — use cases cannot run other use cases, so reusable blocks live in services.
- Examples: `EntitiesService`, `FilesService`, `ThesauriService`. (Query services like `EntitiesQueryService` are reads, per CQRS.)
- **Testing:** same as use cases — `testingEnvironment.runWithContext(() => Factory.default())`.

### Jobs

- Async work flows through a contract/adapter: use cases call semantic methods on the `Dispatcher` contract (`application/contracts/Dispatcher.ts`); `DispatcherAdapter` (`infrastructure/jobs/`) maps each method to a concrete handler.
- **JobHandler** (`infrastructure/jobs/`): extends `UwaziJobHandler`, implements `handle(heartbeat, params, jobInfo)`. Mark system jobs with `@PrivilegedJob()`.
- **Job** (`application/jobs/`): a use case executed by a JobHandler — not user-triggered. Extends `AbstractUseCase` like any use case.
- **Testing:** integration tests; use cases only assert the job was dispatched.

### Adapters

- Driven adapters (DataSources/DAOs in `mongodb/`, `postgresql/`) and driving adapters (express routes, jobs).
- **Testing:** express routes/controllers only need tests when they contain meaningful logic (e.g. error handling, retry decisions) — not for simple pass-through behavior.

### Migrations

- Migrations must be backward-compatible and decoupled from deployments.
