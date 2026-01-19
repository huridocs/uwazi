## CSV Import V2 — Context Doc 06 (Entities Import, No Relationships Yet)

**Date:** 2026-01-13
**Owner:** CSV Import V2 initiative

### 1) Scope and sequencing

- We **exclude relationships entirely** for the initial entities-import pass. Treat `relationship` properties as unsupported/ignored for now.
- Current pipeline: registration → extraction/staging → preflight (thesauri) → thesaurus creation.
- Next big steps:
  1. Fix thesaurus applied-values to include **existing** value IDs (not just newly created).
  2. Implement the **Entities Import job** that consumes staged rows, ignoring relationships.
  3. Later, add **relationships preflight**, then wire relationships into entities import.

### 2) Current state (code, not just docs)

- Staging: `CsvExtractUploadedZipJob` normalizes files and writes `csv_import_rows` (ordered rows, empty rows preserved).
- Preflight: `CsvPreflightJob` reads staged rows only, runs `CsvHeaderAnalyzer`, builds pending thesaurus entries via `CsvThesauriPendingValuesBuilder`, persists to `csv_import_thesauri_values`, sets status `preflight:thesauri:done`, dispatches create job.
- Create thesaurus values: `CsvCreateThesauriValuesJob` uses `PendingThesauriValuesApplier` (`LegacyThesauriRepository` + `LegacyTranslationsRepository`) to append missing values, update translations, mark `appliedAt`, `appliedValues`, `stats`, set status `preflight:thesauri:create:done`.
- Statuses stored as colon-strings in `CsvImportStatus` enum; events go to tenant-admin sockets only.
- Relationships: no V2 handling exists yet.

### 3) Immediate change: capture existing thesaurus IDs

**Problem:** `appliedValues` currently records IDs only for values created in this run. Existing labels referenced by the CSV are not recorded, forcing later re-reads of thesauri.

**Goal:** When applying pending values, produce `appliedValues` covering **all** labels (existing and new) that appear in the pending doc, so downstream (entities import, relationships preflight) can map label → valueId without extra queries.

**Outcome:** `csv_import_thesauri_values.appliedValues` must persist both existing and newly created root/child IDs for every label present in the pending doc (including mixed nested + standalone roots), so entities import can rely solely on this denormalized map without further thesaurus lookups.

**Status (done):**

- `PendingThesauriValuesApplier` now builds a normalized thesaurus index and collects `appliedValues` for every pending label, covering both existing and newly appended roots/children (including standalone roots).
- `CsvImportThesauriValues.shouldPersist` accepts the incoming `appliedValues` and persists even when no appends occur but new applied mappings are found.
- Specs cover existing-only, new-only, and mixed existing + new (nested and standalone) cases.
- `CsvImportStatus` now uses colon-based values that match the emitted socket events (`preflight:thesauri`, `preflight:thesauri:create`, etc.), so downstream jobs can reuse the same naming without extra mapping.

**Plan (code targets):**

- Extend `PendingThesauriValuesApplier` (and supporting diff/indexing) to build a label→id map from the thesaurus **after** append. Use the same sanitize + normalize rules as the diff.
- Populate `appliedValues` with both:
  - existing root/child IDs that match pending labels
  - newly created root/child IDs
- Ensure persistence still occurs when only “existing IDs” are added (no new appends).
- Tests to add/adjust:
  - Pending doc with labels already present → `appliedValues` populated with existing IDs, no appends.
  - Mixed existing + new → both sets captured.
  - Idempotency: rerun with `appliedAt` set does nothing.
  - Translation write failure still bubbles/retries as before.

### 4) Entities Import job (relationships out of scope)

- Inputs: staged rows (`csv_import_rows`), template, settings, thesaurus label→id map from `csv_import_thesauri_values.appliedValues`.
- Behavior:
  - Ignore `relationship` properties entirely (no lookup, no create; optionally emit a single policy warning if needed).
  - Parse rows using header analysis; resolve select/multiselect via `appliedValues`; warn on missing labels; handle other property types per V1 semantics.
  - Create entities via entities.v2 domain/DS; translations per row languages; batch indexing after each batch.
  - Error handling: **before** we stopped on the first error; **now** we keep going and accumulate per-row errors in the DB. The job should complete and then surface a per-row error list and/or a downloadable CSV containing only the failed rows.
  - Early stop policy: add a **quick-stop** to avoid hours of processing when failure rates are extreme. Suggested defaults and config variable names:
    - `CSV_IMPORT_ROW_FAILURE_WARMUP_ROWS = 50`: wait for at least this many rows before evaluating.
    - `CSV_IMPORT_ROW_FAILURE_RATIO_STOP = 0.6`: failure ratio at/above this after warm-up → stop.
    - `CSV_IMPORT_ROW_FAILURE_CONSECUTIVE_STOP = 25`: consecutive failures at/above this → stop.
    - `CSV_IMPORT_ROW_FAILURE_ABSOLUTE_STOP = 500`: total failures at/above this → stop.
    - On stop: persist collected row errors, mark import as `failed` with a policy reason, emit `csvImport:import:error`, and produce the failed-rows CSV/report.
  - Batch processing with progress + heartbeat; idempotent retries (upsert or checkpointed progress).
  - Stats: at least `entitiesCreated`; later extend with `thesauriReferenced` / `entitiesReferenced`.
- Emissions: `csvImport:import:start|progress|success|error` to tenant-admins.
- Status: e.g., `import:entities` → `import:entities:done` (align with the final status naming decision).

### 4.1) Property type compatibility matrix (V1 vs V2)

Goal: ensure every V1 CSV parsing behavior is covered in V2, unless the Entities V2 domain already handles it. The table below lists **V1 CSV behavior**, **Entities V2 domain behavior**, and the **current V2 CSV import gap**.

| Property type              | V1 CSV behavior (row parsing)                                               | Entities V2 domain behavior                               | V2 CSV import status / gap                                              |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| text / markdown            | `sanitizeMetadataValue`, empty → skipped, warnings; 1 value only            | trims value, validates required/length                    | V2 passes raw string; no sanitization warnings                          |
| numeric                    | Coerces to number if possible; otherwise passes string (validation later)   | `z.coerce.number` (domain coerces)                        | Likely OK for numeric; still no sanitization warnings                   |
| date                       | Parses with `settings.dateFormat` + allowed formats; stores timestamp       | Expects **number** (timestamp)                            | **Now parsed** in V2 import                                             |
| multidate                  | Splits by `                                                                 | `, parses each to timestamp                               | Expects array of numeric entries                                        | **Now parsed** in V2 import                   |
| daterange                  | `from:to` using `:`; parses to timestamps                                   | Expects `{ from, to }` numbers and `to >= from`           | **Now parsed** in V2 import                                             |
| multidaterange             | Split `                                                                     | `, each range `from:to`                                   | Expects array of ranges with numeric values                             | **Now parsed** in V2 import                   |
| link                       | `label                                                                      | url`or`url` (label defaults to url); invalid URL → null   | Validates `url` is a URL; single value                                  | **Now parsed** in V2 import                   |
| geolocation                | `lat                                                                        | lon` parsed to numbers; one value → empty                 | Requires numeric `lat`, `lon`                                           | **Now parsed** in V2 import                   |
| select                     | Parent/child parsing + sanitization; lookup in thesaurus; warns on missing  | Validates selection entries; not translatable             | V2 resolves using `appliedValues`; **default-language column enforced** |
| multiselect                | Split by `                                                                  | `, parse parent/child, dedupe; warns on missing           | Validates selection entries; dedup in domain                            | V2 resolves using `appliedValues`, split by ` | `/`;` (OK), **default-language column enforced** |
| relationship               | Creates missing related entities (if `content`); returns `sharedId`         | Domain supports relationship assignments                  | **Intentionally deferred** in V2                                        |
| generatedid                | If empty, auto‑generates ID                                                 | Domain auto‑generates ID if empty                         | **Covered by domain** (no extra V2 parsing needed)                      |
| image                      | Accepts file path or URL; V1 stores file and uses `/api/files/...`          | Domain validates URL; adds `/api/files/` prefix if needed | **Files handling intentionally deferred**                               |
| media                      | Similar to image; expects file path                                         | Domain validates non‑empty string                         | **Files handling intentionally deferred**                               |
| preview                    | V1 passes value; mainly derived                                             | Domain creates empty assignment                           | V2 ignores (probably fine)                                              |
| attachments / file columns | Special handling in `importEntity` (extract files, store, rewrite metadata) | Not handled in domain                                     | **Files handling intentionally deferred**                               |

Notes:

- Entities V2 domain **validates types** and **coerces numeric**, but does **not** parse dates/links/geo from strings. Those need CSV‑specific parsing like V1.
- V1 used **default language** for select/multiselect labels even in translated columns; V2 must mirror that and rely on `appliedValues` from thesauri preflight.
- Sanitization warnings and row‑level parsing warnings exist in V1; V2 currently drops these.
- Files/attachments handling is **intentionally deferred** (image/media/file/attachments) until the dedicated file import stage is defined.

### 4.2) Row-level error reporting (implementation state)

Current implementation (done):

- Row-level errors are persisted to `csv_import_row_errors` with `{ importId, rowIndex, message, createdAt }`.
- The import continues processing; only successful rows count toward `entitiesCreated`.
- Errors are persisted inside the same batch transaction as progress updates.
- A summary is recorded on `csv_imports.stats` (`rowsProcessed`, `rowsFailed`) and `rowErrors` now includes `{ failedRows, reportPath }`.
- A failed-rows CSV report is generated at `csv-imports/{importId}/reports/failed_rows.csv` when any rows fail.
- Quick-stop thresholds are enforced after each batch using:
  - `CSV_IMPORT_ROW_FAILURE_WARMUP_ROWS`
  - `CSV_IMPORT_ROW_FAILURE_RATIO_STOP`
  - `CSV_IMPORT_ROW_FAILURE_CONSECUTIVE_STOP`
  - `CSV_IMPORT_ROW_FAILURE_ABSOLUTE_STOP`

### 5) Relationships (later)

- Add a dedicated **relationships preflight** job after thesauri creation, before entities import:
  - Scan staged rows, collect titles per relationship property/template, resolve existing entities, create missing related entities idempotently.
  - Emit `csvImport:preflight:relationships:*`; status `preflight:relationships(:done)`.
- Only after that, wire relationship resolution into the entities-import job.

### 6) Guardrails and conventions (carry-over)

- **V2-only**: no imports from `app/api/csv` v1 modules inside csv.v2.
- **Transactions**: all DB writes inside `transactionManager.run`; dispatch the next job inside the same run after successful state write.
- **Staged rows are the source of truth**; never re-read the CSV file after extraction.
- **Sockets**: tenant-admin room only; no session events.
- **Idempotency**: every job safe to retry; dedupe by upsert/exists checks.
- **Lint/TS/tests**: every touched file must pass ESLint + TS; prefer integration tests with real Mongo and staged rows.
- **Specs naming**: every `it` description should start with “should …” to align with repo spec style.
- **One class per file, helpers above callers**, avoid `as any`, keep comments for non-obvious rationale only.

### 7) Common pitfalls to avoid

- Forgetting to include existing value IDs in `appliedValues`.
- Re-reading thesauri in later stages instead of using stored mappings.
- Letting use cases open their own transactions; jobs should own TM boundaries and pass callbacks.
- Emitting to tenant-wide rooms or sessions—stick to tenant-admin room.
- Reading the CSV file again after extraction; always use `csv_import_rows`.
- Introducing relationship handling before the dedicated preflight exists.

### 8) Next actions (execution order)

1. ✅ DONE — `appliedValues` enrichment (existing + new IDs) and targeted tests; persistence occurs even when only existing IDs are added.
2. TODO — Replace Legacy thesaurus/translation wrappers with the Thesaurus V2 data sources in `CsvCreateThesauriValuesJob` / `PendingThesauriValuesApplier`.
3. ✅ DONE — Status/event naming aligned: `CsvImportStatus` values are colon-based and match emitted `csvImport:*` events.
4. ✅ DONE — Entities Import job implemented with V2 domains, ignoring relationships (statuses, progress/events, appliedValues lookup for select/multiselect, entities.v2 creation, stats update). ⚠️ Tests are not yet written for this stage. ⚠️ Open design follow-ups (agreed plan = Option A, inline batching):
   - Paging/batching: process staged rows in bounded pages (configurable `batchSize`, e.g. 1k) instead of loading all rows. Persist progress (`lastProcessedRow` / `processedRows`) on the import; emit per-batch progress + heartbeat.

- Idempotency: upsert entities by deterministic key (`importId + rowIndex`) so retries/batch replays do not duplicate rows; resume from checkpoint on retry.
- Error reporting: continue processing; accumulate failed rows (row index + reason) in the DB; emit/record summary at end and produce a downloadable CSV containing only failed rows. Keep job success/failure semantics: non-retriable policy errors still fail the job, but row-level parse/validation errors should collect and report without stopping the batch.
- Horizontal scale: deferred. Option B (chunk jobs) acknowledged but not chosen now to avoid race/aggregation complexity; stick to single-job paged processing for MVP.

5. Later: build **relationships preflight** and then wire relationships into entities import.
