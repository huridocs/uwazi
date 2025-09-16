## Suggestions: end-to-end context (v3) — current implementation and open items

Last updated: 2025-09-12

### Scope and goals

- Unified flow via POST `/api/suggestions/process` supporting:
  - `process_extractor`: find suggestions (honoring filters) → optionally auto-accept
  - `process_selected`: process user-selected sharedIds → optionally auto-accept
- Per-run state lives in `ixmodels.processRun` and drives all phases (find and accept).
- Robust status semantics and realtime events to keep the client in sync.

### Key files and responsibilities

- Endpoint/controller: `app/api/suggestions/adapters/ProcessSuggestionsController.ts`
- Use case (orchestration): `app/api/suggestions/useCases/ProcessSuggestions.ts`
- Status orchestration: `app/api/services/informationextraction/InformationExtraction.ts`
- Model helpers: `app/api/services/informationextraction/ixmodels.ts`
- Sampling and materials: `app/api/services/informationextraction/ixMaterials.ts`
- Suggestions API: `app/api/suggestions/suggestions.ts`
- Auto-accept:
  - Use case: `app/api/suggestions/application/AcceptSuggestionsUseCase.ts`
  - Job: `app/api/suggestions/jobs/AcceptSuggestionsJob.ts`
  - Factory: `app/api/suggestions/infrastructure/AcceptSuggestionsFactory.ts`
- State recompute after accept: `app/api/suggestions/updateState.ts`
- Entity updates during accept: `app/api/suggestions/updateEntities.ts`
- Client: `app/react/V2/Routes/Settings/IX/*`

### processRun schema (summary)

`ixmodels.processRun` holds:

- `mode`, `find` (enabled, size, filters, selectedSharedIds)
- `autoAccept` (enabled, source: previous|all, overwriteMode: blank_only|overwrite_all)
- `suggestionsRunTimestamp` (per-run boundary)
- `findSuggestionsSharedIds`, `findSuggestionsInitialSharedIdsCount` (selected-mode queue)
- `autoAcceptProgress` (`{ total, processed }`)

### Find phase (current behavior)

- Controller validates request; use case persists `processRun` and marks `findingSuggestions=true`.
- Totals: `IXServices.computeTotalSuggestionsForProcess(...)` returns count within filters, capped by request size.
- Sampling: `Suggestions.getSampleForProcess` balances labeled/unlabeled within the filtered subset and excludes `status: ready`.
- Selected-mode uses the queue; progress reports by sharedId: `processed = initialSelected - remainingInQueue`.
- Realtime: `InformationExtraction.updateSuggestionStatus` emits `processing_suggestions` with `{ processed, total }`.
- Completion: when processed >= total, if auto-accept is enabled, transition into accept (see below). If find was disabled and auto-accept enabled, we jump directly into accept.

Batch sizing knobs (dev):

- Property batches: `ixMaterials.ts` → `BATCH_SIZE_FOR_PROPERTY` (default 1000).
- PDF batches: `ixMaterials.ts` → `BATCH_SIZE_FOR_PDF` (default 50).

### Auto-accept phase (current behavior)

- Trigger points:
  - After find completes and auto-accept is enabled, or
  - Immediately if find is disabled and auto-accept is enabled.
- Start: `InformationExtraction.startAutoAcceptIfEnabled(extractorId)`

  - Keeps `findingSuggestions=true` during accept to avoid a status ‘ready’ gap.
  - Emits `processing_auto_accept` socket event to kick off client banner.
  - Dispatches `AcceptSuggestionsJob` for iterative batching.

- Batch logic: `AcceptSuggestionsUseCase.execute` (paging by progress)

  - Builds `match`:
    - Base: `{ extractorId, status: 'ready', date: { $ne: null }, 'state.withSuggestion': true, 'state.obsolete': { $ne: true }, 'state.error': { $ne: true } }`
    - When `overwriteMode !== overwrite_all`: add `'state.withValue': { $ne: true }`
    - When `source !== all`: scope with `$or` of `modelData.suggestionsRunTimestamp` (previous run) and/or `entityId ∈ selectedSharedIdsForAutoAccept` (selected-mode cohort)
  - Initializes `autoAcceptProgress.total` if missing: `countDocuments(match)`
  - Fetches current batch using skip/limit/sort based on `autoAcceptProgress.processed`:
    - `get(match, '_id entityId entityLanguageId ...', { skip: processed, limit: batchSize, sort: { _id: 1 } })`
  - Accepts `toAccept`, recomputes states with `updateState`, increments processed.
  - Returns `{ processed, progress }` for the job to redispatch or complete.

- Job loop: `AcceptSuggestionsJob`
  - Emits `processing_auto_accept` on each iteration, including `{ total, processed, remaining }` when available.
  - Redispatches itself while `processed > 0`; otherwise cleans and emits final `ready`.

Batch sizing (dev):

- Override accept batch size via factory or registry:
  - `AcceptSuggestionsFactory.createDefault({ batchSize: 10 })` (temporary) or change default in the factory.

### Entity update during accept (key changes)

- File: `app/api/suggestions/updateEntities.ts`
  - Maps by `entityId` (per-language) to ensure each language gets its own suggestion value.
  - Eliminated bulk preflight writes to avoid optimistic lock warnings.
  - Per accepted suggestion:
    - Fetch fresh entity doc by `_id: entityId` with `+permissions`.
    - Compute the value via `getValue`/`getRawValue` (uses suggestion for that language).
    - Save sequentially using `ArrayUtils.sequentialFor` and `entities.save(updated, { language })`.
  - This prevents stale `__v` writes and avoids the conflict storm.

### Status semantics and flicker

- Server: `status()`
  - When `status=ready && findingSuggestions=true` and find is complete, returns `processing_auto_accept` (not `ready`) if `processRun.autoAccept.enabled`.
  - Else returns `processing_suggestions` (find in progress) or `ready`.
- Client: `useEventHandler` and `IXSuggestions.tsx`
  - Avoids premature ‘ready’ by treating `processed === total` carefully and inserting a sticky `processing_auto_accept` banner when we know accept is about to run.
  - Current limitation: for accept-only or instant transitions, the first progress payload arrives after the first batch completes, so UI shows “Accepting suggestions…” (no numbers) → “Accepting suggestions… 50/60”. Showing “0/60” at kickoff would require a kickoff event with totals.

### Known hiccups and how we mitigated them

- Optimistic locking warnings during accept: eliminated by per-entity fresh fetch + sequential saves.
- 50-only accept: fixed by paging with `skip=processed` in `AcceptSuggestionsUseCase` and removing pre/post-count guard.
- Status ‘ready’ blip between find and accept: server status function now returns `processing_auto_accept` during the transition; client also handles a sticky banner.
- First accept snapshot shows no totals: by design for now; see “Pending tasks” below for a potential improvement.

### Temporary debug logging (to be removed)

- Client: `useEventHandler.ts` and `IXSuggestions.tsx` have console logs tracing events/state sets.
- Server: `InformationExtraction.status()` and `startAutoAcceptIfEnabled()` log the returns/emits.

### Pending tasks / next steps

1. Optional kickoff snapshot for auto-accept (to show 0/total)

- At the start of `startAutoAcceptIfEnabled`, build the same `match` used by `AcceptSuggestionsUseCase`, compute `total = countDocuments(match)`, and emit `processing_auto_accept` with `{ total, processed: 0 }`.
- This avoids the brief “no numbers” period before the first batch finishes.
- Side-effect: one extra count per run; ensure match builder is factored to avoid drift.

2. Factor acceptance match building into a shared helper

- Extract the match-building logic used by `AcceptSuggestionsUseCase` into a common utility to be reused by kickoff snapshot (and future code) to prevent divergence.

3. Replace console logs with structured logs (production)

- Once stable, remove console debugging and (if needed) replace with `DefaultLogger` info/debug lines at key transition points.

4. Tests to strengthen the flow

- `process_extractor`: filter sets, balanced sampling, totals, status events.
- `process_selected`: queue trimming, progress correctness (pre-processed count), selected cohort acceptance.
- Auto-accept: blank_only vs overwrite_all; previous vs all; paging across multiple batches; proper completion.
- Status transitions: find start, find batches, transition to auto-accept (no ready blip), accept batches, final ready.

5. UI refinements (optional after server snapshot)

- If kickoff snapshot is implemented, ensure the client shows 0/total immediately on accept start.
- When find is disabled + auto-accept enabled, ensure the banner sticks from process response until the first accept event.

### Quick references (dev knobs)

- Property batch size: `ixMaterials.ts` → `BATCH_SIZE_FOR_PROPERTY`
- PDF batch size: `ixMaterials.ts` → `BATCH_SIZE_FOR_PDF`
- Auto-accept batch size: `AcceptSuggestionsFactory.createDefault({ batchSize })` or override in `queueRegistry.ts`

### Summary: current state

- Endpoints and use cases wired; `processRun` drives find and accept.
- Find sampling/filtering works; selected-mode queue tracks progress via sharedIds.
- Auto-accept is stable with paged batches; no more “stops at 50”.
- Acceptance writes per-language safely (no optimistic-locking warning storm).
- Status semantics reduce flicker across transitions; a “0/total” kickoff snapshot is an optional improvement.
