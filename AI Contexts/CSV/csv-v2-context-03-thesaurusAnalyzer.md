## CSV Import V2 — Context Doc 03 (Thesaurus Preflight Addendum)

**Date:** 2025-11-18
**Owner:** CSV Import V2 initiative
**Scope:** Thesauri preflight analysis → pending-value generation → execution

---

### Why this addendum exists

We discovered that the current preflight stage (`CsvPreflightJob`) only performs a shallow, incomplete version of v1’s `arrangeThesauri` logic, and lumps parsing + DB writes into one step. This doc spells out:

1. What v1 actually did and why.
2. What the current v2 code is missing.
3. How we will evolve the flow into two clear responsibilities:
   - **Preparation** (`CsvPreflightJob`): analyze staged rows, replicate v1 parsing, surface _all_ deterministic errors, and persist a pending-values document (missing values + translations).
   - **Application**: consume the pending-values document and perform idempotent thesaurus writes plus translation updates.

New agents should be able to pick up this reference without re-litigating the legacy behavior.

---

### Module layout (Nov 2025)

- `application/`
  - `contracts/`: CSV imports DS, CSV import rows DS, **CsvImportThesauriValuesDataSource** (new).
  - `jobs/`: `CsvExtractUploadedZipJob` (extraction) and `CsvPreflightJob` (headers + thesauri preparation).
  - `services/`: helper utilities (`CsvHeaderAnalyzer`, `CsvThesauriPendingValuesBuilder`, `CsvReader`, etc.).
- `domain/`
  - `CsvImport`, `CsvImportRow`, `CsvThesauriPendingValues`, **`CsvImportThesauriValues`**.
- `infrastructure/`
  - `data_source_defaults.ts`, `csv_import_rows_defaults.ts`, **`csv_import_thesauri_values_defaults.ts`**.
  - `mongodb/`: `MongoCsvImportsDataSource`, `MongoCsvImportRowsDataSource`, **`MongoCsvImportThesauriValuesDataSource`**.
  - `queue/`: dispatchers for extraction and preflight jobs.
  - `schemas/`: `CsvImportTypes`, **`CsvImportThesauriValuesTypes`**.

Use this map when navigating the refactored module.

**Job naming:** Application-layer jobs live in `application/jobs/*Job.ts`, while queue wrappers live in `infrastructure/queue/*JobDispatcher.ts`. When this doc references `CsvPreflightJob`, it means the application job (not the dispatcher).

---

### V1 behavior recap (`arrangeThesauri`)

File: `app/api/csv/arrangeThesauri.ts` + `specs/arrangeThesauri.spec.ts`

Key responsibilities:

1. **Input filtering & sanitation**
   - Uses safe-named headers from `validateColumns`.
   - Only considers template properties of type `select` / `multiselect`.
   - Always reads the default-language column for each property, even if multi-language columns exist.
2. **Parsing semantics**
   - Splits multiselect cells using v1’s separator rules.
   - Supports multiple parent-child syntaxes (`Parent::Child`, `Parent : Child`, etc.) and preserves order for nested creation.
   - Detects invalid group usage (standalone group label without children, conflicting parent definitions) and throws typed errors.
   - Trims/sanitizes labels but respects existing unsanitized entries (avoids creating sanitized duplicates).
3. **Aggregation & dedupe**
   - Builds sets of new root labels and nested children per thesaurus, case-insensitive.
   - Checks existing thesaurus entries before inserting (no duplicates).
4. **Translations**
   - Tracks labels per language so new values are created with the appropriate translation map.
   - Uses i18n entries to upsert translations for newly added values.
5. **Error reporting**
   - Throws deterministic errors for invalid structures (group without child, parent reused inconsistently, invalid syntax).
   - V1 surfaces these errors in the request thread; any fix should aim to report all violations together.
6. **Testing coverage**
   - `arrangeThesauri.spec.ts` covers parent/child creation, duplicates, trimming, case-insensitive behavior, translation updates, error scenarios, and idempotency.

---

### Current V2 implementation (pre-refactor)

File: `app/api/csv.v2/application/jobs/CsvPreflightJob.ts`

Issues / gaps:

1. **Parsing**
   - Only splits on `::`; ignores other parent-child syntaxes and multiselect separators.
   - No support for sanitized fallbacks or label normalization beyond a basic trim.
2. **Language handling**
   - Reads only `prop.name__defaultLanguage` via naive string match; doesn’t use analyzer insights (no fallback if columns are missing or localized differently).
3. **Error handling**
   - Throws on first error; no aggregation, no persistence of which rows/properties failed.
4. **Translations**
   - Does not handle translations at all; inserts base labels only.
5. **Deduplication**
   - Collects roots/nested entries per import run without checking existing thesaurus values.
6. **Responsibility mixing**
   - Parses the CSV _and_ performs DB writes in the same use case, making it hard to retry/extend.
7. **Testing**
   - The spec file is still the old v1 integration test (and currently broken). No coverage for the missing scenarios listed above.

---

### Proposed architecture

#### Stage 1: `CsvPreflightJob` (analysis-only)

Responsibilities:

1. Load staged rows (`csv_import_rows`), template, and settings (for newNameGeneration + languages).
2. Run `CsvHeaderAnalyzer` (already done) and persist aggregated header issues if any.
3. For each select/multiselect property:
   - Use a new parser that mirrors v1 `arrangeThesauri` logic (multi-value splitting, parent/child semantics, sanitization, trimming, warnings).
   - Build a **Thesauri Plan** structure:
     ```ts
     type ThesauriPlan = {
       importId: string;
       createdAt: number;
       selects: Array<{
         propertyId: string;
         thesaurusId: string;
         defaultLanguage: string;
         newRoots: Array<{ label: string; languages: Record<string, string> }>;
         newChildren: Array<{
           parent: string;
           child: string;
           languages: Record<string, string>;
         }>;
       }>;
       warnings?: Array<{ property: string; message: string; row?: number }>;
     };
     ```
   - Persist these pending values (option TBD: `csv_imports.pendingValues` or a separate `csv_import_pending_values` collection for larger payloads).
4. Aggregate **all** deterministic errors (invalid group usage, missing parents, duplicated conflicting entries) and throw a single `CsvPreflightPreparationError`, persisting `{ failure: { stage: 'preflight:preparation:thesauri', issues } }`.
5. On success, set status to `preflight:thesauri:done` and dispatch Stage 2 from inside that same `transactionManager.run` block (no `onCommitted` hop).

#### Stage 2: `CsvCreateThesauriValuesJob` (mutation)

Responsibilities:

1. Load the persisted pending-value docs for the import.
2. Fetch current thesauri values + translations (via the legacy adapters), compute missing entries, and perform idempotent writes:
   - Append new roots/nested entries (skip duplicates; honor sanitized comparisons).
   - Upsert translations via the temporary `LegacyTranslationsRepository`.
3. On error, set status → `retrying` / `failed` (with failure info) respecting retry semantics.
4. On success, mark the pending doc as applied (`appliedAt`, `appliedValues`, stats) and dispatch the next preflight stage (relationships) before leaving the transaction.

#### Data persistence

- `csv_imports.failure`: now includes aggregated analyzer + parser issues (`failure.issues`).
- `csv_import_thesauri_values`: new collection storing one pending-value document per `{ importId, thesaurusId }`. Each document contains the pending root/child labels + translations for that thesaurus. This avoids `csv_imports` documents growing past Mongo’s 16 MB limit and keeps Stage 2 idempotent.

#### Socket emissions

- Keep current `start/success/error` events minimal (just `importId` + `message` for error), with the expectation that the frontend will fetch `GET /csv_imports/{importId}` to read `failure.issues`.
- Later, when the API endpoint exists, ensure it exposes both `status` and the pending-values/failure metadata.

---

### Implementation roadmap

1. **Parser extraction** ✅
   - Implemented `CsvThesauriPendingValuesBuilder` (see specs) to read staged rows, mirror v1 parsing behaviors, emit aggregated issues, and return pending entries grouped per thesaurus. Pending docs are persisted in `csv_import_thesauri_values`.
2. **Preparation stage updates** ✅
   - `CsvPreflightJob` now uses the builder, persists aggregated issues, and stores per-thesaurus pending docs via `CsvImportThesauriValuesDataSource`.
   - Status transitions remain `preflight:thesauri` → `preflight:thesauri:done`.
3. **Apply-pending-values job/use case** ✅
   - `CsvCreateThesauriValuesJob` + handler are wired in `queueRegistry`, using the interim legacy adapters for thesauri/translation writes. Job emits tenant-admin events and records stats.
4. **Testing** (in progress):
   - Add unit tests for the parser (covering v1 scenarios).
   - Add integration tests for the preparation use case (pending docs persisted, failure issues saved).
   - Add integration tests for the apply-pending-values job (idempotent writes, translations, retries).
5. **Docs + TODOs**:
   - Keep this addendum updated as we implement each step.
   - Ensure TODO list references pending-value persistence, apply job, and spec repairs.

---

### Current TODOs (from this addendum)

1. Add integration coverage for the apply-pending-values job (translations failure, retry/idempotency, stats).
2. Restore/replace preflight integration tests (`CsvPreflightJob.spec.ts`) so the staged rows + dispatch chain are exercised end-to-end.
3. Document the pending-values format and failure schema for the future `/csv_imports/{importId}` endpoint + GET API.
4. Track the follow-up work to replace the legacy adapters with real v2 repositories.

Keep this document synchronized with reality so the next agent can pick up any remaining steps without digging through history.

### Testing convention reminder

- When adding or updating specs for the preflight/pending-values flow:
  - Seed data using `getFixturesFactory()` + `testingEnvironment.setUp(fixtures, indexName)`; no ad-hoc template/thesaurus objects.
  - Instantiate the use case with the real factories (`CSVImportEntitiesFactories`, `TransactionManagerFactory.default()`, `TemplatesDataSourceFactory`, `SettingsDataSourceFactory`, `MongoThesauriDataSource`) just like the production wiring.
  - Only mock the queue/socket dispatchers; everything else (data sources, transaction manager, builders) must be the real implementation so Mongo collections are exercised.
  - Stage rows/imports through the actual DS methods; assert results by reading the collections (`csv_import_rows`, `csv_import_thesauri_values`, etc.).
  - Keep every spec lint/TS clean by running `npx eslint <spec>` and `npx tsc --noEmit` locally before handoff.
