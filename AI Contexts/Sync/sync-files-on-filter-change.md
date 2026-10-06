# Sync files when an entity crosses the sync filter

Date: 2026-09-29
Status: implemented. Mongo refreshes `files` logs on entity insert and update (`SyncedCollection`). Postgres does the same for every non-delete entity write, including raw metadata updates, access-policy updates, and language clone (Decisions 2026-10-06). Entity delete and language delete write `entities` logs with `deleted: true` and do not refresh file logs. Follow-ups from that day: `afterSyncLog` stays, `PostgresEntitiesDAO` is split under the line limit, the namespace rename is deferred, and the Postgres log column is `id` (not `mongoId`). See Decisions (2026-10-06, follow-ups).

## Problem

Sync walks `updatelogs` since `lastSyncs.<namespace>` and pushes each row to the target. An entity and its files are separate rows, in separate namespaces (`entities` and `files`).

Creating an entity with a file, creating an entity by uploading a file, or appending a file writes a `files` update log. A later edit of the entity writes an `entities` update log and leaves the file logs alone. That is right when the file bytes did not change. It is wrong when the edit changes the answer of the sync filter:

- Filter was true, edit makes it false. The entity is deleted on the target. Its files stay.
- Filter was false, edit makes it true. The entity is created on the target. Its files are not uploaded.

A template change is not a separate case. Sync never sees the old template or the old metadata. It loads the entity as it is now: template in this config, and the filter matches, then create or update; otherwise delete. Files follow that same current-state check once their logs are refreshed. `entityIsAllowed` already does both checks, in that order.

Deleting the entity on the source is a different path. That deletes the file rows too, and those deletes write their own `files` logs with `deleted: true`. This note is about the entity still existing on the source while the target should gain or lose it.

## What the code does today

### The worker

`syncWorker.syncronizeConfig` loads up to 50 update logs (`UPDATE_LOG_TARGET_COUNT`), in this namespace order: settings, translationsV2, dictionaries, relationtypes, templates, **files**, connections, **entities**. For each log, `shouldSync`:

- `deleted: true` on the log, or `process()` returns `{ skip: true }` → `DELETE /api/sync` with that namespace and `_id`. The target is not checked first. A delete of a row the target never had is a no-op (`deleteOne` / `DELETE` of zero rows).
- `process()` returns `{ data }` → `POST /api/sync` with that document. For `files`, if `filename` is set and `url` is not, the blob is uploaded after the metadata POST.

`lastSyncs.<namespace>` advances only after that HTTP call succeeds.

### The filter applies to files, when a file log is processed

`ProcessNamespaces.entityIsAllowed`:

1. Entity template must be a key of this config's `templates`.
2. If that template entry has a `filter` string, `sift(JSON.parse(filter))` must match the entity document.

`ProcessNamespaces.entities` loads the entity by the log's `mongoId` (one language row) and runs `entityIsAllowed`. Skip deletes that language row on the target. The target entity delete removes the row and the search document. It does not delete files or blobs.

`ProcessNamespaces.files` does use the entity filter:

- `type === 'custom'` → sync, no entity check. Custom files have no entity.
- Otherwise, if `file.entity` is set, load **one** entity with that `sharedId` (`entitiesDao().find({ sharedId })`, no language, no sort). Missing entity → skip. Template config without `attachments: true` → skip. `entityIsAllowed` false → skip.
- Otherwise sync the file (metadata, and the blob unless `url` is set).

The `attachments` flag gates every non-custom file that has an entity: documents, attachments, and thumbnails. The name is narrower than the check. Product rule: files and thumbnail previews are part of this fix only when that template's sync config has `attachments: true`. When it is absent or false, `files()` returns skip, and the target delete runs. The fix must keep going through `files()`. A side path that uploads an entity's files without that flag would violate the rule.

`preview` on the entity row is a different field. It is a filename string on each language document, set from thumbnails by `Entity.setPreview`. It is sent with the entity payload whenever the entity syncs. `entities()` does not look at `attachments`. Thumbnail **files** (the blobs) are what the flag controls.

So the belief in the task is right: a file log is accepted or rejected by the parent entity's template whitelist, the attachments flag, and the sift filter. The file is only re-judged when **its own** log is newer than `lastSyncs.files`. An entity edit does not create that log on the current write path, so the judgment never runs again.

### Who writes the logs

Update logs are one row per document id (`mongoId`), upserted with a new `timestamp` and `namespace`. With `postgresCore` off they live in Mongo `updatelogs`. With the flag on they live in the Postgres `updatelogs` table, and the sync worker reads that table. The `syncs` cursor (`lastSyncs`, `consecutiveFailures`) stays in Mongo.

**Mongo, current entity saves** (`postgresCore` off). `POST /api/entities` goes through `UpdateEntity` → `MongoEntitiesDataSource.bulkUpdate` → `SyncedCollection`. That writes an `entities` log for the entity `_id`s touched. It does not look at `files`.

**Mongo, legacy ODM save.** `EntitiesUpdateLogHelper.upsertLogOne` (used by `OdmModel.save` / `create` / `saveMultiple` on the `entities` model) writes the entity log **and** refreshes existing `files` logs whose `entity` is that `sharedId`. Covered by `app/api/odm/specs/EntitiesUpdateLogHelper.spec.ts`: document, attachment, and thumbnail timestamps move; a custom file and another entity's files do not. `upsertLogMany` only updates logs that already exist (`_updateMany`, no upsert), and it reads files through the Mongo ODM model. The V2 save path does not call this helper.

**Postgres, current entity saves** (`postgresCore` on). `PostgresEntitiesDataSource` writes through a `PostgresPermissionEnforcedTable`. That table receives a `SyncLogWriter` for `entities` and an `afterSyncLog` hook, so `insert`, `update`, `bulkUpdate`, `delete`, and `upsert` write `updatelogs` and, unless the log is a delete, refresh `files` logs. The writer constructed on the unused parent table from `super()` is not the one that runs.

`table.raw` still never notifies by itself. The callers that use it now `RETURNING` the affected `_id`s and `recordSync` them:

- `deleteMetadataProperties`, `renameMetadataProperties`, `deleteReferencesToSharedIds`, and `bulkUpdateDeprecated`.
- `PostgresEntityAccessPolicyDataSource.bulkPersist` — `permissions` and `published` on every language row of each `sharedId`. That permission table has the same writer and hook. The Mongo side already did this through `updateMany` / `bulkWrite`.
- `PostgresEntitiesDAO.cloneForLanguage` / `deleteByLanguage`. Clone's `ignore` upsert notifies inserted ids only. `delete()` notifies `deleted: true` and does not refresh files. `unrestricted()` builds a new DAO with the same Postgres transaction manager, so it logs too.

A log is one row per language-row `_id`, not per `sharedId`. A sharedId-keyed update records every language row it changed. Non-delete logs refresh `files` logs for files whose `entity` is one of those `sharedId`s.

`PostgresEntitiesSyncHandler` (the target, receiving a sync) does pass a `SyncLogWriter` into its permission table. That is the inbound side, not the source save.

**Files.** `MongoFilesDataSource` uses `SyncedCollection` (default). `PostgresFilesDataSource` passes `syncNamespace: 'files'`. Creating, updating, or deleting a file row writes a `files` log. `PostgresFilesDAO` / `FilesDAOFactory` do not pass a sync writer; they are the read DAO. A metadata-only entity save does not call `FilesService.insert` / `delete` / `bulkUpsert`, so no file log is written. Renaming a file or changing its selections does write one, because `bulkUpsert` updates the file row.

## Consequences already fixed by a file log, and those that are not

| Event | Entity log | File logs | Target result |
|---|---|---|---|
| Create entity with file, or upload a file | yes | yes | Both judged. Filter false → both deleted on target. Filter true and `attachments: true` → both stored, blob uploaded. |
| Append / remove / rename a file | only if the entity row is also saved | yes, for the files touched | Those files re-judged. |
| Edit metadata, filter stays true or stays false | yes | yes, except an entity delete | Entity re-judged. Files follow, including a touch that only changes `editDate`. |
| Edit metadata, filter flips | yes | yes, except an entity delete | Entity appears or disappears. Files follow. |
| Delete entity on the source | yes, `deleted: true` | yes, `deleted: true`, via `FilesService.deleteEntityFiles` | Both deleted on target. |

`skip: true` always calls delete. A file that never reached the target is deleted again, harmlessly. A file that did reach it loses the row and, when `filename` was stored, the blob (`routes.ts` delete handler).

## Options

All of these assume we keep today's rule: the entity filter decides the files, and a failed check deletes on the target rather than checking whether the target has the row.

### 1. Refresh file update logs whenever the entity is written

Same idea as `EntitiesUpdateLogHelper`, on the V2 write path.

On every entity insert/update/delete that already writes an `entities` log, also upsert `files` logs (`deleted: false`, new timestamp) for every non-custom file with that `sharedId`. The existing `files()` method then re-applies template whitelist, `attachments`, sift, blob upload, and delete.

- One code path. No second copy of the filter.
- Works for every sync config. Logs are global; each config re-judges with its own filter and its own `lastSyncs`.
- Must run where the file rows actually are (Mongo files collection or Postgres `files`), not via the V1 helper's Mongo ODM read.
- On Postgres this is useless until entity writes themselves emit `entities` logs (the missing `syncWriter` on `PostgresEntitiesDataSource`'s permission table). Otherwise there is no entity event to hang the file refresh on, and entity sync is already not seeing those edits.
- Cost: every metadata edit re-queues every file of that entity, for every active config. Each passing file is POSTed again and, unless it has `url`, the blob is uploaded again. Thumbnails included, because `files()` does not exclude them. An entity with many PDFs can fill the 50-log batch with file work; the entity log waits for a later tick. Files are ordered before entities, which is already how a brand-new entity is synced.
- `upsertLogMany`'s "update existing logs only" behaviour should not be copied. `SyncLogWriter.upsertSyncLogs` inserts the log if it is missing.

### 2. While processing an entity log, also push or delete its files

In `syncronizeConfig`, when the change namespace is `entities` and `shouldSync` has decided, find files for that entity's `sharedId` and call `syncData` / `syncDelete` for each. Do not write file logs.

- No extra update logs, so other configs are not woken up.
- The decision uses the language row in the entity log, which is the row whose filter just flipped. Option 1 does not: the later file pass still loads an arbitrary language via `find({ sharedId })`.
- Duplicates the file rules (custom vs entity file, `attachments`, `url` vs blob, delete of the blob) unless `files()` is called per file anyway. Calling `files()` means loading each file and running the arbitrary-language lookup, which throws away the language-specific decision just made.
- The 50-log budget counts entity logs, not the files hanging off them. One entity can upload or delete a large set inside a single change. A throw midway does not advance `lastSyncs.entities`, so the tick retries the entity and the files. That is safer than advancing past a half-applied set, and it holds the worker longer.
- A config that is not the one being processed is untouched. Good. A second config still needs its own entity log to be pending, which it will be, because logs are shared and `lastSyncs` is per config.
- Postgres source saves that never write an entity log never enter this path either.

### 3. Refresh file logs only when the filter answer changes

Same mechanism as option 1, gated.

Before and after the entity write, run `entityIsAllowed` for each active sync config. If any config's answer changes (including template whitelist), upsert the file logs. If none change, leave the files alone.

- The common edit (metadata that does not cross a filter) does not re-upload blobs.
- When one config flips and another does not, **all** configs still reprocess the files, because there is a single `files` log. The config that did not flip pays one extra pass. Its `files()` result should match what the target already has (pass → upload again, fail → delete again).
- The gate has to see the entity before and after the write, and the sync settings. `SyncedCollection` / `SyncLogWriter` do not have that. The natural place is the entity data source, which means every write method, including the Postgres `raw` metadata updates that can change a property the filter reads.
- Editing the filter string in settings, without an entity write, still does not re-judge existing entities or files. That is a separate hole. Not part of this bug unless we decide it is.
- Same Postgres prerequisite as option 1.

### Not recommended

Calling `EntitiesUpdateLogHelper` from V2. It reads files from the Mongo ODM, updates logs in place without inserting missing ones, and only `upsertLogOne` (single-document save) touches files. `updateMany` on the entities model does not.

Storing "last filter result" on the target or in a new table so we can diff. More machinery than the bug needs, and the worker would have to read the target.

## Adjacent, not this bug

- **Connections** do not go through `entityIsAllowed`. They check that the entity's template is whitelisted, then relationship-type rules. A sift flip does not, by itself, pull connections off the target.
- **Changing the filter text** in the sync config does not rewrite update logs. Entities and files stay at their previous target state until something else writes a log.
- **Inbound sync** on a Postgres target writes an `entities` update log (`PostgresEntitiesSyncHandler` passes `syncWriter`). Mongo sync handlers set `useSyncedCollection: false` so a received document does not bounce back out. Worth knowing if a target is also a source. Not the filter bug.

## Decisions (2026-09-29)

Production sync tenants are Mongo. This change is that path only.

**Option 1.** On an entity insert or update, refresh `files` update logs for the files of that `sharedId`. The existing `files()` path decides sync or delete. That is what `EntitiesUpdateLogHelper.upsertLogOne` did on V1 `save`. V2 entity writes never called it.

Option 3 is out. The save path can read the previous document, so this is not because the past is unknowable. Sync's job is current state. Evaluating sync configs inside entity writes would be a second copy of `entityIsAllowed`. V1 did not do that.

Accepted cost: every such write re-queues those file logs for every active config. A passing file with `attachments: true` is uploaded again (metadata always, blob unless `url` is set), including edits that do not cross a filter and touches that only change `editDate`. A file that fails, or whose template has no `attachments: true`, produces a delete call. Templates that are not in the config still spend batch slots, because the log is written before the config is consulted. The batch size stays 50.

### What gets refreshed

Hook the entity log write in `SyncedCollection` when the collection is `entities`, not `UpdateEntity`. V1 only overrode `upsertLogOne`. `updateMany` did not refresh files. V2 saves through `MongoEntitiesDataSource.bulkUpdate`, and so do thesaurus denormalization, relationship denormalization, `touchEntitiesBySharedIds`, and metadata rewrites. Those can change fields a filter reads. A use-case-only hook misses them.

Do not refresh file logs when the entity log is a delete. Source delete already removes file rows in `FilesService.deleteEntityFiles`, and those writes set `files` logs to `deleted: true`. `EntitiesService.delete` dispatches that cleanup and then `bulkDelete`s the entity. A bump back to `deleted: false` can clear the file-delete log. V1 did not bump files on entity delete.

### How the file is judged

No new filter. `files()` already loads one entity with `find({ sharedId })` and runs `entityIsAllowed`, then the `attachments` flag.

Languages stay as they are. A filter can in theory pass for one language row and fail for another, and entity sync already upserts or deletes per language row. Uwazi is not built for an entity to exist in only some of its languages on a target; a filter that produces that split would break more than sync. We do not add a workaround (default language, any language, all languages). Whichever row `find({ sharedId })` returns is the row that decides the files.

`attachments: true` on that template's sync config is required for documents, attachments, and thumbnails. Missing or false means skip, which deletes on the target. Custom files stay outside this (`type === 'custom'`). The `preview` string on the entity row is part of the entity payload and is not gated by this flag. Thumbnail files are.

Template changes are entity writes. Sync loads the current template and runs the same check. No old-versus-new branch.

Do not change `COLLECTION_SYNC_ORDER`. `files` is drained before `entities`, so refreshed file logs are applied before the entity row in the same tick. That is already how a new entity is synced.

### Out of scope

Editing the sync config (filter text, template list, `attachments`) does not rewrite logs. A from-scratch resync remains the remedy.

Connections are not part of this. They do not go through `entityIsAllowed`.

Postgres entity writes, including the raw paths, the access-policy update, and language clone, now write `entities` logs and refresh `files` logs unless the entity log is a delete. The shape of that is the next section.

## Decisions (2026-10-06)

Passing `syncWriter` into the entity permission table is the fix for `insert`, `update`, `bulkUpdate`, `delete`, and `upsert`. It is not the fix for `table.raw`. Those statements never call the writer, so attaching one changes nothing until the caller records the affected row ids.

The same file-log rule as Mongo applies on Postgres: a non-delete entity log refreshes `files` logs (`deleted: false`, new timestamp) for every file whose `entity` is one of those rows' `sharedId`s. Missing logs are created. A log sitting at `deleted: true` is cleared. Custom files have no `entity` and are not matched. Other entities' files are not matched. A `deleted: true` entity log does not refresh files. Source delete already removes file rows and writes their own delete logs. Bumping those back to `deleted: false` would undo the delete.

`files()` still decides sync or delete. The write path does not reimplement `entityIsAllowed`. Collection order stays files then entities. Batch size stays 50.

### Where the entity log is written

1. Metadata raw updates on `PostgresEntitiesDataSource`: `deleteMetadataProperties`, `renameMetadataProperties`, `deleteReferencesToSharedIds`, and `bulkUpdateDeprecated`. After the `UPDATE`, `RETURNING` the `_id`s and record them. The first three touch every language row of the affected `sharedId`s. The deprecated bulk update touches only the `(sharedId, language)` pairs it patched. Recording the returned ids, not every row of the sharedId, keeps that difference.
2. `PostgresEntityAccessPolicyDataSource.bulkPersist`. Give that permission table the same writer and hook. The SQL updates every language row of each policy `sharedId`. `RETURNING t."_id"`, then record those ids. One policy is several entity logs.
3. `PostgresEntitiesDAO`. The permission table gets the same writer and hook. `unrestricted()` constructs a new DAO, so it must get them too. Clone and delete need no extra SQL: `upsert({ ignore: true })` already notifies the inserted ids, and `delete()` already notifies `deleted: true`. An entity that already has the target language is not re-logged. That matches "leave the existing target-language row alone".

### File logs

One hook, `afterSyncLog`, on the table config, run from the same place that writes the entity log (`insert`, `update`, `bulkUpdate`, `delete`, `upsert`, and a public `recordSync` used by the raw callers). Both `PostgresTable.for` and `PostgresPermissionEnforcedTable.for` have to copy it. `chain()` already keeps the config.

The hook returns immediately when `deleted` is true or there are no ids. Otherwise, inside the tenant transaction, select `sharedId` from `entities` for those `_id`s, then `_id` from `files` where `entity` is one of those sharedIds, then upsert `files` logs with `deleted: false`.

The lookup uses the writer's permission context (`bypass` for a privileged actor, otherwise that actor's ref ids). `withConnection` with no context sets `uwazi.bypass_rls` to false and would hide rows from the session that just wrote them. Files are tenant-isolated only, so the file query does not apply entity permissions. The entity query must still see the rows just written.

## Decisions (2026-10-06, update logs on Postgres)

`updatelogs` moves with `postgresCore`. Postgres data sources, DAOs, and sync handlers do not take a Mongo connection. `SyncLogWriter` upserts the Postgres table through the transaction manager already on the table. When that manager has a transaction open, the log commits with the row. That upsert does not reset `uwazi.bypass_rls`, so a privileged transaction stays privileged after the log is written. Mongo `SyncedCollection` and the V1 mongoose helpers still write the Mongo collection, and they only run when the flag is off.

The table is `tenant_id`, `id`, `namespace`, `timestamp`, `deleted`. `id` is the changed document's id, stored as text. Unique on `(tenant_id, id)`, matching the Mongo upsert, which keys on `mongoId` alone and overwrites `namespace`. Index `(tenant_id, namespace, timestamp)` for the worker query. Tenant row-level security only. Entity permissions do not apply.

`createSyncConfig.lastChangesForCollection` reads that table when the flag is on, and the mongoose model when it is off. The reader maps the `id` column back to `mongoId` on the object the worker already uses. `syncs` stays in Mongo. `lastSyncs` is a timestamp and stays valid if the copied log timestamps are the same.

Existing Mongo logs are copied by `migrateToPostgres.ts` under the `postgresCore` group (`UpdateLogsMigrationConfig`). A tenant that flips the flag without that copy has an empty Postgres log, and the worker will not see changes that were still only in Mongo.

The log write does not reimplement the filter. Collection order and batch size stay as they are.

## Decisions (2026-10-06, follow-ups)

### `afterSyncLog` stays

The file refresh does not move into `SyncLogWriter`. That writer is the generic upsert for every namespace. Teaching it to load entities and files would couple it to those two tables, and every `entities` writer would refresh files, including `PostgresEntitiesSyncHandler`. A received entity must not re-queue that target's files.

The hook stays opt-in on the table config. `PostgresPermissionEnforcedTable` copies it because entity writes use that table, not the parent from `super()`. Only `PostgresEntitiesDataSource`, `PostgresEntityAccessPolicyDataSource`, and `PostgresEntitiesDAO` pass it. The inbound handler does not.

### `PostgresEntitiesDAO` is split

The class file is under the 300-line limit and no longer disables `max-statements`. Query building is `entityQuery.ts` (filters are a list of appliers, not a chain of `if`s). The row map is `entityRow.ts`. Joining files is `entityFilesJoin.ts`. Language clone and language delete are `entityLanguageBatches.ts`. Behavior is unchanged.

### Namespace rename is a later development

The stored namespace stays the Mongo collection name, including `dictionaries`, `translationsV2`, and `relationtypes`. A translation only at send time does nothing while the log, `lastSyncs`, and the target still use those strings. Postgres writers keep passing that name. Replacing it with the Postgres table name, and translating at the boundary that talks to a Mongo target, is a separate change.

### The Postgres column is `id`

Not `mongoId`. The column is text and holds the changed document's id, the same value as that row's `_id`. `(tenant_id, id)` is the primary key. The Mongo document field is still `mongoId`. `UpdateLogsMigrationConfig` copies that field into `id`. `readUpdateLogs` maps `id` back to `mongoId` for the worker, so `ProcessNamespaces` and the HTTP payload are unchanged.
