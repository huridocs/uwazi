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

- Relationships preflight stage now exists but is a dummy stage (no logic yet).
- Pipeline chaining is now complete: thesauri create → relationships preflight → entities import.
- Entities import stage is implemented and wired into the pipeline.

#### 3.2 V1 parity gaps (deferred)

- Relationship parsing/creation semantics (from v1 `typeParsers/relationship.ts`) are not
  in v2 yet.
- Files/attachments handling from v1 (`image`, `media`, `file`, `attachments`) remains
  intentionally deferred in v2.
- Sanitization warnings and row-level warnings are not surfaced in v2; only row errors
  are persisted.

#### 3.3 V2 boundary and tech debt

- `CsvEntitiesImportMapper` still imports `normalizeThesaurusLabel` from a v1 module.
- Thesauri creation still uses legacy adapters instead of v2 data sources.

#### 3.4 Tests and coverage gaps

- Preflight integration spec needs restoration/updates.
- No integration coverage for the complete chain (register → extract → preflight →
  thesauri create → import).
- Entities import job needs tests for batch processing, row errors report, and stop
  thresholds.

#### 3.5 Retention and cleanup

- No finalizer/sweeper job to remove staged rows and extracted artifacts.
- Original uploaded CSV/ZIP is not deleted after extraction.

#### 3.6 Status/event alignment

- Status naming is mostly colon-based; extraction still uses `extracting files` which is
  inconsistent with the rest of v2 status naming conventions. This needs a final decision
  and refactor if we want strict consistency.

### 4) Immediate next steps (agreed direction)

1. **Implement real relationships preflight logic**
   - Read staged rows, collect relationship titles per template, and create missing entities.
   - Keep the stage idempotent and transaction-aware.

2. **Keep future work scoped**
   - Files/attachments remain intentionally deferred.

### 5) Follow-up work (after the dummy stage is in place)

- Replace legacy thesauri/translations adapters with v2 data sources.
- Remove v1 imports from v2 services.
- Add the missing integration tests and finalizer/cleanup job.

### 6) What was completed in this iteration (Jan 2026)

1. **Dummy relationships preflight stage added**
   - New job: `app/api/csv.v2/application/jobs/CsvPreflightRelationshipsJob.ts`.
   - New handler: `app/api/csv.v2/infrastructure/jobHandlers/CsvPreflightRelationshipsJobHandler.ts`.
   - Statuses added to `CsvImportStatus`:
     - `preflight:relationships`
     - `preflight:relationships:done`
   - Emits tenant-admin events:
     - `csvImport:preflight:relationships:start|success|error`

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

### 7) Agent-specific notes (handoff)

- **Always pass `tenantName` + `userId` into job dispatch params.**
  `UserAwareDispatchable` requires them and throws if missing.
- **Dispatcher awareness**:
  `DefaultDispatcher(tenant, ...)` only namespaces the queue; it does NOT inject
  tenant/user into job params. Always include them explicitly.
- **Dummy relationships stage is intentional**:
  Do not add real logic until the team is ready; the current stage just updates status and
  chains into entities import.
- **All CSV v2 jobs emit to tenant admins only** (`emitToTenantAdmins`), never to sessions.
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


