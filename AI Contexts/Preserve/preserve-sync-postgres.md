# Preserve cursor on Postgres

The Preserve cursor is the integration's pointer. It is not a synced namespace and it is not the Preserve configuration. One document per token, in the tenant database: `token`, `lastImport`. The mongoose model is named `preserveSync`; the collection it writes is `preservesyncs`, because mongoose pluralizes that name. `settings.features.preserve` (host, master token, template, user) stays where settings already live.

## Status

Code is in the branch. The copy onto tenants that already have `postgresCore` on is still open, and only matters for tenants that have Preserve configured. See Landed and Copy before the branch is live.

## Decision

`postgresCore` selects Mongo or Postgres, the same flag as `syncs` and `updatelogs`. Do not add `postgresPreserve` or any other flag.

- Flag off: the mongoose `preserveSync` model (`preserveSyncModel`).
- Flag on: a Postgres `preserve_sync` table. The worker already runs inside the tenant context (`runInJobContext` → `ExecutionContextFactory.runForTenant`), so the branch reads `ExecutionContext` the same way `syncs.ts` does.

One row per token. Columns: `tenant_id`, `token`, `last_import` (text). Primary key `(tenant_id, token)`. There is no `_id` column. The worker looks up by `token`. The Mongo `_id` exists only so `save` can update the same document; Postgres upserts on the token.

`last_import` stays text. The value is the evidence `attributes.date` string, sent back to Preserve as `filter[date][gt]`. Parsing it into a timestamp would change that boundary. ISO-8601 strings already sort in time order, which is all the filter needs.

The module stays V1, same shape as `app/api/sync/syncs.ts`. A DAO, a DataSource, a use case, or a factory would put a two-field cursor in the hexagon while `preserveSync.ts` and the worker loop have not moved. SQL stays in something like `PostgresPreserveSync` under `app/api/core/infrastructure/postgresql/`. `preserveSync.ts` calls the module; it does not talk to mongoose or Knex itself.

Two operations:

- read by token, or null when this token has never imported
- upsert `lastImport` for that token after a tick that returned evidences

No delete. Removing a token from the Preserve config leaves the cursor. That is the current behavior.

The cursor does not join the entity transaction in `saveEvidence`. A crash mid-tick leaves `lastImport` where it was, and the next tick asks Preserve again from that date. Keep that.

## What this is

`app/worker.ts` runs `preserve_integration` on a 30s `DistributedLoop`. Each tick calls `preserveSync.syncAllTenants()`, which walks tenants and, when `settings.features.preserve` is set, calls `sync`.

For each config entry the tick:

1. Loads the cursor with `preserveSyncs.read(token)`. Flag off reads `preserveSyncModel`. Flag on reads `preserve_sync`.
2. GETs `{host}/api/evidences?filter[status]=PROCESSED`, and `filter[date][gt]={lastImport}` when a cursor exists.
3. Creates one entity (plus attachments) per evidence that has a title. Empty titles are skipped.
4. If the response had any evidences, `preserveSyncs.save` stores `{ token, lastImport }` from the **last** item in that array. The Mongo branch still passes `_id` through so mongoose updates the same document. Postgres upserts on the token.

Settings, users, entities, and files on this path already go through V2 factories and follow `postgresCore`. With the flag on, the cursor is no longer a Mongo read. Templates and thesauri inside `saveEvidence` are still the V1 facades. They are out of scope.

## Already in place

- `postgresCore` is the single core cutover flag (`app/api/tenants/featureFlags.ts`, `FEATURE_FLAG_POSTGRES_CORE` in `config.ts`). `isPostgresCoreActive()` in `app/api/core/libs/featureFlags.ts` is the helper. Relationship types, settings, update logs, and sync cursors all branch on it. The per-module flags in `AI Contexts/Relationship Types/relationship-types-postgres.md` (`postgresTemplates`, `postgresRelationshipTypes`, …) are gone.
- The copy script groups collections by that flag. `scripts/scripts.v2/migrateToPostgres.ts` `FLAG_GROUPS.postgresCore` includes `updatelogs`, `syncs`, `preserve_sync`, then `activitylogs`. `preserve_sync` has no foreign keys, so that position does not matter if `activitylogs` has already been copied. A re-run skips a table that already has a row for that tenant and copies a table that is still empty for them. A tenant with no Mongo cursors copies nothing; the table stays empty, and the next run tries again and still copies nothing.
- Schema files in `app/api/core/infrastructure/postgresql/schema_migrations/` are applied in order by the test helper and by `yarn migrate`. `current_tenant()` and the `tenant_isolation` policy pattern already exist (`033-create-syncs-table.sql` is the closest copy: small table, RLS in the same file, no `_id`).
- `MigrateCollectionToPostgres` plus a `MigrationConfig` (`mongoCollection`, `pgTable`, `mapDocument`, `conflictColumns`) is the copy. `SyncsMigrationConfig` is the model: drop `_id`, conflict on the natural key, spec covers the mapper and one real copy.
- The worker tick already has a Postgres transaction manager. `preserveSync.syncAllTenants` uses `runInJobContext`, so `ExecutionContext.postgresTransactionManager` is set before `sync` runs. `PostgresSyncs` shows the connection shape: `withConnection`, `preservePermission: true`, tenant id from `ExecutionContext.currentTenant.name`.
- Preserve settings are not part of this move. `SettingsDataSourceFactory` already reads `features.preserve` from whichever backend `postgresCore` selected.
- The existing spec pins the Mongo behavior and forces the flag off: `app/api/services/preserve/specs/preserveSync.spec.ts` builds its tenant with `featureFlags: { postgresCore: false }` and reads the cursor through `preserveSyncModel`. That spec stays the Mongo integration test.

## Landed

- [x] Schema `035-create-preserve-sync-table.sql`: `preserve_sync` with `tenant_id`, `token`, `last_import TEXT NOT NULL`, primary key `(tenant_id, token)`, RLS in the same file.
- [x] `PostgresPreserveSync` with `read(token)` and `save(token, lastImport)` (upsert on conflict).
- [x] A V1 module the tick calls, branching on `postgresCore`. Mongo branch keeps using `preserveSyncModel`. `preserveSync.ts` stops calling the model directly.
- [x] `PreserveSyncMigrationConfig`: collection `preservesyncs` → table `preserve_sync`, drop `_id`, `conflictColumns: ['tenant_id', 'token']`. Registered in `configs/index.ts` and in the `COLLECTIONS` map, in `FLAG_GROUPS.postgresCore` immediately before `activitylogs`. No foreign keys, so the slot does not have to stay after any particular table. Copying the model name `preserveSync` would miss every row.
- [x] A dual-backend spec in the style of `app/api/sync/specs/syncs.spec.ts`: first save creates the row, second save for the same token replaces `lastImport`, a missing token reads null, and the other tenant's row is invisible. The existing `preserveSync.spec.ts` does not need a Postgres twin; it reaches past the module into mongoose.
- [x] One flag-on check that the second tick's Preserve query uses the Postgres `last_import`. The big spec cannot see that, because it reads the mongoose model between ticks.

No feature-flag registry change. No sync handler. No Elasticsearch mapping. No `testingEnvironment` mirror entry: nothing seeds `preserveSync` in fixtures, and `syncs` is not mirrored either. Specs clear and read the table directly.

## Not a sync namespace

`preserveSyncModel` is an `instanceModel`, so every Mongo `save` / `create` also writes an `updatelogs` row with namespace `preserveSync`. `syncs` does not, because `syncsModel` is a `MongooseModelWrapper`.

Those logs are unused. `COLLECTION_SYNC_ORDER` in `app/api/sync/syncConfig.ts` is settings, translations, dictionaries, relation types, templates, files, connections, entities. Preserve tokens are local to this instance's integration. Copying `lastImport` to another Uwazi would make that instance skip evidences it has never stored.

The Postgres path does not write update logs. Leave the Mongo model as it is, so the flag-off path keeps writing the unused rows. Do not add the namespace to the sync order, and do not special-case those rows in the update-log copy.

## Copy before the branch is live

An empty cursor means "import every PROCESSED evidence", and only when `settings.features.preserve` is set. The tick never reads the cursor otherwise. A tenant that already has `postgresCore` on and Preserve configured, running this code before its rows are copied, will create those entities again on the next tick. A tenant with the flag on and Preserve turned off is unaffected.

Order:

1. [x] Ship the schema in this branch. An unused empty table is safe with the old code.
2. [ ] Run `migrateToPostgres` for every tenant that has `postgresCore` on (and any tenant about to turn it on). `preserve_sync` is empty, so the script will not skip it. Tables already copied, including `activitylogs`, stay skipped. Order inside the group does not change that.
3. [ ] Then deploy the branch, or start the worker that contains it.

Tenants with the flag off keep reading Mongo. Copying them early only leaves unused rows. Do not drop the Mongo collection in this change.

Mongo has no unique index on `token`. The application writes one document per token; a race could have written two. The generic copier inserts one row per document and does not merge. Two documents with the same token fail the insert, the batch rolls back, and that tenant's `preserve_sync` copy stays empty until the duplicates are removed. Do not use `--force` to get past that: `ON CONFLICT DO NOTHING` would keep whichever row was inserted first and might drop a later `lastImport`. Clean the duplicates, then copy. A missing `lastImport` should fail the same way rather than be skipped: skipping it is another empty cursor, and the next tick re-imports.

## Out of scope

- The evidence import itself: templates, thesauri, entities, files, attachments.
- Preserve setup (`app/api/preserve/preserve.ts`) and the settings screen.
- A new feature flag, a sync handler, or a domain model for the cursor.
- Deleting Mongo `preservesyncs`, or the stray `updatelogs` rows the model produced.
