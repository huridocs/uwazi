# CSV Import V2 — Context Doc 08 (Entity Update via `id`)

**Date:** 2026-06-10  
**Owner:** CSV Import V2 initiative  
**Scope:** implemented and validated (`csv.v2` test suite)

## 1) Purpose

Capture the agreed direction for adding entity updates to CSV v2 when an `id` column is present, aligned with current V1 behavior where relevant, and explicitly documenting open decisions (notably files/idempotency).

---

## 2) V1 Baseline (what exists today)

### 2.1 Which column triggers updates in V1?

V1 uses **only** `id` from CSV row data, and interprets it as `sharedId`.

- `app/api/csv/importEntity.ts`
  - `currentEntityIdentifiers(toImportEntity.propertiesFromColumns.id, language)`
  - lookup query is `{ sharedId, language }`
- `app/api/csv/specs/csvLoader.spec.js`
  - scenario is literally `describe('when sharedId is provided')`, but the CSV header used is `id`

There is no V1 row-import logic that reads `propertiesFromColumns.sharedId` or `propertiesFromColumns._id`.

### 2.2 Unknown `id` in V1

If `id` is present but not found, V1 falls back to create (no explicit row error).  
For CSV v2, this is intentionally changing (see section 3).

### 2.3 Reserved headers note in V2 docs

`app/api/csv.v2/application/services/CsvHeaderAnalyzer.ts` logic (and context notes) allows `id`, `_id`, `sharedId` to pass as non-language headers, but this is not equivalent to import semantics.  
Current decision for update semantics is in section 3.

---

## 3) Agreed Decisions for CSV v2 Entity Update

1. **Update key column:** CSV column is `id`.
2. **Meaning of `id`:** map to entity `sharedId`.
3. **Aliases:** do **not** implement `_id` or `sharedId` aliases for update behavior in this iteration.
4. **Unknown id behavior:** row-level error (no create fallback).
5. **Error simplification:** keep taxonomy simple for this branch; treat as one business-facing case:
   - `"id not found in template"`  
   (No distinction between “id not found at all” vs “entity exists but belongs to another template”.)
6. **Permissions:** import route is admin-only; no additional entity-level permission branching is required for this flow.
7. **Feature flag/migrations:** no new flag and no DB migration required; this ships under existing CSV v2 rollout path.
8. **Stats/UI:** add persisted update counters and expose them in UI using naming consistent with existing stats fields.

---

## 4) Implemented Changes

## 4.1 Import flow branch in entities stage (implemented)

Main touchpoints:
- `app/api/csv.v2/application/jobs/CsvImportEntitiesBatchProcessor.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesRowPreparation.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesRowPersistence.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesBatchTypes.ts`

Implemented row behavior:
- if row has `id` value:
  - resolve entity inside current template scope via datasource method
    `existsByIdAndTemplateId(id, templateId)`
  - if found in template -> update path
  - if not found in template -> row error
- if row has no `id` value:
  - keep current create path

## 4.2 Keep using Services, not direct DB queries (implemented)

Entity persistence remains through service layer (`EntitiesService` / use-case level orchestration), and lookup happens through datasource contracts.  
No direct database query was introduced in CSV import job logic.

Important validation item:
- `app/api/core/application/EntitiesService.ts`
  - `insert(...)` currently triggers relationship sync through dispatcher
  - `update(...)` currently emits `EntityUpdatedEvent` but does not call dispatcher sync directly

CSV import should rely on service behavior; if relationship/indexing side effects are incomplete for update, the fix should live in the service/domain orchestration, not as CSV-specific special handling.

## 4.3 Error taxonomy + tests (implemented)

Implemented:
- one row error classification for id-template miss semantics (`ID_NOT_FOUND_IN_TEMPLATE`)
- business-facing message: `id not found in template`
- tests mirror that simplicity (no split between unknown id vs wrong-template id)

Primary test area:
- `app/api/csv.v2/application/jobs/specs/CsvImportEntitiesJob.spec.ts`

## 4.4 Stats naming and persistence (implemented)

Current stats include `entitiesCreated`, `rowsProcessed`, `rowsFailed` in:
- `app/api/csv.v2/domain/CsvImport.ts`

Added update metric `entitiesUpdated`, keeping `rowsProcessed` and `rowsFailed` as global counters across both created and updated rows.

Implemented touchpoints:
- `app/api/csv.v2/domain/CsvImport.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesRowsProcessor.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesJob.ts`
- `app/api/csv.v2/infrastructure/jobHandlers/CsvImportEntitiesJobHandler.ts`
- UI consumers under `app/react/V2/Routes/Settings/CSVUpload/*`
- `app/react/V2/api/csv/events.ts`
- `app/react/V2/api/csv/index.ts`

---

## 5) Files on Update: implemented direction + remaining risk

### Direction

Preferred behavior: when updating by `id`, **insert new files and keep existing files** (append semantics).

### Risk

Append semantics can create duplicates on retries/non-idempotent reprocessing.

### Implemented strategy

Implemented option 2: **best-effort dedupe by file `originalname`** during update rows.

Behavior in update rows:
- existing files are kept (no delete path),
- incoming files with matching `originalname` are skipped,
- incoming files with new `originalname` are inserted.

Also implemented as **case-insensitive dedupe** (`trim().toLowerCase()`), and dedupe is applied both against existing entity files and within the incoming row batch.

---

## 6) Impact and Effort (actual)

### Expected impact

- No queue topology changes.
- No migration/new feature flag.
- Behavior change only for CSV files including `id`.
- API/UI impact is additive via new update counter(s).
- Partial CSV update semantics (preserving values for omitted columns on update rows) are out of scope for this iteration; current implementation scope does not include this behavior change.

### Actual effort notes

- Core update branch + simplified errors + stats/UI completed.
- Refactor was needed to keep maintainable code shape:
  - split row preparation and row persistence into dedicated modules,
  - remove temporary max-lines lint bypass from batch processor.
- Strong idempotency keying was not implemented in this iteration.

---

## 7) Implementation Summary (what shipped)

1. Row-level update branch added in entities import batch processor.
2. Row error `ID_NOT_FOUND_IN_TEMPLATE` added and covered in tests.
3. Persisted update stat (`entitiesUpdated`) added and propagated through API/UI.
4. Append-only file behavior with best-effort dedupe by `originalname` implemented.
5. Datasource lookup method added as `existsByIdAndTemplateId` (codebase-friendly naming), while current Mongo implementation still maps it to `sharedId` under the hood.

---

## 8) Nuances discovered during implementation

- **Async error handling nuance:** when returning a promise inside `try/catch` in async code, `await` is required if the catch should handle downstream async rejections. This was fixed in batch row processing.
- **Property replacement nuance:** update rows are implemented with full-replace semantics for mapped properties by resetting to template defaults before applying row assignments.
- **Naming nuance for transition architecture:** new datasource API uses `id` naming (`existsByIdAndTemplateId`) to align with newer entity interfaces even though current Mongo implementation still resolves via `sharedId`.
- **UI nuance:** imports table now shows separate columns for `Entities created` and `Entities updated` rather than overloading one field.

---

## 9) Verification status

- Backend/Frontend lint checks for touched files: clean.
- `csv.v2` suite passes with:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest csv.v2 -w=4`
- CSV upload frontend specs updated and passing (including task progress spec updates).

---

## 10) Pending TODOs

- No `TODO`/`FIXME`/`XXX` markers were found under:
  - `app/api/csv.v2`
  - `app/react/V2/Routes/Settings/CSVUpload`

- Remaining non-goal/risk (not a code TODO in this delivery):
  - stronger idempotency keying for file operations (`(importId, rowIndex, fileRef)`) is still out of scope.

---

## 11) Notes for next agent

- Do not expand alias semantics beyond `id` unless explicitly requested.
- Keep error taxonomy minimal for this feature branch.
- Keep all path references relative to project root in future context updates.
