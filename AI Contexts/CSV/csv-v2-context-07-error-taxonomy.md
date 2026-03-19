# CSV Import V2 — Context 07 Error Taxonomy

Date: 2026-03-19  
Owner: CSV Import V2 initiative  
Purpose: Source-of-truth handoff for standardizing CSV v2 row-error taxonomy, persistence shape, and user-facing reporting.

---

## 1) Why this file exists

CSV v2 currently persists row errors as free-form messages. This is functional, but low-signal for users and hard to stabilize for UX/support.

This doc gives the next agent a concrete implementation map so they can execute the full error-taxonomy workstream without re-discovery.

Clean-slate status (explicit):

- CSV v2 imports have **not** been deployed to production yet.
- As of today, there are **no current CSV v2 imports in the DB** to preserve.
- We should implement the final model directly (no legacy compatibility layer needed for this track).

Companion docs:

- `AI Contexts/CSV/csv-v2-context-07.md` (global project state / priorities)
- `AI Contexts/CSV/csv-v2-context-07-files.md` (file-column conventions already frozen)

---

## 2) Current behavior (code reality)

### 2.1 Row-error persistence shape

`csv_import_row_errors` currently stores:

- `importId`
- `rowIndex`
- `message`
- `createdAt`

Current domain + DS:

- `app/api/csv.v2/domain/CsvImportRowError.ts`
- `app/api/csv.v2/infrastructure/mongodb/MongoCsvImportRowErrorsDataSource.ts`

### 2.2 Where row errors are generated

Primary path:

- `app/api/csv.v2/application/jobs/CsvImportEntitiesBatchProcessor.ts`
  - any per-row exception is caught and persisted as `message: error.message`.

Representative error sources today:

- file missing in extracted assets:
  - `app/api/csv.v2/application/services/CsvImportRowFilesResolver.ts`
  - current message: `CSV import missing file "<name>" for import <id>`
- relationship resolution failures:
  - `app/api/csv.v2/application/services/CsvEntitiesImportMapper.ts`
  - current message includes property + token details in free text
- generic JS/runtime parser errors can leak internal exceptions
  - e.g. `Cannot read properties of undefined ...`

### 2.3 Reporting

- failed-rows CSV report is generated from staged rows, not from structured error metadata:
  - `app/api/csv.v2/application/services/CsvImportEntitiesErrorReporting.ts`
- import summary uses:
  - `csv_imports.stats.rowsFailed`
  - `csv_imports.rowErrors.reportPath`

### 2.4 Product decision checkpoint — failed-rows CSV format

This must be explicitly confirmed before implementation starts.

Decision options:

- **Option A (recommended for this slice):** keep failed-rows CSV as row-only export
  - contains the original failed source rows only,
  - no error code/message columns in the CSV artifact,
  - taxonomy lives in `csv_import_row_errors` + API projections.
- **Option B (future/optional):** enrich failed-rows CSV with error details
  - add columns derived from the same taxonomy source (`code`, stable `message`, selected `details`),
  - must never diverge from `csv_import_row_errors` semantics.

Current default in this document: **Option A**.

---

## 3) Goal and non-goals

### 3.1 Goal

Define and enforce a stable, user-facing row-error taxonomy with:

1. deterministic machine-readable code(s),
2. concise user message(s),
3. structured context payload for support/debugging,
4. clean-slate implementation with no legacy fallback behavior.

### 3.2 Non-goals

- No core queue/router/dispatcher contract changes.
- No rollback semantics changes.
- No frontend overhaul in this slice (but payloads must be UX-ready).

---

## 4) Proposed taxonomy (v1)

Use a finite `RowErrorCode` enum-like set.

Recommended initial set:

- `ROW_EMPTY_OR_MALFORMED`
- `HEADER_MISSING_REQUIRED_COLUMN`
- `VALUE_INVALID_FORMAT`
- `VALUE_UNSUPPORTED_LANGUAGE_COLUMN`
- `THESAURUS_VALUE_NOT_FOUND`
- `RELATIONSHIP_NOT_FOUND`
- `RELATIONSHIP_AMBIGUOUS`
- `FILE_NOT_FOUND`
- `FILE_INVALID_REFERENCE`
- `INTERNAL_ERROR`

Reasoning:

- keep initial set small and actionable,
- reserve `INTERNAL_ERROR` as explicit fallback (do not leak raw stack text),
- cover all known row-failure paths with deterministic mappings from day one
  (files + relationships + parsing/format errors).

---

## 5) Proposed persistence contract

Extend row-error domain model and Mongo schema to include structured fields:

```ts
type CsvImportRowError = {
  importId: string;
  rowIndex: number;
  message: string; // user-facing stable message
  code: RowErrorCode;
  property?: string; // property name when applicable
  rawValue?: string; // offending token/cell value when useful
  details?: Record<string, unknown>; // structured context
  createdAt: number;
};
```

Notes:

- Keep `message` for human readability.
- Add `code` as required for all newly persisted errors.
- No legacy-row fallback logic is required (clean slate: no existing CSV v2 import records).

---

## 6) Error creation API (application-level)

Introduce a dedicated helper/factory in CSV v2 application layer:

- `CsvRowImportErrorFactory` (name suggestion)

Responsibilities:

1. map known exceptions to taxonomy codes,
2. produce standardized user messages,
3. attach structured context (`property`, `rawValue`, `details`),
4. sanitize unknown exceptions into `INTERNAL_ERROR`.

Example output policy:

- `FILE_NOT_FOUND`:
  - message: `Referenced file was not found in the import package.`
  - details: `{ filename, column: "file|files|attachments" }`
- `RELATIONSHIP_AMBIGUOUS`:
  - message: `Relationship value is ambiguous and cannot be resolved uniquely.`
  - details: `{ property, token, candidates, scope }`

---

## 7) Rollout plan (recommended order)

### Phase 1 — Domain + persistence extension

1. Extend `CsvImportRowError` domain to include `code/property/rawValue/details`.
2. Extend Mongo DBO typing and DS mapping.
3. Make `code` mandatory for all persisted row errors in this track.

### Phase 2 — Replace ad-hoc exception persistence in import batch

1. In `CsvImportEntitiesBatchProcessor`, replace `message: error.message` with:
   - `CsvRowImportErrorFactory.fromException(...)`.
2. Start with explicit mappings for:
   - file-missing,
   - relationship not-found/ambiguous,
   - generic fallback.

### Phase 3 — Normalize source errors at producer boundaries

Refactor selected services to throw typed CSV row errors (or typed markers) instead of raw `Error` strings:

- `CsvImportRowFilesResolver` for file-related issues.
- `CsvEntitiesImportMapper` relationship unresolved paths.

### Phase 4 — Reporting/projection alignment

1. Add compact summary projection by code (counts by `RowErrorCode`) in import detail use case if needed.
2. Clarify failed-rows CSV semantics:
   - current `failed_rows.csv` is a download of original failed source rows only (no error columns),
   - keep that behavior as-is in this phase.
3. If product later decides failed-rows CSV must include error details, use the same taxonomy
   (`code`, stable message, structured details) as `csv_import_row_errors` (single source of truth).

### Phase 5 — Tests and fixtures

1. Unit tests for factory mapping (`fromException` behavior).
2. Integration test in `CsvImportEntitiesJob.spec.ts` proving persisted `code/details`.
3. Integration test ensuring `failed_rows.csv` still contains original failed rows only
   (no behavioral regression in report generation).

---

## 8) Acceptance criteria

All must pass:

1. Newly persisted row errors include `code` and user-safe `message`.
2. Known file/relationship failures map to deterministic taxonomy codes.
3. Unknown exceptions no longer leak raw internal text directly to users.
4. `failed_rows.csv` semantics are explicit and consistent with product decision:
   - either row-only export (current), or taxonomy-aligned error columns if enabled later.
5. Focused tests pass for factory + batch processor integration + report behavior.

---

## 9) Guardrails for next agent

- Keep changes scoped to `app/api/csv.v2/**` and CSV context docs.
- Do not change core queue/router/dispatcher/controller contracts.
- No `as any` / `as unknown as` in production implementation.
- Prefer integration-first tests where persistence behavior is asserted.

---

## 10) Suggested implementation entry points

Primary files likely touched:

- `app/api/csv.v2/domain/CsvImportRowError.ts`
- `app/api/csv.v2/infrastructure/schemas/CsvImportRowErrorsTypes.ts`
- `app/api/csv.v2/infrastructure/mongodb/MongoCsvImportRowErrorsDataSource.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesBatchProcessor.ts`
- `app/api/csv.v2/application/services/CsvImportRowFilesResolver.ts`
- `app/api/csv.v2/application/services/CsvEntitiesImportMapper.ts`
- `app/api/csv.v2/application/jobs/specs/CsvImportEntitiesJob.spec.ts`

Optional read/projection follow-up:

- `app/api/csv.v2/application/useCases/*Read*`

---

## 11) Handoff note

If the user asks to execute this track, the next agent should:

1. Re-read `csv-v2-context-07.md` + this file.
2. Implement Phase 1 → 3 first (taxonomy persisted at write path).
3. Run focused tests and then update both docs in the same iteration.
