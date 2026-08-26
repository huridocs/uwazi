# Settings → V2 hex + Postgres

## Objective

Give Settings the same two-step treatment as relationship types and translations:

1. **V2 hex in `app/api/core`**, still on Mongo `settings`, same public HTTP.
2. **Postgres cutover** behind a per-tenant flag, one store, no dual-write.

This is the planning doc for both phases. Pattern sources: [`../Relationship Types/relationship-types-v2-migration.md`](../Relationship%20Types/relationship-types-v2-migration.md), [`../Relationship Types/relationship-types-postgres.md`](../Relationship%20Types/relationship-types-postgres.md), [`../Translations/translations-v2-migration.md`](../Translations/translations-v2-migration.md), [`../Translations/translations-postgres.md`](../Translations/translations-postgres.md).

## Status

- **Analysis / planning** — this document
- **V2 implementation** — **done** (Mongo). Core owns reads/writes: `SettingsDataSource` + `SettingsQueryService` + `SaveSettings` / `SaveSettingsLinks` / `SetDefaultLanguage` / filter use cases; HTTP `/api/settings*` is in `core/infrastructure/express/settings`; sync namespace `settings` is a `SyncHandler`. V1 `app/api/settings` is gone.
- **Postgres** — blocked until a later cutover (schema 016, flag `postgresSettings`). Do not start PG until this V2 slice has soaked.

---

## Why Settings is different

It is **one document per tenant**, not a collection of named rows. The Mongo collection is schemaless (legacy mongoose `strict: false`). Several fields are HTTP secrets (`publicFormDestination`, `sync`, `evidencesVault`). All reads/writes go through core (`SettingsDataSource` / use cases / query service). Language add/delete stay on the existing `AddLanguageUseCase` / `DeleteLanguageUseCase`.

| Aspect | Settings | Closest PG module |
| --- | --- | --- |
| Cardinality | **Singleton** per tenant | Nothing else; users/thesauri are many rows |
| Shape | Large nested blob (`languages`, `links`, `filters`, `features`, `sync`, …) | Templates mix columns + JSONB; usergroups `members` JSONB |
| Schema | Mongoose `strict: false` (unknown keys exist, e.g. `evidencesVault`) | Must round-trip extras — JSONB, not a frozen column list |
| Secrets | `publicFormDestination`, `sync`, `evidencesVault` (`select: false`); admin GET opts into `+publicFormDestination` only | Application-layer whitelist stays (`publicSettings.ts`) |
| Translations | Menu / Filters contexts updated on save | Same `TranslationsService.updateContext` as today |
| Sync | Namespace `settings` via `MongoSettingsSyncHandler` | Inbound POST **applies onto the existing singleton `_id`**. Outbound `processNamespaces.settings()` sends **`{ _id, languages }` only** |
| ES | None | Same as thesauri / relationship types / translations |
| HTTP | `GET/POST /api/settings`, `GET/POST /api/settings/links` | Stable, like `/api/relationtypes` |

**Do not** copy Entities’ partial flag. **Do not** normalize `languages` / `links` / `filters` into child tables in v1 — every language mutation today is `$push` / `$set` / `$pull` on the same document.

---

## Current architecture (after Phase 1)

```
HTTP /api/settings*                    Other callers (mailer, IX, templates, …)
        │                                          │
        ▼                                          ▼
 core express controllers              QueryService / use-case factories / DS
        │                                          │
        ▼                                          ▼
 SaveSettings / SetDefaultLanguage / filter UCs / SettingsQueryService
        │
        ▼
 SettingsDataSource (MongoSettingsDataSource)
        │
        ▼
 Mongo collection `settings`
```

- **`SettingsQueryService.get()`** — V1-compatible read: defaults + omit `sync` / `evidencesVault` / `publicFormDestination`.
- **`SettingsQueryService.getForHttp(isAdmin)`** — public whitelist vs admin (admin re-adds `publicFormDestination` only).
- **`SettingsDataSource.find()` / `get()` / `patch()`** — persistence; `get()` throws if missing (language UCs); `find()` returns null; `patch()` is a `$set` merge onto the singleton.
- **Language HTTP** uses `AddLanguageUseCase` / `DeleteLanguageUseCase`, then QueryService for `updateSettings`.
- **Template HTTP** uses `UpdateFilterNameUseCase` / `RemoveTemplateFromFiltersUseCase`.
- **Secrets** are stored in Mongo and stripped in QueryService / HTTP, not via mongoose `select: false`.

### Public HTTP (must stay)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/settings` | Admin: stored doc (minus `sync`/`evidencesVault`) + `publicFormDestination` + public payload overlay. Others: `getPublicSettingsPayload` whitelist |
| POST | `/api/settings` | Admin. Socket `updateSettings` with **public** payload |
| GET | `/api/settings/links` | `settings.links` |
| POST | `/api/settings/links` | Body is the links array; **partial** `$set` of `links` onto the stored singleton |

Socket: `updateSettings`.

Callers that previously imported `#api/settings` now use `SettingsQueryServiceFactory` (safe reads), `SettingsDataSourceFactory` (secrets / language mutators / sync), or the save/filter/links use-case factories.

---

## Transferable principles

| Principle | Apply to Settings |
| --- | --- |
| Stable external contract | Paths, GET whitelist, sockets, AJV save rules stay |
| Hex in `app/api/core` | Domain / use cases / contract / adapters / factories / express |
| No application upsert | Explicit Save / SetDefaultLanguage / SaveLinks / filter mutators |
| Contract-driven side effects | Menu/Filters translations via `TranslationsService`, not a settings-owned i18n façade |
| Integration-first tests | DB assertions; auth mock OK at routes |
| One store + flag/copy/cutover | After V2; no dual-write of the settings row |
| Mixed Mongo+PG is not 2PC | Same P12 as translations: one `this.transactionManager.run()`; no DualStore |

---

## Phase 1 — V2 hex (Mongo)

### Goal

Core owns Settings **reads and writes**. `app/api/settings` becomes a thin re-export or is deleted. Collection stays `settings`. No Postgres in this phase.

### Expand `SettingsDataSource`

Today the contract is a language/feature helper. It has to become the persistence port for the singleton:

- `get()` — full document (including secrets). Public shaping stays in HTTP / `publicSettings.ts`, not in the DS.
- `save(settings)` — replace the singleton (preserve `_id`).
- Existing language mutators stay (AddLanguage / DeleteLanguage already depend on them).
- Filter/link helpers can be use-case logic on `get` + `save`, or DS methods if they stay `$` operators. Prefer **load → domain change → save** so Mongo and PG share one path. The singleton is small.

`get(query, select)` mongoose projections are an HTTP/admin concern. Do **not** put `+publicFormDestination` string syntax on the port. Admin vs public is `publicSettings.ts` + an explicit “include destination” flag on the GET controller.

### Use cases (mutations)

| Use case | Replaces | Side effects |
| --- | --- | --- |
| `SaveSettings` | `settings.save` | AJV (or domain invariants); Menu/Filters `TranslationsService.updateContext`; if `newNameGeneration` flips on → template name-generation update (today `TemplateFacade.update`) |
| `SaveSettingsLinks` | `POST /api/settings/links` | Merge `links` onto stored doc, then same translation path as save |
| `SetDefaultLanguage` | `settings.setDefaultLanguage` / translations `setasdeafult` | Languages array only |
| `UpdateFilterName` | template rename | Nested filters; translations via save path |
| `RemoveTemplateFromFilters` | template delete | Nested filters; translations via save path |

Language add/delete **already exist** — do not create a second pair. Point leftover V1 `addLanguage` / `deleteLanguage` at the DS or delete them.

GET `/api/settings` and GET links: **QueryService or thin controller → DS.get()**. No `GetSettingsUseCase` (do not copy RT’s Get* use case).

### HTTP

Reimplement `/api/settings*` as core controllers (Zod where useful, same I/O). Keep `updateSettings` socket + public payload overlay.

### Sync (still Mongo)

Settings is the last major namespace on raw ODM (`models.settings().save`). Inbound `/api/sync` **forces** `data._id` to the target singleton `_id`. Outbound only `{ _id, languages }`.

**Do this in Phase 1:** `SettingsSyncHandler` + registry entry for `settings`, preserving:

1. Target `_id` rewrite (singleton).
2. Merge/replace semantics of today’s ODM save (inbound payload is usually languages-only).
3. Outbound `processNamespaces.settings()` still `{ _id, languages }` until product says otherwise.

Then Phase 2 is a factory flag, not a new sync protocol.

### Tests

Integration-first: save + Menu/Filters translation keys, links merge, default language, filter nest, public vs admin GET, `newNameGeneration` template touch, sync `_id` rewrite. Dual-backend `describe.each` comes in Phase 2.

### Phase 1 non-goals

- Postgres schema, flag, copy CLI
- Changing GET whitelist or exposing `sync` / `evidencesVault` on GET
- Changing outbound sync to a full document
- Frontend Settings UI rewrite
- Child tables for languages/links/filters

---

## Phase 2 — Postgres

**Prerequisite:** Phase 1. The factory cannot switch a mongoose `settingsModel.save` that other modules still call.

### Locked decisions

| ID | Decision |
| --- | --- |
| S1 | PG table **`settings`**. Sync namespace stays **`settings`**. |
| S2 | `_id TEXT` + `tenant_id` composite PK (shared `PostgresTable` / `SyncLogWriter`). `_id` is 24-char ObjectId hex. Copy **preserves** Mongo `_id`. |
| S3 | **One row per tenant:** `UNIQUE (tenant_id)`. Never insert a second settings row. |
| S4 | Body is **`document JSONB`**. Mapper: domain ↔ `{ _id, ...document }`. Unknown keys survive (`strict: false`). Do not freeze today’s `settingsType` as columns. |
| S5 | RLS + `tenant_isolation` in the **same** schema migration as `CREATE TABLE` (next delta: **016**). |
| S6 | One store. Copy Mongo → PG, flip `postgresSettings`. No dual-write of the settings row. Flag is **one-way** after any PG write. |
| S7 | New row (blank tenant) mints `_id` via `IdGenerator` in the use case / DS factory wiring — **not** `new ObjectId()` inside the PG DS. |
| S8 | Language `$push`/`$pull` become read-modify-write of `document` inside the PG TM (singleton). Do not add a `settings_languages` table in v1. |
| S9 | `cached()`: when the flag is on, return the same PG DS as `default()` (translations pattern). Optional later: cache `languageKeys` with `onCommitted` clear — not required to ship. |
| S10 | Sync handler factory branches on the same flag. Inbound still rewrites to the tenant’s `_id`. Outbound still `{ _id, languages }` until a separate product change. |
| S11 | Public/admin field filtering stays in HTTP (`publicSettings.ts`), not in SQL column grants. JSONB stores secrets; GET still omits them for non-admin. |
| S12 | Mixed store is P12: one use-case `run()`. While hybrid, Mongo TM for leftover Mongo collections; PG settings auto-commit unless the use-case TM **is** the PG TM (both settings and translations flags on → pass `postgresTransactionManager` as `this.transactionManager`). No DualStore. Staging-only hybrid. |

### Schema (proposed)

`app/api/core/infrastructure/postgresql/schema_migrations/016-create-settings-table.sql`

```sql
CREATE TABLE IF NOT EXISTS settings (
  "_id"       TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "document"  JSONB NOT NULL,
  PRIMARY KEY ("_id", "tenant_id"),
  UNIQUE ("tenant_id")
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON settings
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
```

`current_tenant()` already exists (004).

### Adapter

1. `PostgresSettingsMapper` — `_id` ↔ domain `_id`; rest in `document` (strip `_id` / `__v` from JSONB).
2. `PostgresSettingsDataSource` extends `PostgresDataSource`, table `settings`, implements the Phase 1 contract.
3. Deps: `tenantId` + `mongoDb` (updatelogs) + `pgTransactionManager`. **No** Mongo TM in the PG DS (no ES hook).
4. `sync: { syncNamespace: 'settings', syncDb }`.
5. `SettingsDataSourceFactory` — Templates/Thesauri/Translations shape: flag from `ExecutionContext.currentTenant`, PG TM from EC, fail loudly if flag on without PG context.

### Feature flag

| Surface | Name |
| --- | --- |
| Tenant flag | `postgresSettings` |
| Local ENV | `FEATURE_FLAG_POSTGRES_SETTINGS=true` (do not flip `config.ts` defaults) |

Wire: `config.ts` → `tenantContext.ts` → `tenantsModel.ts` → DS factory → sync handler factory → dual-backend tests.

Cutover per tenant: schema (cluster-wide) → copy → flip flag → smoke GET/POST settings, links, add/delete language, template rename/delete filters, admin vs public GET.

**One-way after flip:** Mongo `settings` goes stale (languages, site name, sync config, filters).

### Data copy

`MigrateCollectionToPostgres` + `SettingsMigrationConfig`:

- `mongoCollection: 'settings'`, `pgTable: 'settings'`
- Map `_id` to hex; remaining fields → `document` JSONB (keep `select:false` fields; copy is ops, not GET)
- Tenant must have **exactly one** Mongo settings doc; fail loudly if 0 or >1
- Idempotent skip if the tenant already has any PG row (engine default)
- CLI: `--collection settings` on `scripts/scripts.v2/migrateToPostgres.ts`

### Hybrid inventory (after flag on, other collections maybe Mongo)

Same class of risk as translations P12. Notable:

| Location | Settings write | Notes |
| --- | --- | --- |
| `SaveSettings` | PG upsert | Menu/Filters translations may already be PG (`postgresTranslations`) or Mongo |
| `AddLanguageUseCase` | `addLanguage` + `setLanguageInstalling` | Clone translations + entity clone jobs; settings row is not last |
| `DeleteLanguageUseCase` | `deleteLanguage` | Inverse |
| Template create/update/delete | filter name / remove template | Socket `updateSettings` |
| `syncWorker` | reads `sync` via `SettingsDataSource.find()`; disable via `deactivateSyncConfig` | Must not go through `SettingsQueryService.get()` (that strips `sync`) |
| Inbound `/api/sync` settings | upsert by rewritten `_id` | Handler, not ODM |

`persistSettingsAndTranslations` (Mongo TM + `dbSessionContext` + mongoose save) **dies in Phase 1**. Replacement is `SaveSettings` + `TranslationsService` inside one `run()`.

---

## Implementation order

### Phase 1 (V2 / Mongo)

1. Expand `SettingsDataSource` + Mongo DS + specs (`save`, full `get`, no mongoose select strings).
2. Domain invariants (default language, link URLs) — reuse AJV `validateSettings` at the use-case boundary unless a small `Settings` model pays for itself.
3. `SaveSettings` / `SaveSettingsLinks` / `SetDefaultLanguage` / filter use cases + Menu/Filters translations.
4. Core HTTP controllers for `/api/settings*`; keep sockets + public payload.
5. `SettingsSyncHandler` + registry; keep `_id` rewrite and languages-only outbound.
6. Sweep `#api/settings` / `settingsModel` runtime imports to factories/DS (mailer, contact, IX, syncWorker, template controllers, …).
7. Delete or shrink `app/api/settings` to re-exports if anything external still needs the path.
8. Update this MD.

### Phase 2 (Postgres)

1. Schema `016` + RLS.
2. Mapper + PG DS + specs (CRUD, singleton unique, RLS as `app_user`, JSONB extras).
3. Flag `postgresSettings` + factory + `cached()`.
4. Sync handler PG branch.
5. `SettingsMigrationConfig` + CLI + specs (0/1/>1 Mongo docs).
6. Dual-backend use-case and route specs (`describe.each`).
7. Local dry-run: schema → copy → flag → GET/POST / links / languages / template filters / public vs admin.
8. Update this MD (pitfalls, dry-run).

---

## Do not

- Dual-write Mongo + PG
- Enable the flag by default
- Turn the flag off after PG writes
- Put `ObjectId` / `new ObjectId()` in the PG DS
- Split languages/links/filters into child tables in v1
- Encode mongoose `select: false` as “column missing in PG” — store them, hide them in HTTP
- Change `/api/settings` contracts or the public whitelist as part of this work
- Expand outbound sync to the full document without a product decision (passwords live on `sync`)
- Skip Phase 1 and branch the factory on mongoose
- Copy Entities’ table-without-RLS or query-only flag
- Nest a second `TM.run()` / invent DualStore
- Reintroduce `GetSettingsUseCase`

---

## Key reference files

| Concern | Path |
| --- | --- |
| V1 façade | `app/api/settings/settings.ts` |
| V1 mongoose | `app/api/settings/settingsModel.ts` |
| Save + Menu/Filters translations | `app/api/settings/settingsTranslations.ts` |
| Public GET whitelist | `app/api/settings/publicSettings.ts` |
| HTTP | `app/api/settings/routes.ts` |
| Shared type / AJV | `app/shared/types/settingsType.d.ts`, `settingsSchema.ts` |
| V2 DS + cache | `app/api/core/infrastructure/mongodb/MongoSettingsDataSource.ts`, `CachedMongoSettingsDataSource.ts` |
| Contract / factory | `app/api/core/application/contracts/SettingsDataSource.ts`, `…/factories/SettingsDataSourceFactory.ts` |
| Language UCs | `app/api/core/application/AddLanguage.ts`, `DeleteLanguage.ts` |
| Inbound sync `_id` rewrite | `app/api/sync/routes.ts` (`namespace === 'settings'`) |
| Outbound sync subset | `app/api/sync/processNamespaces.ts` (`settings()`) |
| Copy engine / CLI | `…/postgresql/migrations/MigrateCollectionToPostgres.ts`, `scripts/scripts.v2/migrateToPostgres.ts` |
| RLS pattern | `…/schema_migrations/015-create-translations-table.sql` |
| Tenant flags | `app/api/config.ts`, `tenants/tenantContext.ts`, `tenants/tenantsModel.ts` |

---

## Open (do not block Phase 1)

- Whether `syncWorker` should get a dedicated `getSyncConfig()` on the DS vs full `get()` (full `get()` is enough if V2 always loads secrets server-side).
- Whether a domain `Settings` class is worth it vs AJV + a typed document. Lean AJV at SaveSettings unless invariants spread.
- Staging collision: any tenant with **zero or multiple** `settings` docs — copy must fail; fix data before flag.
- Outbound sync remaining `{ languages }` only — document here if product ever wants more (never `password` without a separate design).
