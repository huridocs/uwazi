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
- **Suggested Jest invocation for targeted test runs:** `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest <path-or-pattern> -w=4`
- **Run:** `yarn hot`
- **lint:** `yarn eslint <paths>` or `yarn eslint-diff-branch`
- **formatting check:** `yarn prettier`
- **formatting fix:** `yarn prettier --write`
- **Translations CSV update:** never edit translation keys manually in CSV files; run `yarn update-translations-csv` instead.

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

### Building Blocks

Explains main backend core artifacts: purpose, practices, and testing approaches.

#### ExecutionContext

- **Purpose**: Holds shared dependencies, tenant, and actor (future: targetLanguage).
- **Access Rule**: Only usable within factories. No direct access from other layers.

#### Factories

- **Purpose**: Standardize creation of core objects with dependency wiring.
- **Signature**: Accept optional override object matching the exact dependencies of the object being built.
- **Defaults**: Use shared `ExecutionContext` dependencies (including actor/tenant) by default.
- **Testing**: Use `testingEnvironment.runWithContext(() => Factory.default())` instead of mocking.
- **Examples**: api/core/infrastructure/factories/DeleteTemplateUseCaseFactory.ts, api/core/infrastructure/factories/EntitiesServiceFactory.ts

#### UseCases

- **Purpose**: Entry points to the application, orchestrating full application flows.
- **Structure**: Extend AbstractUseCase<Input, Output, Deps> from core/libs/UseCase.ts:
  - **Input**: Defines input type (may include Zod validation schema, e.g., MultiUpdateEntity.InputSchema)
  - **Output**: Return type, usually domain models (e.g., Entity) or arrays of domain models
  - **Deps**: Lists dependencies matching contracts in application/contracts/ (e.g., TransactionManager, EntitiesService, data sources)
- **Provided by AbstractUseCase**:
  - Access to actor (this.actor/this.actorId), tenant (this.tenant), target language (this.targetLanguage) from ExecutionContext (wired via factory)
  - Shared dependencies: this.transactionManager, this.idGenerator, this.dispatcher, this.eventBus, this.logger
- **Transaction Control**: Wrap database operations in this.transactionManager.run() to control transactional boundaries.
- **Orchestration**: Coordinate domain model methods, service calls, and persistence operations to complete application actions.
- **Testing**:
  - Integration tests using testingEnvironment.runWithContext(() => Factory.default()) to create use case instances (enforces ExecutionContext access rules)
  - Assert against database state and returned domain models
  - Async job boundary: When a use case dispatches async jobs via this.dispatcher, only test that the job was dispatched; do not test the full job flow (jobs have their own dedicated tests)
  - Test permissions by passing different actors to runWithContext()
- **Examples**: app/api/core/application/CreateEntity.ts, app/api/core/application/MultiUpdateEntity.ts

### Testing Strategy

Three tiers of tests apply in V2:

1. **Domain tests (unit)** — validate correctness of domain model rules: validation, calculations, state changes, invariants. Fast, no database.

2. **Use case tests (integration)** — end-to-end correctness of application actions, side effects, and business flows.

3. **Contract/adapter tests** — verify communication with external services and API consumers. Tests for driving adapters (controllers, jobs) are only needed when they contain meaningful logic (e.g. error handling, retry decisions), not for simple pass-through behavior.

### Known Constraints

- **Migrations must be decoupled from deployments.** New versions must be backward-compatible with the previous schema. Migrations run as scheduled async jobs, not blocking deployments.

## Frontend

### Tech Stack

Frontend is in `app/react`

- React (with JSX)
- Redux (actions/reducers pattern)
- Tailwind CSS
- Webpack (development server via `webpack-server`)
- Storybook for component development

## Shared

Code shared between frontend and backend is in `app/shared/`:

- Import alias: `#shared/*` (configured in package.json imports)
- Used for common types, utilities, or constants needed by both layers

## Cursor Cloud specific instructions

Non-obvious caveats for running this repo in the Cursor Cloud VM. Standard commands (`yarn hot`, `yarn test`, lint) live in the sections above and in `package.json`.

### Node version
- Use Node **20.19.6** via nvm. The VM has a default `/exec-daemon/node` (v22) that wins on `PATH` in non-interactive shells, so prefix commands with `export PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH"` (already done in interactive shells via `~/.bashrc`). The update script also does this before `yarn install`.

### Backing services (Docker)
- No systemd: start the Docker daemon manually once per VM boot with `sudo dockerd` (run it in a background/tmux session), then wait a few seconds for it to be ready.
- Infra is defined in `docker-compose.yml` (`./run start`). Mongo (replica set, auto-initialized), Postgres, Redis, and MinIO start fine.
- **ElasticSearch caveat:** the `elasticsearch` service has `mem_limit: 4g`, which fails in this nested VM because the root cgroup is in threaded mode and the `memory` controller isn't delegated (`cannot enter cgroupv2 ... it is in threaded mode`). Bring up the other services with `sudo docker compose up -d mongo mongoreplicaset_start_script redis postgres minio`, then run the ES image **without** `mem_limit`:
  ```
  sudo docker run -d --name uwazi-elasticsearch --network workspace_default -p 9200:9200 \
    --ulimit memlock=-1:-1 -e bootstrap.memory_lock=true -e discovery.type=single-node \
    -e xpack.security.enabled=false -e cluster.routing.allocation.disk.threshold_enabled=false \
    -e "ES_JAVA_OPTS=-Xms2g -Xmx2g" -e indices.query.bool.max_clause_count=2048 \
    -v workspace_esdata01:/usr/share/elasticsearch/data workspace-elasticsearch:latest
  ```
  If `mongoreplicaset_start_script` didn't run (was left in `Created`), start it with `sudo docker start mongoreplicaset_start_script` to initialize the single-node replica set.

### Database initialization
- `blank-state` / `dump`/`restore` scripts and `yarn hot` run on the host and need `mongosh` + `mongodb-database-tools` (installed via the MongoDB 7.0 `jammy` apt repo) plus `pdftotext` (poppler-utils).
- **Migrations are coupled to the Postgres schema.** Plain `yarn migrate` (and therefore `yarn blank-state`) gets **blocked** (`{"blocked":{"delta":...,"requiresSchema":5}}`) until the Postgres schema migrations are applied. Use the new flow instead: `yarn migrate --new` (applies PG schema migrations 1-5 + pending Mongo data migrations), then `yarn reindex` to (re)build the ES index. So a full blank init is: `yarn blank-state` → `yarn migrate --new` → `yarn reindex`.
- Postgres is provisioned automatically by the compose init scripts (creates `migrator_user` / `app_user`); `config.ts` defaults (`migrator_user`) match, so no `.env` is required.

### Running the app
- No `.env` file is needed — `config.ts` defaults target Mongo/ES on localhost, Redis off (CLUSTER_MODE=false), and local-filesystem storage. Do **not** copy `.env.example` verbatim, as it enables `EXTERNAL_SERVICES`/AI-assistant which expect extra services.
- `yarn hot` serves the app on http://localhost:3000. Default login: `admin` / `change this password now`. First webpack build takes ~40s.

### Viewing the app through the Cursor Cloud proxy (single-port ingress)
- `yarn hot` serves HTML on port 3000 but references CSS/JS as absolute URLs to the **webpack dev server on port 8080** (a separate origin). This works via `localhost` inside the VM, but through the public per-port ingress (`p-3000-...agent.cvm.dev`) the browser cannot reach port 8080, so the page loads **unstyled**. The port-8080 ingress does not share the login session with the port-3000 ingress, so pointing `WEBPACK_PUBLIC_URL` at it does not fix this.
- To share a working preview link, serve everything from the single port-3000 origin with a production build: `yarn build-production` then `yarn run-production` (uses relative, same-origin asset paths; connects to the same `uwazi_development` DB/index). Trade-off: no hot reload — rebuild to see changes. Use `yarn hot` for active local development.
