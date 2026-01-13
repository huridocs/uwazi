## CSV Import V2 — Context Doc 06 (Entities Import, No Relationships Yet)

**Date:** 2026-01-13  
**Owner:** CSV Import V2 initiative

### 1) Scope and sequencing
- We **exclude relationships entirely** for the initial entities-import pass. Treat `relationship` properties as unsupported/ignored for now.
- Current pipeline: registration → extraction/staging → preflight (thesauri) → thesaurus creation.
- Next big steps:
  1) Fix thesaurus applied-values to include **existing** value IDs (not just newly created).
  2) Implement the **Entities Import job** that consumes staged rows, ignoring relationships.
  3) Later, add **relationships preflight**, then wire relationships into entities import.

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
  - Batch processing with progress + heartbeat; idempotent retries (upsert or checkpointed progress).
  - Stats: at least `entitiesCreated`; later extend with `thesauriReferenced` / `entitiesReferenced`.
- Emissions: `csvImport:import:start|progress|success|error` to tenant-admins.
- Status: e.g., `import:entities` → `import:entities:done` (align with the final status naming decision).

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
1) ✅ DONE — `appliedValues` enrichment (existing + new IDs) and targeted tests; persistence occurs even when only existing IDs are added.
2) Confirm status/event naming mapping so entities-import uses it consistently.  
3) Design and implement **Entities Import job** with relationships ignored.  
4) Later: build **relationships preflight** and then wire relationships into entities import.
