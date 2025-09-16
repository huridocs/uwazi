# Suggestions “process” flow - Working Context

Last updated: 2025-09-08

## Scope

Unifies “find + accept” into one endpoint/process (`/api/suggestions/process`) supporting two modes:

- process_extractor

  - Find (optional, opt-in)
  - Filters: nonProcessed | obsolete | error (at least one required if find enabled)
  - Balanced sampling still applies within filter subset
  - Auto-accept options

- process_selected
  - Ignores find.enabled and filters
  - Initializes a run queue for selected `sharedIds`
  - Auto-accept options (source forced to “previous”)

## Key semantics

- creationDate: training timestamp only. Never reused for “find run” boundaries.
- suggestionsRunTimestamp: per-run boundary stored at `model.processRun.suggestionsRunTimestamp`.
- Balanced sampling within filters: filters narrow the population; we still sample balanced labeled/unlabeled inside the filtered set.
- Avoid re-requesting already “ready”: sampling excludes `status: 'ready'`.
- Auto-accept requires actual suggestions: `state.withSuggestion` must be true.
- Blank-only auto-accept uses `state.withValue != true`.
- Selected mode progress:
  - We keep the user’s total selection as `processRun.findSuggestionsInitialSharedIdsCount`.
  - We trim the queue to remove IDs that already have valid suggestions.
  - Progress = `processed = totalInitialSelected - remainingPending`.
  - This shows instant progress for pre-suggested entities (e.g., selected 100, 20 already suggested => processed 20/100 immediately).

## API: Endpoint and request

- Route: POST `/api/suggestions/process`
- Controller: `app/api/suggestions/adapters/ProcessSuggestionsController.ts`
  - zod validation
  - Validation rule: if `mode === 'process_extractor'` and `find.enabled === true`, at least one filter must be selected
- Use case: `app/api/suggestions/useCases/ProcessSuggestions.ts`
  - Dependencies injected (no production mocks)
  - Accepts `extractorId: string`, `mode`, `find?`, `autoAccept?`, `tenantName?`
  - For `process_selected`, always initializes queue if `selectedSharedIds` present; find is assumed enabled

### Request shape (zod)

- `extractorId: string`
- `mode: 'process_extractor' | 'process_selected'`
- `find?: { enabled?: boolean; size?: number; filters?: { nonProcessed?: boolean; obsolete?: boolean; error?: boolean }; selectedSharedIds?: string[] }`
- `autoAccept?: { enabled?: boolean; source?: 'previous'|'all'; overwriteMode?: 'blank_only'|'overwrite_all' }`

## Model schema

- `app/shared/types/IXModelSchema.ts`
- `processRun` (additionalProperties: false), contains:
  - `mode?: string`
  - `suggestionsRunTimestamp?: number`
  - `find?: { enabled?: boolean; size?: number; filters?: { nonProcessed?: boolean; obsolete?: boolean; error?: boolean }; selectedSharedIds?: string[] }`
  - `autoAccept?: { enabled?: boolean; source?: string; overwriteMode?: string }`
  - `autoAcceptProgress?: { total?: number; processed?: number }`
  - `findSuggestionsSharedIds?: string[]` (queue for selected mode)
  - `findSuggestionsInitialSharedIdsCount?: number` (original selection size)
- Legacy field `findSuggestionsRunTimestamp` is removed from new logic (we read/write `processRun.suggestionsRunTimestamp`).

## Run lifecycle

- Setting the run timestamp:

  - `ixmodels.setProcessRun` sets `processRun.suggestionsRunTimestamp = Date.now()` if absent (covers both find and auto-accept-only).
  - `ixmodels.initializeFindRunQueue` sets the timestamp and initializes the queue.

- Training resets processRun:

  - `ixmodels.startTraining` unsets previous run fields and `$unset: { processRun: '' }`.

- Obsoleting suggestions on model change:
  - `IXServices.saveModelProcess` always calls `ixmodels.saveAndObsoleteSuggestions(newModel)` (processing or ready) to obsolete suggestions when switching to a new model context.

## “Find” phase

- Filter-aware totals:

  - `IXServices.computeTotalSuggestionsForProcess` computes totals with filters applied, capped by `maxSuggestionsToFind`.
  - Use case sets `maxSuggestionsToFind = find.size` (default 1000), then sets `totalSuggestionsToFind` from the computed total.

- Sampling (balanced inside filters):

  - `Suggestions.getSampleForProcess` matches the filter subset first, then balances labeled/unlabeled using `$facet` and sampled sizes.
  - Excludes `status: 'ready'` to avoid re-find of already processed.

- For selected mode:

  - `ixmodels.initializeFindRunQueue` trims the queue by removing IDs that already have valid suggestions (ready, not obsolete, not error), but stores the original selection size in `processRun.findSuggestionsInitialSharedIdsCount`.
  - `ixMaterials` reads `processRun.findSuggestionsSharedIds` to feed batches and updates the queue.

- Progress reporting:
  - `InformationExtraction.getSuggestionsStatus` returns:
    - If `processRun.suggestionsRunTimestamp` exists:
      - `remaining = processRun.findSuggestionsSharedIds.length`
      - `total = processRun.findSuggestionsInitialSharedIdsCount`
      - `processed = total - remaining` (so pre-processed count is included instantly)
    - Else:
      - `processed = count({ extractorId, date != null, date > suggestionsRunTimestamp/fallback creationDate })`
      - `total = model.totalSuggestionsToFind`

## Auto-accept phase

- Trigger:

  - If find is enabled: when processed >= total (per `getSuggestionsStatus`), `InformationExtraction.processResults` emits `processing_auto_accept` and dispatches the auto-accept job.
  - If find is disabled and `autoAccept.enabled` is true: the use case calls `startAutoAcceptIfEnabled` to launch it immediately (and sets find totals to 0 to indicate no find phase).

- Use case + job with DI (hexagonal style):

  - AcceptSuggestionsUseCase: `app/api/suggestions/application/AcceptSuggestionsUseCase.ts`
    - Builds Mongo match:
      - `extractorId`, `status: 'ready'`, `date != null`, `'state.withSuggestion': true`, excludes `obsolete/error`
      - If overwriteMode != overwrite_all: `'state.withValue' != true`
      - If source == 'previous': `modelData.suggestionsRunTimestamp = processRun.suggestionsRunTimestamp`
    - Initializes progress `processRun.autoAcceptProgress` if missing
    - Processes one batch (size default 50), calls `Suggestions.accept`, increments processed; completes by unsetting `processRun`
  - Job: `app/api/suggestions/jobs/AcceptSuggestionsJob.ts`
    - Thin: calls `useCase.execute({ extractorId, batchSize })`
    - Emits `processing_auto_accept` each iteration, re-dispatches itself via injected `JobsDispatcher` if batch processed; emits `ready` on completion
    - No `tenants.run` in job; dispatcher sets the tenant context (mirrors paragraph extraction jobs)
  - Factory: `app/api/suggestions/infrastructure/AcceptSuggestionsFactory.ts`
    - Wires dispatcher, builds use case, constructs job (with deps, including `batchSize`)

- Indexes:
  - `IXSuggestionsModel`: added compound index on `{ extractorId, 'modelData.suggestionsRunTimestamp', status, entityId }` to speed “previous run” and “seen in run” queries.

## File map

- Endpoint: `app/api/suggestions/routes.ts` (controller-based)
- Controller: `app/api/suggestions/adapters/ProcessSuggestionsController.ts` (zod)
- Use case: `app/api/suggestions/useCases/ProcessSuggestions.ts`
- Model helpers: `app/api/services/informationextraction/ixmodels.ts`
  - `setProcessRun`, `unsetProcessRun`, `initializeFindRunQueue`, `appendToFindRunQueue`
  - `setAutoAcceptProgress`, `incAutoAcceptProcessed`
  - `save` (pure) vs `saveAndObsoleteSuggestions` (side-effect)
- Orchestration: `app/api/services/informationextraction/InformationExtraction.ts`
  - `getSuggestionsStatus`, `processResults`, `startAutoAcceptIfEnabled`
- Sampling & queries:
  - `app/api/suggestions/suggestions.ts` (balanced sampling with filters, seen-in-run using modelData.suggestionsRunTimestamp)
  - `app/api/services/informationextraction/ixMaterials.ts` (entities/files batching; selected-mode queue path)
- Auto-accept:
  - Use case: `app/api/suggestions/application/AcceptSuggestionsUseCase.ts`
  - Job: `app/api/suggestions/jobs/AcceptSuggestionsJob.ts`
  - Factory: `app/api/suggestions/infrastructure/AcceptSuggestionsFactory.ts`
- Schema:
  - `app/shared/types/IXModelSchema.ts` processRun fields (strict)
- Index:
  - `app/api/suggestions/IXSuggestionsModel.ts`

## Open items / decisions

- [ ] Confirm if we should also add/fine-tune other indexes (e.g., frequent filters by `state.withValue`).
- [ ] Confirm any remaining legacy reads of `findSuggestionsRunTimestamp` (new code removed them; tests/fixtures may still reference legacy fields).
- [ ] UX strings for:
  - `processing_auto_accept` status transitions
  - Selected-mode “instant progress” explanation (processed count includes entities that were already suggested)
- [ ] Tests:
  - process_extractor: filter sets, balanced sampling, totals
  - process_selected: queue trimming, progress correct on start, find batches
  - auto-accept: blank-only, previous vs all, batching, completion
  - ensure `creationDate` never changes during runs
  - retrain clears `processRun` and obsoletes suggestions on `processing`/`ready`

## Rationale for key choices

- Strict processRun schema keeps run-related data tidy and auditable.
- suggestionsRunTimestamp per-run avoids reusing `creationDate` and decouples training from per-run discovery.
- Balanced sampling within filters preserves prior sampling quality while respecting scope.
- Selected-mode progress shows user “intent count” and acknowledges pre-suggested entities immediately.
- Side-effecting save only when switching the model context (processing/ready) centralizes obsoleting where the model truly changes.
