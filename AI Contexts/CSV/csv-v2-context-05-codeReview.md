## CSV Import V2 — Context Doc 05 Code Review Notes

**Date:** 2025‑12‑01
**Focus:** CsvExtractUploadedZipJob validation/guard reasoning

### 1. Motivation

- The recent code review raised questions about the optional guards inside `CsvExtractUploadedZipJob` (`getImportStoragePath`, `handleExtractionSuccess`, `handleError`). They are not there to defend against normal happy-path flows, but rather to catch once-in-a-lifetime situations where a worker executes after somebody (or something) deleted or mutated the `csv_imports` record it was meant to operate on. Examples include retention sweeps, manual cleanup, or a test scenario where the document disappears between registration and job execution.
- Without these checks the job could continue into file normalization or status updates with a missing `storage.path`, which would result in confusing downstream errors and a retry storm. Throwing a `NonRetryableJobError` (and persisting it) makes the failure explicit, keeps the UI informed, and stops needless retries.

### 2. Suggested tightening strategies

| Goal                                                     | Approach                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guarantee a storage path once registration completes     | Add a helper in the registration flow that throws if `storage.path` is absent, and persist the path as part of the job dispatch payload so every downstream stage receives it explicitly (`CsvExtractUploadedZipJob` no longer needs to fetch it).                          |
| Make status updates safe even if the import has vanished | Have the dispatcher read the import before every downstream dispatch, assert the document exists (maybe via `CsvImportDomain.assertExists(import)`), and pass the sanitized object to the job. Jobs can then skip optional branches and rely on the dispatcher’s pre-check. |
| Keep domains strict for downstream jobs                  | Introduce a domain-level assertion (e.g., `CsvImportDomain.ensureStoragePath(import)`/`assertExists`) that throws early when invariants are missing. Call it at the dispatcher boundary so only fully-formed domains reach the job logic.                                   |

### 3. Next steps

1. **Domain alignment recap for the next agent**
   - `CsvImport`, `CsvImportRow`, `CsvThesauriPendingValues`, `CsvImportThesauriValues` now follow the Template V2 pattern: each is a class with readonly props, creation helpers, mutation methods, and `toPersistence()`; their DSs/services were updated and specs now instantiate them via factory methods.
   - `CsvImportRowsStager` and its Mongo DS produce/consume `CsvImportRow` instances, and specs use `CsvImportRow.create(...)`.
   - `CsvThesauriPendingValuesBuilder` now works with `CsvThesauriPendingEntry/Root/Child` classes instead of plain objects, so all parsing logic lives next to the domain invariants.
   - `CsvImportThesauriValues` now owns `withAppliedValues`, stats aggregation, and persistence helpers that the job uses directly.
2. **Remaining Template-style TODOs**
   - Services such as `PendingThesauriValuesApplier` / `CsvThesauriValuesDiff` should keep operating on the domain objects; if they still return bare arrays, wrap them immediately in the appropriate class before reaching other layers.
   - Queue/event specs should inspect domain instances (e.g., expect `pendingDoc.entries` to exist on a `CsvImportThesauriValues`), so the next agent doesn’t have to reason about raw schemas.
   - Every new helper or DS in `csv.v2` should follow the same convention—one class per file, readonly props, `clone`/`withX` helpers, and `to/fromPersistence`.
3. **Final note**
   - Hand the next agent this file plus the updated `csv-v2-context-05.md`; they contain every reasoning, decision, and remaining TODO needed to extend the Template pattern further. Make sure they read them before diving into the code.
