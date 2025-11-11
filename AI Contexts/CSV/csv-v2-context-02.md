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
  - `sockets`: `WorkerSockets` wrapper exposing `emitToSession` (and `emitToTenant` if ever needed)

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
  5. On success, set status to `files extracted` only via domain mutation + DS update. Do not advance to `processing`. On failure, set status to `failed` via domain mutation and include error note/log if available.

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
  - Introduce a worker-side emit helper to target a room by `sessionId` (mirroring `emitToTenant` but to the session room). This allows jobs to emit without request context.
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

- Jobs framework:
  - Extend `UserAwareDispatchable` so tenant and user contexts are set for the job.
  - Register the job in `queueRegistry` injecting:
    - `CsvExtractUploadedZipUseCaseFactory()` instance
    - `WorkerSockets` wrapper instance
  - Do not implement transactions in the job; keep them in the use case.

### Open questions / next steps

- Admin notifications: do we add a `tenant:admins` room now or later?
- Error persistence: minimal MVP vs. structured error field on `csv_imports`.
- Validation stage: Decide whether to move to `validating` or keep `processing` immediately after extraction; MVP leaves it at `processing`.

### References

- Admin guide re: CSV ZIP contents and `import.csv` naming: https://uwazi.readthedocs.io/en/latest/admin-docs/working-with-entities-in-your-collection.html#how-to-add-entities-in-bulk-with-csv-import
