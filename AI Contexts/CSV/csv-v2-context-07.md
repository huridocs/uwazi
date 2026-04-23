## CSV Import V2 — Context Doc 07 (Findings + Missing Work, Agent Handoff)

**Date:** 2026-01-29
**Owner:** CSV Import V2 initiative

### 1) Purpose

This document captures the current gaps, missing work, and immediate next steps discovered
while reviewing CSV v2 context docs, the v2 code, and v1 behavior. It is intended to
guide the next iteration and ensure the pipeline is complete before adding new logic.
It is also a handoff guide: a new agent should be able to continue by reading this alone.

### 1.2) Document mode (important)

This file is maintained as an **agent-readable working baseline**, not as an exhaustive
execution diary.

- Keep content focused on:
  - current system baseline,
  - what is still missing,
  - implementation constraints and conventions.
- Avoid adding long chronological iteration reports unless a detail is still necessary for
  active decisions.
- When historical detail exists, treat it as **context only**, never as the normative source
  for next actions.

### 1.3) Current open-work snapshot (normative)

Use this snapshot first; companion docs provide deeper implementation detail.

1. **Frontend handoff first:** publish concise frontend implementation notes (feature flags, endpoints, sockets, V1 vs V2 expectations). Source of truth: `AI Contexts/CSV/csv-v2-front-end-notes.md`.
2. Keep CSV v2 scoped inside `app/api/csv.v2/**` unless explicit approval is given for core edits.
3. Continue row-error taxonomy stabilization for UX-facing diagnostics and API projections.
4. Improve integration coverage (full chain + import batch/report/failure-threshold scenarios).
5. Stabilize test infrastructure behavior for CI-like parallel execution.
6. Publish user-facing import guidance (ReadTheDocs scope in section 19).
7. **Import progress/lock safety (new priority):** align progress checkpoint durability with row-import transaction scope and ensure heartbeat cadence does not depend on very large import batches.
8. **Entities import time-creep diagnosis (new):** investigate progressive slowdown during long imports (early batches fast, late batches significantly slower) despite preflight.

### 1.1) Critical working rule (highest priority)

- **DO NOT CHANGE CORE BEHAVIOR (queue, router, dispatcher, base controller, base result/error contracts, etc.) unless explicitly discussed in depth with the team/user first and approved.**
- If a CSV v2 change appears to require core edits, stop and escalate with a written proposal and alternatives that stay inside `csv.v2`.
- CSV v2 Jobs/Handlers must adhere to core queue typings and structures as-is.

### 2) Current v2 pipeline snapshot (code)

- Register import (`CsvImportEntities`) → extraction + row staging (`CsvExtractUploadedZipJob`)
- Preflight scan (thesauri + relationships pending values) (`CsvPreflightJob`)
- Create thesauri values (`CsvCreateThesauriValuesJob`)
- Create relationship entities (`CsvCreateRelationshipEntitiesJob`)
- Entities import (`CsvImportEntitiesJob`)

### 3) Missing or incomplete work

#### 3.1 Pipeline gaps

- Relationships creation stage now exists and performs real work (no longer dummy).
- Pipeline chaining is complete: thesauri create → relationships create → entities import.
- Entities import stage is implemented and wired into the pipeline.
- **Decision (Feb 2026):** align relationships with thesauri by splitting scan vs create using
  a single scan job and sequential apply jobs (no orchestrator).

#### 3.2 V1 parity gaps (deferred)

- Relationship parsing/creation semantics (from v1 `typeParsers/relationship.ts`) are
  now wired into v2 import using preflight-applied values, but full parity (warnings,
  sanitization behavior) is still pending.
- Files/attachments handling from v1 (`image`, `media`, `file`, `attachments`) is now
  implemented in v2 (see section 6.10). Remaining gaps are integration coverage
  (single-row import with files, missing file row errors, S3 vs disk IO).
- Sanitization warnings and row-level warnings are not surfaced in v2; only row errors
  are persisted.

#### 3.3 V2 boundary and tech debt

- `CsvEntitiesImportMapper` still imports `normalizeThesaurusLabel` from a v1 module.
- Thesauri creation still uses legacy adapters instead of v2 data sources.
- TODO: Audit `csv.v2` internal imports and ensure they use **relative paths** (avoid `/api` syntax).
- TODO: Ensure **all stages update `csv_imports.status`** (and stats) even when no work is done,
  so the UI can rely on status transitions instead of missing socket messages.
- Dedicated dependency audit/handoff for this workstream:
  - `AI Contexts/CSV/csv-v2-context-07-v1-dependencies.md`

#### 3.4 Tests and coverage gaps

- No integration coverage for the complete chain (register → extract → preflight →
  thesauri create → import).
- Entities import job now has a basic integration test (single-row happy path).
  Still missing tests for batch processing, row errors report, stop thresholds,
  and files/attachments integration (see 6.10).
- TODO (post-v1 removal): once legacy `/api/import` is retired, remove remaining
  v1 CSV route tests from `app/api/files/specs/uploadRoutes.spec.ts` and keep CSV
  route coverage only under `app/api/csv.v2/**`.

#### 3.5 Retention and cleanup

- No finalizer/sweeper job to remove staged rows and extracted artifacts.
- Original uploaded CSV/ZIP is not deleted after extraction.

#### 3.6 Status/event alignment

- Status naming is mostly colon-based; extraction still uses `extracting files` which is
  inconsistent with the rest of v2 status naming conventions. This needs a final decision
  and refactor if we want strict consistency.

#### 3.7 Progress query endpoints

- **Implemented (Feb 2026):** Added CSV entities-import read endpoints in `csv.v2`:
  - `POST /api/csvImportEntities` (V2-only register/import enqueue endpoint).
  - `GET /api/csvImportEntities/imports` returns `{ rows: [...] }`.
  - `GET /api/csvImportEntities/imports/:id` returns the raw import object body.
  - List rows include `status` as a first-class field for UX list rendering.
- **TODO (next iteration):**
  - Extend detail with explicit row-errors summary/report-path projection if UI needs a narrowed shape.
  - ✅ `GET /api/csvImportEntities/imports/:id` now includes:
    - `rowErrors`: array populated from `csv_import_row_errors` for the given import id.
    - `rowErrorsSummary`: summary/report pointer from `csv_imports.rowErrors` (when present).
  - **Nice to Have:** paginate `rowErrors` in import detail responses for very large failed-row sets.
  - ✅ Added dedicated failed-rows report download endpoint for CSV v2:
    - `GET /api/csvImportEntities/imports/:id/failed-rows-csv`
    - admin-only
    - returns `404` when report artifact is unavailable.
  - **Nice to Have:** paginate `GET /api/csvImportEntities/imports` results to keep large
    collections performant and improve UX load times.
  - Include already-persisted extraction metadata in the detail response so UX can render
    extraction completeness without relying on inferred socket progress:
    - `file.originalName` (original uploaded filename)
    - `file.size` (original uploaded size)
    - `extraction.extractedFilesCount` (files extracted from ZIP)
    - `extraction.totalFilesInZip` (when available)
    - `extraction.originalUploadSizeBytes`
    - `extraction.files[]` (`filename`, `sizeBytes`, `compressedSizeBytes?`)
  - This enables UI polling and recovery when socket events are missed.

#### 3.8 Discuss with team

- Relationship creation now uses `EntitiesService.create` per title, but `EntitiesService` is wired
  with cached settings/templates data sources (mirrors PX pattern) to avoid repeated DB reads.
- Ensure progress callbacks/heartbeats are emitted per batch (not only at end) for long runs.

#### 3.9 Import progress durability + long-running lock renewal (critical)

Production testing surfaced a critical mismatch in entities import behavior:

- A 1000-row CSV can remain at `progress: null` for a long interval, then jump from `0%` to `100%`.
- In multi-worker production, the same import produced duplicated entities (for example 2000 created
  from 1000 source rows), while local single-worker environments masked this issue.

Root causes identified in current implementation:

1. **Progress checkpoint durability is coarser than write durability.**
   - Entity creation commits per row transaction, but progress is persisted at the end of a larger
     batch checkpoint.
   - If rows commit and the worker crashes/retries before checkpoint persistence, replay can re-run
     committed rows.
2. **Heartbeat renewal is coupled to progress callback cadence.**
   - If progress emits only at large batch boundaries, lock renewal can be too sparse for long runs.
   - With multi-worker queue consumers, expired lock windows allow the same job to be picked again.

Required direction (must implement in CSV v2 scope):

- Progress advancement durability must match the import write durability boundary.
  - If writes are per-row transactions, progress checkpoints must be persisted per-row (or in the
    exact same micro-batch transaction as those writes).
- Heartbeat cadence must be independent from very large batch checkpoints.
  - Target frequent renewals/progress emission (for example every ~10 rows) so long imports do not
    rely on single coarse callbacks.
- Endpoint polling (`GET /imports/:id`) and socket events must expose intermediate progress for large runs.
- Add integration coverage for:
  - long-running import with lock-window pressure,
  - restart/retry between committed rows and checkpoint persistence,
  - multi-worker no-duplicate guarantee in the supported concurrency model.

Current implementation progress (Apr 2026):

- Entities import default batch size changed from `1000` to `10` in `CsvImportEntitiesJob`.
- Progress durability is now aligned to row processing:
  - success path: entity/file insert + import progress update in the same transaction boundary for each row,
  - failure path: row error insert + import progress update in the same transaction boundary for each failed row.
- Result: import progress sockets/endpoints now emit and persist intermediate progress every batch of 10 rows (instead of 0->100 jump for 1000-row imports).
- Focused integration verification passed:
  - `app/api/csv.v2/application/jobs/specs/CsvImportEntitiesJob.spec.ts` (7/7).

#### 3.10 Entities import time-creep under long runs (new, critical)

Observed behavior after the batching/progress fix:

- Import progress emits regularly every 10 rows (expected), but throughput degrades as the run advances.
- Example from production-style run:
  - around rows `710..810`, each 10-row batch took roughly `~8-11s`,
  - user observation: early batches (`1..5`) were much faster than late batches (`80+`).
- This indicates **progressive cost growth** (time creep), not a constant per-row cost.
- Additional confirmation (rerun signal):
  - Re-running the same CSV against a collection that already contains the previously imported entities
    still starts fast on early batches and slows again on late batches within that run.
  - This strongly suggests a **run-local accumulating bottleneck** rather than a simple baseline
    “collection already large” read penalty.

Known runtime work still executed during row import (post-preflight):

1. Per-row `EntitiesService.insert(...)` transaction.
2. Per-row dispatch of `RelationshipSyncJob` from `EntitiesService.insert(...)`.
3. Per-row `csv_imports` progress update (intentional durability fix).
4. Property-assignment creation path still calls service strategies that can query DS
   for relationship/select validations depending on template/property mix.

Initial hypothesis ranking:

1. **Most likely:** accumulated `RelationshipSyncJob` pressure and shared DB contention
   while import still writes entities/progress.
2. Secondary: property-assignment service reads (`getLanguageKeys`, relationship/shared-id checks,
   thesaurus/translations lookups) amplified by row count and template complexity.
3. Secondary: queue/jobs collection churn and index contention under high per-row dispatch rates.

Non-hypothesis note:

- Socket `2` / `3` frames seen in logs are transport ping/pong and are not import-stage work.

Handoff requirement:

- Next agent must perform focused diagnosis (no speculative refactor first) and isolate where
  batch wall-time increases:
  - import row transaction time vs
  - progress-update writes vs
  - relationship-sync enqueue/processing latency vs
  - downstream relationship write/search metadata updates.

### 4) Immediate next steps (agreed direction)

1. **Keep future work scoped**
   - Files/attachments handling is critical but the approach is still TBD
     (entities v2 vs a dedicated process).

### 5) Follow-up work (after the dummy stage is in place)

- Replace legacy thesauri/translations adapters with v2 data sources.
- Remove v1 imports from v2 services.
- Add the missing integration tests and finalizer/cleanup job.
- **DONE:** Relationship resolution is wired into entities import (via preflight-applied values).

9. **Relationships preflight refactor (done)**
   - Extracted helper logic into `CsvPreflightRelationshipsService`.
   - Removed ESLint/TS disables from the relationships job (now `CsvCreateRelationshipEntitiesJob`).

### 6) Legacy implementation history (archival, non-normative)

1. **Relationships create stage implemented**

   - Job: `app/api/csv.v2/application/jobs/CsvCreateRelationshipEntitiesJob.ts`.
   - Handler: `app/api/csv.v2/infrastructure/jobHandlers/CsvCreateRelationshipEntitiesJobHandler.ts`.
   - Uses pending relationship titles to create missing related entities using entities.v2.
   - Only creates entities for relationship properties that specify `content` (template id),
     matching v1 behavior.
   - Uses title-only entity creation (no required-property validation; entities.v2 allows this).
   - Statuses in `CsvImportStatus`:
     - `preflight:relationships:create`
     - `preflight:relationships:create:done`
   - Emits tenant-admin events:
     - `csvImport:preflight:relationships:create:start|progress|success|error`

### 6.12) Event semantics discussion (Feb 2026)

This was surfaced during manual testing of CSV V2: the relationships preflight emits two
`progress` events even when there are **zero** relationship properties, because the scan
phase and a final "completion" progress are both emitted before the `success` event. This
is confusing and inconsistent with thesauri preflight behavior.

**Current scan + apply split (now in code):**

- `CsvPreflightJob` (scan/pending-values build):
  - `csvImport:preflight:scan:start|progress|success|error`
- `CsvCreateThesauriValuesJob` (apply/create):
  - `csvImport:preflight:thesauri:create:start|progress|success|error`

**Issue observed (resolved in Feb 2026):**

- Relationships preflight originally scanned rows and created entities in the same job,
  causing duplicate progress emits when no relationships existed. This is now split.

**Proposed alignment (recommended):**

1. **Single scan job**: a unified preflight scan reads staged rows once and generates
   **pending artifacts** for both thesauri and relationships.
   - New collection for relationships: `csv_import_relationships_pending_values`
     (stores `{ importId, templateId, titles[], createdAt }`).
2. **Sequential apply jobs (no orchestrator):**
   - `CsvCreateThesauriValuesJob` (already exists) is the **single next phase** after scan.
   - It **always dispatches** `CsvCreateRelationshipEntitiesJob` on success (even if it did no work).
   - `CsvCreateRelationshipEntitiesJob` **always dispatches** the entities import job on success
     (even if it did no work).
   - Each job is a "dumb dispatcher" of the next stage; no fan-out or join logic.
3. **Event contract** (consistent with thesauri):
   - **Scan phase events (single job):**
     - `csvImport:preflight:scan:start|progress|success|error`
       - payload: `{ importId, processedRows, totalRows }`
   - **Apply phase events (per type, only if work exists):**
     - Thesauri: `csvImport:preflight:thesauri:create:start|progress|success|error`
     - Relationships: `csvImport:preflight:relationships:create:start|progress|success|error`
       - payload: `{ importId, processedTemplates, totalTemplates, createdEntities }`
   - **No progress emits when there is no work** (scan still emits; create does not).

**Rationale:**

- Keeps progress semantics meaningful (progress only when real work occurs).
- Avoids duplicate progress events when there are zero relationships.
- Makes relationships consistent with existing thesauri split.
- Reduces duplicate CSV row scans while preserving idempotent, sequential apply jobs.

### 6.13) Critical design constraint — relationship entity creation (Feb 2026)

**Context (manual testing):**

- CSV with relationship values succeeded in preflight and relationships-create, but **row import failed**
  with: `Translation for language 'es' does not exist. ["en"]`.
- This error is thrown when building relationship assignments, which **expects related entities to have
  translations for all UI languages**.

**Root cause (must not regress):**

- The current relationships creation path **does not use the Entities module**.
- It creates related entities directly via the Entity domain + data source, **only with the default
  language**, which violates the Entities module contract.
- This is why `getTitle('es')` fails during relationship assignment creation.

**Non‑negotiable requirements (explicitly confirmed):**

1. **Creating entities is the sole responsibility of the Entities module.**
   - CSV V2 must **not** manually construct multiple per‑language entity documents.
   - CSV V2 must **not** rely on low‑level domain/DS inserts to create entities.
2. The relationships creation step **must call the same Entities creation flow** used by the API or
   row import creation, with a minimal payload (title + template).
3. CSV V2 must **not** encode assumptions about how translations are stored (current model or future
   refactors).
4. Relationship creation **does not get multi‑language input** (only title), so it should delegate
   to the Entities module to build the full translation set.

**Required test (new):**

- Add a spec that proves **relationship‑created entities have all UI languages** using the Entities
  module creation flow (not by inspecting low‑level translation storage shape).
- This test should fail against the current relationships creation code until it is updated to use
  the Entities module properly.

**Summary instruction (for next agent):**

- Do **not** “fix” this by patching translation lookups or skipping missing languages.
- The correct fix is to **replace relationship entity creation** with the Entities module create
  use case so the Entities subsystem owns translation creation.

**Status (implemented):**

- Relationships creation now delegates to the Entities module (via entity creation use case),
  so translation setup is owned by Entities and not replicated in CSV.
- Creation batches missing titles and uses `EntitiesService.bulkInsert` per batch while building
  entities via `EntitiesService.create` (one per title).
- `EntitiesService` for this job now uses cached settings/templates DS (PX pattern) to avoid
  repeated DB reads per entity.
- Progress/heartbeat now emits per batch (before each bulk insert) to avoid worker timeouts.
- Entity creation logic moved out of the job factory into application-layer helpers:
  `app/api/csv.v2/application/services/CsvRelationshipEntitiesCreator.ts`.
- New integration spec added:
  - `app/api/csv.v2/application/jobs/specs/CsvCreateRelationshipEntitiesJob.spec.ts`
    validates that related entities are created with all UI languages.
- **Testing rule (explicit):** do not mock entity creation to assert calls. Use integration tests
  with real persistence to verify behavior. Mocking must remain minimal and only at boundaries.
- Manual verification: CSV with relationship values now imports successfully without
  translation errors (relationship-created entities get all UI languages).

2. **Pipeline chaining completed**

   - `CsvCreateThesauriValuesJob` now dispatches `CsvCreateRelationshipEntitiesJobHandler`
     inside the same transaction that sets `preflight:thesauri:create:done`.
   - `CsvCreateRelationshipEntitiesJob` dispatches `CsvImportEntitiesJobHandler`
     inside its success transaction.
   - Queue registry wiring added for the new handler.

3. **Job handler heartbeat behavior aligned**

   - Removed catch-path `heartbeat()` calls from:
   - `CsvCreateRelationshipEntitiesJobHandler`
     - `CsvImportEntitiesJobHandler`
   - Rationale: catch path only does quick DB writes (`markAsFailed`), so it does not need
     extra heartbeats beyond normal progress callbacks.

4. **Simplified `CsvCreateThesauriValuesJob` flow**

   - Removed the early `if (!pendingDocs.length)` guard.
   - Empty list now naturally falls through the same finalize/success path.

5. **Spec fix for new dispatch requirements**

   - `CsvCreateThesauriValuesJob.spec.ts` updated with a `jobsDispatcher` mock and
     added `tenantName`/`userId` to `execute` input.

6. **Core entities DS additions**

   - Added `getSharedIdsByTemplateAndTitles` to `MultiLanguageEntityDataSource` and
     implemented it in `MongoMultiLanguageEntityDataSource`.
   - Added unit test coverage in `MongoMultiLanguageEntityDataSource.spec.ts`.

7. **Relationships preflight batching improvements**

   - Added a configurable, top-of-file constant in `CsvCreateRelationshipEntitiesJob`:
     `RELATIONSHIP_TITLES_CHUNK_SIZE`.
   - Title lookups are now chunked to avoid large `$in` queries.
   - Creation runs in the same chunk size and updates an in-memory `knownTitles` set to
     prevent duplicates across chunks during the same import.

8. **Relationship applied-values persistence**

   - Added `csv_import_relationships_values` persistence (existing + newly created).
   - New DS: `MongoCsvImportRelationshipValuesDataSource` with `replaceValues` + `getByImport`.
   - Preflight now stores `label → sharedId` entries per template for later import usage.

9. **Relationships wired into entities import**

   - `CsvImportEntitiesJob` now loads relationship mappings and passes them to the mapper.
   - `CsvEntitiesImportMapper` applies relationship assignments during row import using
     preflight-applied values, matching v1's title-based relationship resolution.

10. **Files/attachments handling implemented in entities import**

- New helper `CsvImportRowFilesResolver` reads extracted files via `FileStorage`
  (`csv-imports/{importId}/extracted`) and builds `InputFile[]` for documents
  (`file` single-value with `file__{defaultLanguage}` support, plus `files` multi-value via `|`)
  and attachments (`attachments` column, split by `|`).
- `CsvEntitiesImportMapper` now returns `PropertyAssignmentInput` (not domain assignments)
  and can map image/media values to `{ attachment: index }` when filenames match attachments.
  This avoids duplicating domain normalization logic; trimming/validation happens in the
  property assignment services and domain validators.
- Entities import batch processor now:
  - resolves row files outside transactions,
  - uses `PropertyAssignmentCreatorServiceStrategy.bulkCreate(...)` to produce assignments,
  - stores files via `FilesService.storeFiles(...)` outside the DB transaction,
  - inserts entity + file records inside a per-row transaction (`EntitiesService.insert` +
    `FilesService.insert`).
- Queue wiring updated to inject `FilesService`, `PropertyAssignmentCreatorServiceStrategy`,
  and `IdGenerator` into `CsvImportEntitiesJob`.
- Unit spec updated: `CsvEntitiesImportMapper.spec.ts` now asserts attachment mapping and
  reflects that mapper passes raw values to the property-assignment layer.

11. **CSV v2 job factories added (Entities v2-style)**

- New factories for CSV v2 jobs:
  - `CsvExtractUploadedZipJobFactory`
  - `CsvPreflightJobFactory`
  - `CsvCreateThesauriValuesJobFactory`
  - `CsvCreateRelationshipEntitiesJobFactory`
  - `CsvImportEntitiesJobFactory` (refactored to match the same pattern)
- Queue registry now builds these jobs via factories.
- Tests were updated to use factories instead of hand-wiring dependencies.

12. **Relationship stats persisted (Feb 2026)**

- `CsvCreateRelationshipEntitiesJob` now updates import stats:
  - `relationshipValuesObserved`
  - `relationshipValuesCreated`
- When no relationship titles are present, these stats are explicitly set to `0`
  (job still updates status and dispatches the next stage).
- Spec coverage added for the **no-relationships** path (no progress emit, stats set to zero).

13. **V1 socket-compat layer removal (Apr 2026)**

- Removed temporary V1 socket compatibility bridge from CSV v2 flow.
- Removed `featureFlags.v1CSVImportCompat` and `CsvV1CompatEmitter`.
- CSV v2 handlers now emit only the native `csvImport:*` tenant-admin events.
- Legacy `IMPORT_CSV_*` socket stats continue to be emitted only by the V1 `/api/import` route flow.

14. **Extraction metadata persisted on imports (Feb 2026)**

- `CsvExtractUploadedZipJob` now persists extraction/source metadata into `csv_imports.extraction`
  on successful extraction:
  - `sourceType` (`zip` or `csv`)
  - `originalUploadSizeBytes`
  - `extractedFilesCount`
  - `totalFilesInZip` (ZIP only)
  - `files[]` with per-file size metadata (`filename`, `sizeBytes`, `compressedSizeBytes?`).
- Upload identity metadata remains on `csv_imports.file` and includes:
  - `originalName`
  - `mimeType`
  - `size`
- Integration coverage updated in:
  - `app/api/csv.v2/application/jobs/specs/CsvExtractUploadedZipJob.spec.ts`
  (CSV + ZIP assertions for extraction metadata persistence).
- UX data inventory doc added:
  - `AI Contexts/CSV/csv-v2-ux-data-inventory.md`

#### V1 compat removal checklist (completed Apr 2026)

1. Deleted `app/api/csv.v2/infrastructure/services/CsvV1CompatEmitter.ts`.
2. Removed `v1CSVImportCompat` from:
   - `app/api/tenants/tenantContext.ts`
   - `app/api/config.ts`
3. Removed compat wiring from `app/queueRegistry.ts`.
4. Removed optional `v1Compat` usage from CSV v2 job handlers.
5. Updated docs to reflect the bridge retirement.

### 7) Agent-specific notes (handoff)

- **Doc hygiene is mandatory:** Whenever a user gives new instructions or corrections,
  update the relevant CSV v2 context docs in the same iteration so the next agent can
  continue without extra guidance. These MDs are the source of truth.
- **Indexes context companion:** For CSV v2 Mongo indexing decisions and migration notes,
  read and maintain `AI Contexts/CSV/csv-v2-context-07-indexes.md` together with this file.
- **Cleanup context companion:** For terminal artifact-cleanup job design and handoff notes,
  read and maintain `AI Contexts/CSV/csv-v2-context-07-cleanup.md` together with this file.
- **Error taxonomy companion:** For row-error codes/messages/details standardization and
  implementation plan, read and maintain
  `AI Contexts/CSV/csv-v2-context-07-error-taxonomy.md` together with this file.
- **Queue test-pollution companion:** For queue isolation/cleanup hardening in CSV v2 specs,
  read and maintain
  `AI Contexts/CSV/csv-v2-context-07-queue-test-pollution.md` together with this file.
- **Performance-creep companion:** For entities-import throughput degradation findings, measurements,
  and diagnosis checklist, read and maintain
  `AI Contexts/CSV/csv-v2-context-07-performance-creep.md` together with this file.
- **Use CSV v2 job factories** for job wiring **and tests**. Do not hand-wire dependencies
  in specs; rely on the factories and override only where a test needs a specific stub.
- **Always pass `tenantName` + `userId` into job dispatch params.**
  `UserAwareDispatchable` requires them and throws if missing.
- **Dispatcher awareness**:
  `DefaultDispatcher(tenant, ...)` only namespaces the queue; it does NOT inject
  tenant/user into job params. Always include them explicitly.
- **Relationships stage now has real logic**:
  Keep it idempotent and transaction-aware; only create entities for relationship
  properties with `content` (template id), matching v1 behavior.
- **All CSV v2 jobs emit to tenant admins only** (`emitToTenantAdmins`), never to sessions.
- **Files in import**:
  - Extracted assets remain under `csv-imports/{importId}/extracted`.
  - Entity file persistence is handled by `FilesService` during entities import; no
    intermediate persistence layer exists or is needed.
- **Tests**:
  A new integration test covers `CsvImportEntitiesJob` (single-row happy path), but there are
  still no pipeline integration tests (register → extract → preflight → create → relationships → import).

### 9) TODO — CSV v2 tests pollute queue jobs

Running CSV v2 tests leaves jobs in the queue collection even when tests pass. The queue uses the
shared DB and default queue name; dispatched jobs are not auto-cleaned.

Scope clarification (Mar 2026):

- In `NODE_ENV=test`, shared DB resolves to `uwazi_shared_db_testing`, so this no longer pollutes
  the main shared DB used outside tests.
- Priority remains test quality/stability (cross-suite contamination/flakiness), but criticality is
  lower than before this isolation change.

Source of truth for this track:

- `AI Contexts/CSV/csv-v2-context-07-queue-test-pollution.md`

### 10) TODO — Improve row-level error messaging

Row errors are currently low-signal for end users (e.g., an empty CSV line can surface as
`Cannot read properties of undefined (reading 'Value')`). We should add explicit, user-friendly
errors/warnings for common parsing issues (empty line, missing required columns, malformed rows),
and avoid leaking internal exceptions directly to users.

Policy clarification (agreed):

- Preserve row index fidelity for analysis/import traceability.
- Row-error persistence cardinality is currently one error per failed row (first encountered failure).
- Multi-error per row is not part of the current write model and would require explicit design work.
- Malformed rows are true failures and must remain visible in row errors and failed-rows CSV.
- Empty source lines are explicit failures in row errors (to keep traceability), but must be
  classified as `ROW_EMPTY_OR_MALFORMED` with message `Empty line.` (never generic `INTERNAL_ERROR`).
- Empty-line row errors are counted in `stats.rowsFailed`.
- `failed_rows.csv` is a filtered artifact: empty-line failures are excluded from exported CSV rows.
- `file` column misuse with multiple values (e.g. `fileA.pdf|fileB.jpg`) must not report
  misleading `file not found`; it should return an explicit validation error instructing users
  to use `files` for multi-document input.

Source of truth for this track:

- `AI Contexts/CSV/csv-v2-context-07-error-taxonomy.md`

### 11) File column conventions (v1 parity + multi-file option)

Status (Mar 2026): **Implemented in code + unit specs**

Formalized CSV file column semantics:

- `file__XX` (language-specific): **one value per cell**.
- `file` (default language): **one value per cell**.
- `files` (new, multi-file): allows a single value or `|`‑separated list.
- `files` is unsuffixed only (no `files__XX` support).

Compatibility objective met:

- `file` reverted to v1-compatible single-value semantics.
- `files` is the explicit opt-in multi-file column.
- Added/updated specs:
  - `CsvImportRowFilesResolver.spec.ts` covers `file`, `file__default`, and `files` behavior.
  - `CsvHeaderAnalyzer.spec.ts` asserts `files__XX` is rejected.

### 12) TODO — Add cancel endpoint (cooperative stop, no cleanup)

Feature request recap (backend first, API endpoint only):

- Add a "Cancel import" endpoint that marks an import as stopped/cancelled and prevents the
  pipeline from continuing beyond the next safe checkpoint.
- Keep this intentionally simple: **no rollback/cleanup** of already-applied work.
  - If cancellation is requested before work starts: no further action should happen: if jobs have already been created, they will fetch the DB import DS and figure out it was canceled and stop cleanly, no actions taken.
  - If requested after thesauri preflight/create: keep those values.
  - If requested during relationships create or entities import: allow partial progress (for
    example, 1,050/20,000 rows imported), then stop and report the achieved progress.
- Cooperative-stop semantics are acceptable:
  - If a stage can detect cancellation mid-loop, stop there.
  - If not, finish the current stage/batch, then avoid dispatching downstream jobs.
- Final status should be visible as `cancelled`/`stopped` with existing counters/progress/errors
  preserved as-is.

Implementation direction (to evaluate before coding):

- Add a cancel API route (admin-only) that updates `csv_imports.status`.
- Use cooperative status checks only (no queue cleanup assumptions):
  - At the beginning of every job, re-read `csv_imports.status`; if `cancelled`, treat as
    a no-op stop and return without dispatching downstream jobs.
  - At intermediate checkpoints in long loops/batches (especially where we already heartbeat),
    re-check status and stop when it becomes `cancelled`.
- Keep behavior simple and deterministic:
  - cancellation is not rollback,
  - completed work stays,
  - downstream stages are simply not started once cancellation is detected.

Critical concurrency pitfall (must handle):

- A running job can keep an in-memory/stale `csvImport` snapshot while an admin cancels the import
  in a different transaction.
- If the job later writes status/progress/failure using a full-document `$set` from stale data,
  it can accidentally overwrite `status: cancelled` (for example, back to `import:entities`,
  `retrying`, or `*:done`).
- Mongo transactions do not automatically prevent this at our current write pattern; a commit may
  still succeed unless we enforce write preconditions.

Minimal guard pattern (recommended):

- Keep cooperative checks at job start + loop checkpoints as planned.
- Additionally, make csv-import writes cancellation-safe:
  - Use conditional updates for status/finalization/progress writes (compare-and-set style),
    e.g., apply update only when current status is not `cancelled` (or when expected status matches).
  - If conditional update does not match any document, treat as clean stop/no-op (not a failure).
- For terminal transitions (`*:done`, `failed`, `retrying`), never overwrite `cancelled`; if import
  is already cancelled, return without dispatching downstream jobs.
- Preserve current simplicity: no rollback, no cleanup, just "stop at checkpoints" and "never
  revert cancelled".
- Tighten endpoint semantics:
  - Cancel is idempotent and monotonic: once `cancelled`, it stays cancelled (no implicit resume).
  - If import is already in terminal `completed`/`failed`, cancel endpoint should be a no-op
    response and must not rewrite terminal history.
  - Job handlers should treat cancellation exits as clean stop (not retryable error paths).

### 12.1) Cancellation implementation caveat discovered (Mar 2026)

This section records a rejected direction so it is not repeated.

**Rejected approach (do not implement):**

- Using a blanket `updateIfNotCancelled` / compare-and-set gate for all `csv_imports` writes.
- Why rejected:
  - It can suppress legitimate progress/stat updates from already completed work (for example, a finished batch) if cancellation happens between work completion and write.
  - It violates expected UX semantics where completed work must remain reflected.

**Desired flow (agreed):**

1. Check cancellation at safe checkpoints:
   - start of each job,
   - start of each batch/chunk/loop unit.
2. If cancelled at checkpoint:
   - stop cleanly,
   - do not dispatch downstream jobs.
3. Persist completed work updates (progress/stats/errors/report metadata) normally.
4. Ensure status monotonicity:
   - once `status = cancelled`, subsequent writes must not revert status to `retrying`, `failed`, `*:done`, etc.
   - this should be enforced in CSV v2 import-write logic, not by dropping all writes.
5. No rollback/cleanup in cancel flow (as already agreed).

### 12.2) Typing incident and TODO (Mar 2026)

During cancel-flow implementation attempts, dispatch typing friction around CSV job handlers led to an incorrect attempt to modify core queue typing/contracts. That direction is explicitly rejected.

**Do not do this again:**

- Do not change core queue/router/dispatcher typing contracts to satisfy CSV v2 compile issues.
- Do not use force casts (`as any`, `as unknown as`) as a final solution in CSV v2 production code.

**TODO (typing discipline):**

- Ensure CSV v2 Jobs and JobHandlers strictly conform to the existing core queue typing/contracts.
- Fix CSV v2 compile issues by aligning CSV v2 code to core structures (not by introducing cast-based shortcuts).
- Do not add local dispatch typing adapters/wrappers as an alternate contract layer.

### 13) TODO — ANY-template relationships with deterministic conflict handling

Problem:

- For relationship properties without `content` (ANY template), v2 currently skips resolution.
- We need predictable behavior that does not create random entities and does not silently attach
  ambiguous matches.
- Encoding note (verified in template editor + API/domain mapping):
  - For v1-style relationship properties (`type: 'relationship'`), "Any entity" is represented as
    `content: ''` (empty string), not a literal `"ANY"` token.
  - Treat empty/falsey `content` as the ANY-template scenario in CSV import logic.

Decision direction:

- Implement Option B semantics:
  - Try to resolve existing entities by title across allowed scope.
  - Never create missing entities for ANY-template relationships.
  - If resolution is ambiguous (more than one candidate), mark as unresolvable.

Required behavior:

- Unresolvable relationship values must fail the row with explicit, user-friendly errors.
- Errors should identify property + raw relationship value + reason (`not_found` or `ambiguous`).
- Do not fallback to "first match wins".

**Status (Feb 2026): Implemented**

- ANY-template relationships (`content: ''`) are now scanned and resolved across all templates.
- Missing values in ANY scope are **not created** and now fail the row as `not_found`.
- Ambiguous ANY matches now fail the row as `ambiguous`.
- Decision: these are treated as **row errors** (not warnings) so rows are skipped deterministically.

### 14) TODO — Relationship title ambiguity (targeted and ANY) must fail rows

Problem:

- Duplicate titles can exist even within the same target template. Current behavior can collapse
  to one entry (effectively first/last match), which is incorrect and non-deterministic.
- This impacts both:
  - constrained relationships (`property.content` set to a template id),
  - unconstrained ANY-template relationships.

Required behavior (split by scenario):

- Constrained relationship (`property.content` set):
  - zero entities => keep current v2 behavior: create missing entity in the target template during
    relationships create preflight, then assign by resolved sharedId.
  - more than one entity (duplicate title match) => `unresolvable:ambiguous` row error.
  - exactly one entity => assign normally.
- ANY-template relationship (`property.content` not set):
  - zero entities => `unresolvable:not_found` row error (no creation allowed).
  - more than one entity => `unresolvable:ambiguous` row error.
  - exactly one entity => assign normally.
- Row must fail when at least one relationship token is unresolvable; importer should continue with
  other rows according to existing row-error policy.
- Persist enough conflict detail for debugging/reporting (at minimum: row index, property, token,
  candidate count and template scope context).

**Status (Feb 2026): Implemented**

- Constrained relationships now fail rows when more than one candidate entity matches a title.
- ANY-template relationships now fail rows for both `not_found` and `ambiguous`.
- Row-error messages now include property, token, reason, candidate count, and scope context.
- No fallback behavior remains (`first/last match` resolution removed).

### 15) Mongo indexes for CSV v2 collections

**Status (Mar 2026): Implemented and verified**

- Baseline CSV v2 indexes were added via migration:
  - `app/api/migrations/migrations/185-csv_v2_indexes/index.ts`
- Migration spec exists and validates all baseline index names/keys/options:
  - `app/api/migrations/migrations/185-csv_v2_indexes/specs/185-csv_v2_indexes.spec.ts`
- Focused verification command:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/migrations/migrations/185-csv_v2_indexes/specs/185-csv_v2_indexes.spec.ts`
  - result: pass (7/7 tests).

Follow-up maintenance rule:

- Revisit and evolve indexes whenever new CSV v2 query paths are introduced (treat index review as part of done criteria for new read/write patterns).

### 16) TODO — Cleanup extracted/original files after import reaches terminal state

Source of truth for this track:

- `AI Contexts/CSV/csv-v2-context-07-cleanup.md`

Problem:

- CSV artifacts under `csv-imports/{importId}` are currently retained indefinitely.
- We do not need to keep original/extracted import files in S3/disk after the import is done.

Required behavior:

- Implement final cleanup when import reaches terminal status (`completed`, `failed`, `cancelled`):
  remove original upload + extracted assets (idempotent, retry-safe).
- Apply cleanup consistently for success and stop/error terminal paths.
- Keep entity-owned files untouched; cleanup scope is only CSV import staging artifacts.

### 8) Next agent checklist (quick start)

1. Skim `csv-v2-context-07.md` and confirm the pipeline chain in code:
   `CsvCreateThesauriValuesJob` → `CsvCreateRelationshipEntitiesJob` → `CsvImportEntitiesJob`.
2. Keep job dispatch params explicit (`tenantName`, `userId`) for all `UserAwareDispatchable` jobs.
3. Do not add real relationships logic until the team agrees on the preflight design.
4. When adding logic, ensure all DB writes are inside `transactionManager.run` and all file I/O
   stays outside transactions.
5. Emit only tenant-admin socket events (`emitToTenantAdmins`) for all CSV v2 jobs.
6. Update tests if you touch `CsvCreateThesauriValuesJob` input shape (it now requires
   `tenantName` and `userId`).
7. Run ESLint/TS checks on touched files before handing off.

### 17) Execution checklist to avoid regressions (mandatory)

Use this as a strict gate before, during, and after implementation.

#### 17.1 Before coding (alignment gate)

- Re-state target behavior in 3 bullets and verify with user/team:
  1. cancellation checks at safe checkpoints (job start + batch/chunk boundaries),
  2. already-completed work remains reflected in persisted progress/stats/errors,
  3. `status: cancelled` is monotonic and must never be reverted by stale writes.
- Confirm file scope for the task:
  - Allowed by default: `app/api/csv.v2/**` and CSV context docs.
  - Forbidden without explicit approval: queue/router/dispatcher/controller/result/error **core contracts/behavior**.

#### 17.2 Non-negotiable DO NOTs

- Do **not** introduce `as any` / `as unknown as` in production CSV v2 code.
- Do **not** change core queue typings/contracts to “fix” CSV v2 compile issues.
- Do **not** ship cast-based or “temporary” typing hacks as final implementation.

#### 17.3 Implementation order (discipline)

1. Implement behavior in CSV v2.
2. Run lint/type checks on touched files.
3. Run focused tests for changed flows.
4. If an error suggests a core change, stop and escalate with options; do not patch core by default.

#### 17.4 Cancellation acceptance criteria (must all pass)

- Start-of-job cancellation check exists for every stage.
- Start-of-batch/chunk cancellation check exists for iterative stages.
- Completed batch/chunk results persist (progress/stats/error counts/report metadata).
- Downstream dispatch is skipped after cancellation detection.
- `status` cannot be overwritten away from `cancelled` by stale snapshots.
- Cancellation exits are clean stops (not retry/failure paths unless truly exceptional).

#### 17.5 Known regression traps

- Full-document stale `$set` can clobber `status: cancelled`.
- “Block all writes when cancelled” hides already-completed work from users.
- Emitting success after cancellation creates inconsistent UX state.
- Fixing CSV typing by touching core contracts causes broad breakage/risk.

#### 17.6 Verification baseline (required)

- Lint/type-check all touched CSV v2 files.
- Run focused specs for cancel-related paths and impacted jobs.
- Run Jest in this repo with:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest path-or-string-to-file`
- Include at least one scenario where cancellation happens between batch completion and finalization write, and verify:
  - completed progress remains visible,
  - status remains `cancelled`,
  - no downstream stage is dispatched.
- Include at least one scenario where import processing is interrupted after a subset of row writes and verify:
  - persisted progress does not lag behind committed row writes,
  - retries do not duplicate entities from already committed rows,
  - lock renewal remains active during long-running imports.

#### 17.7 Escalation rule

- If the only apparent fix is a core contract/behavior change:
  - stop implementation,
  - provide a short written proposal with alternatives and trade-offs,
  - wait for explicit approval before touching core.

### 18) Legacy historical log (non-normative)

This section contains prior iteration history. It is retained for context, but it is not the
primary source of truth for planning.

When this file is updated, prefer keeping sections 1.x, active TODOs, and priority sections
current instead of appending detailed chronological logs.

#### 18.1 Test command convention (explicit)

- Standard command to run focused Jest specs in this repo:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest path-or-string-to-file`
- This is now the default command format for CSV v2 verification.
- Environment note:
  - In sandboxed agent environments, Jest/DB-backed specs can show false negatives
    (timeouts, setup/connection issues) that do not reproduce locally.
  - If this happens, rerun the same command outside sandbox restrictions before
    concluding there is a code regression.

#### 18.2 CSV v2 JobHandler typing alignment (core-safe)

- Context: Type errors surfaced in CSV v2 job dispatch calls (e.g. dispatching `Csv*JobHandler` classes from jobs) due to strict `JobsDispatcher` generic constraints expecting `Dispatchable` signatures.
- Decision: **Do not touch core queue/router/dispatcher contracts**.
- Fix applied inside CSV v2 only:
  - Updated all CSV v2 job handlers to explicitly implement a compatible `handleDispatch(...)` signature using core `Dispatchable` params.
  - Added strict runtime param parsing per handler (`importId`, `tenantName`, `userId`) and delegated to `UserAwareDispatchable` via `super.handleDispatch(...)`.
  - Kept handler `handle(...)` logic unchanged.
- Handlers updated:
  - `CsvExtractUploadedZipJobHandler`
  - `CsvPreflightJobHandler`
  - `CsvCreateThesauriValuesJobHandler`
  - `CsvCreateRelationshipEntitiesJobHandler`
  - `CsvImportEntitiesJobHandler`
- Also normalized handler imports to explicit `.js` paths where needed.

#### 18.3 Outcome achieved

- CSV v2 dispatch typing errors in job dispatch sites were resolved without any core contract changes.
- No force-cast shortcut was introduced as a final production solution in CSV v2.
- Focused cancel use-case spec passes using the standardized command.

#### 18.4 Cancel-flow implementation record (Mar 2026)

This captures the concrete cancel-flow work completed in the same iteration so handoff is complete.

- **Endpoint + use case (admin-only, idempotent/monotonic):**
  - Added route: `POST /api/csvImportEntities/imports/:id/cancel`
    - file: `app/api/csv.v2/infrastructure/http/routes.ts`
  - Added controller:
    - `app/api/csv.v2/infrastructure/http/CancelCsvImportEntitiesImportController.ts`
  - Added use case:
    - `app/api/csv.v2/application/useCases/CancelCsvImportEntitiesImportUseCase.ts`
  - Added factory wiring:
    - `app/api/csv.v2/infrastructure/factories/CSVImportEntitiesFactories.ts`
  - Terminal no-op semantics are enforced (`import:entities:done`, `completed`, `failed`, `cancelled`).

- **Data source contract + Mongo implementation:**
  - Extended contracts:
    - `CsvImportsDataSource`: added `cancel(importId)` and `isCancelled(importId)`
    - `CsvImportEntitiesImportsDataSource`: added `cancel(importId)`
  - Implemented in:
    - `app/api/csv.v2/infrastructure/mongodb/MongoCsvImportsDataSource.ts`
  - Monotonic status guard implemented in `update(...)`:
    - if persisted status is already `cancelled`, subsequent updates keep `status=cancelled`
    - other fields (stats/progress/errors/etc.) are still persisted
    - this prevents stale snapshot writes from reverting cancellation.

- **Cooperative stop checkpoints added (no rollback/cleanup):**
  - Job-start cancel checks added in:
    - `CsvExtractUploadedZipJob`
    - `CsvPreflightJob`
    - `CsvCreateThesauriValuesJob`
    - `CsvCreateRelationshipEntitiesJob`
    - `CsvImportEntitiesJob`
  - Iterative checkpoint checks added at safe boundaries:
    - preflight scan batch loop (`CsvPreflightJob`)
    - thesauri pending-doc loop (`CsvCreateThesauriValuesJob`)
    - relationship template/chunk loops (`CsvPreflightRelationshipsService` + `CsvCreateRelationshipEntitiesJob`)
    - entities import batch loop (`CsvImportEntitiesRowsProcessor`)
    - extract row staging batch insertion (`CsvExtractUploadedZipJob`)
  - Downstream dispatch is skipped when cancellation is detected before dispatch/finalization.

- **Completed-work visibility preserved:**
  - Rejected blanket “drop writes if cancelled” behavior was not used.
  - Progress/stats/errors/report metadata writes remain persisted.
  - Only status regression away from `cancelled` is blocked.

- **Additional support file added:**
  - `app/api/csv.v2/application/services/CsvImportCancellation.ts`
    - explicit cancelled error marker used for clean cooperative stop paths.

- **Tests updated in this iteration:**
  - Added:
    - `app/api/csv.v2/application/useCases/specs/CancelCsvImportEntitiesImportUseCase.spec.ts`
      - verifies idempotent cancel and terminal no-op semantics.
  - Updated:
    - `app/api/csv.v2/application/jobs/specs/CsvImportEntitiesJob.spec.ts`
      - scenario: cancel between batch completion and finalization write
      - verifies completed progress remains visible and status remains `cancelled`.

- **Verification notes (current environment):**
  - Focused cancel use-case spec passes using the mandated command format.
  - CSV integration specs requiring Mongo may fail locally when Mongo is unavailable (`ECONNREFUSED 127.0.0.1:27017`); rerun in a test environment with DB available.

#### 18.5 Follow-up test-fix update (Mar 2026)

- New regressions detected during `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest csv.v2 -w=4`:
  - `CsvCreateThesauriValuesJob.spec.ts` and `CsvPreflightJobErrorHandling.spec.ts` failed with:
    - `this.deps.csvImportsDS.isCancelled is not a function`
- Root cause:
  - unit-test local mocks for `csvImportsDS` were not updated after adding cooperative cancellation checks that call `isCancelled(...)`.
- Fix applied:
  - Updated both specs to provide `isCancelled: jest.fn().mockResolvedValue(false)` on mocked `csvImportsDS`.
- Verification:
  - command run:
    - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/csv.v2/application/jobs/specs/CsvCreateThesauriValuesJob.spec.ts app/api/csv.v2/application/jobs/specs/CsvPreflightJobErrorHandling.spec.ts`
  - result: both suites pass.

- Remaining failures in the full `csv.v2` run are environment/infrastructure related:
  - Elasticsearch connection errors (`socket hang up` to `127.0.0.1:9200`) in integration suites.
  - These are not caused by the CSV cancel-flow typing/cancellation changes; rerun with Elasticsearch available.

#### 18.6 Cancellation nuance correction (Mar 2026)

Critical semantic clarification from review:

- `cancel` means **"stop when safe"** (cooperative stop), not "discard integrity data".
- If a real exception occurs after cancellation was requested, failure metadata should still be persisted for observability/integrity.
- Only explicit cooperative-cancel exits should be treated as clean no-op stops.

What was corrected in implementation:

- Removed catch-path short-circuit logic that previously skipped failure persistence when `isCancelled(...) === true`.
- Updated jobs:
  - `CsvPreflightJob`
  - `CsvCreateThesauriValuesJob`
  - `CsvCreateRelationshipEntitiesJob`
  - `CsvImportEntitiesJob`
- Behavior now:
  1. checkpoint cancellation exits still return cleanly (no downstream dispatch),
  2. real exceptions still go through failure persistence + onError callbacks,
  3. `status` monotonicity remains protected by the CSV import datasource guard (cancelled status is not reverted).

Rationale:

- preserves completed-work writes and error observability,
- avoids silent data-loss of failure context,
- keeps the agreed cooperative-stop model.

#### 18.7 Extract-stage cooperative cancel refactor (Mar 2026)

Additional refinement requested:

- Remove throw-based cancellation control flow (`throwIfCancelled`) from extract stage.
- Reason: cancellation is not an error; cooperative stop should use explicit early returns/checkpoints.

What changed:

- Refactored `CsvExtractUploadedZipJob` to remove:
  - `throwIfCancelled(...)`,
  - cancellation sentinel error usage.
- Replaced with explicit checkpoint checks (`isCancelled(...)`) and clean returns at:
  - start of extraction flow,
  - after normalization,
  - before/after row staging,
  - before success callback emission.
- Non-cancellation exceptions still persist failure metadata via `handleError(...)`.

- Enhanced `CsvImportRowsStager` to support cooperative stop without throws:
  - added optional `shouldContinue?: () => Promise<boolean>` to stage params,
  - accumulator now stops staging and skips further batch writes once continuation returns `false`,
  - no extra progress/writes after stop flag is reached.

- Removed now-unused cancellation sentinel helper file:
  - `app/api/csv.v2/application/services/CsvImportCancellation.ts`

Outcome:

- Cancellation in extract stage is now explicit “stop when safe” flow (no exception-driven cancellation path),
- while preserving existing behavior for real errors and downstream-dispatch guards.

#### 18.8 Checkpoint-density simplification policy (Mar 2026)

Follow-up refinement applied to reduce cancellation-check noise and improve readability.

Policy now used across CSV v2 jobs:

1. Check at **job/stage start**.
2. Check at **batch/chunk loop boundaries**.
3. Check **before downstream dispatch**.
4. Check **before success callback emission**.

Avoid:

- repeated micro-checks around short local blocks with no external side effects.

Implementation simplifications performed:

- Consolidated adjacent early-return guards in `CsvImportRowsStager` where semantics are equivalent.
- Ensured `shouldContinue` is actually propagated from `stage(...)` into the accumulator.
- Removed redundant pre-write cancellation guards that could hide completed-work persistence just before finalize writes in:
  - `CsvPreflightJob` transaction finalize block,
  - `CsvCreateThesauriValuesJob` finalize path,
  - `CsvCreateRelationshipEntitiesJob` finalize path.
- Kept mandatory guards at loop boundaries, pre-dispatch, and pre-success callback.

#### 18.9 V1-dependency cleanup progress + migration spec polish (Mar 2026)

- Added dedicated handoff/inventory doc for this workstream:
  - `AI Contexts/CSV/csv-v2-context-07-v1-dependencies.md`
- Decoupled CSV v2 tests from v1 helper imports:
  - Created `app/api/csv.v2/specs/helpers/createTestingZip.ts`.
  - Updated CSV v2 extraction specs to import this v2-local helper instead of `#api/csv/specs/helpers.js`.
- Typing cleanup for the new helper:
  - Added dev dependency `@types/yazl`.
  - Updated helper import to `import { ZipFile } from 'yazl'`.
  - Removed temporary ambient declaration shim once real types were installed.
- Migration spec output suppression aligned with repo convention:
  - `app/api/migrations/migrations/185-csv_v2_indexes/specs/185-csv_v2_indexes.spec.ts`
    now mocks `process.stdout.write` in `beforeAll` to avoid printing migration banners during tests.
- Verification:
  - CSV v2 focused extraction specs pass.
  - `185-csv_v2_indexes` focused spec still passes after stdout-silencing update.

#### 18.10 Thesauri v2 replacement pass (Mar 2026)

- Removed CSV v2 dependency on legacy thesauri/translations modules:
  - deleted:
    - `app/api/csv.v2/infrastructure/services/LegacyThesauriRepository.ts`
    - `app/api/csv.v2/infrastructure/services/LegacyTranslationsRepository.ts`
  - added:
    - `app/api/csv.v2/infrastructure/services/CsvThesauriRepository.ts`
    - `app/api/csv.v2/infrastructure/services/CsvTranslationsRepository.ts`
  - updated factory wiring:
    - `app/api/csv.v2/infrastructure/factories/CsvCreateThesauriValuesJobFactory.ts`
- Replaced direct `normalizeThesaurusLabel` usage from v1 module:
  - added `app/api/csv.v2/application/services/CsvThesaurusLabelNormalizer.ts`
  - updated:
    - `CsvThesauriValuesDiff`
    - `PendingThesauriValuesApplier`
    - `CsvEntitiesImportMapper`
- `PendingThesauriValuesApplier` now passes context label to translations repository updates
  (to preserve thesaurus context metadata when upserting translation keys).
- Verification:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/csv.v2/application/services/specs/PendingThesauriValuesApplier.spec.ts app/api/csv.v2/application/services/specs/CsvEntitiesImportMapper.spec.ts app/api/csv.v2/application/jobs/specs/CsvCreateThesauriValuesJob.spec.ts`
  - result: pass (3 suites, 17 tests).
- Remaining intentional compatibility bridges are tracked in:
  - `AI Contexts/CSV/csv-v2-context-07-v1-dependencies.md`

#### 18.11 Review clarifications + next first priority (Mar 2026)

- Clarified behavior: v1 thesaurus normalization lowercases labels for matching/dedup keys,
  but does not force stored labels to lowercase; effective matching remains case-insensitive.
- Fixed TS issue in `CsvThesauriRepository` ("transaction manager used before initialization")
  by moving DS initialization into constructor.
- **Explicit next-agent first priority (for boundary cleanup):**
  - Collapse temporary CSV adapter repositories introduced in 18.10 and refactor thesauri-create
    flow to consume v2-native contracts/services directly.
  - Source of truth for this priority:
    - `AI Contexts/CSV/csv-v2-context-07-v1-dependencies.md` (section "Next-agent first priority — collapse temporary adapters").

#### 18.12 Temporary thesauri adapter layer removed (Mar 2026)

- Completed the follow-up from 18.11:
  - deleted:
    - `app/api/csv.v2/infrastructure/services/CsvThesauriRepository.ts`
    - `app/api/csv.v2/infrastructure/services/CsvTranslationsRepository.ts`
    - `app/api/csv.v2/application/contracts/ThesauriRepository.ts`
    - `app/api/csv.v2/application/contracts/TranslationsRepository.ts`
- `CsvCreateThesauriValuesJobFactory` now injects native dependencies directly:
  - core `ThesauriDataSource` via `ThesauriDataSourceFactory.default(...)`
  - `i18n.v2` `TranslationsDataSource` via `DefaultTranslationsDataSource(...)`
- `PendingThesauriValuesApplier` now consumes those native contracts directly to:
  - load/update thesauri values,
  - upsert translations.
- No CSV-local thesauri/translations repository wrappers remain in production code.
- Follow-up maintainability pass:
  - split `PendingThesauriValuesApplier` helper logic into focused service modules:
    - `PendingThesauriThesaurusGateway`
    - `PendingThesauriTranslationsGateway`
    - `PendingThesauriAppliedValuesCollector`
  - goal: keep applier orchestration readable while preserving behavior.
- Test cleanup (integration-first):
  - replaced fake/mocked DS/result-set coverage in:
    - `CsvCreateThesauriValuesJob.spec.ts`
    - `PendingThesauriValuesApplier.spec.ts`
  - both specs now run against real Mongo-backed data sources and real result sets via
    `testingEnvironment` + fixtures, aligned with the CSV v2/core v2 testing rule.
- `CsvCreateThesauriValuesJobFactory` now lazily resolves a Mongo transaction manager only when DS defaults are needed, allowing typed non-Mongo transaction-manager doubles in tests without async-context failures.
- Focused verification:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/csv.v2/application/services/specs/PendingThesauriValuesApplier.spec.ts app/api/csv.v2/application/jobs/specs/CsvCreateThesauriValuesJob.spec.ts`
  - result: pass (2 suites, 4 tests).

#### 18.13 Boundary-cleanup status checkpoint (Apr 2026 update)

- CSV-local thesauri/translations adapters are removed and covered by focused tests.
- Remaining v1 compatibility bridges are identified and documented in:
  - `AI Contexts/CSV/csv-v2-context-07-v1-dependencies.md`
- `CsvV1CompatEmitter` bridge was removed.
- Current remaining compatibility bridge is only the v1 `/api/import` route path.

#### 18.14 Cleanup workstream context split (Mar 2026)

- Added dedicated cleanup handoff/source-of-truth document:
  - `AI Contexts/CSV/csv-v2-context-07-cleanup.md`
- Cleanup scope and constraints are now tracked separately from the v1-boundary track:
  - cleanup runs as a dedicated background job/handler,
  - dispatch on terminal states (`completed`, `failed`, `cancelled`),
  - no user-facing status/event changes (housekeeping only),
  - internal cleanup-state field recommended on `csv_imports` (`fileCleanup` structured state).
- This main context now references the cleanup companion in:
  - section 7 (agent-specific companion docs),
  - section 16 (cleanup TODO source-of-truth pointer).

#### 18.15 Cleanup trigger clarification (Mar 2026)

- Cleanup dispatch semantics were tightened after race-risk review:
  - do **not** dispatch cleanup directly from cancel endpoint/use case,
  - run cleanup only at terminal-safe stage boundaries.
- Agreed trigger points:
  - success: only after entities-import terminal success,
  - cancel: after the currently running stage exits cleanly with `cancelled`,
  - hard failures: non-retryable or retry-exhausted terminal failures.
- Internal cleanup marker simplified to:
  - `filesCleanup: 'pending' | 'done' | 'failed'`
  - no additional attempts/retry/error payload on `csv_imports`.
- Source of truth:
  - `AI Contexts/CSV/csv-v2-context-07-cleanup.md`

#### 18.16 Cleanup stage implementation + dedup refactor (Mar 2026)

- Implemented cleanup stage in CSV v2:
  - `CsvCleanupImportFilesJob`
  - `CsvCleanupImportFilesJobHandler`
  - `CsvCleanupImportFilesJobFactory`
  - queue registration in `queueRegistry`.
- Import-level internal marker implemented as agreed:
  - `filesCleanup: 'pending' | 'done' | 'failed'`
  - no attempt/error payload expansion on `csv_imports`.
- Cleanup scope finalized in code:
  - delete original upload + extracted staging assets,
  - preserve failed-rows report artifact (`csv-imports/{importId}/reports/failed_rows.csv`) for UX download flow.
- Terminal cleanup dispatch is now active for:
  - entities-import success (`import:entities:done`),
  - cooperative-cancel exits at stage boundaries,
  - terminal failures (non-retryable and retry-exhausted).
- Design cleanup to remove repeated logic:
  - job-level cleanup behavior centralized in:
    - `app/api/csv.v2/application/jobs/CsvCleanupAwareJob.ts`
  - handler-level terminal cleanup flow centralized in:
    - `app/api/csv.v2/infrastructure/jobHandlers/CsvCleanupDispatch.ts`
  - stage jobs/handlers now call shared helpers instead of duplicating the same blocks.
- Verification:
  - new integration spec added:
    - `app/api/csv.v2/application/jobs/specs/CsvCleanupImportFilesJob.spec.ts`
  - full CSV v2 suite passes:
    - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest csv.v2 -w=4`
    - result: pass (17 suites, 66 tests).

#### 18.17 Cleanup follow-up stabilization + handoff target (Mar 2026)

- Test-stability follow-up implemented:
  - `CsvImportEntitiesJobFactory.build(...)` now allows optional `jobsDispatcher` injection.
  - `CsvImportEntitiesJob.spec.ts` injects a mocked dispatcher to avoid queue/session flakiness
    in full-suite execution (`Transaction ... has been committed`).
  - Production wiring remains unchanged (default dispatcher path still used outside tests).
- Cleanup workstream status:
  - terminal artifact cleanup is implemented and verified,
  - failed-rows report artifact is intentionally preserved.
- Next handoff target (priority continuation):
  - proceed to **file-column contract freeze** (`file__LANG`, `file`, `files`) as the next active
    TODO after cleanup completion (**completed in 18.18**).

#### 18.18 File-column contract freeze update (Mar 2026)

- Implemented contract alignment for file columns in CSV v2 entities import:
  - `file` / `file__{defaultLanguage}` is now single-value only (v1 parity),
  - `files` is the new explicit multi-value document column (`|` separated),
  - `attachments` remains multi-value (`|` separated).
- `files` suffixes are intentionally unsupported:
  - `files__{lang}` is now explicitly rejected by header analysis as unknown property.
- Resolver behavior updated in:
  - `app/api/csv.v2/application/services/CsvImportRowFilesResolver.ts`
- Spec coverage added/updated:
  - `app/api/csv.v2/application/services/specs/CsvImportRowFilesResolver.spec.ts`
  - `app/api/csv.v2/application/services/specs/CsvHeaderAnalyzer.spec.ts`
- Focused verification passed:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/csv.v2/application/services/specs/CsvImportRowFilesResolver.spec.ts app/api/csv.v2/application/services/specs/CsvHeaderAnalyzer.spec.ts`

#### 18.19 Error taxonomy write-path implementation (Mar 2026)

- Implemented taxonomy persistence for entities-import row errors:
  - `csv_import_row_errors` now stores `code` + optional structured context
    (`property`, `rawValue`, `details`) with stable `message`.
- Added application mapper:
  - `CsvRowImportErrorFactory.fromException(...)` used in
    `CsvImportEntitiesBatchProcessor` instead of persisting raw `error.message`.
- Producer-side normalization added:
  - `CsvImportRowFilesResolver` now throws typed file errors (`FILE_NOT_FOUND` mapping),
  - relationship resolver paths now throw typed relationship errors
    (`RELATIONSHIP_NOT_FOUND` / `RELATIONSHIP_AMBIGUOUS` mappings).
- Unknown exceptions are sanitized to `INTERNAL_ERROR` with user-safe message.
- Option A preserved explicitly:
  - failed-rows report remains row-only CSV with original failed source rows (no error columns).

#### 18.20 Parallel-test cancellation race stabilization (Mar 2026)

- Resolved an intermittent integration failure in parallel suite runs:
  - symptom: `MongoServerError: Transaction with { txnNumber: ... } has been committed`
    in `CsvImportEntitiesJob.spec.ts` cancellation scenario.
- Root cause:
  - async cancellation triggered inside `onProgress` callback could race transaction/session
    lifecycle because progress callback completion was not awaited by the rows processor.
- Fix:
  - `CsvImportEntitiesRowsProcessor` now awaits `callbacks.onProgress(...)` using
    `await Promise.resolve(...)` (supports both sync and async callbacks).
- Verification:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest csv.v2 -w=4`
  - result: pass (19 suites, 76 tests).

#### 18.21 Queue test-pollution hardening update (Mar 2026)

- Scope clarification confirmed in code:
  - test-mode shared DB is `uwazi_shared_db_testing` (not main shared DB),
  - queue pollution risk is test contamination/flakiness, not production DB contamination.
- Implemented queue hardening in CSV v2 specs:
  - added helper:
    - `app/api/csv.v2/specs/helpers/queueTestCleanup.ts`
    - deletes queue docs by `{ queue: config.queueName, namespace: tenants.current().name }`
      on shared DB.
  - wired queue cleanup in integration-spec `afterEach`:
    - `CsvExtractUploadedZipJob.spec.ts`
    - `CsvPreflightJob.spec.ts`
    - `CsvCreateThesauriValuesJob.spec.ts`
    - `CsvCreateRelationshipEntitiesJob.spec.ts`
    - `CsvImportEntitiesJob.spec.ts`
  - replaced remaining implicit default-dispatcher usage with mocked `jobsDispatcher` in:
    - `CsvCreateThesauriValuesJob.spec.ts`
    - `CsvCreateRelationshipEntitiesJob.spec.ts`
- Verification:
  - focused job-spec run passes (5/5),
  - full CSV v2 suite passes:
    - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest csv.v2 -w=4`
    - result: pass (19 suites, 76 tests).

#### 18.22 Dedicated V2 register endpoint for frontend (Mar 2026)

- Added a dedicated V2 import register route:
  - `POST /api/csvImportEntities`
  - auth: admin
  - middleware: V2 `UploadMiddleware` (request-time instantiation)
  - handler: `RegisterCsvImportController`
- Compatibility route remains:
  - `POST /api/import` is V1-only for transition/testing while V2 uses `POST /api/csvImportEntities`.
- Frontend handoff doc updated to make V2 endpoint primary:
  - `AI Contexts/CSV/csv-v2-front-end-notes.md`
- Verification:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/files/specs/uploadRoutes.spec.ts`
  - result: pass (includes new `POST /api/csvImportEntities` test).

#### 18.23 Relationship sync regression in entities import (Apr 2026)

- Manual/frontend validation surfaced a critical regression:
  - relationship metadata values were persisted on imported rows,
  - but actual relationship links were not created.
- Root cause:
  - `CsvImportEntitiesBatchProcessor` inserted entities via low-level
    `entitiesDS.create(...)`, bypassing the Entities module side-effects.
  - This skipped `RelationshipSyncJob` dispatch from `EntitiesService.insert(...)`.
- Fix implemented:
  - CSV v2 row import now persists entities through `EntitiesService.insert(...)`
    inside the per-row transaction, then inserts files via `FilesService.insert(...)`.
  - `CsvImportEntitiesJobFactory` now wires `EntitiesService` into the import job and
    uses the same dispatcher instance so relationship sync dispatch is observable/testable.
- Test coverage added:
  - `CsvImportEntitiesJob.spec.ts` now asserts `RelationshipSyncJob` dispatch for
    relationship-bearing imported rows.

### 19) TODO — Document ReadTheDocs import instructions

We should create and maintain user-facing documentation in ReadTheDocs that explains
how to run CSV imports end-to-end.

Required scope:

- Upload requirements and supported file formats (`CSV` and `ZIP` with `import.csv` at root).
- Column conventions (`file`, `files`, `attachments`, language suffix rules, and relationship fields).
- Preflight/import behavior, including row-error handling and failed-rows report usage.
- Cancel semantics (cooperative stop, no rollback/cleanup of already-applied work).
- Troubleshooting section for common import failures and recovery steps.

### 20) Priority order (agreed, Mar 2026; updated after index migration completion)

The following order is explicitly agreed and should drive upcoming iterations.

#### 20.1 Primary priorities (fixed order)

1. **Complete CSV v2 boundary cleanup from v1 dependencies**
   - Remove remaining v1 architectural references/wrappers from `csv.v2` paths and replace them with v2-native contracts/data-source usage.
   - Use `AI Contexts/CSV/csv-v2-context-07-v1-dependencies.md` as the source of truth for current inventory, allowed temporary bridges, and migration order.
2. **Implement terminal artifact cleanup for imports**
   - ✅ Implemented. See:
     - `AI Contexts/CSV/csv-v2-context-07-cleanup.md`
   - Current behavior: cleanup removes original upload + extracted staging assets, preserves failed-rows report artifact.
3. **Freeze file-column contract for CSV inputs**
   - ✅ Implemented in backend services/specs.
   - Follow-up: propagate final wording to user-facing docs (ReadTheDocs scope in section 19).
4. **Standardize row error taxonomy and reporting output**
   - Finalize user-facing error naming/messages and reporting structure so diagnostics are clear, actionable, and stable for frontend/support usage.

Index migration completion note:

- Previous primary priority (**establish and ship CSV v2 index migrations**) is complete via migration delta `185` and its dedicated spec coverage.

#### 20.2 Remaining work (recommended order after primary priorities)

1. **Stabilize tests/infrastructure in CI-like environment**
   - Ensure Mongo + Elasticsearch-backed CSV v2 suites are green and deterministic.
   - Address queue test pollution with explicit isolation/cleanup strategy.
2. **Close missing integration coverage**
   - Full pipeline chain coverage.
   - Files/attachments edge cases (`missing file`, `S3 vs disk` behavior).
   - Batch/failure-threshold/report-path scenarios in entities import.
   - User-priority override (Mar 2026): queue test-pollution hardening runs before this item.
3. **Finalize API payloads for UX polling/recovery**
   - Detail/list projections for row-errors summary/report path and extraction metadata.
   - Add pagination for imports list endpoint if needed for scale.
4. **Publish ReadTheDocs import guidance**
   - Implement the documentation scope defined in section 19.
