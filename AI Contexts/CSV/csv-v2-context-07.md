## CSV Import V2 — Context Doc 07 (Findings + Missing Work, Agent Handoff)

**Date:** 2026-01-29
**Owner:** CSV Import V2 initiative

### 1) Purpose

This document captures the current gaps, missing work, and immediate next steps discovered
while reviewing CSV v2 context docs, the v2 code, and v1 behavior. It is intended to
guide the next iteration and ensure the pipeline is complete before adding new logic.
It is also a handoff guide: a new agent should be able to continue by reading this alone.

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

- **Implemented (Feb 2026):** Added CSV entities-import read endpoints in `csv.v2`:
  - `GET /api/csvImportEntities/imports` returns `{ rows: [...] }`.
  - `GET /api/csvImportEntities/imports/:id` returns the raw import object body.
  - List rows include `status` as a first-class field for UX list rendering.
- **TODO (next iteration):**
  - Extend detail with explicit row-errors summary/report-path projection if UI needs a narrowed shape.
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
- **Indexes context companion:** For CSV v2 Mongo indexing decisions and migration notes,
  read and maintain `AI Contexts/CSV/csv-v2-context-07-indexes.md` together with this file.
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

**Mitigation options:**

- **Test cleanup:** delete the queue collection in CSV v2 specs (`afterEach`/`afterAll`).
- **Test queue namespace:** configure a test-only queue name to isolate/purge safely.
- **Recording/Sync dispatcher:** use non-queue dispatchers in tests that don't need real workers.
- **No worker during tests:** ensure the queue worker isn't running when tests enqueue jobs.

### 10) TODO — Improve row-level error messaging

Row errors are currently low-signal for end users (e.g., an empty CSV line can surface as
`Cannot read properties of undefined (reading 'Value')`). We should add explicit, user-friendly
errors/warnings for common parsing issues (empty line, missing required columns, malformed rows),
and avoid leaking internal exceptions directly to users.

### 11) TODO — Define file column conventions (v1 parity + multi-file option)

We should formalize CSV file column semantics to avoid ambiguity and align with v1:

- `file__XX` (language-specific): **one value per cell**.
- `file` (default language): **one value per cell**.
- `files` (new, multi-file): allows a single value or `|`‑separated list.

Goal: keep v1 semantics intact while providing an explicit multi-file column.

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

#### 17.7 Escalation rule

- If the only apparent fix is a core contract/behavior change:
  - stop implementation,
  - provide a short written proposal with alternatives and trade-offs,
  - wait for explicit approval before touching core.

### 18) Latest iteration update (Mar 2026) — mandatory handoff record

This section captures what was done in the latest development pass and must be updated on every iteration.

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

### 19) TODO — Document ReadTheDocs import instructions

We should create and maintain user-facing documentation in ReadTheDocs that explains
how to run CSV imports end-to-end.

Required scope:

- Upload requirements and supported file formats (`CSV` and `ZIP` with `import.csv` at root).
- Column conventions (`file`, `attachments`, language suffix rules, and relationship fields).
- Preflight/import behavior, including row-error handling and failed-rows report usage.
- Cancel semantics (cooperative stop, no rollback/cleanup of already-applied work).
- Troubleshooting section for common import failures and recovery steps.

### 20) Priority order (agreed, Mar 2026; updated after index migration completion)

The following order is explicitly agreed and should drive upcoming iterations.

#### 20.1 Primary priorities (fixed order)

1. **Complete CSV v2 boundary cleanup from v1 dependencies**
   - Remove remaining v1 architectural references/wrappers from `csv.v2` paths and replace them with v2-native contracts/data-source usage.
2. **Implement terminal artifact cleanup for imports**
   - Add reliable, retry-safe cleanup of CSV-owned artifacts (original upload + extracted staging files) when imports reach terminal states.
3. **Freeze file-column contract for CSV inputs**
   - Define and document exact behavior for `file__LANG`, `file`, and `files` so parsing/import behavior is deterministic and consistent across API, jobs, and UX.
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
3. **Finalize API payloads for UX polling/recovery**
   - Detail/list projections for row-errors summary/report path and extraction metadata.
   - Add pagination for imports list endpoint if needed for scale.
4. **Publish ReadTheDocs import guidance**
   - Implement the documentation scope defined in section 19.
