# CSV Import V2 — Context 07 Queue Test Pollution Hardening

Date: 2026-03-19  
Owner: CSV Import V2 initiative  
Purpose: Source-of-truth handoff for eliminating CSV v2 test pollution in the test shared queue collection.

---

## 1) Why this file exists

Some CSV v2 specs still enqueue real queue jobs into the shared `jobs` collection during tests.
Those jobs can survive test completion and affect other suites/runs.

Scope clarification (important):

- In test mode, shared DB is `uwazi_shared_db_testing` (not production/dev shared DB).
- This means current risk is test contamination/flakiness, not pollution of the main shared DB.

This document gives a concrete implementation plan so a new agent can harden queue-test isolation quickly and safely.

Companion docs:

- `AI Contexts/CSV/csv-v2-context-07.md` (global state / priorities)
- `AI Contexts/CSV/csv-v2-context-07-error-taxonomy.md` (separate track; already mostly implemented)

---

## 2) Current behavior (code reality)

### 2.1 Queue write path in tests

- CSV job factories default to real dispatcher when `jobsDispatcher` is not injected:
  - `CsvExtractUploadedZipJobFactory`
  - `CsvPreflightJobFactory`
  - `CsvCreateThesauriValuesJobFactory`
  - `CsvCreateRelationshipEntitiesJobFactory`
  - `CsvImportEntitiesJobFactory`
- Default path:
  - `DefaultDispatcher(...)` -> `JobsRouter` -> `NamespacedDispatcher` -> `MongoQueueAdapter`
  - queue docs are stored in Mongo collection: `jobs`.
- Shared DB target in tests:
  - `config.SHARED_DB` resolves to `uwazi_shared_db_testing` when `NODE_ENV === test`.

Key references:

- `app/api/core/libs/queue/configuration/factories.ts`
- `app/api/core/libs/queue/infrastructure/JobsRouter.ts`
- `app/api/core/libs/queue/infrastructure/MongoQueueAdapter.ts`
- `app/api/config.ts` (`queueName`, default `uwazi_jobs`)

### 2.2 Why pollution happens

- Integration specs commonly clean CSV collections in `afterEach`, but not `jobs`.
- Specs that call factories without injected dispatcher can enqueue downstream jobs as part of normal stage chaining.
- Result: stale queued jobs remain in test shared DB state.

### 2.3 Known CSV v2 spec patterns

- Some specs already inject mocked dispatchers (good, no queue writes).
- Some specs still rely on factory defaults (risk).

---

## 3) Goal and non-goals

### 3.1 Goal

Make CSV v2 test execution queue-clean and deterministic:

1. no unintended writes to `jobs` in CSV v2 specs,
2. no leftover queued jobs after CSV v2 test runs,
3. no behavior changes in production code paths.

Severity note:

- This is now a **test-quality/stability** hardening item.
- It is no longer a production-shared-DB protection emergency.

### 3.2 Non-goals

- No core queue contract/adapter redesign.
- No changes to production dispatch semantics outside test injection.
- No broad CI infra redesign in this slice.

---

## 4) Strategy decision (recommended)

Use a two-layer hardening approach:

1. **Primary guard (required):** inject non-queue dispatchers in CSV v2 specs that do not need real queue persistence.
2. **Safety net (required):** explicitly clean `jobs` collection namespace in CSV v2 integration `afterEach`/`afterAll`.

Do **not** rely only on collection cleanup; avoid enqueuing in the first place.

---

## 5) Implementation plan

### Phase 1 — Standardize test dispatcher injection

For CSV v2 specs that build use cases through factories:

1. pass `jobsDispatcher` explicitly (mocked or sync/non-persistent),
2. avoid implicit `DefaultDispatcher(...)` in tests unless test specifically validates queue adapter behavior.

Preferred test dispatcher options:

- `TestUtils.mockClass<JobsDispatcher>({...})` with `dispatch`/`dispatchMany` stubs, or
- `NoOpDispatcher()` when dispatch behavior is irrelevant.

### Phase 2 — Add queue cleanup safety net

In CSV v2 integration spec cleanup blocks, include:

- delete from `jobs` where `namespace = tenants.current().name` (or broader test-safe delete if isolated DB).

Rationale:

- catches accidental defaults,
- protects against future tests added without explicit dispatcher injection.

### Phase 3 — Documented helper for reuse

Add a small CSV v2 test helper (optional but recommended) to avoid copy/paste:

- `createCsvV2TestJobsDispatcher()` (mock/no-op),
- `cleanupCsvV2QueueJobs()` (collection cleanup).

Keep helper under `app/api/csv.v2/specs/helpers/`.

---

## 6) Concrete file targets (likely)

Specs likely needing alignment (or verification they already inject dispatcher):

- `app/api/csv.v2/application/jobs/specs/CsvCreateThesauriValuesJob.spec.ts`
- `app/api/csv.v2/application/jobs/specs/CsvCreateRelationshipEntitiesJob.spec.ts`
- `app/api/csv.v2/application/jobs/specs/CsvPreflightJob.spec.ts`
- `app/api/csv.v2/application/jobs/specs/CsvExtractUploadedZipJob.spec.ts`
- `app/api/csv.v2/application/jobs/specs/CsvImportEntitiesJob.spec.ts`

Core references (read-only context):

- `app/api/core/libs/queue/configuration/factories.ts`
- `app/api/core/libs/queue/infrastructure/MongoQueueAdapter.ts`

---

## 7) Acceptance criteria

All must pass:

1. CSV v2 integration specs no longer depend on implicit `DefaultDispatcher` for regular flow tests.
2. `jobs` collection in `uwazi_shared_db_testing` is clean after CSV v2 test execution
   (at least for current tenant namespace).
3. `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest csv.v2 -w=4` is stable in local CI-like run.
4. No production behavior regressions from this test-only hardening.

---

## 8) Verification checklist

1. Run focused CSV v2 suites that previously used default factory dispatchers.
2. Run full CSV v2 suite:
   - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest csv.v2 -w=4`
3. Inspect `jobs` collection after run and confirm no stale CSV v2 jobs remain.
4. Re-run suite to confirm no cross-run flakiness caused by stale queue data.

---

## 9) Guardrails for next agent

- Keep changes scoped to `app/api/csv.v2/**` and CSV context docs.
- Do not modify core queue contracts/behavior.
- Avoid test-only hacks in production code.
- Prefer explicit test dependency injection over global config mutation.

---

## 10) Handoff note

If user asks to execute this track next:

1. Re-read `csv-v2-context-07.md` + this file.
2. Apply Phase 1 first (stop new queue writes from specs).
3. Add Phase 2 safety net cleanup.
4. Verify with full `csv.v2` suite and document outcome in main 07 context.

---

## 11) Implementation update (Mar 2026)

Delivered in this iteration:

- Added queue cleanup helper targeting shared test DB queue docs by tenant namespace:
 - Added queue cleanup helper targeting shared test DB queue docs by tenant namespace:
  - `app/api/csv.v2/specs/helpers/queueTestCleanup.ts`
  - cleanup query scope:
    `{ queue: config.queueName, namespace: tenants.current().name, name: { $in: CSV_V2_JOB_HANDLER_NAMES }, 'params.importId': { $in: createdImportIds } }`
  - cleanup is now test-owned and import-scoped (each spec tracks its own `importId`s), avoiding generic namespace-wide flushes.
- Updated CSV v2 job integration specs to execute queue cleanup in `afterEach`:
  - `CsvExtractUploadedZipJob.spec.ts`
  - `CsvPreflightJob.spec.ts`
  - `CsvCreateThesauriValuesJob.spec.ts`
  - `CsvCreateRelationshipEntitiesJob.spec.ts`
  - `CsvImportEntitiesJob.spec.ts`
- Removed remaining implicit queue writes in key specs by injecting mocked `jobsDispatcher`
  instead of relying on factory `DefaultDispatcher`:
  - `CsvCreateThesauriValuesJob.spec.ts`
  - `CsvCreateRelationshipEntitiesJob.spec.ts`

Verification:

- Focused suites pass:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/csv.v2/application/jobs/specs/CsvCreateThesauriValuesJob.spec.ts app/api/csv.v2/application/jobs/specs/CsvCreateRelationshipEntitiesJob.spec.ts app/api/csv.v2/application/jobs/specs/CsvPreflightJob.spec.ts app/api/csv.v2/application/jobs/specs/CsvImportEntitiesJob.spec.ts app/api/csv.v2/application/jobs/specs/CsvExtractUploadedZipJob.spec.ts`
- Full CSV v2 suite pass:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest csv.v2 -w=4`
  - result: pass (19 suites, 76 tests).

Remaining optional follow-up:

1. Extend the cleanup helper to any additional future CSV v2 specs that begin touching
   default queue dispatch paths.
2. Add an explicit assertion spec that verifies no stale queue docs remain for the current
   tenant namespace after selected integration flows (nice-to-have guard).

Concurrency note (important):

- The concern about cross-suite deletion is valid in principle.
- Current CSV v2 integration specs run under test tenants derived from test DB context
  (`testingDB.dbName`), so namespace collisions are unlikely.
- Even so, cleanup is additionally constrained by CSV v2 handler names and per-test `importId` ownership.
