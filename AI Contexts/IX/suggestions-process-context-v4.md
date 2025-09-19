## Suggestions: end-to-end context (v4) — production hardening, fixes, and next steps

Last updated: 2025-09-19

### Scope and goals

- Unified flow via POST `/api/suggestions/process` supporting:
  - `process_extractor`: find suggestions (honoring filters) → optionally auto-accept
  - `process_selected`: process user-selected `sharedIds` → optionally auto-accept
- Per-run state lives in `ixmodels.processRun` and drives all phases (find and accept).
- Robust status semantics and realtime events keep the client in sync.

### Current status (what just worked)

- Queue job runs with the initiating user context (multi-tenant safe):
  - Job receives `tenantName` and `userId` and sets permissions context before processing.
  - `ModelWithPermissions.save` now uses a valid `_id` query (no more `_id: null`).
  - Entity and file saves succeed; model transitions to `ready` on completion.
- PDF flow balanced selection and selected-mode scoping fixes are in place and verified.

### Key files and responsibilities

- Endpoint/controller: `app/api/suggestions/adapters/ProcessSuggestionsController.ts`
- Use case (orchestration): `app/api/suggestions/useCases/ProcessSuggestions.ts`
- Status orchestration: `app/api/services/informationextraction/InformationExtraction.ts`
- Model helpers: `app/api/services/informationextraction/ixmodels.ts`
- Materials (entities/files, PDF segmentation-aware): `app/api/services/informationextraction/ixMaterials.ts`
- Suggestions API (sampling/accept): `app/api/suggestions/suggestions.ts`
- Auto-accept:
  - Use case: `app/api/suggestions/application/AcceptSuggestionsUseCase.ts`
  - Job: `app/api/suggestions/jobs/AcceptSuggestionsJob.ts`
  - Factory: `app/api/suggestions/infrastructure/AcceptSuggestionsFactory.ts`
- State recompute after accept: `app/api/suggestions/updateState.ts`
- Entity updates during accept: `app/api/suggestions/updateEntities.ts`
- ODM and permissions:
  - Base ODM: `app/api/odm/model.ts`
  - Permissions wrapper: `app/api/odm/ModelWithPermissions.ts`
  - Entities service: `app/api/entities/entities.js`

### processRun schema (summary)

`ixmodels.processRun` holds:

- `mode`, `find` (enabled, size, filters, selectedSharedIds)
- `autoAccept` (enabled, source: previous|all, overwriteMode: blank_only|overwrite_all)
- `suggestionsRunTimestamp` (per-run boundary for “seen in run”)
- `findSuggestionsSharedIds`, `findSuggestionsInitialSharedIdsCount` (selected-mode queue)
- `selectedSharedIdsForAutoAccept` (selected cohort used to include pre-existing suggestions in acceptance)
- `autoAcceptProgress` (`{ total, processed }`)

### Find phase (current behavior)

- Controller validates request; use case persists `processRun` and marks `findingSuggestions=true`.
- Totals: `IXServices.computeTotalSuggestionsForProcess(...)` returns count within scope, capped by requested size.
- Sampling: `Suggestions.getSampleForProcess` balances labeled/unlabeled within the filtered subset; excludes `status: 'ready'`.
- Selected-mode queue:
  - `ixmodels.initializeFindRunQueue` trims IDs that already have valid suggestions and stores the original selection size.
  - Progress by sharedId: `processed = initialSelected - remainingInQueue` (pre-suggested count included instantly).
  - Guard: if mode is `process_selected` and the trimmed queue is empty, do not fall back to population sampling; proceed to auto-accept (if enabled).

#### PDF flow — balanced selection after segmentation filtering

- Problem: oversampling 3× then slicing to `limit` post-filter led to imbalanced final batches.
- Implemented post-segmentation balancing in `ixMaterials.getFileIdsWithReadySegmentations`:
  1. Sample labeled and unlabeled separately (each up to `limit × 3`, or proportional to need when large).
  2. Filter both subsets to those with ready segmentations.
  3. Choose `min(idealHalf, available)` from labeled and unlabeled; `idealHalf = floor(limit/2)`.
  4. Fill any remaining slots from the side(s) with more availability until `limit` is reached.
- Result: final `limit` is as balanced as available data allows, after segmentation readiness.

### Auto-accept phase (current behavior)

- Trigger:
  - After find completes when `autoAccept.enabled`.
  - Or immediately if find is disabled and `autoAccept.enabled`.
- Start: `InformationExtraction.startAutoAcceptIfEnabled(extractorId)` keeps `findingSuggestions=true`, emits kickoff event, dispatches job.
- Match builder (base):
  - `{ extractorId, status: 'ready', date: { $ne: null }, 'state.withSuggestion': true, 'state.obsolete': { $ne: true }, 'state.error': { $ne: true } }`
  - If `overwriteMode !== overwrite_all`: add `'state.withValue': { $ne: true }` (blank-only).
- Scoping by source:
  - `source: 'previous'` (default for selected-mode): scope to the current run via `modelData.suggestionsRunTimestamp == processRun.suggestionsRunTimestamp`.
  - In `process_selected`, also include pre-existing ready suggestions for the originally selected cohort:
    - For `source !== 'all'`, match strictly by `entityId ∈ processRun.selectedSharedIdsForAutoAccept` (removed the prior `$or` with run timestamp to avoid accepting unrelated suggestions).
  - `source: 'all'`: accept across the population (subject to overwrite rules).
- Paging & progress:
  - Default batch size: 50 (configurable via factory/registry).
  - Initialize `processRun.autoAcceptProgress.total` on first pass; fetch batch with `skip = processed` and `limit = batchSize`.
  - Accept, recompute states for affected IDs, increment processed, emit `{ total, processed, remaining }`.
  - Redispatch while items processed; best-effort cleanup (`stopTraining`, emit final `ready`) when complete.
- Loop guard: recompute match pre/post accept; if `postCount >= preCount`, stop redispatch to avoid loops (e.g., on save failures).

### Multi-tenant and permissions context (critical fix)

- Root cause of production failures: `AcceptSuggestionsJob` ran without a user in `permissionsContext`, leading to `_id: null` permission queries and failed saves (“The document was not updated!”).
- Fix:
  - `AcceptSuggestionsJob` now implements `UserAwareDispatchable`; the job is dispatched with `tenantName` and the initiating `userId`.
  - On `handle`, the job sets tenant and user in context so subsequent saves via `ModelWithPermissions` are authorized.
  - `AcceptSuggestionsFactory` no longer fetches arbitrary admin/editor; it expects caller-provided `userId`.
  - `InformationExtraction.startAutoAcceptIfEnabled` reads the current user from `permissionsContext` and passes `tenantName` and `userId` to dispatcher.
- Verification (from logs): job starts with userId/role, `ModelWithPermissions.save` shows valid `_id` queries, entity/file saves succeed, model flips to `ready`.

### Status semantics and realtime events

- Server status mapping:
  - `status=processing && findingSuggestions=true` → `processing_model`
  - `status=ready && findingSuggestions=true` → `processing_suggestions` or `processing_auto_accept` based on phase
  - `status=ready` → `ready`
- Realtime emits:
  - Find: `processing_suggestions` snapshots with `{ processed, total }` (selected-mode counts by sharedId).
  - Accept: `processing_auto_accept` snapshots each iteration with `{ total, processed, remaining }`.
  - Final: `ready` emitted by the accept job after cleanup.
- Flicker mitigations:
  - Keep `findingSuggestions=true` across accept transition; server and client avoid a `ready` blip between find and accept.

### Indices

- `IXSuggestionsModel`: compound index `{ extractorId, 'modelData.suggestionsRunTimestamp', status, entityId }` speeds “previous run” and seen-in-run queries.
- Consider additional indexes for frequent filters (see Next steps).

### Known hiccups and mitigations

- Process-selected over-processing (PDF/property):
  - Cause: trimmed queue empty → fallback sampling pulled unrelated materials; acceptance `$or` also matched run timestamp.
  - Fix: no fallback sampling in selected-mode; acceptance in selected-mode strictly matches `selectedSharedIdsForAutoAccept` when `source !== 'all'`.
- Selected-mode stuck at “finding suggestions… 0/1”:
  - Fix: when trimmed queue is empty, trigger auto-accept immediately (or stop run if disabled).
- Production `failed to save entity` during accept:
  - Cause: missing user in job; `_id: null` permission query.
  - Fix: user-aware job and propagation described above.
- Optimistic locking on entities during accept:
  - Mitigation: per-language fresh fetch + sequential saves; recompute states; redispatch guard prevents loops.
- Redis MaxListeners warnings:
  - Mitigation elsewhere: ensure single listener registration and `setMaxListeners(0)` as needed.
- Paragraph Extraction `PXValidationError: DOCUMENT_DO_NOT_HAVE_CHANGE_CRITERIA`:
  - Benign on saves that do not affect PX criteria; logged but does not block accept.

### Configuration knobs

- Property batch size: `ixMaterials.ts` → `BATCH_SIZE_FOR_PROPERTY` (default 1000)
- PDF batch size: `ixMaterials.ts` → `BATCH_SIZE_FOR_PDF` (default 50)
- Auto-accept batch size: `AcceptSuggestionsFactory.createDefault({ batchSize })` or override in registry

### Auditing and observability (recommended)

- Add concise structured logs (production):
  - Acceptance match summary: extractorId, source, overwriteMode, `suggestionsRunTimestamp`, selected cohort size, `count`.
  - Include `tenantName` and `userId` in acceptance info logs for traceability.
  - Transition points: find → accept kickoff, batch completion snapshots, final completion.
  - Errors: entity save failures (entity `_id`, `sharedId`, property, suggestion `_id`, language), with tenant and user.
- Optional: add per-run correlationId (UUID) into `processRun` to join logs across phases and batches.

### Open items / next steps

1. Acceptance kickoff snapshot (0/total):
   - At auto-accept start, build the same match used by the use case, compute `total = countDocuments(match)`, and emit `{ total, processed: 0 }`.
   - Factor match-building into a shared helper to avoid drift.
2. Bounded retry on optimistic lock in `Suggestions.accept`:
   - Retry small, e.g., 2–3 attempts per entity; skip and log after exhausting retries.
   - Ensure skipped entities’ suggestions are not re-matched endlessly (state recompute already reduces this).
3. Index review:
   - Assess adding index on `{ extractorId, status, 'state.withSuggestion', 'state.obsolete', 'state.error', 'state.withValue' }` for acceptance filters.
4. Tests (server):
   - `process_extractor`: filter sets, balanced sampling, totals, status events.
   - `process_selected`: queue trimming, instant progress accounting, no fallback sampling, acceptance cohort scoping.
   - Auto-accept: blank_only vs overwrite_all; previous vs all; paging across multiple batches; completion; no redispatch loops on failures.
   - Status transitions: find start, find batches, transition to accept (no ready blip), accept batches, final ready.
5. UI refinements:
   - If kickoff snapshot implemented, show 0/total immediately on accept start.
   - Ensure banner behavior for instant transitions (accept-only path).
6. Observability and auditing:
   - Replace temporary console logs with structured logs (keep at key points above).
   - Consider Sentry/Breadcrumbs for accept batches with `tenantName`, `extractorId`, `userId`.
7. Operational hardening:
   - Ensure queue worker registration uses `UserAwareDispatchable` for accept job in all environments.
   - Verify multi-tenant `namespace` isolation in queue registry and dispatcher.

### Troubleshooting checklist

- Accept saves fail with “The document was not updated!”:
  - Confirm worker logs show a valid `userId` and `_id` queries in `ModelWithPermissions.save`.
  - Check tenant namespace matches the model’s tenant.
- Selected-mode processes more items than selected:
  - Ensure `ixMaterials` selected-mode guards are active; check acceptance match scoping.
- Balanced PDF sampling seems off:
  - Verify segmentation readiness filtering and final balanced pick; confirm `idealHalf` and remaining fill logic.
- Status flicker or stuck states:
  - Validate `findingSuggestions` stays true during accept; server emits `processing_auto_accept` on transition and batches.

### Quick references (dev knobs)

- Property batch size: `ixMaterials.ts` → `BATCH_SIZE_FOR_PROPERTY`
- PDF batch size: `ixMaterials.ts` → `BATCH_SIZE_FOR_PDF`
- Auto-accept batch size: `AcceptSuggestionsFactory.createDefault({ batchSize })`

### Summary: current state

- Unified endpoint and use cases wired; `processRun` drives find and accept.
- PDF flow post-segmentation balancing and selected-mode scoping are implemented and validated.
- Auto-accept runs with initiating user context; saves succeed in multi-tenant environments.
- Status semantics reduce flicker across transitions; kickoff snapshot (0/total) remains an optional improvement.
