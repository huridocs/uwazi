# CSV Import V2 — Context 09 (Canonical, Code-Verified)

Date: 2026-06-10  
Scope: Consolidate Contexts 01..08 and addendums into one source-of-truth file, verified against current code.

## 1) Purpose and usage

This is the **go-to file** for CSV v2 status.

- Active backlog tracking lives here.
- Older context docs are historical references.
- This version is updated after a **code-level verification pass** (not doc-only).

## 2) Verification rule used in this file

Status labels in this file mean:

- **Code-verified done**: behavior present in code and/or covered by relevant specs.
- **Code-verified pending**: behavior absent or explicitly still deferred in code.
- **Doc-only note**: historical/contextual; not used as completion evidence.

## 3) Code-verified done (current baseline)

### 3.1 Core CSV v2 pipeline

- Extraction -> row staging -> preflight -> relationship create -> entities import chain is implemented in CSV v2 jobs.
- Staged-row model is used (`csv_import_rows`) via row data source flows.
- Colon-based statuses and v2 socket event family are implemented.

### 3.2 Cancel/cooperative stop

- Cancel endpoint exists: `POST /api/csvImportEntities/imports/:id/cancel`.
- Cooperative cancellation checks exist across extraction/preflight/relationship/entities jobs.

### 3.3 Error taxonomy and failed-rows flow

- Row-error codes are persisted with deterministic mapping (`FILE_NOT_FOUND`, relationship not-found/ambiguous, `ROW_EMPTY_OR_MALFORMED`, `VALUE_INVALID_FORMAT`, fallback `INTERNAL_ERROR`).
- Empty-line failures are filtered out from generated `failed_rows.csv` while remaining counted in failed stats.
- Failed-rows download endpoint exists: `GET /api/csvImportEntities/imports/:id/failed-rows-csv`.

### 3.4 Entity update by id (Context 08 scope)

- Update path by CSV `id` exists in entities import flow.
- Template-scoped existence check is implemented: `existsByIdAndTemplateId`.
- "id not found in template" row error mapping exists (`ID_NOT_FOUND_IN_TEMPLATE`).
- `entitiesUpdated` is wired backend -> API types -> CSV upload UI (`ImportsTable`, `UploadStatus`, progress events/types/specs).

### 3.5 Files behavior already implemented

- `file` single-value and `files` multi-value split is implemented in resolver/header behavior.
- Update-row file persistence is append-only with dedupe by normalized `originalname`.

### 3.6 Infra hardening completed

- CSV staging artifact cleanup job exists (`CsvCleanupImportFilesJob` + handler + integration spec).
- CSV v2 index migration exists and has migration specs (`192-csv_v2_indexes`).
- Queue test cleanup helper/hardening exists for CSV v2 specs.
- Performance creep Stage 1 fix is present in `MongoTransactionManager` with corresponding spec coverage for handler leakage behavior.

## 4) Code-verified pending TODOs (canonical backlog)

### P0

1. **Remove remaining v1 compatibility bridge**
   - Legacy route `/api/import` is still mounted in `app/api/csv.v2/infrastructure/http/routes.ts`.
   - Legacy `/api/import` tests still exist in `app/api/files/specs/uploadRoutes.spec.ts`.

2. **Publish CSV v2 ReadTheDocs guidance**
   - No repository evidence of the dedicated CSV v2 ReadTheDocs update from Context 07 scope.

### P1

3. **Optional preflight creation toggle (create missing thesauri/relationship entities)**
   - Register API currently accepts only `{ template }` (plus file), no toggle field.
   - Relationship preflight currently always uses create-missing behavior.

4. **`file` multi-value misuse validation**
   - Current resolver behavior treats `file: "a|b"` as a literal single filename and results in missing-file behavior.
   - Pending requirement remains: explicit validation error instructing use of `files`.

5. **Remaining integration coverage gaps**
   - Strong coverage exists for many flows, but gaps remain for file-focused import integration scenarios called out in previous contexts:
     - single-row mixed document/image/media flow,
     - missing extracted file in end-to-end entities import path,
     - storage-mode compatibility scenarios.

6. **Optional queue stale-doc assertion spec**
   - Cleanup helper is present, but explicit "no stale queue docs remain" assertion spec is still optional and not found.

### P2

7. **Performance Stage 2 transaction-hook contract hardening**
   - `MongoTransactionManager` still supports persistent handler registration outside active transactions.
   - Stage 2 target (strict transaction-scoped app-facing hooks + centralized bootstrap-only persistent hooks) is not implemented.

8. **Imports list pagination**
   - List use case returns `getAll()` rows with no pagination contract.

## 5) Reclassified from previous 09 draft

The prior 09 draft listed "compact row-error summary projection in import detail" as pending.  
After code review, this is **already implemented** via import detail use case fields:

- `rowErrorsSummary`
- `rowErrors`

So this item is removed from pending backlog.

## 6) Explicitly retired from active backlog

The following tracks are code-verified complete and should not remain as active TODOs:

- CSV v2 index migration baseline.
- Cleanup implementation for terminal imports.
- Queue-pollution baseline hardening in CSV v2 specs.
- File-column contract freeze (`file` vs `files`) at baseline behavior.
- Entity update-by-id delivery from Context 08.

## 7) Non-goals kept explicit

- Cancellation is cooperative stop, not rollback.
- CSV update rows do not remove existing entity-owned files.

## 8) Evidence map (quick audit)

Use these paths as the first verification jump points.

Done evidence:

- Pipeline + statuses/events:
  - `app/api/csv.v2/application/jobs/CsvExtractUploadedZipJob.ts`
  - `app/api/csv.v2/application/jobs/CsvPreflightJob.ts`
  - `app/api/csv.v2/application/jobs/CsvCreateRelationshipEntitiesJob.ts`
  - `app/api/csv.v2/application/jobs/CsvImportEntitiesJob.ts`
  - `app/api/csv.v2/domain/CsvImport.ts`
- Cancel/cooperative stop:
  - `app/api/csv.v2/infrastructure/http/routes.ts`
  - `app/api/csv.v2/application/useCases/CancelCsvImportEntitiesImportUseCase.ts`
  - `app/api/csv.v2/infrastructure/mongodb/MongoCsvImportsDataSource.ts`
- Row errors + reports:
  - `app/api/csv.v2/application/services/CsvRowImportErrorFactory.ts`
  - `app/api/csv.v2/application/services/CsvImportEntitiesErrorReporting.ts`
  - `app/api/csv.v2/application/useCases/GetCsvImportEntitiesImportUseCase.ts`
  - `app/api/csv.v2/infrastructure/http/routes.ts`
- Entity update by id + stats/UI:
  - `app/api/csv.v2/application/jobs/CsvImportEntitiesRowPersistence.ts`
  - `app/api/entities.v2/contracts/MultiLanguageEntitiesDataSource.ts`
  - `app/api/entities.v2/database/MongoMultiLanguageEntityDataSource.ts`
  - `app/api/csv.v2/domain/CsvImportRowError.ts`
  - `app/api/csv.v2/application/jobs/CsvImportEntitiesJob.ts`
  - `app/react/V2/Routes/Settings/CSVUpload/Components/ImportsTable.tsx`
  - `app/react/V2/Routes/Settings/CSVUpload/UploadStatus.tsx`
- Infra hardening:
  - `app/api/csv.v2/application/jobs/CsvCleanupImportFilesJob.ts`
  - `app/api/csv.v2/infrastructure/jobHandlers/CsvCleanupImportFilesJobHandler.ts`
  - `app/api/migrations/migrations/192-csv_v2_indexes/index.ts`
  - `app/api/core/infrastructure/mongodb/common/MongoTransactionManager.ts`

Pending evidence:

- Remaining v1 bridge:
  - `app/api/csv.v2/infrastructure/http/routes.ts`
  - `app/api/files/specs/uploadRoutes.spec.ts`
- Missing preflight toggle:
  - `app/api/csv.v2/infrastructure/http/RegisterCsvImportController.ts`
  - `app/api/csv.v2/CsvImportEntities.ts`
  - `app/api/csv.v2/application/jobs/CsvCreateRelationshipEntitiesJob.ts`
- `file` multi-value validation gap:
  - `app/api/csv.v2/application/services/CsvImportRowFilesResolver.ts`
  - `app/api/csv.v2/application/services/specs/CsvImportRowFilesResolver.spec.ts`
- Pagination gap:
  - `app/api/csv.v2/application/useCases/ListCsvImportEntitiesImportsUseCase.ts`

## 9) Maintenance rule

When work changes:

1. Update this file first.
2. Move completed pending items from section 4 into section 3/6.
3. Keep older context docs as historical references only.

If this file conflicts with older context docs, treat this file as canonical and reconcile.

