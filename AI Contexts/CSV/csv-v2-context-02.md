## CSV Import V2 — Context Doc 02

Date: 2025-11-11
Owner: CSV Import V2 initiative

### Purpose

Follow-up to csv-v2-context-01.md consolidating decisions for Job 1 (file extraction/prep) and event emission patterns, so future contributors can proceed without re-discovery.

### Scope recap (from Context 01)

- Architecture: V2 hexagonal; background jobs process after quick upload response.
- Collection: `csv_imports` stores each import and its status.
- Storage: Use files.v2 `FileStorage` with `customPath` under `csv-imports/{importId}`.
- Routing: `POST /api/import`, admin-only, feature-flagged via `v2CSVImport`.
- MVP Statuses: start at `queued`; Job 1 sets `extracting files`, then proceeds.

### Storage layout (MVP, reaffirmed)

- Base: `csv-imports/`
- Original upload: `csv-imports/{importId}/{uploadedFilename}.{ext}`
- Extracted artifacts: `csv-imports/{importId}/extracted/`
- CSV canonical name after Job 1: `csv-imports/{importId}/extracted/import.csv`

### Job 1: ExtractUploadedZipOrPrepareCsv

- Location (planned): `app/api/csv.v2/jobs/CsvExtractUploadedZipJob.ts` (name may evolve)
- Purpose: Normalize inputs to a canonical extracted state so downstream jobs need zero guesswork.

- Params (extends v2 jobs conventions):

  - `tenantName`: string
  - `userId`: string (uploader)
  - `importId`: string
  - `sessionId` (recommended): string — so we can emit only to the uploading session

- V2 patterns to follow (critical):

  - Jobs are thin orchestrators; they delegate business logic to Use Cases.
  - Use cases own transactions (via `transactionManager`). No transactions in jobs.
  - Dependencies are injected via factories; DSs must be transaction-aware (extend `MongoDataSource`).
  - Emits should use a sockets wrapper and be passed as callbacks to the use case when appropriate (mirrors templates.v2 patterns).
  - Jobs pass params and context only (tenantName, userId, sessionId).
  - Domain-first mutations: All state changes must be done via Domain methods; DS updates persist the resulting Domain object. Never shape partial updates ad hoc.

#### Domain and mapping rules (enforced)

- Domain owns defaults and mutations:
  - Creation: `CsvImportDomain.create({...})`
  - Storage path: `CsvImportDomain.withStorage(csvImport, storagePath)`
  - Status change: `CsvImportDomain.withStatus(csvImport, status)`
- Data sources persist domain objects:
  - `csvImportsDS.insert(domain: CsvImport)`
  - `csvImportsDS.update(domain: CsvImport)`
  - Internally map `_id ↔ id` via mapper; no DB-specific fields in domain.
- Transactions:

  - File storage OUTSIDE the transaction.
  - DB writes INSIDE `transactionManager.run(...)`.
  - Use `transactionManager.onCommitted(...)` only for enqueuing next jobs or side-effects that must happen after commit.

- Job dependencies:

  - `useCase`: `CsvExtractUploadedZipUseCase`
  - `sockets`: `V1WebSocketsWrapper` exposing `emitToSession` (and `emitToTenant` if ever needed)

- Behavior:

  1. Load import by `importId`. If missing → hard fail.
  2. Immediately set status to `extracting files` via `CsvImportDomain.withStatus(...)` and persist using `csvImportsDS.update(...)` inside a transaction.
  3. Determine input kind by `storage.path`/extension or `file.mimeType`:
     - ZIP case:
       - Open the uploaded ZIP (flat structure expected).
       - Extract ALL entries to `csv-imports/{importId}/extracted/`.
       - Require that `import.csv` exists at the root. Fail if not present.
     - CSV case (non-ZIP):
       - Copy the original uploaded file to `csv-imports/{importId}/extracted/import.csv`.
       - This enforces the same downstream invariant as the ZIP path: a canonical `import.csv` in `extracted/`.
  4. Idempotency: overwrite-on-retry is acceptable for MVP (safe to re-run job).
  5. On success, set status to `files extracted` only via domain mutation + DS update. Do not advance to `processing`. On failure:
     - If non-retriable → mark `failed`.
     - If retriable → set `retrying` and let the queue reschedule.

- Rationale for CSV copy:
  - Policy expects ZIPs to contain a flat root with `import.csv`. To keep downstream logic identical, when the upload is a single CSV we normalize by copying it to `extracted/import.csv` so the next stage always looks in one place.
  - See Admin Guide for bulk CSV import conventions (root-level `import.csv` alongside supporting files) — reference: `https://uwazi.readthedocs.io/en/latest/admin-docs/working-with-entities-in-your-collection.html#how-to-add-entities-in-bulk-with-csv-import`.

### Dispatch and transaction hook

- Extend `RegisterCsvImportUseCase` factory to inject `jobsDispatcher`.
- After persisting the import (and after file storage succeeds), use `transactionManager.onCommitted` to dispatch the extraction/prep job:
  - Params must include `{ tenantName, userId, importId, sessionId }`.
  - `sessionId` should be captured at controller level from the request cookie and forwarded into the use case input → on to the job params.
- After Job 1 completes and sets status to `files extracted`, the component performing the status update must again use `transactionManager.onCommitted` to trigger the next job (processing/validation), which is responsible for subsequent stages.

### Emits and notifications

- Current primitives:

  - `emitToTenant(tenantName, event, payload...)` (broadcast to all in tenant).
  - `req.emitToSessionSocket(event, payload...)` (per-session; available only in request scope).

- Requirement:

  - Do NOT broadcast job progress to all tenant users.
  - MUST notify at least the uploading user (ideally only their current session). MAY also notify other admins later.

- Proposal (MVP-friendly):
  - Capture `sessionId` in the controller from `connect.sid` and include it in job params.
  - Use `V1WebSocketsWrapper.emitToSession(sessionId, ...)` from job/use-case callbacks to notify only the uploader session.
  - Events (prefix suggestion): `csvImport:extract:start|progress|success|error` with `{ importId, details }`.
  - Future: consider a `tenant:admins` room to optionally notify admins only; keep MVP scoped to the uploader’s session to avoid noise.

### Status transitions (MVP)

- `queued` → (Job 1 start) `extracting files` → (success) `files extracted` → (next job will set its own status)
- On failure: `failed`

### Interfaces to reuse

- Files v2:

  - `FileStorage.storeFile({ file, type: 'customPath', destination })`
  - `FileStorage.getFile({ type: 'customPath', destination, filename })` → stream into `storeFile` for copies
  - `PathManager({ tenant }).createPath(...)` for consistent tenant paths

- Domain:

  - `CsvImportDomain.create`, `CsvImportDomain.withStorage`, `CsvImportDomain.withStatus`
  - Enum: `CsvImportStatus` (Queued, Validating, ExtractingFiles, FilesExtracted, Retrying, Processing, Completed, Failed, Cancelled)

- Jobs framework:
  - Extend `UserAwareDispatchable` so tenant and user contexts are set for the job.
  - Register the job in `queueRegistry` injecting:
    - `CsvExtractUploadedZipUseCaseFactory()` instance (created with `FileContentsIO`)
    - `V1WebSocketsWrapper` instance
  - Do not implement transactions in the job; keep them in the use case.

### Retries and non-retriable errors

- Background

  - Jobs are retried automatically after the lock window expires, up to configured max retries.
  - Worker doubles the lock window after each failure; default initial is 10 minutes.
  - Some failures will never improve on retry and should be treated as non-retriable (fail fast).

- Current throw conditions and suggested classification

  - Import not found:
    - Trigger: `csvImportsDS.getById(importId)` resolves to undefined.
    - Classification:
      - Non-retriable if DS successfully queried and the document is truly missing.
      - Retriable if the DS call throws/returns a connection/operational error (not “undefined”).
    - Implementation: DS should throw on connection errors; only return undefined for “not found”.
  - Storage path missing (in domain):
    - Trigger: `!csvImport.storage?.path`.
    - Classification: Non-retriable (broken record).
    - Note: Distinguish from IO “path not found” while reading from storage (see next).
  - Unable to open ZIP file (yauzl open error):
    - Classification:
      - Retriable if error indicates transient FS/S3/IO condition.
      - Non-retriable if error indicates “not a zip”/corrupt format (e.g., end of central directory not found).
    - Implementation: Inspect error codes/messages from yauzl/open to differentiate.
  - Failed to read ZIP entry (yauzl openReadStream error):
    - Classification:
      - Retriable for transient read/IO errors.
      - Non-retriable for data corruption (e.g., decompression/data errors).
  - `import.csv` not found at ZIP root:
    - Trigger: After successful iteration through entries, `hasImportCsv === false`.
    - Classification: Non-retriable (deterministic policy violation).
    - Rationale: If iteration aborts early due to IO errors, we fail before reaching “end”; only the completed pass yields this check.
  - Copy CSV to `extracted/import.csv` fails (getFile/read/storeFile):
    - Classification: Retriable by default (FS/S3 transient). Reserve non-retriable only for definitive “source file not found” semantics (unexpected for our pipeline).
  - Status persistence failures (inside `transactionManager.run`):
    - Classification: Retriable (TM already retries transient errors). Use non-retriable only for schema/validation bugs (should not occur).

- Implementation guideline

  - Throw `NonRetryableJobError` for deterministic policy errors:
    - Import not found
    - Storage path missing
    - ZIP missing `import.csv`
    - Detectably corrupt file formats (when verifiable)
  - For storage/IO and DB operational errors, propagate the original error and let the job retry policy handle it.
  - Optionally augment job logs with a flag (`nonRetriable: true`) for observability.

- Status semantics during retries
  - On transient failure, set `status = 'retrying'` to surface pending retry to users.
  - Set `status = 'failed'` only if:
    - The error is classified as non-retriable, or
    - This was the last retry attempt (based on jobInfo.retryCount + 1 >= jobInfo.maxRetries) and the job will not be retried.
  - Optionally persist a lightweight failure descriptor (code/message/retryable) for support.

### Open questions / next steps

- Admin notifications: do we add a `tenant:admins` room now or later?
- Error persistence: minimal MVP vs. structured error field on `csv_imports`.
- Validation stage: Decide whether to move to `validating` or keep `processing` immediately after extraction; MVP leaves it at `processing`.

### Testing (not implemented yet)

- We have not added tests for these implementations yet.
- ToDos for tests (follow entities.v2/templates.v2 patterns):
  - Unit tests for `CsvExtractUploadedZipUseCase`:
    - Domain-first mutations (`withStatus`, `withStorage`) and DS update calls wrapped in `transactionManager.run`.
    - ZIP happy path (streaming entries), CSV copy path, idempotency.
    - Error classification paths (`NonRetryableJobError` vs transient errors) and resulting statuses (`failed` vs `retrying`).
    - Heartbeat-related progress: expose and assert `onProgress` per entry (job uses it to heartbeat).
  - Integration tests for job wiring:
    - Job dispatch on commit from `RegisterCsvImportUseCase`.
    - Job emits to session using `V1WebSocketsWrapper` (mock wrapper).
    - Queue retry behavior (simulate transient failure → status `retrying`; non-retriable → `failed`; last retry → final `failed`).
  - Mock strategy:
    - Mock `CsvImportsDataSource`, `FileStorage`, and `FileContentsIO` similar to templates.v2 and paragraph extraction tests.
    - Avoid real FS/S3; use in-memory streams and deterministic buffers.
    - Use transaction manager factory test doubles as in entities.v2/templates.v2.

### Testing implementation and strategies (Nov 2025)

- Integration-first tests completed for:
  - `RegisterCsvImportUseCase`
  - `CsvExtractUploadedZipUseCase`
  - `CsvExtractUploadedZipJob`
- Strategy mirrors entities.v2/templates.v2/files.v2:

  - Real Mongo via `DefaultCsvImportsDataSource(transactionManager)`.
  - Real filesystem using `FileSystemStorage(new PathManager({ tenant }))`.
  - Real `FileContentsIO`.
  - Minimal boundary doubles only where necessary:
    - Queue: `SyncDispatcherForTests` to execute jobs synchronously, and a local `RecordingDispatcher` to assert dispatch without executing (to validate the intermediate `queued` state).
    - Sockets: thin fake using `TestUtils.mockClass<V1WebSocketsWrapper>` to assert `emitToSession` calls.
  - No data-source or transaction manager mocks.

- Key testing patterns and fixes:

  - Unique temp directories per test to avoid races:
    - Build per-test subfolders (e.g., `tmp/${timestamp}_${rand}` or `uploads_intermediate/${unique}`).
    - Use `.gitignore` to ignore these paths.
  - Deterministic cleanup:
    - `testingEnvironment.cleanupUploadPaths()` for tenant-scoped base paths (note: only clears top-level files; does not remove nested customPath folders).
    - Per-test `afterEach` removes:
      - `uploadedDocuments/csv-imports/{importId}` for imports created in the test.
      - Each per-test temporary local directory created for inputs.
  - ZIP fixtures and creation:
    - Reuse v1 helper `createTestingZip` from `app/api/csv/specs/helpers`.
    - It writes to `<tempDir>/zipData/<zipName>`. Tests must:
      - Ensure `<tempDir>/zipData` exists.
      - Read the resulting zip from `path.join(tempDir, 'zipData', zipFilename)`.
    - Fixture sources are under `app/api/csv/specs/zipData`.
  - Input files for uploads:
    - Introduced `createUploadedInputFile` in `api/files.v2/testing/InputFileTestFactory.ts` to generate `InputFile` instances from a path/string, reducing boilerplate.
  - ObjectId correctness:
    - Use `getFixturesFactory().idString('key')` for `importId` and `userId` to produce valid 24-hex strings, avoiding BSON cast errors in DS operations and user lookups in `UserAwareDispatchable`.
  - Transactions and queue:
    - When executing the extraction job synchronously inside the registration test, instantiate the job’s use case with a fresh `TransactionManager` and DS in the job factory. This prevents “Transaction already finished” errors caused by reusing the same session across nested operations.
    - To assert the intermediate `queued` state, inject a non-executing `RecordingDispatcher` that only records `dispatch` calls; do not run the job.
  - Event emissions and heartbeats:
    - Job test asserts `csvImport:extract:start|progress|success|error` events emitted via `emitToSession` when `sessionId` is present.
    - `onProgress` triggers `heartbeat()`; test asserts the heartbeat spy is called.
  - Use case behavior validated:
    - `RegisterCsvImportUseCase`:
      - Stores the original upload to `csv-imports/{id}/{filename}`.
      - Persists import with `status: queued` and `storage.path`.
      - Enqueues extraction via `onCommitted` with `{ tenantName, userId, importId, sessionId }`.
    - `CsvExtractUploadedZipUseCase`:
      - `queued` → `extracting files` → `files extracted` success path.
      - Non-retriable errors:
        - Missing import → throws `NonRetryableJobError`.
        - Missing storage path → throws `NonRetryableJobError`.
        - ZIP without `import.csv` → throws `NonRetryableJobError`, final status `failed`.
      - Retriable errors path available; finalization sets `retrying`.
      - CSV normalization copies to `csv-imports/{id}/extracted/import.csv`.
  - Lint/ES rules:
    - Avoid `global-require` in tests; import `FileContentsIO` at top-level and use `new FileContentsIO()`.

- Route testing note (temporary):
  - To exercise `/api/import` after route moved to csv.v2, tests can register both route sets on the same Express app:
    - `import csvV2Routes from 'api/csv.v2/routes/routes';`
    - After building the app with `uploadRoutes`, call `csvV2Routes(app);` or wrap both in a combined route initializer.
  - Enable the v2 flag in tests to use the new path:
    - `testingTenants.changeCurrentTenant({ featureFlags: { v2CSVImport: true } });`

### Agent handoff: operational guidelines and preferences

- Architecture and boundaries

  - Follow entities.v2 patterns: thin controllers, use cases own business logic and transactions, DS are transaction-aware and do the Mongo mapping, domain owns defaults/mutations, transport-free domain models.
  - IDs are generated in use cases via `idGenerator.generate()` and persisted as Mongo `_id` (mapped to/from `id`).
  - Storage for imports:
    - Base prefix: `csv-imports/{importId}`
    - Original upload: `csv-imports/{importId}/{uploadedFilename}`
    - Canonical extracted CSV: `csv-imports/{importId}/extracted/import.csv`
  - Status transitions (MVP): `queued` → `extracting files` → `files extracted` → next job decides onward.

- Testing philosophy

  - Integration-first: use real Mongo (via DS factories and TM), real filesystem (`FileSystemStorage` + `PathManager`), and real `FileContentsIO`.
  - Avoid mocks unless at strict boundaries:
    - Queue: use `SyncDispatcherForTests` for synchronous execution, or a local `RecordingDispatcher` to assert `dispatch` without executing.
    - WebSockets: use `TestUtils.mockClass<V1WebSocketsWrapper>` only to assert `emitToSession` calls.
  - Do not mock data sources, transaction managers, or storage in these tests.
  - Use `getFixturesFactory().idString('key')` for any ids expected to be `ObjectId`-like (e.g., `importId`, `userId`).
  - Ensure fresh transaction managers for nested job executions (e.g., register → onCommitted → extraction) to avoid "Transaction already finished".

- Filesystem and zips in tests

  - Use `createTestingZip` from `app/api/csv/specs/helpers` for deterministic zips. It writes to `<tempDir>/zipData/<zipFilename>`.
    - Always create `zipData` under your per-test temp dir and read the zip from that subfolder.
    - Fixture sources: `app/api/csv/specs/zipData`.
  - Use `createUploadedInputFile` from `api/files.v2/testing/InputFileTestFactory.ts` to build `InputFile` instances (avoid ad-hoc shapes).
  - Per-test isolation: create unique temp dirs (`${timestamp}_${rand}`) and push them to a tracked list for `afterEach` cleanup.
  - Cleanup rigor:
    - Call `testingEnvironment.cleanupUploadPaths()` at least once per test to clear top-level tenant files.
    - Explicitly remove `uploadedDocuments/csv-imports/{importId}` created during the test in `afterEach`.
    - Remove per-test local temp dirs in `afterEach`.
    - Avoid recursive deletes of shared dirs to prevent races in parallel runs.

- Events and session notifications

  - Use the new `V1WebSocketsWrapper` with `emitToSession(sessionId, event, payload...)`.
  - Job events for extraction: `csvImport:extract:start|progress|success|error`.
  - Only emit to the uploader’s `sessionId` (do not broadcast to tenant).
  - In jobs, renew queue lock on `onProgress` by calling `heartbeat()`.

- Queue and jobs

  - Jobs extend `UserAwareDispatchable` and receive `{ tenantName, userId, importId, sessionId? }`.
  - Use `TransactionManager.onCommitted` to dispatch the extraction job from `RegisterCsvImportUseCase`.
  - Error classification in extraction use case:
    - Throw `NonRetryableJobError` for policy violations (missing import, missing storage path, ZIP missing `import.csv`, detectably corrupt formats).
    - Propagate operational errors (IO/DB) to allow queue retry policy to mark as `retrying`.
    - On last retry, job marks status as `failed`.

- Feature flags and routes

  - Feature flag: `v2CSVImport` toggles v1/v2 behavior on `/api/import`.
  - For tests that need v2 behavior: `testingTenants.changeCurrentTenant({ featureFlags: { v2CSVImport: true } });`
  - For route tests that were previously bound to v1: register both `uploadRoutes` and `csv.v2` routes on the same Express app (temporarily) if needed.

- Lint/style guardrails

  - No `global-require` in tests; import at top-level (e.g., `FileContentsIO`).
  - Prefer descriptive names and avoid `as any` unless absolutely necessary at boundary adapters.
  - Keep comments only when they convey non-obvious rationale, invariants, or edge cases.

- What not to do

  - Do not broadcast job progress to all tenant users.
  - Do not use data-source mocks for persistence logic; prefer real DS with test TM.
  - Do not bypass `MongoTransactionManager` by using raw `db.collection` outside DS.

- Handoff quickstart
  - To add a new stage/job:
    1. Create a use case (domain-first, TM-aware DS usage, file ops outside TM).
    2. Add a job that orchestrates the use case, wiring sockets and heartbeats.
    3. Register the job in `queueRegistry`, injecting real factories (TM, DS, storage, IO).
    4. Dispatch the job via `onCommitted` at the correct stage boundary.
    5. Write integration tests with real DS/FS/IO, unique temp dirs, and deterministic cleanup.

### References

- Admin guide re: CSV ZIP contents and `import.csv` naming: https://uwazi.readthedocs.io/en/latest/admin-docs/working-with-entities-in-your-collection.html#how-to-add-entities-in-bulk-with-csv-import
