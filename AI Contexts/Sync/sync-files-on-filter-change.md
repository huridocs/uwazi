# Sync files when an entity crosses the sync filter

Date: 2026-09-29
Status: option 1 chosen, not implemented. Challenges below are still open.

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

Update logs still live in Mongo `updatelogs`, for both databases. One row per (`namespace`, `mongoId`), upserted with a new `timestamp`.

**Mongo, current entity saves** (`postgresCore` off). `POST /api/entities` goes through `UpdateEntity` → `MongoEntitiesDataSource.bulkUpdate` → `SyncedCollection`. That writes an `entities` log for the entity `_id`s touched. It does not look at `files`.

**Mongo, legacy ODM save.** `EntitiesUpdateLogHelper.upsertLogOne` (used by `OdmModel.save` / `create` / `saveMultiple` on the `entities` model) writes the entity log **and** refreshes existing `files` logs whose `entity` is that `sharedId`. Covered by `app/api/odm/specs/EntitiesUpdateLogHelper.spec.ts`: document, attachment, and thumbnail timestamps move; a custom file and another entity's files do not. `upsertLogMany` only updates logs that already exist (`_updateMany`, no upsert), and it reads files through the Mongo ODM model. The V2 save path does not call this helper.

**Postgres, current entity saves** (`postgresCore` on). `PostgresEntitiesDataSource` constructs a `SyncLogWriter` for namespace `entities` on the table created by `super()`, then overrides `table` with a `PostgresPermissionEnforcedTable` that is **not** given that writer. `bulkUpdate`, `insert`, and `delete` on the permission table therefore do not write `updatelogs`. Raw metadata updates (`deleteMetadataProperties`, `renameMetadataProperties`, `deleteReferencesToSharedIds`) go through `table.raw` and would not write logs even if the writer were attached. There is no spec that a Postgres entity insert/update produces an `entities` update log.

`PostgresEntitiesSyncHandler` (the target, receiving a sync) does pass a `SyncLogWriter` into its permission table. That is the inbound side, not the source save.

**Files.** `MongoFilesDataSource` uses `SyncedCollection` (default). `PostgresFilesDataSource` passes `syncNamespace: 'files'`. Creating, updating, or deleting a file row writes a `files` log. `PostgresFilesDAO` / `FilesDAOFactory` do not pass a sync writer; they are the read DAO. A metadata-only entity save does not call `FilesService.insert` / `delete` / `bulkUpsert`, so no file log is written. Renaming a file or changing its selections does write one, because `bulkUpsert` updates the file row.

## Consequences already fixed by a file log, and those that are not

| Event | Entity log | File logs | Target result |
|---|---|---|---|
| Create entity with file, or upload a file | yes | yes | Both judged. Filter false → both deleted on target. Filter true and `attachments: true` → both stored, blob uploaded. |
| Append / remove / rename a file | only if the entity row is also saved | yes, for the files touched | Those files re-judged. |
| Edit metadata, filter stays true or stays false | yes on Mongo V2; not on Postgres V2 (see above) | no | Entity re-judged. Files left as they were after their last file log. |
| Edit metadata, filter flips | same | no | Entity appears or disappears. Files do not follow. |
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

Production sync tenants are Mongo. This change fixes that path. Postgres entity saves not writing `updatelogs` is a separate issue, not part of this work. Do not open that issue until the note in "Challenges" is agreed, so the issue text tells the next change to refresh file logs too.

**Option 1.** When an entity row is written, refresh `files` update logs for files of that `sharedId`, and let the existing `files()` path decide. That is what `EntitiesUpdateLogHelper.upsertLogOne` did on V1 save. V2 entity writes never called it.

Option 3 is out. Not because the save path is unable to read the previous document (it can, in the same write). Because sync's job is to look at current state, and teaching every entity write to evaluate sync configs is a second copy of `entityIsAllowed`. V1 did not do that.

Out of scope, same as today: editing the sync config (filter text, template list, `attachments`) does not rewrite logs. A from-scratch resync is the existing remedy.

Template changes need no extra branch. They are entity writes. The next sync loads the current template and runs `entityIsAllowed`.

Files, attachments, and thumbnails move with that result only when `attachments: true`. Custom files stay outside the entity filter (`type === 'custom'` returns the file as-is).

## Challenges still open

These are disagreements with a naive reading of option 1, not a request to switch options.

**V1 did not cover every entity write.** `EntitiesUpdateLogHelper` overrides `upsertLogOne` only. `OdmModel.save`, `create`, and `saveMultiple` refresh file logs. `updateMany` does not. V2's normal save is `MongoEntitiesDataSource.bulkUpdate`, which is the `updateMany` shape. Hooking only `UpdateEntity` repeats the miss: thesaurus denormalization, relationship denormalization, `touchEntitiesBySharedIds`, and metadata rewrites also update entity rows through `SyncedCollection` and can change fields a filter reads. The file refresh belongs next to the entity log write in `SyncedCollection` when the collection is `entities`, not in the use case.

**Do not refresh file logs on entity delete.** Source delete already removes file rows in `FilesService.deleteEntityFiles`, and those writes set `files` logs to `deleted: true`. `EntitiesService.delete` dispatches that cleanup and then `bulkDelete`s the entity. A blanket "entity log written → set file logs `deleted: false`" can run after the file-delete log, or between them, and clear `deleted`. V1 did not bump files on entity delete. Option 1 should run for inserts and updates only.

**Re-upload is the cost of option 1, including edits that do not cross a filter.** Every refreshed file log is processed by every active config. Pass plus `attachments: true` means POST metadata and, unless `url` is set, upload the blob again. Fail, or `attachments` not true, means a delete call. Entities whose template is not in the config still consume part of the 50-log batch, because the log is written before the config is consulted. V1 accepted this on `save`. It is easy to under-count: a touch that only sets `editDate` goes through `SyncedCollection` too.

**Languages are not one filter result.** Uwazi expects every configured language to have a row, so "row missing in Spanish" is not a case to design for. Both rows can still disagree: `entityIsAllowed` runs on one language document, and a filter on a translated property can pass in English and fail in Spanish. Entity sync already deletes or upserts per language row. Option 1 does not change that. After the bump, `files()` still loads a single entity via `find({ sharedId })` with no language and no sort, and that row decides every file and thumbnail. That lookup is already how file logs work. Treating "the entity" as one pass/fail would be a new rule (for example default language, or any language). This fix should not invent it.

**Collection order is files, then entities.** Refreshing file logs makes files and thumbnails eligible in the `files` namespace, which the worker drains before `entities`. Inside one tick, blobs are uploaded or deleted before the entity row is. That matches a brand-new entity today. It is the opposite of "thumbnails post-sync after the entity" if that phrase means order rather than "also sync them when the entity is updated". Not changing `COLLECTION_SYNC_ORDER` as part of this unless that order is actually required. Reordering would change every file sync, not just filter crossings.

**Postgres follow-up, not this change.** `PostgresEntitiesDataSource` builds a `SyncLogWriter` and then does not pass it to the permission table it writes. When that is fixed, file logs will be missed again if the fix only writes `entities` logs. The follow-up issue should say: entity writes must emit `entities` update logs, and those writes must refresh `files` logs the same way the Mongo choke point does.
