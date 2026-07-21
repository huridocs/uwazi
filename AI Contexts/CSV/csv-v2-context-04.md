## CSV Import V2 — Context Doc 04 (Current State & Next Steps)

**Date:** 2025‑11‑19
**Owner:** CSV Import V2 initiative

### 1. How to use this document

- This is the **current, consolidated view** of the CSV Import V2 work as of Nov 2025.
- It assumes familiarity with the earlier context docs:
  - Read in order: [`csv-v2-context-01.md`](./csv-v2-context-01.md) → [`csv-v2-context-02.md`](./csv-v2-context-02.md) → [`csv-v2-context-03.md`](./csv-v2-context-03.md) plus the addenda:
    - [`csv-v2-context-03-headerAnalyzer.md`](./csv-v2-context-03-headerAnalyzer.md)
    - [`csv-v2-context-03-thesaurusAnalyzer.md`](./csv-v2-context-03-thesaurusAnalyzer.md)
- **Latest handoff note (Jan 2026):** See [`csv-v2-context-07.md`](./csv-v2-context-07.md) for the most
  recent pipeline updates, dummy relationships stage, and agent handoff notes.
- This doc:
  - Summarizes **what is implemented today** in code (csv.v2 + socket layer + tests).
  - Clarifies **revised decisions** made during recent iterations (e.g., dispatch locations, notification model, removal of `sessionId` from jobs).
  - Consolidates **all outstanding ToDos** across the earlier docs into a single, prioritized list.
  - Reiterates **coding guardrails and expectations** so future contributors don’t repeat past mistakes (especially around v1 usage and job wiring).

---

### 2. Current system overview (as implemented)

#### 2.1 Architecture & routing

- We have a V2 CSV Import module under `app/api/csv.v2` following **entities.v2‑style hexagonal architecture**:

  - Controllers (`routes/`, `RegisterCsvImportController` using `AbstractController` + Zod).
  - Application use cases (`CsvImportEntities`, `CsvExtractUploadedZipJob`, `CsvPreflightJob`, etc.) extending `AbstractUseCase`.
  - Transaction‑aware Mongo DS implementations under `app/api/csv.v2/database` & `app/api/csv.v2/infrastructure/mongodb/`.
  - Domain layer under `app/api/csv.v2/domain` (`CsvImport`, `CsvImportRow`, `CsvThesauriPendingValues`, `CsvImportThesauriValues`).
  - Queue dispatchers under `app/api/csv.v2/infrastructure/queue/*JobDispatcher.ts`.
  - Specs and fixtures under `app/api/csv.v2/specs/**` and `app/api/csv.v2/application/jobs/specs/**`.

- **Route (current baseline, Apr 2026)**:
  - `POST /api/csvImportEntities` is the V2 entrypoint.
  - `POST /api/import` remains the legacy V1 route.
  - Backend does not switch V1/V2 via `v2CSVImport`; that flag is client-facing only.

#### 2.2 Registration (`CsvImportEntities`)

- **Input** (`RegisterCsvImportInput`):

  - `template: string`
  - `file: InputFile` (wrapped in controller)
  - `userId: string`
  - **No `sessionId` is propagated** to the use case or beyond.

- **Behavior (implemented)**:

  1. Generate a new `id` via `idGenerator.generate()`.
  2. Construct a `CsvImportDomain` instance with `{ id, templateId, file: { originalName, mimeType, size }, createdBy }`.
  3. Store the raw upload with `FileStorage` to `csv-imports/{id}/{filename}` (outside the transaction).
  4. Compute `storage.path = "csv-imports/{id}/{filename}"` and call `CsvImportDomain.withStorage(...)`.
  5. Call `transactionManager.run(async () => { ... })`:

     - Insert the `CsvImport` into `csv_imports` (via `csvImportsDS.insert`).
     - Inside the same `run` block, call:

       ```ts
       await jobsDispatcher.dispatch(CsvExtractUploadedZipJobDispatcher, {
         tenantName: tenants.current().name,
         userId: input.userId,
         importId: id,
       });
       ```

  6. Return `{ id, status: 'queued', message: 'Import registered and queued for processing.' }`.

- **Tests** (`CsvImportEntities.spec.ts`, updated):

  - **Intermediate test**: asserts that after `execute`:

    - The `csv_imports` record exists with `status: 'queued'` and correct `storage.path`.
    - The original file exists at `csv-imports/{id}/{filename}`.
    - The fake dispatcher (via `SyncDispatcherForTests` + `FakeCsvExtractUploadedZipJobDispatcher`) recorded exactly one dispatch to `CsvExtractUploadedZipJobDispatcher` with:

      ```ts
      {
        params: {
          tenantName: tenants.current().name,
          userId: f.idString('uploader'),
          importId: result.id,
          sessionId: 'sess-1', // still present at the interface boundary only in tests
        }
      }
      ```

  - **Sync‑style test**: same setup, but asserts:
    - Response is `{ id, status: 'queued', message: ... }`.
    - Import is persisted with `status: 'queued'` and correct metadata.
    - Original file is written where expected.
    - The fake dispatcher saw the correct dispatch params.
  - **Important**: These tests **no longer execute the real `CsvExtractUploadedZipJob`**; they only verify that it was dispatched with the right payload, which aligns with the new design (registration tests don’t reach into extraction side‑effects).

#### 2.3 Job 1: `CsvExtractUploadedZipJob` and dispatcher

- **Use case** (`app/api/csv.v2/application/jobs/CsvExtractUploadedZipJob.ts`):

  - Input: `{ importId, callbacks: { onStart, onProgress, onSuccess, onError } }`.
  - `executeAsync`:
    - Emits `onStart({ importId })`.
    - Calls `setStatus(importId, CsvImportStatus.ExtractingFiles)` in a TM `run`.
    - Loads the import via `csvImportsDS.getById(importId)` and validates `storage.path`.
    - Delegates file preparation to `CsvImportFileNormalizer`:
      - ZIP: streams each root-level entry to `csv-imports/{id}/extracted/`, calling `callbacks.onProgress({ type: 'files', importId, processedFiles })` after each file so the dispatcher can emit socket events and call `heartbeat()`.
      - CSV: copies the original upload to `csv-imports/{id}/extracted/import.csv`.
    - Delegates row staging to `CsvImportRowsStager`, which:
      - Reads the canonical `import.csv`, preserves empty rows to keep row indexes aligned with the user’s CSV, and persists rows into `csv_import_rows`.
      - Supports configurable batching (default 500 rows). The job injects `deleteRows` / `insertBatch` callbacks so all `transactionManager.run` calls still happen inside the job layer.
      - Emits `callbacks.onProgress({ type: 'rows', importId, stagedRows })`.
    - On success:
      - Clears any prior `failure` and sets `status = ExtractingFilesDone` inside a TM `run`.
      - Calls `onSuccess({ importId })`.
    - On error:
      - Calls `onError({ importId, error })`.
      - Persists a `failure` object with `{ message, retryable, at, stage: 'extracting files' }`.
      - Sets `status` to `Failed` (for non-retriable errors) or `Retrying` (for transient ones).

- **Dispatcher** (`CsvExtractUploadedZipJobDispatcher`):

  - Extends `UserAwareDispatchable<Params>` where `Params` includes `{ tenantName, userId, importId }`.
  - `handle(heartbeat, jobInfo?)`:

    - Captures `tenantName = this.tenantName`.
    - Calls `useCase.execute({ importId, callbacks: { onStart, onProgress, onSuccess, onError } })`.
    - `onStart` / `onProgress` / `onSuccess` / `onError` each call:

      ```ts
      this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:extract:*', { ... });
      ```

    - `onProgress` also calls `heartbeat()` once per file to renew the queue lock.
    - On final failure, if this was the last retry (`jobInfo.retryCount + 1 >= jobInfo.maxRetries`), calls `useCase.markAsFailed(importId)` to set status `Failed` + failure info.

- **SessionId removal**:
  - `Params` no longer includes `sessionId`.
  - All emitters for extraction use **only** `tenantName` → `emitToTenantAdmins(tenantName, ...)`.
  - The old per‑session path (`emitToSession(sessionId, ...)`) is no longer used by CSV V2.
  - Tests were updated accordingly:
    - `CsvExtractUploadedZipJobDispatcher.spec.ts` now contains:
      - `'should emit start/progress/success to tenant admins and extract files'` — asserts that:
        - Status transitions to `ExtractingFiles` → `ExtractingFilesDone`.
        - `emitToTenantAdmins(tenantName, 'csvImport:extract:start|progress|success', ...)` were called appropriately.
        - `heartbeat` is called at least once.
      - The dispatcher enqueues `CsvPreflightJobHandler` with `{ tenantName, userId, importId }` so the next stage starts immediately.
  - The previous `'should not emit if sessionId not present'` test has been **removed** as it was no longer meaningful after removing all `sessionId` branching.
  - `CsvExtractUploadedZipJob.spec.ts` gained assertions that the mocked dispatcher is called on success, guaranteeing the extraction → preflight chain even at the use-case level.
- All CSV V2 jobs must wrap their execution in a catch-all that (a) records `csv_imports.failure`
  with `{ message, stage, retryable }`, (b) flips the status to `failed` or `retrying`, and (c)
  emits the corresponding `csvImport:*:error` socket event before rethrowing. `CsvPreflightJob`
  now follows this pattern—see `CsvPreflightJobErrorHandling.spec.ts`.
- Supporting services:
  - `CsvImportFileNormalizer` handles the ZIP/CSV branching and per-file progress callbacks.
  - `CsvImportRowsStager` stages rows in configurable batches (default 500) and uses job-supplied `deleteRows`/`insertBatch` callbacks so only the job opens transactions. Tests can override the batch size to verify batching without staging hundreds of rows.

#### 2.4 Socket model (`setupSockets.ts` & `socketClusterMode.spec.ts`)

- **Tenant rooms**:

  - On `io.on('connection')`, each socket:
    - Joins its tenant room: `socket.join(socket.request.headers.tenant || config.defaultTenant.name)`.
    - Joins a session room keyed by `connect.sid` if present; this is still used by `req.emitToSessionSocket` for v1 flows but **not** by CSV V2 jobs.

- **Admin rooms (`${tenantName}:admins`)**:

  - Implemented in `setupSockets.ts` via `attachAdminRoomIfApplicable`:
    - On connection:
      - Parse `Cookie` header to get `connect.sid`.
      - Resolve the Express session from the shared `MongoStore` used by `auth/routes.js`.
      - Read `session.passport.user` (`"${userId}///${tenantNameFromSession}"`).
      - Load the `User` via `api/users/users.getById`.
      - If `user.role === 'admin'` and the tenant matches the socket’s `tenant` header:
        - `socket.join(`${tenantName}:admins`)`.
  - Exported `emitToTenantAdmins(tenantName, event, ...data)` from `setupSockets.ts`, and implemented in `V1WebSocketsWrapper` as:

    ```ts
    emitToTenantAdmins(tenantName: string, event: string, ...data: any[]) {
      emitToTenantAdmins(tenantName, event, ...data);
    }
    ```

  - `socketClusterMode.spec.ts` has a dedicated “tenant admins room” suite:
    - Sets up sockets for `tenant1` and `tenant2`, with some users having `role: 'admin'`.
    - Uses a test helper to feed `connect.sid` cookies mapped to user records.
    - Asserts that `emitToTenantAdmins('tenant1', 'event', ...)` is seen **only** by admin sockets in `tenant1`, not by non‑admins or other tenants.

---

### 3. Coding patterns & guardrails (reaffirmed)

- Prefer “helpers first” ordering inside each file: define dependent helper functions before the caller so files read top-down.
- Keep one class per file. If you need supporting logic, extract pure helper functions (or a separate module) instead of nesting additional classes.

#### 3.1 V2‑only boundaries (no v1 leakage)

- **Never import v1 CSV modules** (`app/api/csv/**`) into `app/api/csv.v2/**`:

  - No `validateColumns`, `arrangeThesauri`, `csvLoader`, `importEntity`, etc.
  - If something is missing on the v2 side (e.g., thesauri updates, settings access), add a V2‑style DS/use‑case rather than calling v1.

- For core services:
  - Templates: use `TemplatesDataSourceFactory.default(transactionManager)` and the `Template` **domain**, not `TemplateSchema`.
  - Settings: use `SettingsDataSourceFactory.default(transactionManager)`, and pass only the necessary bits (`availableLanguages`, `defaultLanguage`, `newNameGeneration`) into pure services like `CsvHeaderAnalyzer`.
  - Thesauri: use `MongoThesauriDataSource` from `api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.ts` and extend it with explicit write methods (`appendRootLabelsIfMissing`, `appendNestedLabelsIfMissing`, etc.) that all go through `this.getCollection()` so they participate in the active TM session.

#### 3.2 Transactions & side‑effects

- **Registration (`CsvImportEntities`)**:

  - File I/O (`fileStorage.storeContent`) happens **before** opening a transaction.
  - DB insert (`csvImportsDS.insert`) happens inside `transactionManager.run`.
  - The **extraction job dispatch** is intentionally called **inside** the same `run` block:

    ```ts
    await this.transactionManager.run(async () => {
      await this.deps.csvImportsDS.insert(csvImportWithStorage);
      await this.deps.jobsDispatcher.dispatch(CsvExtractUploadedZipJobDispatcher, { ... });
    });
    ```

  - Rationale:
    - If storage fails, we never start the transaction → no dangling DB rows.
    - If the insert fails/rolls back, the dispatch does not happen.
    - We accept that the job may see a committed import record even if some later, independent write were to fail (prefer DB integrity over “two‑phase commit” semantics here).

- **Jobs (extraction, preflight, future stages)**:
  - Use `transactionManager.run` for DB mutations inside the job/use‑case.
  - Jobs own the transaction boundaries. Services invoked by the jobs (e.g., `CsvImportRowsStager`) should accept callbacks such as `deleteRows` / `insertBatch` instead of calling `transactionManager.run` themselves. This keeps failure handling and retry semantics centralized.
- Job dispatch for downstream stages happens as the final action inside the same
  `transactionManager.run` block that performed the DB mutation; do **not** hop through
  `transactionManager.onCommitted` for queue chaining.
- Use `transactionManager.onCommitted` **only** for non‑queue side-effects that truly must wait
  until the commit is durable (e.g., scheduling cleanup/deletes outside Mongo).

#### 3.3 Testing patterns

- **Integration‑first** for real behavior:

  - Use **real Mongo** via TM‑aware DS factories and `MongoTransactionManager`.
  - Use **real filesystem** for extraction‑related tests (`FileSystemStorage` + `PathManager`) and `FileContentsIO`.
  - Keep tests isolated by using per‑test temp directories and cleaning them up in `afterEach` (see `CsvExtractUploadedZipJob.spec.ts` and `CsvImportEntities.spec.ts`).

- **Queue / job testing**:

  - Use `SyncDispatcherForTests` to simulate queue execution deterministically.
  - For tests that only care about “was a job dispatched?”, inject **fake dispatchers** (e.g., `FakeCsvExtractUploadedZipJobDispatcher`) via the `SyncDispatcherForTests` registry and assert on their `calls`. Do **not** run real job logic from registration tests.
  - For tests that exercise actual job behavior (e.g., `CsvExtractUploadedZipJob.spec.ts`), build real jobs with real DS + FS + TM, and call `handleDispatch` directly with a `heartbeat` spy. Assert:
    - Status transitions.
    - File system side‑effects.
    - Emitted events via `V1WebSocketsWrapper` fakes (now using `emitToTenantAdmins`).
  - `CsvExtractUploadedZipJob.spec.ts` now includes a batching scenario: by injecting a smaller `batchSize` into `CsvImportRowsStager`, the test asserts that `rowsDS.insertMany` flushes multiple batches without having to create 500+ fixture rows.

- **Sockets**:

  - Use `TestUtils.mockClass<V1WebSocketsWrapper>` in unit/integration tests to assert that job callbacks call:
    - `emitToTenantAdmins(tenantName, 'csvImport:extract:*', payload)` or
    - `emitToTenantAdmins(tenantName, 'csvImport:preflight:*', payload)` as appropriate.

- **No data‑source / TM mocks for core logic**:
  - For behavior/flow tests (registration, extraction, preflight), rely on real DS + TM to catch transactional issues.
  - Only mock boundaries: queue dispatchers and socket wrappers.

#### 3.4 Collaboration & process expectations

- **Ask before large structural changes**:

  - For changes to core patterns (dispatch placement, notification model, job sequencing, cross‑module dependencies), **propose the plan first** and get explicit agreement before touching code.
  - Use this doc and the earlier contexts as the single source of truth for patterns and ToDos; keep them updated in the same PR when behavior or assumptions change.

- **Avoid “fix by adding conditionals” in core paths**:
  - Do not introduce `if (config.ENVIRONMENT === 'test')` or similar into production code paths to placate tests. Fix tests and factories instead (e.g., by using fakes or adjusting test wiring).
  - When tests fail after a design change (e.g., moving dispatch into `run`), prefer **adapting tests or using better test doubles** over changing core behavior or adding environment‑specific branches.

---

### 4. Consolidated outstanding ToDos

This section merges and deduplicates ToDos from `csv-v2-context-01/02/03` and the addenda, filtered against the current codebase.

#### 4.1 Registration & extraction pipeline

1. ~~**Chaining extraction → preflight**~~ **(Done)**

   - `CsvExtractUploadedZipJob` now dispatches `CsvPreflightJob` as the final statement inside the
     transaction that clears failures and sets `ExtractingFilesDone`. `CsvExtractUploadedZipJob.spec.ts`
     and `CsvExtractUploadedZipJobDispatcher.spec.ts` both assert the dispatcher call and tenant/user
     payload, so the pipeline automatically proceeds to preflight after extraction completes.

2. ~~**Preflight catch-all failure handling**~~ **(Done)**

   - `CsvPreflightJob` now wraps its execution in a catch-all that:
     - Persists a `failure` object on `csv_imports` with `{ message, stage: 'preflight:scan' }`,
       marking the import `retrying` (or `failed` for `NonRetryableJobError`s) when unexpected errors happen.
     - Invokes `callbacks.onError` so the dispatcher emits `csvImport:preflight:scan:error`.
     - Has a dedicated spec (`CsvPreflightJobErrorHandling.spec.ts`) that verifies the failure + emit path.

3. **Registration & dispatch semantics (decision)**
   - Current and desired behavior: dispatch extraction (and any future stage) as the last statement inside the same `transactionManager.run` that inserted/updated the import.
   - Only revisit this if product/ops explicitly require a “post-commit only” guarantee; until then this item is intentionally **not planned**.

#### 4.2 Row staging after extraction (`csv_import_rows`)

3. ~~**Implement row staging in `CsvExtractUploadedZipJob`**~~ **(Done)**

   - `CsvImportRowsStager` now reads the canonical `import.csv`, preserves empty lines (so row indexes match user CSVs), and persists normalized rows into `csv_import_rows` before any downstream jobs run. Batching is configurable (default 500) and covered by integration specs.

4. ~~**Implement a robust `CsvReader`**~~ **(Done)**

   - `CsvReader` now uses `csvtojson` with proper quoting/delimiter/BOM handling plus `collectEmptyRowIndexes`. Edge cases (quoted commas, embedded newlines, blank rows) are exercised by the extraction job specs.

5. ~~**Fix `csv_import_rows` data-source mapping**~~ **(Done)**
   - `CsvImportRow` domain + Mongo mapper were introduced earlier. All staging writes go through domain-shaped objects and reuse the active TM session via injected callbacks from the job.

#### 4.3 Preflight (thesauri, relationships, validation)

6. ~~**Complete thesauri preflight “apply pending values” stage**~~ **(Done)**

   - `CsvPreflightJob` now dispatches `CsvCreateThesauriValuesJob` from inside the same `transactionManager.run` block that writes `preflight:scan:done`.
   - `CsvCreateThesauriValuesJob`:
     - Loads per‑thesaurus pending-value docs from `csv_import_thesauri_values`.
     - Uses `CsvThesauriValuesDiff` to compare pending roots/children against the live thesaurus and append any missing values via the legacy adapters.
     - Upserts translations through the temporary `LegacyTranslationsRepository`, records `appliedValues`, and emits tenant-admin progress events (with `heartbeat()` renewals).
     - Updates per-import stats (`thesaurusValuesObserved`, `thesaurusValuesCreated`, `thesauriTouched`) before dispatching the next stage.

7. **Finalize `CsvPreflightJob` behavior**

   - Ensure `CsvPreflightJob`:
     - Uses `CsvHeaderAnalyzer` and `CsvThesauriPendingValuesBuilder` only on staged `csv_import_rows`.
     - Sets `status` to `preflight:scan` in a small TM run and emits `csvImport:preflight:scan:start`.
     - On header/pending-values errors:
       - Persists `failure` with `issues` and `stage` (`preflight:preparation:headers` / `...:thesauri`).
       - Sets `status = failed`.
       - Emits `csvImport:preflight:scan:error`.
     - On success:
       - Clears any prior `failure`.
       - Sets `status = preflight:scan:done`.
       - Dispatches the apply‑pending-values job before exiting the success transaction (after clearing failure + storing status).

8. **Design & implement relationship preflight**

   - Implement `CsvPreflightRelationshipEntitiesUseCase` + dispatcher:
     - Read staged `csv_import_rows`.
     - For each relationship property, collect unique target titles per target template.
     - Query existing entities by title (scoped by template if `content` is set).
     - Create any missing related entities (using entities.v2 with minimal required fields).
     - Ensure idempotency (no duplicate related entities on retries).
   - Emit `csvImport:preflight:relationships:start|progress|success|error`.
   - Chain from thesauri preflight by dispatching the relationship job inside the transaction that marks thesauri preflight as done.

9. **(Optional) Domain‑validation preflight**
   - Implement `CsvPreflightDomainAssignmentUseCase` + job that:
     - Reads staged rows.
     - Attempts to build entities.v2 domain objects without persisting them.
     - Aggregates per‑row warnings/errors into a report (`csv_imports.failure.issues` and/or separate collection).
     - On excessive failure ratios, mark import as `failed` or `retrying` per policy.

#### 4.4 Event naming, statuses, and notifications

10. **Status naming consistency**

    - Decide on a unified policy for DB `CsvImportStatus` vs emitted event names:
      - Option A: store colon‑based statuses directly (e.g. `preflight:scan`, `preflight:scan:done`).
      - Option B: keep coarser DB enums (`ExtractingFiles`, `PreflightThesauri`, etc.) and introduce a mapping layer for events.
    - Apply the decision across:
      - `CsvImportStatus` enum.
      - `CsvPreflightJob` and `CsvExtractUploadedZipJob` status transitions.

11. **Finalize event model**
    - Confirm and document the final event set (currently:
      - Extraction: `csvImport:extract:start|progress|success|error`.
      - Preflight (scan): `csvImport:preflight:scan:start|progress|success|error`.
      - Preflight (relationships): `csvImport:preflight:relationships:start|progress|success|error`.
      - Preflight (validation): `csvImport:preflight:validate:start|progress|success|error` (optional).
    - Ensure that:
      - Emissions use `emitToTenantAdmins` and include `{ importId, ... }`.
      - There are no remaining uses of v1 `IMPORT_CSV_*` events in v2 jobs.

#### 4.5 Tests & specs

12. **Preflight job specs**

    - Fix and extend `app/api/csv.v2/application/jobs/specs/CsvPreflightJob.spec.ts`:
      - Use staged rows from `csv_import_rows`.
      - Cover happy paths (simple thesauri, parent/child, multiselect, duplicates, trimming, case‑insensitive, etc.).
      - Cover error scenarios (invalid group labels, missing default language, unsupported types).
      - Cover `failure` persistence and event emission on errors.

13. **Thesauri pending-values apply tests**

    - Add:
      - Unit tests for `CsvThesauriPendingValuesBuilder` covering all V1 parity cases (as listed in `csv-v2-context-03-thesaurusAnalyzer.md`).
      - Integration tests for the apply‑pending-values job (idempotent writes, translation updates).

14. **Large‑scale & batching tests (future phase)**
    - Once batching is implemented:
      - Add tests for large imports (50k–100k rows), verifying:
        - Performance characteristics (per‑batch duration).
        - Idempotent re‑execution of batches.
        - Correct progress tracking (`totalRows`, `processedRows`, `lastProcessedRow`, `batchSize`).
        - Stop conditions (e.g., abort after too many consecutive failures).

#### 4.6 Retention & cleanup

15. **Retention & cleanup job**
    - Implement an “import finalizer” job or scheduled sweeper that:
      - Deletes `csv-imports/{importId}/extracted/` and `csv_import_rows` once an import is in a terminal status (`Completed` / `Failed` / `Cancelled`) and any configured retention period has elapsed.
      - Ensures deletes are idempotent and safe under retries.
      - Never deletes files that have been moved into permanent document storage.

#### 4.7 Files / attachments (critical gap)

16. **Files/attachments import support**
    - CSV rows may reference `image`, `media`, `file`, or `attachments` columns.
    - V2 is missing the end-to-end handling (extract/store/rewrite metadata) that v1
      `importEntity` performed.
    - Approach is **TBD** (entities v2 capability vs a dedicated process), but it must
      be defined and covered by tests.

---

This document should be kept in sync with the code and tests. When you make a significant change to the CSV V2 pipeline, **update this file and the relevant earlier contexts** so the next person has a clear, accurate map of the system and its remaining work. Use this ToDo list as your checklist when planning subsequent iterations.
