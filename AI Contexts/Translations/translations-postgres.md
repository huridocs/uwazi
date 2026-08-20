# Translations → Postgres Migration

## Objective

Move translations storage from MongoDB (`translationsV2`) to the shared Postgres database, behind a per-tenant feature flag, following thesauri / templates / files / relationship types. Public HTTP (`/api/translations*`, `/api/v2/translations`) stays unchanged. The store stays **by-item** — no mammoth collection in Postgres.

This document is the working context for the Postgres phase. Prior V2 hex work: [`translations-v2-migration.md`](./translations-v2-migration.md). Diagnosis: [`translations-v2-diagnosis.md`](./translations-v2-diagnosis.md). Pattern source: [`../Relationship Types/relationship-types-postgres.md`](../Relationship%20Types/relationship-types-postgres.md).

## Status

- **Analysis / planning** — decisions locked below
- **Implementation** — in progress
- **Prerequisite** — V2 core ownership on Mongo `translationsV2` is done; factory seam `TranslationsSyncHandlerFactory` is Mongo-only until the PG branch lands

### Implemented so far

- [x] Schema `015-create-translations-table.sql` (`translations` + RLS in the same migration)
- [x] `PostgresTranslationsDataSource` + mapper + specs (incl. RLS isolation, natural-key upsert)
- [x] Feature flag `postgresTranslations` (config / tenantContext / tenantsModel; local via `FEATURE_FLAG_POSTGRES_TRANSLATIONS=true`)
- [x] `TranslationsDataSourceFactory` — Templates/Thesauri-style EC + flag; PG TM from EC; `cached()` returns the PG DS when the flag is on (no Mongo cache wrap)
- [x] `PostgresTranslationsSyncHandler` + factory branch (sync namespace still `translationsV2`)
- [x] `TranslationsMigrationConfig` + CLI `--collection translations`
- [x] Dual-backend use-case / QueryService specs (`describe.each` Mongo + Postgres)

### Still open

- [ ] Local cutover dry-run: schema → data copy → flip flag → CRUD / language add / SSR / Settings GET / sync
- [ ] Sync not manually exercised until dry-run

---

## Why translations differ from relationship types

Relationship types are a small named collection (`id` + `name`). Translations are a **large by-item store**. Domain `Translation` has **no id** — identity is `(language, key, context.id)`. Mongo still has a surrogate `_id` (ObjectId) because that is what `updatelogs` / cluster sync use.

| Aspect          | Translations                                                      | Closest PG module                                     |
| --------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Domain fields   | `language`, `key`, `value`, `context { type, label, id }`         | Thesauri are simpler; this is closer to a join table  |
| Nested data     | Context flattened to columns (queried / unique-indexed)           | Thesauri JSONB `values`                               |
| Surrogate `_id` | Persistence/sync only; **not** on the domain model                | RT/Thesauri/Templates: `_id` **is** domain id         |
| Unique key      | `(tenant_id, language, key, context_id)`                          | Thesauri: `(name, tenant_id)`                         |
| Volume          | Thousands–tens of thousands of rows per tenant                    | RT: dozens                                            |
| Sync namespace  | `translationsV2` (≠ PG table `translations`)                      | Thesauri: namespace `dictionaries` ≠ table `thesauri` |
| ES hooks        | None                                                              | Same as thesauri / relationship types                 |
| Reads           | `Promise<Translation[]>` (Mongo cursor stays inside the Mongo DS) | RT `getAll` is `Promise<T[]>`                         |

**Do not** put `id` on domain `Translation` just to look like Thesauri. **Do not** mint `_id` with `new ObjectId()` inside the PG DS — inject `IdGenerator` (same hex ObjectId strings `SyncLogWriter` requires).

---

## Locked decisions

| ID  | Decision                                                                                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | PG table **`translations`**. Sync namespace stays **`translationsV2`**.                                                                                                                                                                                                                       |
| P2  | `_id TEXT` + `tenant_id` composite PK (shared `PostgresTable` / `SyncLogWriter` convention). `_id` is a 24-char ObjectId hex.                                                                                                                                                                 |
| P3  | Flatten context: `context_id`, `context_type`, `context_label`. Unique `(tenant_id, language, key, context_id)`.                                                                                                                                                                              |
| P4  | RLS in the **same** schema migration that creates the table.                                                                                                                                                                                                                                  |
| P5  | One store. Copy Mongo → PG, then flip `postgresTranslations`. No dual-write of domain rows. Flag is **one-way** after any PG write.                                                                                                                                                           |
| P6  | New inserts mint `_id` via `IdGenerator` (factory-wired). Data copy **preserves** Mongo `_id`. Natural-key upsert **must not** overwrite an existing `_id`.                                                                                                                                   |
| P7  | Translation upsert identity is `(language, key, context_id)`, not `_id`. Default `PostgresTable.upsert` conflicts on `_id`; pass `{ columns: NATURAL_KEY, merge: [...] }` (and `RETURNING _id` for sync). Do **not** add `id` to domain `Translation` — that does not change upsert identity. |
| P8  | `cloneForLanguage` is insert-ignore by natural key, not a second mammoth read into `getLegacy`.                                                                                                                                                                                               |
| P9  | `TranslationsDataSource` getters return `Promise<Translation[]>`. Production callers already materialized ResultSet with `.all()`. Mongo may still use a cursor internally.                                                                                                                   |
| P10 | Thesaurus stays **off SSR**; that is unrelated to this cutover. QueryService / SSR keep calling the DS — the factory flag is the switch.                                                                                                                                                      |
| P11 | Phase 1b FE (Settings atom / mammoth GET) is **not** a blocker for Postgres.                                                                                                                                                                                                                  |

**Primary references:** Thesauri PG DS deps (no ES, no Mongo TM in the PG DS). Templates/Files factory shape (flag from EC, `postgresTransactionManager`). Relationship types postgres doc for flag/copy/cutover. Avoid Entities partial cutover.

---

## Schema

Location: `app/api/core/infrastructure/postgresql/schema_migrations/015-create-translations-table.sql`

```sql
CREATE TABLE IF NOT EXISTS translations (
  "_id"           TEXT NOT NULL,
  "language"      TEXT NOT NULL,
  "key"           TEXT NOT NULL,
  "value"         TEXT NOT NULL,
  "context_id"    TEXT NOT NULL,
  "context_type"  TEXT NOT NULL,
  "context_label" TEXT NOT NULL,
  "tenant_id"     TEXT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id"),
  CHECK ("context_type" IN ('Entity', 'Relationship Type', 'Uwazi UI', 'Thesaurus'))
);

CREATE UNIQUE INDEX IF NOT EXISTS translations_natural_key
  ON translations ("tenant_id", "language", "key", "context_id");

CREATE INDEX IF NOT EXISTS translations_tenant_language
  ON translations ("tenant_id", "language");

CREATE INDEX IF NOT EXISTS translations_tenant_context
  ON translations ("tenant_id", "context_id");

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON translations
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
```

`current_tenant()` already exists (migration 004).

---

## Adapter

1. `PostgresTranslationMapper` — domain ↔ row (`context_*` columns ↔ `TranslationContext`)
2. `PostgresTranslationsDataSource` extends `PostgresDataSource` → implements `TranslationsDataSource`
3. Constructor: `{ tenantId, mongoDb, pgTransactionManager, idGenerator }`
4. Sync: `syncNamespace: 'translationsV2'`
5. Factory branches on `tenant.featureFlags.postgresTranslations`

**`updateContext`:** apply `TranslationContextModel.getDiff()` in SQL (label updateMany, insert added, update values, delete keys). Do **not** reuse `buildTranslationContextBulkOps` (Mongo `AnyBulkWriteOperation`).

**Reads:** getters return `Promise<Translation[]>` (same as Thesauri/Templates/Files). Mongo may still use a cursor internally; the contract does not expose `ResultSet`.

**`cached()`:** when the flag is on, return the same PG DS as `default()`. Do not invent `CachedPostgresTranslationsDataSource` in this slice.

---

## Feature flag

| Surface     | Name                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| Tenant flag | `postgresTranslations`                                                               |
| Local ENV   | `FEATURE_FLAG_POSTGRES_TRANSLATIONS=true` (do not edit `config.ts` defaults to true) |

Wiring: `config.ts` → `tenantContext.ts` → `tenantsModel.ts` → DS factory → sync handler factory → dual-backend tests.

**Local:** ENV on the default tenant. **Multi-tenant / production:** `featureFlags.postgresTranslations` on the tenant document.

Cutover per tenant: schema (cluster-wide) → one-time copy → flip flag → smoke.

**One-way after flip:** do not turn the flag off; Mongo `translationsV2` is stale.

---

## Data copy

Engine: `MigrateCollectionToPostgres`

- CLI: `node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --tenant <name> --collection translations`
- `mongoCollection: 'translationsV2'`, `pgTable: 'translations'`
- Map `_id` to hex; flatten `context`
- Idempotent skip if the tenant already has any PG row

---

## Sync

- Namespace remains `translationsV2`
- `PostgresTranslationsSyncHandler` preserves historical semantics: **delete by natural key** then insert the synced document (including its `_id`)
- Factory mirrors the DS flag

---

## Implementation order

1. Schema + RLS
2. Mapper + PG DataSource + specs (CRUD, natural-key upsert, clone, exclude types, RLS)
3. Flag + factory
4. Sync handler + factory specs
5. MigrationConfig + CLI
6. Dual-backend specs
7. Local dry-run

---

## Do not

- Dual-write Mongo + PG
- Load Thesaurus on SSR as part of this cutover
- Put `ObjectId` imports in the PG DS; do not mint ids with `new ObjectId()` there
- Use `PostgresTable.upsert` default (`onConflict _id`) for translation upsert — pass the natural-key `columns` option
- Put `ResultSet` / `PostgresTableResultSet` back on translations reads — getters return arrays
- Add `id` to domain `Translation` just to look like Thesauri; upsert identity stays the natural key
- Change HTTP contracts or locale DTO maps
- Reintroduce `GetTranslationsUseCase`
- Rename sync namespace without a coordinated cluster change
- Turn the flag off after PG writes
