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
- Preflight (thesauri pending values) (`CsvPreflightJob`)
- Create thesauri values (`CsvCreateThesauriValuesJob`)
- Entities import job (`CsvImportEntitiesJob`) exists and is registered but was not chained
  from the thesauri creation stage.

### 3) Missing or incomplete work

#### 3.1 Pipeline gaps

- Relationships preflight stage now exists and performs real work (no longer dummy).
- Pipeline chaining is complete: thesauri create → relationships preflight → entities import.
- Entities import stage is implemented and wired into the pipeline.

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

#### 3.4 Tests and coverage gaps

- Preflight integration spec needs restoration/updates.
- No integration coverage for the complete chain (register → extract → preflight →
  thesauri create → import).
- Entities import job needs tests for batch processing, row errors report, stop
  thresholds, and files/attachments integration (see 6.10).

#### 3.5 Retention and cleanup

- No finalizer/sweeper job to remove staged rows and extracted artifacts.
- Original uploaded CSV/ZIP is not deleted after extraction.

#### 3.6 Status/event alignment

- Status naming is mostly colon-based; extraction still uses `extracting files` which is
  inconsistent with the rest of v2 status naming conventions. This needs a final decision
  and refactor if we want strict consistency.

### 4) Immediate next steps (agreed direction)

1. **Keep future work scoped**
   - Files/attachments handling is critical but the approach is still TBD
     (entities v2 vs a dedicated process).

### 5) Follow-up work (after the dummy stage is in place)

- Replace legacy thesauri/translations adapters with v2 data sources.
- Remove v1 imports from v2 services.
- Add the missing integration tests and finalizer/cleanup job.
- **TODO:** Relationship resolution is **not wired into entities import yet**.
  Preflight creates missing entities, but `CsvImportEntitiesJob` still ignores relationship
  assignments. This must be connected later once relationship parsing logic is finalized.

9. **Relationships preflight refactor (done)**
   - Extracted helper logic into `CsvPreflightRelationshipsService`.
   - Removed ESLint/TS disables from `CsvPreflightRelationshipsJob`.

### 6) What was completed in this iteration (Jan 2026)

1. **Relationships preflight stage implemented**

   - Job: `app/api/csv.v2/application/jobs/CsvPreflightRelationshipsJob.ts`.
   - Handler: `app/api/csv.v2/infrastructure/jobHandlers/CsvPreflightRelationshipsJobHandler.ts`.
   - Reads staged rows, collects relationship titles (split by `|`), and creates
     missing related entities using entities.v2.
   - Only creates entities for relationship properties that specify `content` (template id),
     matching v1 behavior.
   - Uses title-only entity creation (no required-property validation; entities.v2 allows this).
   - Statuses in `CsvImportStatus`:
     - `preflight:relationships`
     - `preflight:relationships:done`
   - Emits tenant-admin events:
     - `csvImport:preflight:relationships:start|progress|success|error`

2. **Pipeline chaining completed**

   - `CsvCreateThesauriValuesJob` now dispatches `CsvPreflightRelationshipsJobHandler`
     inside the same transaction that sets `preflight:thesauri:create:done`.
   - `CsvPreflightRelationshipsJob` dispatches `CsvImportEntitiesJobHandler`
     inside its success transaction.
   - Queue registry wiring added for the new handler.

3. **Job handler heartbeat behavior aligned**

   - Removed catch-path `heartbeat()` calls from:
     - `CsvPreflightRelationshipsJobHandler`
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

   - Added a configurable, top-of-file constant in `CsvPreflightRelationshipsJob`:
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

### 7) Agent-specific notes (handoff)

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
  Only one unit test currently covers `CsvCreateThesauriValuesJob`. There are no pipeline
  integration tests yet (register → extract → preflight → create → relationships → import).

### 8) Next agent checklist (quick start)

1. Skim `csv-v2-context-07.md` and confirm the pipeline chain in code:
   `CsvCreateThesauriValuesJob` → `CsvPreflightRelationshipsJob` → `CsvImportEntitiesJob`.
2. Keep job dispatch params explicit (`tenantName`, `userId`) for all `UserAwareDispatchable` jobs.
3. Do not add real relationships logic until the team agrees on the preflight design.
4. When adding logic, ensure all DB writes are inside `transactionManager.run` and all file I/O
   stays outside transactions.
5. Emit only tenant-admin socket events (`emitToTenantAdmins`) for all CSV v2 jobs.
6. Update tests if you touch `CsvCreateThesauriValuesJob` input shape (it now requires
   `tenantName` and `userId`).
7. Run ESLint/TS checks on touched files before handing off.
