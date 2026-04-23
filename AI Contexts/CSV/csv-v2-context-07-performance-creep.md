# CSV V2 Context 07 — Entities Import Performance Creep

Date: 2026-04-23  
Scope: Diagnose progressive slowdown during long CSV entities imports.

## 1) Why this document exists

After fixing progress durability and reducing entities-import batch size to 10, imports now report
progress correctly, but a new runtime concern became clear: throughput degrades as processing advances.

This doc is a focused handoff for the next agent to diagnose where time is being spent.

## 2) Recent changes already applied

1. Entities import default batch size reduced:
   - `CsvImportEntitiesJob` default `batchSize`: `1000 -> 10`.
2. Progress durability aligned with row processing:
   - row success path persists progress in the same transaction boundary as entity/file insert,
   - row failure path persists progress + row error in the same transaction boundary.
3. Focused verification:
   - `app/api/csv.v2/application/jobs/specs/CsvImportEntitiesJob.spec.ts` passed (7/7).

## 3) Current symptom

- Early import batches are fast (user-reported: first ~250 entities noticeably faster).
- Later batches are slower (user-reported + timing sample around rows 700+).
- Representative sample around rows 710..810 (10-row batches) shows many intervals around ~8-11s.
- Re-run confirmation:
  - Same CSV file executed again after prior 1000 entities already existed in the collection.
  - Early batches are fast again, then slowdown appears again later within the same run.

Interpretation:

- This is a **time-creep pattern** (progressive degradation) instead of fixed per-row throughput.
- This is likely **run-local accumulation** (in-job pressure growth), not primarily a static
  “collection size at start” penalty.

## 4) Key runtime operations still happening during import

Even with preflight, row import still performs non-trivial work:

1. Per-row entity creation transaction (`EntitiesService.insert`).
2. Per-row dispatch of `RelationshipSyncJob` from `EntitiesService.insert`.
3. Per-row import progress write to `csv_imports`.
4. Property-assignment strategy execution per mapped property; for some property types this includes
   DS access (relationship/select validation paths).

## 5) Diagnosis status (updated)

The original RelationshipSync-first hypothesis is now **falsified** by A/B tests:

- In A/B runs where `RelationshipSyncJob` dispatch was disabled for CSV import diagnostics,
  creep still persisted with very similar slope.
- This means RelationshipSync queue pressure is not the primary root cause of the time creep.

Confirmed primary root cause:

- `MongoTransactionManager` kept `onCommitHandlers` / `onRetryHandlers` arrays across repeated `run()`
  calls in the same manager instance.
- Per-row import transactions register commit handlers; without per-run cleanup, handler count
  grows monotonically and inflates transaction-overhead cost over time.
- This manifests as increasing `transactionOverheadMs` while core row work (`entityInsertMs`,
  `progressUpdateMs`, mapping) stays relatively stable.

## 6) Files to inspect first

Import chain:

- `app/api/csv.v2/application/jobs/CsvImportEntitiesRowsProcessor.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesBatchProcessor.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesContextLoader.ts`

Core side-effects:

- `app/api/core/application/EntitiesService.ts`
- `app/api/core/infrastructure/jobs/RelationshipSyncJob.ts`
- `app/api/relationships/relationships.js` (`saveEntityBasedReferences`)

Property assignment services:

- `app/api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.ts`
- `app/api/core/application/propertyAssignmentCreatorService/RelationshipPropertyAssignmentCreatorService.ts`
- `app/api/core/application/propertyAssignmentCreatorService/SelectPropertyAssignmentCreatorService.ts`

## 7) Diagnosis checklist (completed)

Completed confirmation sequence:

1. Measured per-batch wall time and row-step attribution across long runs.
2. Added queue-pressure sampling for `RelationshipSyncJob`.
3. Ran A/B with RelationshipSync dispatch disabled (diagnostic-only).
4. Added transaction-manager debug counters (`onCommitHandlersCount` / `onRetryHandlersCount`).
5. Verified direct correlation:
   - handler count grew linearly in creeping runs,
   - `transactionOverheadMs` rose with the same pattern.
6. Applied temporary manager-level per-run handler reset:
   - handler count stayed at `0`,
   - creep collapsed (stable throughput across full 1000-row run).

## 8) Guardrails while diagnosing

- Keep code changes in `app/api/csv.v2/**` unless explicit approval for core edits.
- Do not alter queue core contracts while diagnosing.
- Do not mark this track as complete until measurements identify dominant contributor(s)
  and a mitigation plan is reviewed.

## 9) Temporary diagnostics used during investigation

The investigation used temporary console-based instrumentation and temporary A/B behavior toggles
to isolate the bottleneck. These changes were diagnostic scaffolding only (not intended as permanent
product behavior).

Captured diagnostic signals included:

- per-batch throughput (`batchPerRowMs`, `creepRatio`),
- row-step timings (`transactionMs`, `transactionCallbackMs`, `transactionOverheadMs`, etc.),
- optional queue pressure samples,
- transaction-manager debug counters (`onCommitHandlersCount`, `onRetryHandlersCount`).

Temporary A/B mode used during diagnosis:

- CSV-v2 import path with RelationshipSync dispatch disabled (diagnostic-only) to test hypothesis,
- temporary transaction-manager handler reset patch to validate causality.

## 10) Confirmed diagnosis (A/B + causality validation)

Date: 2026-04-23

### 10.1 Baseline run (before A/B)

Observed in baseline diagnostics:

- Severe in-run creep:
  - early batches around `~27ms/row`,
  - late sampled batches around `~600ms+/row`.
- `rowTimings.transactionOverheadMs` grew continuously with batch index.
- Relationship-sync queue also grew in baseline runs, but this was not yet causal proof.

### 10.2 A/B run with RelationshipSync dispatch disabled (diagnostic-only)

Temporary CSV-v2-only wrapper disabled `RelationshipSyncJob` dispatch during import.

Result:

- `relationshipSyncQueue.deltaFromStart` remained `0`.
- Creep remained largely unchanged.
- `transactionOverheadMs` still increased strongly with batch index.

Conclusion:

- Relationship-sync queue pressure is **not** the primary root cause of this creep.

### 10.3 Transaction-manager handler accumulation probe

Added diagnostics field:

- `transactionManagerDebug.onCommitHandlersCount`

In the unchanged (creeping) run:

- `onCommitHandlersCount` increased almost perfectly linearly with processed rows
  (roughly `+10` per 10-row batch).
- `transactionOverheadMs` increased with the same progression pattern.

This established a direct in-run accumulator correlated with slowdown.

### 10.4 Temporary core patch to validate causality (diagnostic-only)

Temporary patch in `MongoTransactionManager.run(...)`:

- clear `onCommitHandlers` and `onRetryHandlers` at run start,
- clear again in `finally`.

Validation run result (1000 rows):

- `transactionManagerDebug.onCommitHandlersCount` stayed `0` across all batches.
- Creep collapsed:
  - `batchPerRowMs` stabilized around `~7-9ms`,
  - `transactionOverheadMs` stayed low and stable (~`35-45ms` per 10-row batch),
  - no progressive growth pattern.
- Total import:
  - `processedRows: 1000`,
  - `avgPerRowMs: 7.52`,
  - `processRowsMs: 7764`.

Final conclusion (confirmed):

- Progressive entities-import slowdown was primarily caused by **accumulation of transaction-manager
  commit/retry handlers across runs inside the same manager instance**, which inflated transaction
  overhead over time.

### 10.5 Scope and cleanup note

All diagnosis instrumentation and temporary behavior toggles used in this investigation are disposable.
If code is discarded after diagnosis, preserve this document as the source of truth for:

- observed symptoms,
- A/B falsification of RelationshipSync primary-cause hypothesis,
- confirmed root cause,
- verified temporary fix behavior.

## 11) Affected implementations under strict transaction-scoped handler model

If `TransactionManager.onCommitted` / `onRetry` are changed to be strictly transaction-scoped
(allowed only while a transaction is active, and throwing outside `run()`), the following
non-test implementations are affected and would lose behavior unless migrated.

### 11.1 Affected (constructor-level registrations; behavior would be missing)

1. `app/api/core/infrastructure/mongodb/CachedMongoSettingsDataSource.ts`
   - Current use: constructor registers `onCommitted` to clear settings cache.
   - Missing after strict-scoped change: cache no longer auto-invalidates after commits;
     stale settings/language reads can persist.

2. `app/api/core/infrastructure/mongodb/thesauri/CachedMongoThesauriDataSource.ts`
   - Current use: constructor registers `onCommitted` to clear thesauri cache.
   - Missing: stale thesauri entries may be served after writes.

3. `app/api/i18n.v2/database/CachedMongoTranslationsDataSource.ts`
   - Current use: constructor registers `onCommitted` to clear translations cache.
   - Missing: stale translations may be returned after updates.

4. `app/api/core/infrastructure/mongodb/template/CachedMongoTemplatesDataSource.ts`
   - Current use: constructor registers `onCommitted` to clear templates cache.
   - Missing: stale template/default-template reads.

5. `app/api/core/infrastructure/elasticSearch/entities/MongoSlotsDAO.ts`
   - Current use: constructor registers both `onCommitted` and `onRetry` to invalidate slot cache.
   - Missing: stale slot map reuse across commits/retries, risking incorrect slot assignment behavior
     and retry flows operating with outdated cache state.

6. `app/api/entities.v2/database/MongoMultiLanguageEntityDataSource.ts`
   - Current use: constructor registers three `onCommitted` handlers to:
     - run `search.indexEntities`,
     - run `entityIndexerService.index` for mutated entities,
     - run `entityIndexerService.deleteBySharedIds` for deleted entities.
   - Missing: search/index synchronization with entity writes stops.
   - Additional risk: in-memory accumulators (`modifiedSharedIds`, `mutatedEntities`,
     `deletedEntities`) can grow without being flushed.

7. `app/api/core/infrastructure/mongodb/files/MongoFilesDataSource.ts`
   - Current use: constructor registers `onCommitted` handlers to:
     - reindex entities/files and trigger full-text indexing for processed PDFs,
     - delete full-text entries for removed files.
   - Missing: full-text/search index drift for created/updated/deleted files.
   - Additional risk: in-memory accumulators (`filesToReindex`, `fileToDelete`) can grow.

8. `app/api/core/infrastructure/mongodb/template/MongoTemplatesDataSource.ts`
   - Current use: constructor registers `onCommitted` to call `updateMapping` with mutated templates.
   - Missing: template mapping updates stop, creating search/schema divergence.

### 11.2 Not affected (already transaction-scoped registrations)

The following implementations register handlers inside active transaction flows and are compatible
with strict transaction-scoped semantics:

- `app/api/core/application/EntitiesService.ts`
- `app/api/core/application/FilesService.ts`
- `app/api/relationships.v2/services/DenormalizationService.ts`
- `app/api/relationships.v2/services/propertyUpdateStrategies/OnlineRelationshipPropertyUpdateStrategy.ts`
- `app/api/relationships.v2/services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob.ts`

### 11.3 Architectural implication

A strict scoped-only contract is safer for long-running jobs and avoids handler accumulation,
but constructor-level cross-transaction side effects (cache invalidation and indexing hooks)
must be migrated to a centralized infrastructure mechanism before enforcing that contract.

