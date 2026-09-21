# CSV v2 → Postgres Migration

## Objective

Move CSV v2 **staging collections** from MongoDB to the shared Postgres database, behind a per-tenant feature flag, with **RLS in the same schema migration** that creates the tables. Public HTTP (`/api/csvImportEntities*`) and socket events stay unchanged.

This document is the working context for the Postgres phase. Prior CSV v2 product/architecture work lives in [`csv-v2-context-09.md`](./csv-v2-context-09.md) and the numbered context files in this folder. Pattern sources: [`../Relationship Types/relationship-types-postgres.md`](../Relationship%20Types/relationship-types-postgres.md), [`../Settings/settings-v2-and-postgres.md`](../Settings/settings-v2-and-postgres.md), Pages (`postgresPages`).

Locked decisions below are from the 2026-09-16 alignment. Implementation notes record what actually shipped.

## Status

- **Analysis / planning** — aligned (2026-09-16)
- **Implementation** — done in code (2026-09-16). Schema `020`, PG adapters, copy CLI, flag/TM wiring (job `run()` = `EC.transactionManager`, P12 hybrid; dispatcher inlined per factory like CreateUser), domain `id` on children, 4-way job/use-case/route specs. No `csvJobWiring`.
- **Not done** — staging/prod dry-run (section G): copy → flip `postgresCsv` (with `postgresCore` on) → restart → run a real import.
- **Prerequisite** — CSV v2 hex already existed in `app/api/csv.v2` (Mongo). This was **not** a V1→V2 rewrite.

---

## Why CSV is a reasonable next candidate — and why it is not “relationship types simple”

CSV v2 already has domain models, application contracts, use cases/jobs, and Mongo DataSources. The **collections are process-local staging**, not replicated by the instance-to-instance Sync feature. That is simpler than Settings/Entities.

CSV is **harder than relationship types** because jobs write CSV staging **and** core aggregates in the same unit of work:

```ts
await params.deps.transactionManager.run(async () => {
  await params.deps.entitiesService.insert([entity], params.insertContext);
  await params.deps.filesService.insert(entityFiles);
  await params.deps.csvImportsDS.update(params.updatedImport);
});
```

(`CsvImportEntitiesRowPersistence.ts` — same `this.transactionManager.run()` in relationship-entity-create. Job TM is `ExecutionContext.transactionManager` (`postgresCore`), same as translations P12 / templates / thesauri. CSV DataSources pick their own store TM from `postgresCsv`. When the two TMs are the same instance, writes join one `run()`. When they differ, PG `withConnection` auto-commits. `UpdateEntriesByContextUseCaseFactory.default()` starts its own core `run()` after the thesauri-apply `run()` returns.)

| Aspect | CSV v2 | Closest existing PG module |
|--------|--------|----------------------------|
| Cardinality | Many imports per tenant; child rows in the thousands | Pages (parent + children) |
| Nested data | JSON blobs on the import (`file`, `storage`, `stats`, `progress`, `extraction`, `failure`); arrays on child docs | Pages locales / IX JSONB columns |
| Translations | None owned by CSV | n/a |
| Sync (instance replication) | **None** — CSV does not participate | Pages omit sync; Settings/RT keep Mongo `updatelogs` |
| Factory | Flag + `ExecutionContext` (`csvDataSource` / job TM = `EC.transactionManager` / dispatcher inlined) | Pages: flag + `ExecutionContext.postgresTransactionManager` |
| Cross-module writes | **Yes** — entities, files, thesauri, translations, settings | Pages: weak (language listeners). Settings: jobs still on Mongo queue |
| ES | None on CSV collections; entity/file writes may reindex via core DS | Same as “CSV does not own ES” |

**Primary references (compare, don’t single-source):**

- Independent flag + module stays in `*.v2`: **Pages** (flag/TM only — **not** Pages’ adapter placement in `core/`)
- Identity `_id` + domain `id` + mapper: **Relationship types / Templates / Files** (not Settings’ `tenant_id` PK)
- Factory + dual TM when ES hooks exist on **core** collaborators: Templates / Files
- Simple PG DS (no ES, no sync): Thesauri / Pages
- Hybrid TM (one use-case `run()`, Mongo while hybrid, PG auto-commit): **translations P12** / Settings
- Queue still Mongo: **Settings P12**
- Partial / incomplete cutover (avoid copying gaps): Entities

---

## Collections in scope

Six collections. Indexes from tenant migration `192-csv_v2_indexes`. Every domain model now has `id`; persistence stores it as `_id`.

| Mongo collection | PG table | Domain / DS | Identity |
|------------------|----------|-------------|----------|
| `csv_imports` | `csv_imports` | `CsvImport` | `_id` minted in `CsvImportEntities` via `idGenerator`. `update` uses SQL `CASE` so **Cancelled wins** (Mongo used aggregation `$cond`). `cancel` is `UPDATE … WHERE status NOT IN (terminal)`. |
| `csv_import_rows` | `csv_import_rows` | `CsvImportRow` | Domain `id`, minted at extract (`CsvImportRowsStager`). Unique `(importId, rowIndex)`. |
| `csv_import_row_errors` | `csv_import_row_errors` | `CsvImportRowError` | Domain `id`, minted in `CsvRowImportErrorFactory`. Index `(importId, rowIndex)` is **not** unique. |
| `csv_import_thesauri_values` | `csv_import_thesauri_values` | `CsvImportThesauriValues` | Domain `id`, minted in preflight. Unique `(importId, thesaurusId)`. `replacePendingValues` = delete + insertMany (joins an open job `run()` when that TM is the PG TM; otherwise each `withConnection` auto-commits). |
| `csv_import_relationships_pending_values` | `csv_import_relationships_pending_values` | `CsvImportRelationshipPendingValues` | Domain `id`, minted in preflight. Unique `(importId, templateId)`. |
| `csv_import_relationships_values` | `csv_import_relationships_values` | `CsvImportRelationshipValues` | Domain `id`, minted in the relationship job. Unique `(importId, templateId)`. |

**Out of scope as CSV tables:** entities, files, templates, thesauri, translations, settings, queue jobs, uploaded zip/csv bytes (file storage). Those stay on their own flags.

---

## How existing modules do it (short map)

Same conventions as relationship types / templates / pages **parent** rows:

- `"_id" TEXT NOT NULL` is **row identity** (Mongo ObjectId hex). Domain property is `id`. Mapper is the only `id` ↔ `_id` bridge.
- `tenant_id TEXT NOT NULL` is **tenancy** for RLS, **not** identity. Composite PK `("_id", "tenant_id")`. Do **not** copy Settings’ `tenant_id` PRIMARY KEY.
- Unique indexes from Mongo stay **unique indexes**, not a replacement PK.
- RLS: `ENABLE` + `POLICY tenant_isolation` using `current_tenant()` **in the same schema file** (`020-create-csv-tables.sql`)
- App runtime = `app_user` (RLS); migrator = `migrator_user`
- `PostgresTransactionManager.withConnection` sets `app.current_tenant`
- `PostgresTable` injects `tenant_id` on write, strips it on read
- `PostgresTable.insert` accepts an array (bulk)
- One-time copy: `MigrateCollectionToPostgres` + CLI; skip-if-tenant-has-rows; `--force` non-destructive
- Flag flip is **one-way** after any PG write of that module

Schema: **020** (`app/api/core/infrastructure/postgresql/schema_migrations/020-create-csv-tables.sql`).

---

## What the port had to change (shipped)

Hex was already there; Mongo adapters mapped onto `PostgresDataSource`. The work that was **not** “write six mappers”:

1. **Factories now read ExecutionContext.** Job / use-case `transactionManager` is `EC.transactionManager` (`postgresCore`). CSV DataSources branch on `postgresCsv` and take `EC.postgresTransactionManager` or `EC.mongoTransactionManager` — the job TM is **not** drilled into them. Core DS factories are `Factory.default()` with no TM override. There is **no** `csvJobWiring` helper. Each factory that dispatches a job calls `UwaziDispatcherFactory(EC.tenant.name, EC.mongoTransactionManager)` inline (same as `CreateUserUseCaseFactory`), unless a test passes `jobsDispatcher`.

2. **Two stores, two TMs — one `run()`, no nest.** Same house style as translations P12. A single `this.transactionManager.run()` is atomic only when CSV TM === core TM (both flags on, both PG; or both off, both Mongo). Mixed cells: core/Mongo-or-PG `run()` covers that store; the other store’s writes auto-commit via `withConnection` / session-less Mongo. Non-atomic across stores. No DualStore. No nested second `run()`.

3. **Thesauri job is not a fake hybrid.** CSV DS from `csvDataSource`; `ThesauriDataSourceFactory.default()` / translations with no TM override. `UpdateEntriesByContextUseCaseFactory.default()` uses `EC.transactionManager` and starts its own `run()` **after** the apply `run()` returns (Mongo/PG `run()` cannot nest on the same instance).

4. **Queue is Mongo.** Register / finalize `dispatch()` inside the job `run()`. The queue collection is still Mongo, so the dispatcher always gets `mongoTransactionManager` — never the job TM, never the PG TM.

5. **Cancel / update race is in the DataSource.** PG `UPDATE … SET status = CASE WHEN status = 'cancelled' THEN status ELSE ? END` and `cancel` with `NOT IN` terminal statuses. Same behavior as Mongo `$cond` / `$nin`.

6. **Child documents have domain `id`.** Minted before persist; Mongo DS inserts `new ObjectId(doc.id)`; PG mapper `id` ↔ `_id`. Unique indexes from `192` unchanged.

7. **`replace*` is persist-only.** DataSources do **not** call `TM.run()`. Delete + insertMany join an open PG `run()` via `withConnection` when the job TM is that PG instance (both flags on, or the job already opened it). Hybrid: each statement auto-commits (same accepted window as translations `cloneForLanguage`). Preflight wraps the two `replacePendingValues` calls in `this.transactionManager.run()` so the both-on cell is one PG transaction.

8. **Tests are dual-backend.** Contract specs next to the ports, `describe.each(csvBackendConfigs)` (Mongo / Postgres CSV). Jobs, register, reads, extract dispatcher, and routes use `describe.each(csvJobBackendConfigs)` (4-way). Preflight no longer injects `MongoThesauriDataSource`.

9. **Module stays in `csv.v2`.** PG DataSources/mappers in `csv.v2/infrastructure/postgresql/`. Schema SQL in core `schema_migrations/`. V1 `/api/import` bridge left alone.

---

## Feature flag and Transaction Manager

**Locked: independent `postgresCsv`.** Production tenants that turn it on are **assumed** to also have `postgresCore` (transitional; everything ends on PG). **No factory check, no error if someone enables CSV without core.** Tests still cover the mixed cell so hybrid life is not a surprise.

### Which TM wins

Same as translations P12 / templates / thesauri. Factories do **not** receive one universal TM and “pick a winner.” Each DataSource uses the TM of **its own store**. The job’s `run()` follows **core** (`ExecutionContext.transactionManager`).

| `postgresCsv` | `postgresCore` | CSV DS TM | Core DS TM | Job `run()` | Same-`run()` atomicity (CSV status + entity/file writes) |
|---------------|----------------|-----------|------------|-------------|----------------------------------------------------------|
| off | off | Mongo | Mongo | Mongo (`EC.transactionManager`) | Yes — same Mongo instance |
| off | on | Mongo | PG | PG | **No** — hybrid; CSV Mongo auto-commits |
| on | off | PG | Mongo | Mongo | **No** — tests only; CSV PG auto-commits |
| on | on | PG | PG (**same** `EC.postgresTransactionManager`) | PG | **Yes** — intended production pair |

**When both flags are on:** job TM = `EC.transactionManager` = `EC.postgresTransactionManager`. CSV PG DS is wired to that same instance. One `run()` covers entity insert + file insert + `csv_imports` update. Do **not** pass a Mongo TM into core factories. Do **not** open a second `run()`.

**When CSV is on and core is not:** job TM is still Mongo (core). CSV PG writes auto-commit. `EntitiesService.ensureTransaction` passes because the job opened the core TM. Mixed, non-atomic. No DualStore. No nested PG `run()`. No `if (!postgresCore) throw`.

**Queue dispatcher:** always `UwaziDispatcherFactory(EC.tenant.name, EC.mongoTransactionManager)` in the factory that owns the job (CreateUser / files / PX style). Never pass the PG TM or the job TM into `UwaziDispatcherFactory`. Do **not** put this behind a CSV-only wiring module.

**Fail loudly** if `postgresCsv` is on and there is no ExecutionContext store / no PG TM. No silent Mongo fallback.

```
CSV DS factory (`csvDataSource` in CSVImportEntitiesFactories)
  if postgresCsv → Postgres*DataSource({ pgTransactionManager: EC.postgresTransactionManager })
  else           → Mongo*DataSource(db, overrides.tm ?? EC.mongoTransactionManager)

Core DS factories
  unchanged — they already branch on postgresCore. Do NOT pass the job TM into them.

Job / use case
  this.transactionManager = override ?? EC.transactionManager
  mixed core+CSV writes = this.transactionManager.run(write)   // one run, no nest
  dispatcher = options.jobsDispatcher
    ?? UwaziDispatcherFactory(EC.tenant.name, EC.mongoTransactionManager)
  core collaborators = Factory.default() with no TM override
```

---

## Glossary (the three things that were unclear)

### One-way flag vs “in-flight imports”

All of these Mongo→PG cutovers are **one-way**: copy Mongo → Postgres, flip the tenant flag, **never turn it back**. After any PG write, Mongo is stale. That is D6 and is the same as relationship types / settings / pages.

That is **not** what “in-flight” was about.

CSV imports are **jobs that run for minutes** (extract zip, stage rows, create thesauri, create entities). If we copy + flip the flag **while a job is still running**, that process was talking to Mongo and the next factory call talks to Postgres (empty or a snapshot from before the job’s latest writes). Progress, cancel, and row batches can split across stores. The job looks stuck or duplicates work.

There is **no code gate** for this (D1b). The cutover note is: pick a quiet moment — no CSV import currently queued or running — then copy, then flip. Same idea as “don’t deploy a storage switch mid-request,” not a special ops product.

### Foreign keys (FKs)

A **foreign key** is a Postgres constraint: “this child row’s `import_id` must exist in `csv_imports`.” `ON DELETE CASCADE` would mean deleting an import row automatically deletes its staged rows/errors.

Mongo has **no** such constraint. Application code already does `deleteByImport`. Adding FKs would be extra PG integrity, not “keep the Mongo shape.” Given “change as little as possible,” **we did not add FKs in this phase** (D9). `deleteByImport` stays. Unique indexes from migration `192` stay as indexes.

### Sync (not tenant-to-tenant)

**Not** “tenants sharing data with each other.”

Uwazi has an **instance-to-instance replication** feature (a collection can push to another Uwazi, e.g. a public portal). Templates, entities, settings, relationship types participate: every write also records an `updatelogs` row under a **sync namespace**. Postgres DataSources for those modules take `sync: { syncNamespace, syncDb }`.

CSV import jobs are **not** in that feature. Confirmed: we do **not** wire `SyncLogWriter` or a CSV sync handler.

---

## Decision map

| ID | Topic | Status |
|----|-------|--------|
| D1 | Feature flag vs `postgresCore` | **Locked and shipped** — `postgresCsv` independent; prod assumed to also have `postgresCore`; no factory check |
| D1b | Copy of running imports | **Locked** — treat Mongo as a stale snapshot; no mid-import provision. Staging first; production is stop-the-world then restart |
| D2 | Code location | **Locked and shipped** — hex + PG adapters in `csv.v2`; schema SQL only in core `schema_migrations/` |
| D3 | RLS timing | **Locked and shipped** — same migration as `CREATE TABLE` (`020`) |
| D4 | Identity / `_id` / domain `id` | **Locked and shipped** — every table PK `("_id", "tenant_id")`; domain `id`; mapper bridges; mint in application; copy preserves Mongo `_id` |
| D5 | Sync | **Locked and shipped** — none |
| D6 | Cutover / dual-write | **Locked** — copy once, flip flag, no dual-write, **never switch back**. Copy CLI exists; prod flip not done |
| D7 | Factory / TM wiring | **Locked and shipped** — job `run()` is `EC.transactionManager`; CSV DS pick their store TM; mixed cells auto-commit the other store (P12); dispatcher inlined (`UwaziDispatcherFactory` + Mongo TM); no `csvJobWiring`; do not nest a second `run()`; do not drill the job TM into CSV or core factories |
| D8 | Schema shape | **Locked and shipped** — `_id` + `tenant_id`; scalars + JSONB; Mongo unique indexes kept as unique indexes |
| D9 | Foreign keys | **Locked** — none this phase |
| D10 | What to copy | **Locked and shipped** — all six collections in `FLAG_GROUPS.postgresCsv` parent→child |
| D11 | Test matrix | **Locked and shipped** — Pages-style 4-way on jobs/use cases/routes; 2-way (Mongo/PG CSV) on DS contracts |

---

## Locked decisions

### D1. Flag `postgresCsv` — not `postgresCore`

| Surface | Value |
|---------|-------|
| Tenant flag | `postgresCsv` |
| Local env | `FEATURE_FLAG_POSTGRES_CSV=true` (seeds the default tenant only; `config.ts` stays `false` unless that env is set) |
| Wiring | `.env.example` `FEATURE_FLAG_POSTGRES_CSV`, `config.ts` `defaultTenant.featureFlags`, `tenantContext.ts`, `tenantsModel.ts`, CSV DS factories, `FLAG_GROUPS.postgresCsv` in `migrateToPostgres.ts` |
| Default | `false` |

Do not put CSV collections in `FLAG_GROUPS.postgresCore`. Do not require `postgresCore` in code. Assume it in production.

### D1b. Copy is a stale snapshot

No code for “drain in-flight jobs” or “skip non-terminal imports.” The copy reads Mongo as it is at that moment. Staging is where we enable the flag. Production cutover is stop everything → copy → flip flag → restart servers/workers. A job that was mid-import at copy time is leftover staging in PG, not something we try to resume across the switch.

### D2. Placement — adapters in the module, schema SQL in core

Do **not** copy Pages (`PostgresPagesDataSource` under `core/…/postgresql/page/`). CSV Mongo adapters already live in `csv.v2`; PG adapters sit next to them.

| Piece | Where |
|-------|--------|
| Domain / application / HTTP / jobs / Mongo DS | `app/api/csv.v2` |
| Postgres DS + mappers | `app/api/csv.v2/infrastructure/postgresql/` |
| Copy configs | `app/api/csv.v2/infrastructure/postgresql/migrations/` — CLI (`migrateToPostgres.ts`) imports and registers them |
| Schema SQL | **`app/api/core/infrastructure/postgresql/schema_migrations/020-create-csv-tables.sql`** |
| Shared PG primitives | stay in core (`PostgresDataSource`, `PostgresTable`, `PostgresTransactionManager`) |
| Factories | `csv.v2/infrastructure/factories` (`CSVImportEntitiesFactories.ts`, job factories) |

Schema SQL in core is a runner constraint, not a module-ownership rule.

### D3. RLS in the create migration

Every CSV table: `ENABLE ROW LEVEL SECURITY` + `tenant_isolation` (`USING` / `WITH CHECK` `tenant_id = current_tenant()`). Isolation tests as `app_user` (`csvTablesSchema.spec.ts`).

### D4. Keep `_id` as identity — domain `id` — no natural-key PK

This is the Templates / Relationship types / Files convention. Settings using `tenant_id` as PRIMARY KEY is the exception we did **not** copy.

**Postgres (every CSV table):**

```text
"_id"      TEXT NOT NULL
"tenant_id" TEXT NOT NULL
PRIMARY KEY ("_id", "tenant_id")
```

**Domain:** the property is `id`, never `_id`. Persistence types / SQL use `_id`. The mapper is the only bridge.

**Who mints `id`:** the application via `idGenerator.generate()`, **before** `insert` / `insertMany`. Postgres DataSources do **not** import `ObjectId` and do **not** mint ids.

**Copy:** preserve Mongo `_id` as TEXT (ObjectId hex). Do not generate new ids on copy (`csvMigrationIdOf`).

**Children** (`CsvImportRow`, `CsvImportRowError`, `CsvImportThesauriValues`, `CsvImportRelationshipPendingValues`, `CsvImportRelationshipValues`): `id` is on `create` / `fromObject` / `toObject`. Create sites mint it. Mongo DS inserts with `new ObjectId(doc.id)`. Unique indexes from `192` remain unique indexes, not the PK.

### D5. No sync

`PostgresDataSource` constructed **without** `sync`. No CSV sync handler factory.

### D6. Copy then flag; never switch back

One-time CLI copy → flip `postgresCsv` → PG is source of truth for CSV collections. No dual-write of staging rows. **Do not turn the flag off** after any PG write.

### D7. Factory / TM

See “Which TM wins” above. When `postgresCsv && postgresCore`, job `run()` **is** the PG TM so we actually get the atomicity. Mixed cells follow translations P12: one `run()`, the other store auto-commits. Do not nest. Dispatcher is **not** that TM — it is always Mongo, inlined in each factory.

### D8. Schema (shipped in `020`)

**Every table:** `"_id" TEXT NOT NULL`, `"tenant_id" TEXT NOT NULL`, `PRIMARY KEY ("_id", "tenant_id")`, RLS in the same file.

**`csv_imports`**

- Scalars: `template_id`, `status`, `created_by`, `created_at`, `updated_at`, `files_cleanup`
- JSONB: `file`, `storage`, `stats`, `progress`, `extraction`, `failure`, `row_errors`
- Index: `(tenant_id, created_at DESC)` (list UI)

**Children:**

- `csv_import_rows`: `import_id`, `row_index`, `headers JSONB`, `values JSONB` + unique `(tenant_id, import_id, row_index)`
- `csv_import_row_errors`: `import_id`, `row_index`, `message`, `code`, `property`, `raw_value`, `details JSONB`, `created_at` + index `(tenant_id, import_id, row_index)` (not unique)
- `csv_import_thesauri_values`: `import_id`, `thesaurus_id`, `entries JSONB`, `applied_*`, `stats JSONB` + unique `(tenant_id, import_id, thesaurus_id)`
- `csv_import_relationships_pending_values`: `import_id`, `template_id`, `titles JSONB` + unique `(tenant_id, import_id, template_id)`
- `csv_import_relationships_values`: `import_id`, `template_id`, `values JSONB` + unique `(tenant_id, import_id, template_id)`

Cancel semantics in SQL, not in the application layer.

**JSONB vs Mongo:** `JSON.stringify` drops `undefined`. PG will not round-trip Mongo-only sentinels such as `candidates: null`. Assert with `objectContaining`, not exact document equality.

### D9. No foreign keys this phase

No `REFERENCES csv_imports`. No `ON DELETE CASCADE`. Application `deleteByImport` stays. Copy still runs parent-then-children for sanity (`FLAG_GROUPS.postgresCsv` order).

**Advice (not a decision change):** adding FKs is a few SQL lines. It would **not** replace `deleteByImport`. CSV never deletes the parent `csv_imports` row; it wipes children in place (re-extract rows, `replacePendingValues`). `ON DELETE CASCADE` only runs when the parent is deleted.

### D10. Copy all six collections

The UI list only **shows** `csv_imports` (status, stats, progress, file name). Failed-rows download uses a **file** in storage, not `csv_import_rows`. Staged rows / pending thesauri / relationship docs after a finished import are leftover pipeline data.

We copy them anyway: history, integrity, in-progress resume, simpler copy engine. All six collections, parent first in `FLAG_GROUPS.postgresCsv`. Configs live next to the PG adapters; `mapDocument` is camelCase Mongo → snake_case PG.

### D11. Four-way tests

Like Pages (`pagesBackendTest.ts`). Helpers in `app/api/csv.v2/specs/csvBackendTest.ts`:

1. Mongo (both flags off)
2. Postgres CSV only (`postgresCsv`, core off)
3. Postgres core only (`postgresCore`, CSV off) — hybrid
4. Both on — intended production pair

DS contract specs stay **2-way** (`csvBackendConfigs`: Mongo / Postgres CSV). Jobs, register, reads, extract dispatcher, and routes use **4-way** (`csvJobBackendConfigs`).

When stores differ, skip rollback-across-stores assertions. Do not skip the mixed cells entirely.

---

## Implementation notes (do not re-learn these)

### Hybrid writes — one `run()`, no nest

`EntitiesService.ensureTransaction` throws if core TM is not running. Job TM **is** `EC.transactionManager`, so opening `this.transactionManager.run()` is enough. Entity-row persistence and relationship-entity create call that `run()` directly. Both-on is a single PG transaction. Mixed: CSV or core (whichever is not the job TM) auto-commits.

Do **not** DualStore. Do **not** nest `postgresTransactionManager.run()` / `mongoTransactionManager.run()` inside the job `run()`. Do **not** call `TM.run()` inside a DataSource.

### CSV `replace*`

PG child DataSources delete then insertMany. They join an open PG `run()` through `withConnection`; they do not start one. Preflight owns `this.transactionManager.run()` around the two `replacePendingValues` calls. Relationship finalize already wraps `replaceValues` in the job `run()`.

### Queue dispatcher

There is no `csvJobWiring`. That file existed when CSV also chose the job TM there. Other modules inline `UwaziDispatcherFactory(tenant, EC.mongoTransactionManager)` in the factory (`CreateUserUseCaseFactory`, files controllers, PX). CSV does the same. Tests that need to assert dispatch pass `jobsDispatcher` on factory options.

### Job tests

- **One outer `beforeAll` / `afterAll`.** `describe.each` must **not** `setUp`/`tearDown` per cell: the first cell’s `tearDown` disconnects Mongo (`MongoNotConnectedError` on the next cell).
- **Build + execute inside one `runWithContext`** (`itWithContext` in `csvBackendTest.ts`). Factory reads EC flags/TMs; a job built outside ALS is the wrong graph.
- **Job `run()` TM is `EC.transactionManager` in every 4-way cell** (`csvJobTransactionManager.spec.ts`). Mixed cells used to pick the CSV-store TM; that is no longer true.
- **Do not pass a TM override into job factories in integration tests.** That only replaces `this.transactionManager`; CSV and core DS still follow flags. A mock TM that is not the store TM hides whether writes actually join `run()`. Production `default()` does not drill the job TM into CSV or core factories.
- **CSV fixtures are not in `testingEnvironment` `MIRRORED_COLLECTIONS`.** Seed via the factory DS (or raw PG), not Mongo-only `getCollection('csv_imports')`.
- **Core assertions follow the core flag.** Translations live in `translationsV2` (Mongo) or `translations` (PG). Entities/files similarly. `testingEnvironment.db.getCollection('translationsV2')` is empty when `postgresCore` is on.
- **Header validation failure** must set `failureRecorded` (or equivalent) so `persistGenericFailure` does not overwrite `HEADER_VALIDATION_FAILED` / `issues` with a generic `{ stage: 'preflight:scan' }`. PG JSONB makes that overwrite visible; Mongo sometimes left the first write in place.

### Copy configs

`MigrationConfig.mapDocument` camelCase → snake_case. Child `created_at` is a number. Optional JSON fields use `null` in SQL, not `undefined`.

---

## Work

### Done

- **A.** Flag `postgresCsv`; job TM is `EC.transactionManager`; CSV DS flag-aware; dispatcher inlined (`UwaziDispatcherFactory` + Mongo TM, no `csvJobWiring`); no job TM into CSV or core factories; both-on job `run()` is PG TM.
- **B.** Domain `id` on child models; create sites mint; Mongo DS persist provided `_id`.
- **C.** Schema + RLS `020`. Six tables, `_id` + `tenant_id` PK, indexes matching `192`. No FKs.
- **D.** Postgres adapters in `csv.v2/infrastructure/postgresql/`. Mappers `id` ↔ `_id`. Bulk insert. `replace*` persist-only (join open PG `run()`). Cancel/update race in SQL. No `ObjectId` in PG adapters. Schema/RLS specs as `app_user`.
- **E.** Six `MigrationConfig`s; `FLAG_GROUPS.postgresCsv` parent→child. Specs: map, copy, skip, force, tenant isolation.
- **F.** Contract specs per DS (2-way). Job/use-case/route `describe.each` 4-way. Preflight does not inject Mongo thesauri. Queue dispatch mocked at the job boundary.

### Remaining

**G. Manual dry-run.** Staging (or production stop-the-world): schema → copy all six (Mongo treated as a stale snapshot) → flip `postgresCsv` (with `postgresCore` on) → restart → register import → extract → preflight → thesauri → relationships → entities → cancel mid-flight → failed-rows download → cleanup. Optionally repeat core-off for the mixed cell.

---

## Explicit non-goals

- Do not move `csv.v2` into `app/api/core` as a hexagon relocation.
- Do not fold CSV into `postgresCore`.
- Do not add a factory requirement that `postgresCore` is on.
- Do not dual-write staging rows.
- Do not add CSV to instance sync.
- Do not migrate file storage / zip bytes.
- Do not paginate the imports list (context 09 P2) in this phase.
- Do not remove V1 `/api/import`.
- Do not invent DualStore.
- Do not nest a second `TM.run()` for hybrid Mongo+PG.
- Do not add a CSV-only dispatcher/TM wiring module (`csvJobWiring`). Other factories inline `UwaziDispatcherFactory`.
- Do not enable the flag by default.
- Do not copy entities’ “table without RLS.”
- Do not copy Settings’ `tenant_id` PRIMARY KEY.
- Do not replace `_id` with natural-key primary keys.
- Do not add foreign keys this phase.
- Do not put CSV Postgres DataSources/mappers under `app/api/core` (D2).
- Do not change HTTP / socket contracts.

---

## Key reference files

| Concern | Path |
|---------|------|
| Queue dispatcher (always Mongo TM) | `UwaziDispatcherFactory(EC.tenant.name, EC.mongoTransactionManager)` inline in each job factory (e.g. `CsvImportEntitiesJobFactory.ts`) |
| Job TM = `EC.transactionManager` (4-way) | `app/api/csv.v2/application/jobs/specs/csvJobTransactionManager.spec.ts` |
| DS factory (`csvDataSource`) | `app/api/csv.v2/infrastructure/factories/CSVImportEntitiesFactories.ts` |
| Same-unit core + CSV (entities) | `app/api/csv.v2/application/jobs/CsvImportEntitiesRowPersistence.ts` |
| Same-unit core + CSV (relationships) | `app/api/csv.v2/application/services/CsvRelationshipEntitiesCreator.ts` |
| Cancel / status race (PG) | `app/api/csv.v2/infrastructure/postgresql/PostgresCsvImportsDataSource.ts` |
| Cancel / status race (Mongo) | `app/api/csv.v2/infrastructure/mongodb/MongoCsvImportsDataSource.ts` |
| 4-way / 2-way test helpers | `app/api/csv.v2/specs/csvBackendTest.ts` |
| Schema + RLS | `app/api/core/infrastructure/postgresql/schema_migrations/020-create-csv-tables.sql` |
| Schema specs | `app/api/core/infrastructure/postgresql/specs/csvTablesSchema.spec.ts` |
| Copy configs | `app/api/csv.v2/infrastructure/postgresql/migrations/` |
| Copy CLI groups | `scripts/scripts.v2/migrateToPostgres.ts` |
| Child create sites (mint `id`) | `CsvImportRowsStager.ts`, `CsvRowImportErrorFactory.ts`, `CsvPreflightJob.ts`, `CsvPreflightRelationshipsService.ts` |
| Pages independent flag | `app/api/pages.v2/infrastructure/factories/PagesDataSourceFactory.ts` |
| Pages 4-way tests | `app/api/pages.v2/specs/pagesBackendTest.ts` |
| Settings P12 / queue Mongo TM | `AI Contexts/Settings/settings-v2-and-postgres.md` |
| RT postgres (`_id` + domain `id`) | `AI Contexts/Relationship Types/relationship-types-postgres.md` |
| PG TM `withConnection` autocommit | `app/api/core/infrastructure/postgresql/common/PostgresTransactionManager.ts` |
| Flag-aware default TM | `app/api/core/libs/transactionManagerFactories.ts` |
| CSV Mongo indexes | `app/api/migrations/migrations/192-csv_v2_indexes` |
