# Backend

The Express API in `app/api`, plus queue workers (`app/worker.ts`, `app/queueWorker.ts`,
`app/setupQueueWorker.ts`), `scripts/` and `database/`.

**Multi-tenant.** Nothing runs globally: every request, job and script executes inside an
execution context scoped to a single tenant, and data and feature flags are read through it. Code
that steps outside that context leaks data across tenants.

## Where code lives

`app/api` is the back end. Alongside it sit the workers, which run the same code outside the
request cycle: `app/worker.ts`, `app/queueWorker.ts` and `app/setupQueueWorker.ts`, with jobs
registered in `app/queueRegistry.ts`.

Generations coexist inside `app/api`. `core/` is the target architecture and the place new work
belongs unless there is a reason otherwise; `*.v2/` is an earlier V2 generation, still in use but
not a pattern to copy or extend; everything else is V1 legacy, with business rules, persistence and
HTTP mixed together.

**Prefer full DDD.** A module gets the whole hexagon — domain, application, infrastructure — even
when its domain model is thin, a bag of properties with little behaviour. Thinness is not a reason
to collapse layers; the model is expected to grow into them. `architecture.md` defines what each
layer holds.

Two databases: MongoDB (legacy) and PostgreSQL (V2), and a Mongo→Postgres migration is in progress.
Which one backs a given module is decided per tenant by feature flags — read the module's own
factory to find out rather than assuming, and keep both paths working.

Elasticsearch backs search. A change to indexed data may require a reindex — say so in your summary.

## Rules

1. **Before editing any backend code, read `docs/backend/architecture.md`.**
2. **Before writing or changing a spec, read `docs/backend/testing.md`.**
3. **Before editing a V1 module** (anything in `app/api` outside `core/` and `*.v2/`), also read
   `docs/backend/v1-legacy.md`.
4. **Before adding a migration, read `docs/backend/migrations.md`.**

## Commands

**Run** — `yarn hot` (server + webpack + types), `yarn dev-worker`, `yarn dev-queue`.

**Migrations** — `yarn add-migration schema|data <name> <description>` to scaffold, `yarn migrate` to
run, `yarn migrate-and-reindex` when indexed data changed, `yarn reindex` for Elasticsearch alone.
