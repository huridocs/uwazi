# CSV V2 Frontend Notes (Concise)

Date: 2026-04-15  
Audience: Frontend team  
Scope: What UI needs to integrate CSV Import V2 now.

## 1) Endpoints and responses

### `POST /api/csvImportEntities` (admin, V2-only)

- Request: multipart upload + `template` in body.
- Response:
  - `{ id: string, status: "queued", message: "Import registered and queued for processing." }`

### `GET /api/csvImportEntities/imports` (admin)

- Response:
  - `{ rows: CsvImportListRow[] }`
- Each row includes:
  - `id`, `status`, `templateId`, `file`, `createdAt`, `updatedAt`
  - optional: `progress`, `stats`, `extraction`, `failure`

### `GET /api/csvImportEntities/imports/:id` (admin)

- Response:
  - raw import object (same model shape persisted in backend), including status/progress/stats/failure/extraction.
  - includes `rowErrorsSummary` (from import-level rowErrors pointer) and `rowErrors` array loaded from `csv_import_row_errors`.

### `POST /api/csvImportEntities/imports/:id/cancel` (admin)

- Response:
  - `{ id: string, status: string, cancelled: boolean }`
- Semantics:
  - cooperative stop (no rollback),
  - idempotent,
  - terminal imports may return `cancelled: false` with unchanged terminal status.

### `GET /api/csvImportEntities/imports/:id/failed-rows-csv` (admin)

- Response:
  - streams CSV download (`text/csv`) from the persisted `rowErrors.reportPath` artifact.
- Semantics:
  - returns `404` when the import does not exist,
  - returns `404` when no failed-rows CSV artifact is available for the import.

## 2) Socket events and payloads

V2 emits to **tenant admins** (not per-session V1 pattern).

### Extract stage

- `csvImport:extract:start` -> `{ importId }`
- `csvImport:extract:progress` ->
  - files mode: `{ importId, stage: "files", processedFiles }`
  - rows mode: `{ importId, stage: "rows", stagedRows }`
- `csvImport:extract:success` -> `{ importId }`
- `csvImport:extract:error` -> `{ importId, message }`

### Preflight scan stage

- `csvImport:preflight:scan:start` -> `{ importId }`
- `csvImport:preflight:scan:progress` -> `{ importId, processedRows, totalRows }`
- `csvImport:preflight:scan:success` -> `{ importId }`
- `csvImport:preflight:scan:error` -> `{ importId, message }`

### Thesauri create stage

- `csvImport:preflight:thesauri:create:start` -> `{ importId }`
- `csvImport:preflight:thesauri:create:progress` ->
  `{ importId, thesaurusId, processedThesauri, totalThesauri, createdValues }`
- `csvImport:preflight:thesauri:create:success` -> `{ importId }`
- `csvImport:preflight:thesauri:create:error` -> `{ importId, message }`

### Relationships create stage

- `csvImport:preflight:relationships:create:start` -> `{ importId }`
- `csvImport:preflight:relationships:create:progress` ->
  `{ importId, processedTemplates, totalTemplates, createdEntities }`
- `csvImport:preflight:relationships:create:success` -> `{ importId }`
- `csvImport:preflight:relationships:create:error` -> `{ importId, message }`

### Entities import stage

- `csvImport:import:start` -> `{ importId }`
- `csvImport:import:progress` ->
  `{ importId, processedRows, totalRows, batchIndex, batchCount, entitiesCreatedInBatch }`
- `csvImport:import:success` -> `{ importId }`
- `csvImport:import:error` -> `{ importId, message }`

### Legacy bridge events (not for new UI)

- `IMPORT_CSV_START` (no payload)
- `IMPORT_CSV_PROGRESS` (number)
- `IMPORT_CSV_ROW_EXCEPTIONS` (legacy grouped payload)
- `IMPORT_CSV_ERROR` (legacy error payload)
- `IMPORT_CSV_END` (no payload)
- Source of truth:
  - These legacy events are emitted only by the V1 `/api/import` route flow.
  - CSV V2 jobs do not emit `IMPORT_CSV_*`; they emit only `csvImport:*` stage events.

## 3) V1 vs V2 (expectation management)

- New UI should use `POST /api/csvImportEntities` as the dedicated V2 import entrypoint.
- `POST /api/import` remains compatibility/testing surface and should not be the primary new-UI contract.
- V2 is a multi-stage background pipeline with explicit statuses (not a single monolithic flow).
- V2 has dedicated read/cancel endpoints for polling/recovery (`/api/csvImportEntities/imports*`).
- V2 socket events are stage-oriented (`csvImport:*`) and emitted to tenant admins.
- V1-like socket contract (`IMPORT_CSV_*`) exists only for the legacy `/api/import` flow and must not drive new UI behavior.
- Failed-rows CSV remains row-only export in current V2 scope (error taxonomy is in DB/API, not appended to report CSV).
- Failed-rows CSV is a filtered artifact:
  - empty-line failures are still counted in `stats.rowsFailed`,
  - but `ROW_EMPTY_OR_MALFORMED` rows are excluded from report CSV content.
- Failed-rows artifact path is exposed in import data (`rowErrors.reportPath`) and can be downloaded via:
  - `GET /api/csvImportEntities/imports/:id/failed-rows-csv`.

## 4) Current row errors (what is implemented)

- Row-level failures are persisted with structured taxonomy fields (not just plain text):
  - `rowIndex`, `message`, `code`, optional `property`, optional `rawValue`, optional `details`.
- Error cardinality per row is currently **single-error**:
  - importer persists only the first failure encountered for a row,
  - row processing stops for that row after first throw,
  - no generic array-of-errors payload exists per row (except type-specific arrays inside `details`,
    such as relationship `details.unresolved[]`).
- Current deterministic mapping includes:
  - `FILE_NOT_FOUND`
  - `RELATIONSHIP_NOT_FOUND`
  - `RELATIONSHIP_AMBIGUOUS`
  - `ROW_EMPTY_OR_MALFORMED` (message: `Empty line.`)
  - `VALUE_INVALID_FORMAT` (existing entity/property validation bubbled with context)
  - `INTERNAL_ERROR` (sanitized fallback only)
- Validation failures now include richer context when available:
  - `property`, `rawValue`,
  - `details.column`,
  - `details.validationMessage`,
  - `details.sourceErrorName`.
- Relationship resolution failures are now deterministic in row errors:
  - `RELATIONSHIP_NOT_FOUND`
  - `RELATIONSHIP_AMBIGUOUS`
- Relationship row errors include useful metadata for UX/support in `details.unresolved[]`:
  - `token`, `reason`, `scope`, and `candidates` (when ambiguous).
- Empty-line failures are explicit row errors:
  - `code: ROW_EMPTY_OR_MALFORMED`
  - `message: Empty line.`
  - `details.reason: empty_line`
- Import continues processing other rows; failed rows are counted in `stats.rowsFailed` and reflected in the failed-rows summary/report metadata.
- Failed-rows CSV stays as a source-row export (no appended error-code columns in the file) and excludes empty-line failures.

