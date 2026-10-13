# Sync cursors on Postgres

The `syncs` collection is the worker's cursor. It is not a synced namespace. One document per sync config name, in the tenant database: `name`, `lastSyncs` (namespace → timestamp), `consecutiveFailures`. `settings.sync` (url, credentials, template whitelist) stays where settings already live.

## Decision

`postgresCore` selects Mongo or Postgres, the same flag as update logs.

- Flag off: the mongoose `syncs` model (`syncsModel`).
- Flag on: the Postgres `syncs` table. The worker already runs inside the tenant context, so it branches the same way `lastChangesForCollection` does.

One row per config name. Columns: `tenant_id`, `name`, `last_syncs` (jsonb), `consecutive_failures`. Primary key `(tenant_id, name)`. The jsonb keys stay the wire namespaces (`files`, `entities`, `dictionaries`, and the rest). There is no id column. The worker looks up by `name`, and the Mongo `_id` is unused.

The module is `app/api/sync/syncs.ts`. It exports `syncs`, a bare object of functions, the same shape as `synchronizer`. The `postgresCore` branch lives inside that module. Postgres SQL stays in `PostgresSyncs`. Callers are `syncWorker` and `createSyncConfig`. The spec is `app/api/sync/specs/syncs.spec.ts`, and it imports the module with a relative path.

This stays V1. A DAO, a DataSource, a service, or a factory would mean the cursor had moved into the V2 hexagon, and the worker has not. "Store" is not a role in the architecture notes. The suffix was dropped for that reason.

`syncs` does not write update logs. It is not in the sync order. Pushing the cursor to a target would be wrong.

The worker and `createSyncConfig` both take `SettingsSyncSchema` from `app/shared/types/settingsType.ts`. There is no second sync-config interface. `syncConfig` does not import the worker, so the two files no longer depend on each other.

The five operations stay:

- create the row if it is missing
- read `lastSyncs`
- set one namespace timestamp, leaving the others in place
- reset `consecutiveFailures` to 0
- increment `consecutiveFailures`, creating the row if the failure happens before the first successful tick

Copy existing Mongo documents with `migrateToPostgres.ts`, in the `postgresCore` group, alongside `updatelogs`. Turning the flag on without that copy leaves `lastSyncs` empty, and the next tick resends every log since the beginning.

Mongo specs that read `syncs` directly stay on that path. The Postgres path has its own coverage.

This does not remove a Mongo connection from the Postgres data sources. That dependency left when update logs moved.
