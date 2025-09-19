## Suggestions: unified process + auto-accept (Context v2)

Last updated: 2025-09-11

### Scope

- Single endpoint: POST `/api/suggestions/process`
- Two modes:
  - `process_extractor`: find suggestions according to filters, then (optionally) auto-accept
  - `process_selected`: process a user-provided cohort of sharedIds, then (optionally) auto-accept

### Controller and request

- Controller: `app/api/suggestions/adapters/ProcessSuggestionsController.ts`
- Zod validation; requires mode; optional `find` and `autoAccept`
- If `mode === 'process_extractor'` and `find.enabled`, must specify at least one filter (nonProcessed | obsolete | error)

Request shape:

```json
{
  "extractorId": "string",
  "mode": "process_extractor" | "process_selected",
  "find": {
    "enabled": boolean,
    "size": number,
    "filters": { "nonProcessed"?: boolean, "obsolete"?: boolean, "error"?: boolean },
    "selectedSharedIds"?: string[]
  },
  "autoAccept": {
    "enabled"?: boolean,
    "source"?: "previous" | "all",
    "overwriteMode"?: "blank_only" | "overwrite_all"
  }
}
```

### Model schema and run state

- Schema: `app/shared/types/IXModelSchema.ts`
- `status`: `processing | failed | ready`
- `findingSuggestions`: boolean (means “a process is currently running”, not just training)
- `processRun` (strict):
  - `mode?`
  - `suggestionsRunTimestamp?`
  - `find?` (persisted copy of request options)
  - `autoAccept?` (persisted copy of request options)
  - `autoAcceptProgress?` (`{ total?: number; processed?: number }`)
  - `findSuggestionsSharedIds?` (queue for selected mode)
  - `findSuggestionsInitialSharedIdsCount?` (original selection size)
  - `selectedSharedIdsForAutoAccept?` (selected cohort to include pre-existing suggestions in auto-accept “previous” scope)

### Lifecycle helpers (ixmodels)

- `setProcessRun(extractorId, processRun)`: sets run options; ensures `suggestionsRunTimestamp` exists
- `initializeFindRunQueue(modelId, sharedIds)` (selected mode):
  - Trims pre-suggested (ready & not obsolete/error) sharedIds out of queue
  - Sets `processRun.suggestionsRunTimestamp = now`
  - Sets `processRun.findSuggestionsSharedIds = pending`
  - Sets `processRun.findSuggestionsInitialSharedIdsCount = original length`
  - Stores `processRun.selectedSharedIdsForAutoAccept = sharedIds` (cohort for acceptance)
- `appendToFindRunQueue`
- `startFindingSuggestions(extractorId)` -> `findingSuggestions=true`, `status=processing`
- `stopTraining(extractorId)` -> `findingSuggestions=false`, `status=ready`, clears findRun data
- `unsetProcessRun(extractorId)`
- `setAutoAcceptProgress` / `incAutoAcceptProcessed`

### Find phase (InformationExtraction + IXServices + Suggestions)

- Totals:

  - `IXServices.computeTotalSuggestionsForProcess(extractorId, model, filters?)` computes count within filters, capped by `maxSuggestionsToFind` (from request size)
  - For `process_extractor`, `filters` are honored; for `process_selected`, `filters` are not provided to totals (the cohort governs scope)

- Sampling (balanced inside filters): `Suggestions.getSampleForProcess`

  - Builds `$or` of statuses according to filters (`nonProcessed`, `obsolete`, `error`)
  - Excludes ready from sampling
  - Balances labeled/unlabeled using `$facet` and `$sample`
  - For `process_selected`, materials are fed from entities/files derived from the run queue; batch size is computed against `totalSuggestionsToFind - processed`

- Selected mode progress reporting (sharedId-based):

  - `total = processRun.findSuggestionsInitialSharedIdsCount`
  - `remaining = processRun.findSuggestionsSharedIds.length`
  - `processed = total - remaining` (includes immediately those already pre-suggested)

- Status emits during find: `emitToTenant(tenant, 'ix_model_status', extractorId, 'processing_suggestions', '', { processed, total })`

- Completion trigger:
  - When `processed >= totalSuggestionsToFind`, transition to auto-accept if enabled (do not emit ready)
  - If find is explicitly disabled and `autoAccept.enabled`, trigger auto-accept immediately (and set totals to 0)

### Auto-accept phase

Core classes:

- Use case: `app/api/suggestions/application/AcceptSuggestionsUseCase.ts`
- Job: `app/api/suggestions/jobs/AcceptSuggestionsJob.ts`
- Factory: `app/api/suggestions/infrastructure/AcceptSuggestionsFactory.ts`

Acceptance match (base):

- Always filtered by extractorId, `status: 'ready'`, `date != null`, `'state.withSuggestion': true`, exclude obsolete/error
- If `overwriteMode !== overwrite_all`, also require `'state.withValue' != true` (blank_only)

Scoping by source:

- `source: 'previous'`:
  - Matches suggestions created in the current run via `modelData.suggestionsRunTimestamp == processRun.suggestionsRunTimestamp`
  - In selected mode, also include pre-existing ready suggestions for the selected cohort: `entityId ∈ processRun.selectedSharedIdsForAutoAccept`
- `source: 'all'`:
  - No additional scoping (accept across the population, subject to overwrite rules)

Batching and progress:

- Default batch size: 50 (configurable via factory)
- `processRun.autoAcceptProgress`: `{ total, processed }`
- Each batch:
  - Fetch suggestions; build `toAccept = [{ _id, sharedId: entityId, entityId: entityLanguageId, overwriteAll }]`
  - `Suggestions.accept(toAccept)`
  - Recompute states for accepted IDs (so they stop matching subsequent iterations)
  - Increment `processRun.autoAcceptProgress.processed`

Loop guard (to prevent redispatch loops):

- Measure pre/post match counts around accept; if the `postCount >= preCount`, stop redispatch and return a progress snapshot (prevents infinite loops when entity saves fail due to optimistic locking)

Job behavior:

- Emits `processing_auto_accept` with `{ total, processed, remaining }` snapshot each iteration
- Redispatches itself while `processed > 0`
- On completion (no items processed), best-effort cleanup: `ixmodels.stopTraining(extractorId)` (sets ready + clears find-run data), then emits `ready`
- On error, best-effort cleanup: `unsetProcessRun`, `stopTraining`, then rethrow for the queue worker to handle

### Status endpoint semantics (server -> client)

- `status()` evaluates:
  - `status=processing && findingSuggestions=true` => `processing_model` (UI “training”/protection state)
  - `status=ready && findingSuggestions=true` => `processing_suggestions` with find-progress payload
  - `status=ready` => `ready`
- During auto-accept, we rely on the real-time `processing_auto_accept` socket events; final `ready` is emitted by the accept job on completion.

### Selected mode: totals and acceptance

- Selected progress is by sharedId, not suggestions.
- A single batch dequeues N sharedIds, and processes all language variants for those N sharedIds (can yield N×languages suggestions in a batch).
- Auto-accept progress is suggestion-based (processed/total/remaining suggestions).

### Error handling and known hiccups

- Optimistic locking on entities during accept:

  - Can happen if entities are concurrently modified while auto-accept updates values
  - We recompute suggestion states after accept and guard redispatch with pre/post match counts to avoid loops
  - Follow-up (pending): add bounded retries inside `Suggestions.accept` for entity saves that fail with optimistic lock

- Redis MaxListeners warnings:
  - We avoided repeated listener registration by setting `setMaxListeners(0)` and enforcing single registration in sockets setup

### Logging

- Prefer structured, compact logs. For complex match objects, log `JSON.stringify(match)` to view arrays and nested clauses
- Avoid excessive casts in code (no `(match as any)` unless strictly necessary)

### Pending tasks / next steps

1. Wrap entity save in `Suggestions.accept` with bounded retry on optimistic lock

   - Retry a small number of times (e.g., 2-3) per entity before skipping
   - Log skipped entities; do not block the batch
   - Ensure suggestions for skipped entities are not re-matched endlessly (state recompute already helps)

2. Remove debug console logs once stable; keep concise logs for:

   - Transition points (start auto-accept, finish auto-accept)
   - Accept match summary (counts, sources)

3. Tests:

   - process_extractor: filters, balanced sampling, totals
   - process_selected: queue trimming, progress correct on start, selected cohort acceptance
   - auto-accept: blank_only / overwrite_all, previous vs all, batching, completion, no loops on lock errors
   - status endpoint transitions at each stage

4. Index review

   - Existing compound index on suggestions: `{ extractorId, 'modelData.suggestionsRunTimestamp', status, entityId }`
   - Consider additional indexes for common acceptance filters if needed

5. UI alignment
   - Selected-mode progress is sharedId-based (by design)
   - Auto-accept progress is suggestion-based

### File map (key locations)

- Endpoint: `app/api/suggestions/adapters/ProcessSuggestionsController.ts`
- Use case (orchestration): `app/api/suggestions/useCases/ProcessSuggestions.ts`
- Model helpers: `app/api/services/informationextraction/ixmodels.ts`
- Orchestration: `app/api/services/informationextraction/InformationExtraction.ts`
- Sampling & queries: `app/api/suggestions/suggestions.ts`
- Acceptance:
  - Use case: `app/api/suggestions/application/AcceptSuggestionsUseCase.ts`
  - Job: `app/api/suggestions/jobs/AcceptSuggestionsJob.ts`
  - Factory: `app/api/suggestions/infrastructure/AcceptSuggestionsFactory.ts`
- Schema: `app/shared/types/IXModelSchema.ts` (includes `selectedSharedIdsForAutoAccept`)
- Index: `app/api/suggestions/IXSuggestionsModel.ts`
