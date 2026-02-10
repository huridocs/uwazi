## CSV Import V2 — Context Doc 07 (Findings + Missing Work, Agent Handoff)

**Date:** 2026-01-29
**Owner:** CSV Import V2 initiative

### 1) Purpose

This document captures the current gaps, missing work, and immediate next steps discovered
while reviewing CSV v2 context docs, the v2 code, and v1 behavior. It is intended to
guide the next iteration and ensure the pipeline is complete before adding new logic.
It is also a handoff guide: a new agent should be able to continue by reading this alone.

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

#### 3.4 Tests and coverage gaps

- No integration coverage for the complete chain (register → extract → preflight →
  thesauri create → import).
- Entities import job now has a basic integration test (single-row happy path).
  Still missing tests for batch processing, row errors report, stop thresholds,
  and files/attachments integration (see 6.10).

#### 3.5 Retention and cleanup

- No finalizer/sweeper job to remove staged rows and extracted artifacts.
- Original uploaded CSV/ZIP is not deleted after extraction.

#### 3.6 Status/event alignment

- Status naming is mostly colon-based; extraction still uses `extracting files` which is
  inconsistent with the rest of v2 status naming conventions. This needs a final decision
  and refactor if we want strict consistency.

#### 3.7 Progress query endpoints

- **TODO:** Add API endpoints to query CSV import progress directly (not only via socket events):
  - List imports (paginated, filterable by status/template/date).
  - Get import details (status, progress counters, row errors summary, report paths, failures).
  - This enables UI polling and recovery when socket events are missed.

#### 3.8 Discuss with team

- Relationship creation now uses `EntitiesService.create` per title, but `EntitiesService` is wired
  with cached settings/templates data sources (mirrors PX pattern) to avoid repeated DB reads.
- Ensure progress callbacks/heartbeats are emitted per batch (not only at end) for long runs.

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

### 6) What was completed in this iteration (Jan 2026)

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
  (`file` column, split by `|`) and attachments (`attachments` column, split by `|`).
- `CsvEntitiesImportMapper` now returns `PropertyAssignmentInput` (not domain assignments)
  and can map image/media values to `{ attachment: index }` when filenames match attachments.
  This avoids duplicating domain normalization logic; trimming/validation happens in the
  property assignment services and domain validators.
- Entities import batch processor now:
  - resolves row files outside transactions,
  - uses `PropertyAssignmentCreatorServiceStrategy.bulkCreate(...)` to produce assignments,
  - stores files via `FilesService.storeFiles(...)` outside the DB transaction,
  - inserts entity + file records inside a per-row transaction (`entitiesDS.create` +
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

13. **V1 socket-compat layer (Mar 2026)**

- Added a removable, handler-only compat emitter to reuse the v1 UI socket footprint while the
  v2 UI is under construction.
- Emits **tenant-admin** events only (no session propagation), to avoid polluting use cases.
- Feature-flagged via `featureFlags.v1CSVImportCompat` (default `false`).
- Events:
  - `IMPORT_CSV_START`: emitted from extract job start.
  - `IMPORT_CSV_PROGRESS`: emitted from entities-import batches (cumulative entities created).
  - `IMPORT_CSV_ROW_EXCEPTIONS`: emitted once on entities-import success, built from
    `csv_import_row_errors` and grouped by error message.
  - `IMPORT_CSV_ERROR`: emitted from any stage failure (extract, preflight, thesauri, relationships, import).
  - `IMPORT_CSV_END`: emitted after entities-import success (after row exceptions).
- Implementation:
  - `app/api/csv.v2/infrastructure/services/CsvV1CompatEmitter.ts`
  - wired in queue worker registration (`app/queueRegistry.ts`)
  - used in job handlers:
    - `CsvExtractUploadedZipJobHandler`
    - `CsvPreflightJobHandler`
    - `CsvCreateThesauriValuesJobHandler`
    - `CsvCreateRelationshipEntitiesJobHandler`
    - `CsvImportEntitiesJobHandler`

#### How to remove v1 compat (when v2 UI is ready)

1. Delete `app/api/csv.v2/infrastructure/services/CsvV1CompatEmitter.ts`.
2. Remove `v1CSVImportCompat` from:
   - `app/api/tenants/tenantContext.ts`
   - `app/api/config.ts`
3. Remove `CsvV1CompatEmitter` wiring in `app/queueRegistry.ts`.
4. Remove optional `v1Compat` usage from CSV job handlers listed above.
5. Delete any v1 compat references in docs/tests (if added).

### 7) Agent-specific notes (handoff)

- **Doc hygiene is mandatory:** Whenever a user gives new instructions or corrections,
  update the relevant CSV v2 context docs in the same iteration so the next agent can
  continue without extra guidance. These MDs are the source of truth.
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
