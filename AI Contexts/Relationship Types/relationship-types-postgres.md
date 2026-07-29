# Relationship Types → Postgres Migration

## Objective

Move relationship types storage from MongoDB (`relationtypes` collection) to the shared Postgres database, behind a per-tenant feature flag, following the same patterns already used for thesauri / templates / files. Public API `/api/relationtypes` stays unchanged.

This document is the working context for the Postgres phase. The prior V2 architecture work is documented in [`relationship-types-v2-migration.md`](./relationship-types-v2-migration.md).

## Status

- **Analysis / planning** — in progress (this document)
- **Implementation** — not started
- **Prerequisite** — V2 core ownership is done; legacy `.properties` cleanup is migration `200`

## Why this is a good next candidate

Relationship types are one of the simplest remaining domains:

| Aspect | Relationtypes | Closest existing PG module |
|--------|---------------|----------------------------|
| Domain fields | `id`, `name` only | Thesauri (`id`, `name`, `values` JSONB) — relationtypes even simpler |
| Nested data | None (properties dropped) | Thesauri need JSONB `values` |
| Translations | Still Mongo (`LegacyRelationshipTypesTranslationService`) | Same pattern as other modules |
| Sync namespace | `relationtypes` | Thesauri use sync namespace `dictionaries` ≠ PG table `thesauri` |
| Current factory | Mongo-only, no flag | Thesauri: `postgresThesauri` branch |

**Primary references (compare, don’t single-source):**

- Factory + dual TM when ES hooks exist: Templates, Files
- Simple PG DS deps (no ES): Thesauri
- Partial / incomplete cutover (avoid copying gaps): Entities

Relationtypes are closest to thesauri in **data shape**, but factory/flag/TM wiring should follow the **shared Templates/Files/Thesauri pattern**, with DS deps chosen by actual needs (no ES → no Mongo TM in PG DS).


---

## How existing modules do it (reference map)

### 1. Schema migrations (Postgres DDL)

Location: `app/api/core/infrastructure/postgresql/schema_migrations/`

| Delta | File | Notes |
|------:|------|-------|
| 001 | `create_templates_table.sql` | Structured columns + JSONB + `tenant_id` |
| 002 | `create_thesauri_table.sql` | Simplest full table — best copy source |
| 003 | `create_files_table.sql` | Many scalars + JSONB |
| 004 | `add-row-level-security-policy.sql` | RLS for templates/thesauri/files |
| 005 | `add-entities-table.sql` | Entities table **without** RLS (known lag) |

Conventions:

- `_id TEXT` (Mongo ObjectId hex string)
- `tenant_id TEXT NOT NULL` on every row
- Composite PK `("_id", "tenant_id")`
- Indexes include `tenant_id`
- Create via plop: `yarn add-migration` → kind `schema`

Runner: `PgMigrator` / `yarn migrate --new` (admin pool as `migrator_user`).

### 2. RLS (Row-Level Security) — not “RSL”

Multi-tenancy model:

- **Mongo:** one database per tenant (`tenant.dbName`)
- **Postgres:** one shared DB; rows namespaced by `tenant_id`; isolation enforced by RLS

How it works today:

1. Tables `ENABLE ROW LEVEL SECURITY`
2. Policy `tenant_isolation`: `USING / WITH CHECK (tenant_id = current_tenant())`
3. Function `current_tenant()` reads GUC `app.current_tenant`
4. `PostgresTransactionManager.withConnection` runs `set_config('app.current_tenant', tenantId, true)` inside each transaction
5. `PostgresTable` always injects `tenant_id` on write and strips it on read
6. App runtime uses `app_user` (subject to RLS); schema migrations use `migrator_user` (owner / bypass)

**Lesson from entities:** table created in 005 without RLS. Prefer enabling RLS in the **same** schema migration that creates `relationtypes` (or immediately after in the same file), so we never ship a window where rows are readable across tenants under `app_user`.

Reference policy (004):

```sql
ALTER TABLE thesauri ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON thesauri
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
```

`current_tenant()` already exists after 004 — new tables only need `ENABLE` + `CREATE POLICY`.

### 3. Adapters / DataSources

Pattern (thesauri):

1. `Postgres*Mapper` — domain ↔ row (`_id` TEXT, scalars / JSON)
2. `Postgres*DataSource` extends `PostgresDataSource` → implements application contract
3. Constructor wires `PostgresDataSource(tableName, { tenantId, pgTransactionManager, sync: { syncDb, syncNamespace } })`
4. Sync still writes Mongo `updatelogs` under the **Mongo collection / sync namespace** so cluster sync keeps working
5. Factory branches on `tenant.featureFlags.postgres*`

Relationship types already have:

- Contract: `RelationshipTypesDataSource`
- Mongo: `MongoRelationshipTypesDataSource` (collection `relationtypes`)
- Factory: `RelationshipTypesDataSourceFactory` — **always Mongo today**

### 4. Feature flags (per tenant)

Existing flags (all default `false` in `config.ts`):

| Flag | Switches |
|------|----------|
| `postgresTemplates` | Templates DS / DAO / sync handler |
| `postgresThesauri` | Thesauri DS / DAO / sync handler |
| `postgresFiles` | Files DS / DAO / sync handler |
| `postgresEntities` | Entities **query** path only (partial) |

Wiring surfaces that must stay in sync for a new flag:

1. `app/api/config.ts` — `defaultTenant.featureFlags`
2. `app/api/tenants/tenantContext.ts` — `Tenant` type
3. `app/api/tenants/tenantsModel.ts` — Mongo schema Boolean
4. DataSource factory branch
5. Sync handler factory branch (if applicable)
6. Dual-backend tests (`describe.each` Mongo / Postgres) like thesauri use cases

Cutover order per tenant:

1. Apply PG schema (cluster-wide)
2. Run one-time Mongo → PG data copy for that tenant
3. Flip flag `true` on that tenant
4. Smoke CRUD + sync + translations

### 5. One-time Mongo → Postgres data copy

Engine: `MigrateCollectionToPostgres`

- Batch size 50
- Idempotent: if PG already has any row for the tenant → `{ skipped: true }`
- Maps via per-collection `MigrationConfig` (`mongoCollection`, `pgTable`, `mapDocument`)

Existing configs: templates, thesauri (`dictionaries` → `thesauri`), files; entities config exists but is **not** wired into the CLI yet.

CLI:

```bash
node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts \
  --tenant <name> --collection thesauri|templates|files
# or --all
```

Not a queue job; manual / ops-driven. Schema migration is separate.

### 6. Sync

When PG is source of truth, sync handlers write into PG instead of Mongo for that namespace.

- Thesauri: `ThesauriSyncHandlerFactory` branches on `postgresThesauri`
- Relationtypes today: `RelationtypesSyncHandlerFactory` → always `MongoRelationtypesSyncHandler`
- Registered as namespace `relationtypes` in `registerSyncHandlers.ts`

---

## Decision map (how to read D1–D7)

Earlier drafts split “open” (D1–D3, D7) vs “settled recommendations” (D4–D6). That was confusing. Below, **all seven** are listed once, with status.

| ID | Topic | Status |
|----|-------|--------|
| D1 | Naming / feature flag / PG table | **Locked** — prefer `relationshipTypes` / deprecate `relationtypes` |
| D2 | Name uniqueness | **Locked direction** — case-insensitive + trim in app; run collision diagnosis first |
| D3 | RLS timing | **Locked** — RLS in the same schema migration as table create |
| D4 | Sync / Mongo collection naming during cutover | **Locked with caveat** — see below |
| D5 | Cutover / dual-write | **Locked** — copy once, then flag; no dual-write |
| D6 | Translations | **Locked** — stay in Mongo this phase |
| D7 | Factory / TM wiring | **Locked** — Templates/Files-style factory + flag; PG DS gets PG TM from EC; no Mongo TM inside PG DS unless ES hooks appear |

---

## Locked decisions

### D1. Naming — move toward `relationshipTypes`

Product language is **relationships**, not “relations”. Prefer `relationshipTypes` spelling everywhere we control.

| Surface | Decision |
|---------|----------|
| Feature flag | `postgresRelationshipTypes` |
| PG table | **`relationship_types`** (snake_case — matches Postgres norms and existing PG tables: `templates`, `thesauri`, `files`, `entities`) |
| Code / domain / factories | Keep / prefer `RelationshipType(s)` (already mostly there) |
| Deprecate | `relationtypes` / `Relationtypes` / `relationType` spellings in **new** code |

**HTTP path** `/api/relationtypes` stays for API compatibility (external contract). Internal rename does not require a public route rename in this phase.


### D2. Name uniqueness — label semantics + diagnosis

Agreed model:

- **Identity** is always `_id`; consumers link by id (connections.template, etc.).
- **`name` is a label**, mainly for UI + translation context keys/labels.
- Uniqueness check stays **application-level**, **case-insensitive + trim** (same as current `existsByName`). No thesauri-style case-sensitive unique index on `(name, tenant_id)`.

**Before enforcing / relying on this in PG cutover**, run a **collision diagnosis** across tenants: find docs where `lower(trim(name))` collides within the same DB. If collisions exist, decide remediation (rename one label, or temporarily allow duplicates and only block new creates). Add a mongosh audit script under this phase’s prep work; record findings in this MD.

No DB unique expression index in v1 of the schema unless diagnosis + product say we want hard enforcement.

### D3. RLS timing

**Locked:** enable RLS + `tenant_isolation` policy in the **same** schema migration that creates `relationship_types`. Migration 004-style lag was a mistake; do not repeat.

### D4. Sync namespace + Mongo collection during cutover

Unlike a greenfield rename, sync/`updatelogs` already use namespace **`relationtypes`**, and Mongo data lives in collection **`relationtypes`**.

Same pattern as thesauri: Mongo collection `dictionaries` → PG table `thesauri`, sync namespace stays `dictionaries`.

| Surface | Value during this phase |
|---------|-------------------------|
| Mongo source (data copy) | `relationtypes` (existing data) |
| PG table | `relationship_types` (new name) |
| Sync / updatelogs namespace | keep `relationtypes` for cluster compatibility |

A later dedicated rename of sync namespace / Mongo leftovers can happen after PG is source of truth and sync consumers are coordinated — **out of scope** for first PG cutover.

### D5. Cutover / dual-write

**Locked:** one-time CLI copy → flip `postgresRelationshipTypes` → PG is source of truth. Still write Mongo `updatelogs` (namespace `relationtypes`) for sync. No ongoing dual-write of domain rows.

### D6. Translations

**Locked:** translation contexts stay in Mongo this phase (`LegacyRelationshipTypesTranslationService`).

### D7. Factory / TransactionManager approach — cross-module comparison

**Do not treat thesauri as the only source of truth.** Compare full PG cutovers:

| Module | Flag | Factory reads EC? | PG DS gets `pgTM` from EC? | Also gets Mongo TM? | Why Mongo TM in PG DS? |
|--------|------|-------------------|----------------------------|---------------------|-------------------------|
| **Templates** | `postgresTemplates` | Yes | Yes | **Yes** | `onCommitted` → ES mapping update |
| **Files** | `postgresFiles` | Yes | Yes | **Yes** | `onCommitted` → search reindex |
| **Thesauri** | `postgresThesauri` | Yes | Yes | **No** | No ES / post-commit hook in DS |
| **Entities** | `postgresEntities` | Partial (query path only) | N/A for full DS | N/A | **No full PG DataSource yet** — not a cutover template |
| **Relationship types (today)** | none | No | N/A | Required Mongo TM arg only | Mongo-only factory |

**What is shared (Templates + Files + Thesauri) — follow this**

1. Factory reads `ExecutionContext.currentTenant` / `tenant.featureFlags.postgres*`
2. When flag on → construct PG DataSource with `ExecutionContext.postgresTransactionManager` (RLS `app.current_tenant`)
3. Mongo path uses `overrides?.transactionManager ?? ExecutionContext.transactionManager`
4. Sync handler factories mirror the same flag + `postgresTransactionManager`

**Where modules diverge — pick by need, not by copy-paste**

- Templates/Files PG DataSources take **both** TMs because they register Mongo `onCommitted` hooks for Elasticsearch.
- Thesauri PG DataSource takes **only** `pgTransactionManager` — storage + sync via `PostgresDataSource` / `SyncLogWriter`; no ES hook.
- Relationship types match **thesauri’s dependency shape**: mutations do not update ES mappings; translations are a separate Mongo service; sync is updatelogs via `SyncLogWriter`.

**Locked approach for relationship types**

1. **DataSource factory** — follow **Templates/Files factory shape** (flag from ExecutionContext, optional TM override, explicit PG branch with `ExecutionContext.postgresTransactionManager` from the start). Do not keep a required Mongo-only constructor arg.
2. **Postgres DataSource deps** — follow **Thesauri DS shape**: `tenantId` + `mongoDb` (for sync updatelogs) + `pgTransactionManager`. **Do not** add a Mongo TM into the PG DS unless/until we introduce an `onCommitted` need (we do not have one today).
3. **Use-case factories** — keep a Mongo `transactionManager` on the **use case** for `run()` / orchestration (same as CreateTemplate / current RT factories). Prefer eventually reading it from `ExecutionContext.transactionManager` (newer Files/Entities use-case factories) rather than always `TransactionManagerFactory.default()`, but that can be incremental; the critical PG correctness is (1)+(2).
4. **Entities** — use only as a cautionary tale (partial flag, no RLS on table yet); not as the adapter pattern to copy.

**Tests must cover**

- Flag off → Mongo path unchanged
- Flag on → writes hit `relationship_types` under RLS via PG TM
- Flag on without PG context → fail loudly (no silent Mongo fallback)

---

## Proposed work for relationship types

### A. Prep — name-collision diagnosis

- Mongosh (or script) across tenants: group `relationtypes` by `lower(trim(name))`, report collisions.
- Record results here before cutover.

### B. Schema + RLS

Create schema migration `006-create_relationship_types_table.sql` (next delta after 005):

```sql
CREATE TABLE IF NOT EXISTS relationship_types (
  "_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE INDEX IF NOT EXISTS relationship_types_tenant_id ON relationship_types ("tenant_id");

ALTER TABLE relationship_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON relationship_types
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
```

No unique index on `name` in v1 (see D2). Do **not** store `properties`.

### C. Postgres adapter

- `…/postgresql/relationshipType/PostgresRelationshipTypesDataSource.ts`
- Mapper + specs
- Preserve `existsByName` (case-insensitive + trim)
- Extend `PostgresDataSource` with table `'relationship_types'`
- `sync: { syncNamespace: 'relationtypes', syncDb }` (D4 — Mongo sync namespace kept)
- Deps: `tenantId` + `mongoDb` + `pgTransactionManager` (no Mongo TM in DS unless we add ES hooks later)
- Translations remain Mongo

### D. Feature flag + factories

- Flag: `postgresRelationshipTypes` (config, tenantContext, tenantsModel)
- `RelationshipTypesDataSourceFactory` — Templates/Files-style: flag from EC, optional override TM for Mongo path, PG branch uses `ExecutionContext.postgresTransactionManager` (D7)
- Sync handler factory — same flag; PG TM from EC (see Templates/Files/Thesauri sync factories)
- Call sites that currently pass a required Mongo TM into the DS factory need updating (e.g. `CreateTemplateUseCaseFactory` still does `RelationshipTypesDataSourceFactory.default(transactionManager)`)

### E. Data migration config + CLI

- Config: mongo `relationtypes` → pg `relationship_types`
- Map `_id` + `name` only; ignore leftover `properties`
- CLI key e.g. `relationshipTypes` or `relationship_types` (pick one when implementing; prefer matching flag family)
- Specs: batching, skip-if-exists, tenant isolation

### F. Tests / cutover checklist

- [ ] Name-collision diagnosis reviewed
- [ ] Schema + RLS as `app_user`
- [ ] Data copy; second run skips
- [ ] Flag off → Mongo; flag on → PG
- [ ] Sync + translations parity
- [ ] Dual-backend specs
- [ ] Delete-in-use guards still in use cases

---

## Explicit non-goals

- Do not reintroduce `properties` / `connections.metadata` in PG
- Do not migrate translations to PG in this phase
- Do not change `/api/relationtypes` HTTP contract in this phase
- Do not rename sync namespace away from `relationtypes` in the first cutover
- Do not invent a new migration runner — use `PgMigrator` + `MigrateCollectionToPostgres` + existing CLI
- Do not enable the flag by default

---

## Implementation order (when coding starts)

1. Name-collision diagnosis (D2 prep)
2. Schema migration `006` — `relationship_types` + RLS (D1, D3)
3. Mapper + Postgres DataSource + specs
4. Feature flag `postgresRelationshipTypes` + factory ExecutionContext alignment (D7)
5. Sync handler PG branch (namespace still `relationtypes`)
6. Migration config + CLI registration + specs
7. Dual-backend regression
8. Manual cutover dry-run on a non-prod tenant
9. Update this MD with diagnosis results / pitfalls

---

## Key reference files

| Concern | Path |
|---------|------|
| Templates schema | `…/schema_migrations/001-create_templates_table.sql` |
| Thesauri schema (simple table) | `…/schema_migrations/002-create_thesauri_table.sql` |
| RLS (historical separate migration) | `…/schema_migrations/004-add-row-level-security-policy.sql` |
| Entities schema (**no RLS — do not copy**) | `…/schema_migrations/005-add-entities-table.sql` |
| Templates PG DS (dual TM + ES) | `…/postgresql/template/PostgresTemplatesDataSource.ts` |
| Files PG DS (dual TM + ES) | `…/postgresql/files/PostgresFilesDataSource.ts` |
| Thesauri PG DS (PG TM only) | `…/postgresql/thesaurus/PostgresThesauriDataSource.ts` |
| Templates factory flag | `…/factories/TemplatesDataSourceFactory.ts` |
| Files factory flag | `…/factories/FilesDataSourceFactory.ts` |
| Thesauri factory flag | `…/factories/ThesauriDataSourceFactory.ts` |
| Entities factory (still Mongo DS) | `…/factories/EntitiesDataSourceFactory.ts` |
| Sync factories | `app/api/sync/{Templates,Files,Thesauri}SyncHandlerFactory.ts` |
| Data copy engine | `…/postgresql/migrations/MigrateCollectionToPostgres.ts` |
| Migration configs | `…/migrations/configs/{Template,Thesaurus,Files}MigrationConfig.ts` |
| CLI | `scripts/scripts.v2/migrateToPostgres.ts` |
| Current RT Mongo DS | `…/mongodb/relationshipType/MongoRelationshipTypesDataSource.ts` |
| Current RT factory | `…/factories/RelationshipTypesDataSourceFactory.ts` |
| Current RT sync | `app/api/sync/RelationtypesSyncHandlerFactory.ts` |
| Tenant flags | `app/api/config.ts`, `tenants/tenantContext.ts`, `tenants/tenantsModel.ts` |
| Prior V2 context | [`relationship-types-v2-migration.md`](./relationship-types-v2-migration.md) |

---

## To keep an eye on

- Run and record name-collision diagnosis before relying on case-insensitive uniqueness at scale.
- Sync namespace stays `relationtypes` for now even though PG table is `relationship_types` (thesauri-style mismatch).
- When flipping flags in prod: **data copy before flag**, never the reverse.
- Superusers / table owners bypass RLS — isolation tests must run as `app_user`.
- Sync handler and DataSource must share the same tenant flag (`postgresRelationshipTypes`).
- Data-copy mapper should ignore stray `properties` defensively.
- Do not copy entities’ “table without RLS” pattern.
- Later: optional rename of sync namespace / leftover `relationtypes` spellings after PG cutover is proven.
