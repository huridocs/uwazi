## CSV Import V2 — Context 07 Cleanup

Date: 2026-03-12  
Owner: CSV Import V2 initiative  
Purpose: Dedicated source of truth for CSV import artifact cleanup design, constraints, and implementation checklist.

## 1) Why this file exists

This document isolates all cleanup-related decisions so implementation can proceed without re-discovery and without mixing cleanup details into unrelated CSV v2 tracks.

It is a companion to:

- `AI Contexts/CSV/csv-v2-context-07.md`

## 2) Problem and scope

Current state:

- CSV-owned artifacts under `csv-imports/{importId}` remain indefinitely.
- We only need these artifacts during extraction/preflight/import processing.

Cleanup scope (only CSV-owned staging artifacts):

- Original upload stored under `csv-imports/{importId}/...`
- Extracted staging assets under `csv-imports/{importId}/extracted/...`
- Preserve failed-rows report artifact under `csv-imports/{importId}/reports/failed_rows.csv`
  when present (used by UX download/report flows).

Out of scope:

- Entity-owned files created by entities/files flows.
- Any rollback of already-applied thesauri/entities work.

## 3) Non-negotiable behavior

1. Cleanup is a dedicated **background housekeeping stage** implemented as:
   - application job + queue job handler, matching existing CSV v2 stage patterns.
2. Cleanup is dispatched on terminal import states:
   - `completed`
   - `failed`
   - `cancelled`
3. Cleanup is **transparent to end users**:
   - no status transition for cleanup,
   - no user-facing progress/error/success events,
   - no UX coupling to cleanup completion.
4. Cleanup must be idempotent and retry-safe:
   - repeated runs must be safe when files are already missing/deleted.

## 4) Status and events contract

Import status contract:

- Cleanup must not mutate `csv_imports.status`.
- Import terminal status remains the user-visible source of truth.

Event contract:

- Do not emit user-facing CSV lifecycle events for cleanup.
- Cleanup telemetry/logging is internal only (if needed), not part of the CSV UX socket contract.

## 5) Internal control field (agreed)

We track only a minimal internal state on `csv_imports`:

```ts
filesCleanup?: 'pending' | 'done' | 'failed';
```

Notes:

- Naming is plural: `filesCleanup`.
- This is internal-only housekeeping state.
- Retries may overwrite this value.

## 6) Dispatch model

Dispatch trigger points (race-safe):

- Do **not** dispatch cleanup directly from cancel endpoint/use case.
- Dispatch cleanup only at terminal-safe stage boundaries:
  - success: after entities-import terminal success (`import:entities:done`),
  - cancel: after the currently running stage exits cleanly with cancelled status,
  - hard failure: when a stage becomes terminal failed (non-retryable or last retry exhausted).

Execution semantics:

- Dispatch should happen after terminal-state persistence succeeds (same reliability discipline as other stage chaining).
- Cleanup job re-reads import context and executes safely even if artifacts are already gone.
- Cleanup must never run while a stage may still need extracted/original files.

## 7) Failure semantics for housekeeping

- Cleanup failure must not rewrite terminal import status.
- Cleanup retries are allowed; terminal import outcome remains unchanged.
- Internal `filesCleanup` should capture terminal housekeeping outcome (`done` or `failed`).

## 8) Implementation checklist (completed)

1. Add cleanup job + job handler in `csv.v2` with the same structure/patterns as existing stages.
2. Add internal `filesCleanup` field mapping in domain + data source updates.
3. Dispatch cleanup from terminal-safe boundaries (success after entities import, cancel after active stage exits, terminal hard-failure paths).
4. Implement idempotent deletion of:
   - original upload
   - extracted staging directory/files
5. Ensure no status changes and no user-facing event emissions.
6. Add focused tests:
   - terminal dispatch triggers cleanup,
   - status remains unchanged,
   - repeated cleanup is safe,
   - missing files do not fail terminal semantics.

## 9) Implementation status (Mar 2026)

Status: **Implemented**.

Delivered components:

- Application job:
  - `app/api/csv.v2/application/jobs/CsvCleanupImportFilesJob.ts`
- Job handler:
  - `app/api/csv.v2/infrastructure/jobHandlers/CsvCleanupImportFilesJobHandler.ts`
- Factory:
  - `app/api/csv.v2/infrastructure/factories/CsvCleanupImportFilesJobFactory.ts`
- Queue registration:
  - `app/queueRegistry.ts`

Persistence updates:

- `csv_imports` now tracks internal housekeeping state:
  - `filesCleanup?: 'pending' | 'done' | 'failed'`
- Mapping/contracts updated in CSV v2 domain/schema/data-source paths.

Behavior now in code:

- Cleanup runs only for terminal imports.
- Cleanup deletes:
  - original upload path (`csv_imports.storage.path`),
  - extracted staging assets (`csv-imports/{importId}/extracted/*` from extraction metadata, with fallback to `extracted/import.csv`).
- Cleanup preserves:
  - failed-rows report artifact `csv-imports/{importId}/reports/failed_rows.csv`.
- Cleanup is idempotent (safe on missing/deleted files).
- Cleanup does not change `csv_imports.status`.

## 10) Dispatch architecture (implemented refactor)

To avoid repeated logic in each stage:

- Job-side cleanup helpers are centralized in:
  - `app/api/csv.v2/application/jobs/CsvCleanupAwareJob.ts`
  - provides `markAsFailed`, cancelled/failed cleanup checks, cleanup dispatch helper, and failed-status cleanup marker helper.
- Handler-side terminal cleanup orchestration is centralized in:
  - `app/api/csv.v2/infrastructure/jobHandlers/CsvCleanupDispatch.ts`
  - used by all CSV stage handlers to run:
    - post-success cancel cleanup dispatch checks,
    - terminal failure cleanup dispatch flow (including last-retry mark-as-failed path).

This keeps stage jobs/handlers aligned while avoiding copy-pasted cleanup decision blocks.

## 11) Verification (latest)

- Focused cleanup job integration spec:
  - `app/api/csv.v2/application/jobs/specs/CsvCleanupImportFilesJob.spec.ts`
  - covers terminal cleanup, non-terminal no-op, and idempotency with missing files.
- Full CSV v2 suite result:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest csv.v2 -w=4`
  - pass: **17 suites**, **66 tests**.

## 12) Test stability note (Mar 2026)

- A flaky integration failure was observed in `CsvImportEntitiesJob.spec.ts` under full-suite
  execution (`Transaction ... has been committed`) when the job used the default queue dispatcher.
- Stabilization applied:
  - `CsvImportEntitiesJobFactory.build(...)` now supports injecting `jobsDispatcher`.
  - `CsvImportEntitiesJob.spec.ts` injects a mocked dispatcher for deterministic integration
    behavior while preserving production default wiring.
- This is a test-isolation fix; production behavior continues to use `DefaultDispatcher` unless
  explicitly overridden.

## 13) Guardrails

- Keep changes scoped to `app/api/csv.v2/**` and CSV context docs unless explicit approval is given.
- Do not change core queue/router/dispatcher contracts.
- Follow integration-first testing patterns and CSV v2 conventions already established in Context 07.

## 14) Next TODO after cleanup

- With cleanup implementation complete:
  - **File-column contract freeze** (`file__LANG`, `file`, `files`) was completed in the
    follow-up iteration (see `csv-v2-context-07.md`, section 18.18).
  - Next prioritized item is now:
    - **Standardize row error taxonomy and reporting output**.
