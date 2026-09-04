# Backend

The Express API in `app/api`, plus queue workers (`app/worker.ts`, `app/queueWorker.ts`,
`app/setupQueueWorker.ts`), `scripts/` and `database/`.

**Multi-tenant.** Every request, job and script runs for one tenant. Data and feature flags are
per tenant; code that ignores this leaks data across tenants. Get the current tenant from
`ExecutionContext.tenant` (V1 code uses `tenants.current()`).

## Where code lives

Three generations coexist. **All new work goes in `app/api/core`.**

- **`app/api/core`** — the target. Hexagonal/DDD: domain, application (use cases), infrastructure
  (adapters), libs. Covers entities, templates, files, thesauri, relationships, users.
- **`app/api/*.v2`** — an earlier V2 generation (`entities.v2`, `authorization.v2`, `common.v2`, …)
  with its own `model`/`services`/`database` layout. Still in use; do not extend it with new
  features, and do not treat its layout as the pattern to copy.
- **Everything else in `app/api`** — V1 legacy (e.g. `app/api/entities`). CRUD-centric, with
  business rules, persistence and HTTP mixed together.

Not every module earns the full hexagon. **Full DDD applies to templates, entities +
`entityAccessPolicy`, and users + user groups** — these have real invariants and are the modules to
copy from. Others are deliberately thinner; `architecture.md` says which and why. Do not impose full
layering on a module that does not need it.

Two databases: MongoDB (legacy) and PostgreSQL (V2). The Mongo→Postgres migration is gated per
tenant by feature flags; **the flag names differ per module** (`postgresEntities`,
`postgresTemplates`, `postgresUsers` + `postgresUsergroups`, …) — check the module's own factory
before assuming. `isPostgresEntitiesActive()` (`core/libs/featureFlags.ts`) tells you which is the
source of truth. Both paths must keep working.

Elasticsearch backs search. A change to indexed data may require a reindex — say so in your summary.

## Rules

1. **Before editing any backend code, read `docs/backend/architecture.md`.**
2. **Before writing or changing a spec, read `docs/backend/testing.md`.**
3. **Before editing a V1 module** (anything in `app/api` outside `core/` and `*.v2/`), also read
   `docs/backend/v1-legacy.md`.
4. **Before adding a migration, read `docs/backend/migrations.md`.**

## Commands

**Test** — `yarn test <path-or-pattern>`. Needs Mongo and Postgres running. Target specific specs;
do not run broad sweeps of `app/api/core`. See `testing.md`.

**Run** — `yarn hot` (server + webpack + types), `yarn dev-worker`, `yarn dev-queue`.

**Database** — `yarn blank-state` (reset), `yarn fixtures` (restore fixture dataset),
`yarn provision-postgres`, `yarn describe-database`, `yarn admin-user`.

**Migrations** — `yarn add-migration schema|data <name> <description>` to scaffold, `yarn migrate` to
run, `yarn migrate-and-reindex` when indexed data changed, `yarn reindex` for Elasticsearch alone.
