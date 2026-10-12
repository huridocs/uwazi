# Sync cursors on Postgres

The `syncs` collection is the worker's cursor. It is not a synced namespace. One document per sync config name, in the tenant database: `name`, `lastSyncs` (namespace → timestamp), `consecutiveFailures`. `settings.sync` (url, credentials, template whitelist) stays where settings already live.

## Decision

`postgresCore` selects the store, the same flag as update logs.

- Flag off: the mongoose `syncs` model.
- Flag on: the Postgres `syncs` table. The worker already runs inside the tenant context, so it branches the same way `lastChangesForCollection` does.

One row per config name. Columns: `tenant_id`, `name`, `last_syncs` (jsonb), `consecutive_failures`. Primary key `(tenant_id, name)`. The jsonb keys stay the wire namespaces (`files`, `entities`, `dictionaries`, and the rest). There is no id column. The worker looks up by `name`, and the Mongo `_id` is unused.

A small store used only by `syncWorker` and `createSyncConfig`. It does not write update logs. `syncs` is not in the sync order. Pushing the cursor to a target would be wrong.

The five operations stay:

- create the row if it is missing
- read `lastSyncs`
- set one namespace timestamp, leaving the others in place
- reset `consecutiveFailures` to 0
- increment `consecutiveFailures`, creating the row if the failure happens before the first successful tick

Copy existing Mongo documents with `migrateToPostgres.ts`, in the `postgresCore` group, alongside `updatelogs`. Turning the flag on without that copy leaves `lastSyncs` empty, and the next tick resends every log since the beginning.

Mongo specs that read `syncs` directly stay on that path. The Postgres path has its own coverage.

This does not remove a Mongo connection from the Postgres data sources. That dependency left when update logs moved.
