# IX "use for training" — Working Context

Last updated: 2025-09-24

## Scope

- Add a persistent per-suggestion flag to indicate inclusion preference for training sets.
- Provide an endpoint to mark/unmark suggestions in bulk.
- Extend aggregation and filters to surface this flag.
- Later: extend training flows (Text/PDF) to honor a sample policy and forward the flag to the IX service.

## Decisions (agreed)

- Endpoint path: `POST /api/suggestions/training-set`
- Request body (JSON):

  ```json
  {
    "extractorId": "string",
    "suggestionIds": ["string", "string"],
    "useForTraining": true
  }
  ```

  - `useForTraining`:
    - `true` → mark as use for training
    - `false` → unmark
    - if omitted → default to `true`
  - Bulk and idempotent; only affects suggestions that belong to `extractorId`.

- Response (JSON):

  ```json
  {
    "updated": ["<suggestionId>", "<suggestionId>"],
    "useForTraining": true
  }
  ```

- Persistent flag on suggestions: `useForTraining: boolean` (distinct from `trainingSample`).

  - `trainingSample` remains a transient marker used by training jobs to note what was used in the last run.
  - `useForTraining` is user-curated and persistent across runs.

- Keep `suggestionsToFind` on `/api/suggestions/train` unchanged.

- Future training options naming: `options.samplePolicy` (mutually exclusive, not implemented yet):

  - `only_marked`: use only suggestions marked as `useForTraining`
  - `marked_plus_labeled`: complement marked suggestions with labeled samples

- Payloads to IX external service will carry the flag under the name `useForTraining`:
  - Text flow: include in each `labeled_data` record.
  - PDF flow: include in materials payload (see Open items for granularity).

## Data model and relationships (authoritative context)

- Entities use `sharedId` across UI languages; there are N entity documents per `sharedId`, one per UI language.
- Extractors (IX) have a 1:1 relationship with models; a single model per extractor evolves over time.
- Suggestions are per `(entity-language, extractor)` and act as data holders (a subset is actual suggestions).
  - If there are 3 UI languages, there are 3 suggestions per `sharedId` (one per entity version) for the extractor.
- Files belong to an entity `sharedId` (so they relate to all entity-language variants sharing that `sharedId`).
- PDF vs Text sources:
  - Text training sends `labeled_data` records per entity/property.
  - PDF training sends XML + materials; suggestions include fields like `fileId`, `page`, `segment`, and `selectionRectangles` (file-aware). `fileId` is optional on suggestions but present for PDF cases.

## Open items / to be validated

1. PDF granularity for `useForTraining` forwarding:

   - Current leaning: consider a file/material "curated" if there exists at least one suggestion for that `(extractorId, fileId)` with `useForTraining === true`.
   - Implementation detail: we will compute per-file curated status by querying suggestions grouped by `fileId`.
   - Confirm that this aligns with how IX materials are consumed.

2. Text flow and empty values:

   - Goal: allow training on empty values ("suggest an empty value under certain conditions").
   - Constraint: external service acceptance of empty labels is unknown; may cause errors.
   - Interim stance: when `samplePolicy === only_marked`, we will restrict to marked items; whether empty labels are included will be guarded behind validation or feature flag after service capability is confirmed.

3. API key naming:

   - External payload uses `useForTraining` (camelCase) for clarity.
   - Request body uses top-level `useForTraining` (camelCase). Route path remains hyphenated: `training-set`.

4. Controller/UseCase pattern (PX style):
   - Controller validates with zod, ensures user, delegates to a factory-created use case.
   - No business logic in controller.
   - Avoid using "as any"; prefer precise typing.

## Implementation plan (tests-first, incremental)

1. Add tests for `POST /api/suggestions/training-set` (mark/unmark; extractor scoping; idempotence; bad inputs).
2. Implement hex Controller/UseCase to perform the bulk update.
3. Extend suggestion schema/model with `useForTraining: boolean` (default `false`) and add index by `{ extractorId, useForTraining }`.
4. Extend aggregation to include `useForTraining` count; tests.
5. Extend GET `/api/suggestions` custom filter to filter by `useForTraining`; tests.
6. Extend `/api/suggestions/train` request schema to accept `options.samplePolicy`; tests.
7. Implement dataset selection honoring `samplePolicy` (Text and PDF), preserving existing filtering logic.
8. Include `useForTraining` in outbound payloads to IX service (Text `labeled_data`, PDF materials); tests/e2e.

## Existing references (for later integration)

- Existing transient marker: `Suggestions.markSuggestionsAsTrainingSamples(entities, extractorId)` — resets `trainingSample` and marks the last-run set.
- Filters and aggregation live in `app/api/suggestions/pipelineStages.ts` and `app/api/suggestions/suggestions.ts`.
- Training flows:
  - Text: `app/api/services/informationextraction/TrainModelForText.ts` (posts `labeled_data`).
  - PDF: `app/api/services/informationextraction/TrainModelForPDF.ts` (uploads XML and materials).

## Non-goals

- Do not change prediction/suggestion request flows to be aware of training provenance.
- Do not alter `suggestionsToFind` semantics or process flow.

## Current status (backend, tests-first)

- Endpoint added: `POST /api/suggestions/training-set`

  - Middleware: `serviceMiddleware`, `needsAuthorization(['admin','editor'])`
  - Controller: `app/api/suggestions/adapters/TrainingSetController.ts`
    - Zod validation messages:
      - extractorId: "You should provide an Extractor"
      - suggestionIds[]: "You should provide a Suggestion"
      - suggestionIds min(1): "You should provide at least one Suggestion"
    - Delegates to use case via factory (PX style)
  - Use case: `app/api/suggestions/application/MarkSuggestionsUseForTrainingUseCase.ts`
    - Filters provided IDs by `extractorId`
    - Bulk `updateMany` sets/unsets `useForTraining`
    - Returns `{ updated: string[], useForTraining: boolean }`
  - Factory: `app/api/suggestions/infrastructure/TrainingSetFactory.ts`
  - Route wiring: `app/api/suggestions/routes.ts`

- Schema/model updates for suggestions:

  - `app/api/suggestions/IXSuggestionsModel.ts`: added `useForTraining: boolean` (default `false`) and index `{ extractorId: 1, useForTraining: 1 }`
  - `app/shared/types/suggestionSchema.ts`: added `useForTraining: { type: 'boolean' }` to `IXSuggestionSchema`

- Tests: `app/api/suggestions/adapters/specs/TrainingSetRoutes.spec.ts`

  - Covers: validation errors, idempotent marking, unmarking, ignoring IDs from other extractors, defaulting when `useForTraining` omitted, and bulk updates
  - DB assertions via `testingEnvironment.db` on `ixsuggestions`
  - Auth: injects `req.user` through `setUpApp` middleware (no global auth mock needed)
  - External deps: mocks `api/services/informationextraction/InformationExtraction` to avoid Redis/TaskManager initialization and eliminate open handle warnings
  - Style: follows paragraphExtraction test patterns; avoids `as any`

- Aggregation:

  - Implemented `useForTraining` count in `app/api/suggestions/suggestions.ts` aggregation pipeline
  - Exposed new field in schema: `useForTraining: number` in `IXSuggestionAggregationSchema`
  - Test updated in `app/api/suggestions/specs/routes.spec.ts` to assert non-zero counts
  - Fixtures: added `useForTraining` to two `stateFilterFixtures.ixsuggestions` records for `test_extractor` so count == 2
  - Clean-up: removed accidental `useForTraining` additions from unrelated `comprehensiveTestFixtures` to avoid cross-test pollution

- GET filtering support (table query):
  - Schema: `SuggestionCustomFilterSchema` includes `useForTraining: boolean` (required in shape)
  - Pipeline: `filterFragments.useForTraining` and `translateCustomFilter` extended
  - Tests:
    - Route-level filtering removed (was noisy); filtering assertions live in:
      - `app/api/suggestions/specs/getSuggestionsForTableQuery.spec.ts` → end-to-end table query filtering, including `useForTraining` scenario (flags two records then asserts total 2)
      - `app/api/suggestions/specs/customFilters.spec.ts` → aggregation-level count covers `useForTraining` = 2
  - Fixtures hygiene preserved; tests mark flags via DB writes where needed

## Training flow (pre-send) — control/data flow chart

Goal: clarify WHEN we fetch entities/files for training and WHEN `processRun` is touched, to decide the correct hook for `samplePolicy` selection without breaking existing logic.

1. Route: POST `/api/suggestions/train`

   - Validates `{ extractorId, suggestionsToFind?, options.samplePolicy? }` (schema extended; behavior unchanged)
   - Calls `InformationExtraction.trainModel(extractorId, suggestionsToFind, options?)`

2. InformationExtraction.trainModel

   - Calls `ixmodels.startTraining(extractorId, { suggestionsToFind })`
     - Sets model: `findingSuggestions = true`, `status = processing`, stores `maxSuggestionsToFind`
     - UNSETS `processRun` entirely for a clean start (critical)
     - Unsets any previous find-run queue data
   - If provided, persists `options.samplePolicy` via `ixmodels.setProcessRun(extractorId, { samplePolicy })`
     - IMPORTANT: This happens AFTER `startTraining`, so the unset above does not squash this new value
   - Emits status event and dispatches `IXTrainModelJob`

3. IXTrainModelJob

   - Loads extractor by id
   - Branches by source:
     - PDF → `TrainModelForPDF.execute`
     - Property/Text → `TrainModelForText.execute`

4. TrainModelForText.execute (Property source)

   - Fetches entities via `getEntitiesForTraining(extractor.templates, extractor.property, extractor.source.property)`
     - This selection is entity-centric and does NOT use suggestions
   - Iterates entities sequentially
   - Prepares `PropertySourceMaterials` per entity
   - Sends labeled_data (not changed yet)
   - Collects processed `entity.sharedId` → marks suggestions of those entities as `trainingSample`

5. TrainModelForPDF.execute (PDF source)
   - Fetches files/materials via `getFilesForTraining(extractor)` which returns a `process` iterator over files with segmentation info
     - This is file-centric and does NOT use suggestions
   - For each file:
     - Verifies XML exists; computes `propertyLabeledData`, `propertyValue`/`propertyType`
     - Sends XML and labeled_data (not changed yet)
     - Collects processed `file.entity` → marks suggestions of those entities as `trainingSample`

Key implications and hook points for samplePolicy selection:

- `getEntitiesForTraining` and `getFilesForTraining` are the canonical sources; current flows don’t pull selection from suggestions.
- `processRun` is cleared in `startTraining` and can safely store our `samplePolicy` only if written AFTER that call (current ordering is correct).
- To honor `samplePolicy` without rewriting core materials logic, selection should intercept:
  - Text: After `getEntitiesForTraining` returns, trim the `entities` list to those derived from samplePolicy:
    - Map marked suggestions (`useForTraining`) to `entity.sharedId/lang` and intersect
    - For `marked_plus_labeled`, union with labeled entities
  - PDF: After `getFilesForTraining` yields a file, decide to skip/keep based on samplePolicy:
    - Map marked suggestions to `fileId` (and/or entity) and filter
    - For `marked_plus_labeled`, union with labeled suggestions/files
- `processRun.samplePolicy` should be read inside the train use cases right before iteration, NOT earlier in the queue/job layer.

Why not query suggestions directly upfront?

- Current training selection is decoupled from suggestions; replacing it risks breaking PDF segmentation and property source paths. Using post-fetch filtering preserves existing logic while allowing curated selection.

Safeguards and ordering guarantees:

- Maintain `setProcessRun` strictly after `startTraining` to avoid losing `samplePolicy`.
- Ensure selection filters are applied immediately before the per-item loop in Text/PDF use cases, so no other step resets or overrides selection.

## Agreed selection strategy (no payload changes yet)

Two-stage selection to guarantee inclusion of marked samples while preserving current logic and limits:

Stage A — Always include “marked for training”

- Purpose: guarantee that all suggestions marked `useForTraining` are included regardless of sampling/limits upstream.
- Text (Property source):
  - Build the cohort from suggestions: map `(entityId/sharedId, language)` where `useForTraining === true` for the extractor.
  - Truncate the “is labeled” requirement: marked samples are valid even if unlabeled (service will handle empty/none labels as discussed).
  - Fetch entities via existing `getEntitiesForTraining(...)` path but ensure inclusion of the marked cohort: intersect by sharedId+language, and bypass the labeled-only guards for these.
- PDF (File source):
  - Build the cohort from suggestions: prefer `fileId` when present; fall back to `entityId/sharedId` if `fileId` is missing.
  - XML/segmentation and any other data constraints still apply; if constraints fail (e.g., missing XML), skip as today.
  - Fetch files via `getFilesForTraining(extractor)` and ensure inclusion of the marked cohort early in the iteration (do not rely on sampling or prior limits).
- De-duplication: unify by `(sharedId, language)` on Text and `(fileId)` (or `(entity, file)` pair) on PDF to avoid repeated sends.
- Cap behavior: Stage A can exceed `maxSuggestionsToFind` (we will not drop marked items). Stage B then uses an effective remaining budget (possibly zero).

Stage B — Current logic with adjusted limit

- Run the existing training selection as-is (no semantic changes).
- Effective limit = `maxSuggestionsToFind - StageACount`, lower-bounded at 0.
- Exclude anything already included in Stage A to avoid duplicates.
- Conditional on sample policy:
  - If `samplePolicy === only_marked`, skip Stage B entirely (Stage A only).
  - If `samplePolicy === marked_plus_labeled` or not provided, execute Stage B as above.

Implementation notes (to be done next):

- Encapsulate Stage A + Stage B orchestration in a small helper module (keep `InformationExtraction.ts` readable). The helper exposes two functions used by `TrainModelForText.execute` and `TrainModelForPDF.execute` just before their per-item loops.
- Use present indexes: `{ extractorId, useForTraining }` on `ixsuggestions` for fast cohort discovery.
- Language precision: suggestions are per entity-language; Stage A must include the corresponding language variant in Text flow.
- Telemetry (optional): record StageA/StageB counts in `processRun` if future progress feedback is needed (not required now).

Test plan (selection-only)

- Text:
  - Marked unlabeled entities are included; labeled guards are bypassed for Stage A.
  - Stage B returns exactly `max - StageACount` additional entities, excluding duplicates.
- PDF:
  - Marked files are included if XML exists; absent XML still skips as today.
  - Stage B returns exactly `max - StageACount` additional files, excluding duplicates.
  - If `fileId` is missing on marked suggestion, inclusion falls back via entity association if feasible; otherwise skip (documented).

## What remains (next steps)

1. Update `/api/suggestions/train` to accept `options.samplePolicy` (mutually exclusive: `only_marked` | `marked_plus_labeled`); add tests
2. Implement training dataset selection honoring `samplePolicy` for Text and PDF, preserving existing filtering logic
3. Include `useForTraining` in outbound payloads to IX service (Text `labeled_data`, PDF materials); add tests/e2e

## Notes for future implementers

- Keep `suggestionsToFind` unchanged on `/api/suggestions/train`.
- PDF/Text training specifics are deferred; marking logic is independent.
- When adding tests that import `api/suggestions/routes.ts`, mock `api/services/informationextraction/InformationExtraction` to avoid Redis handles.
- Prefer injecting `req.user` through the `setUpApp` callback in tests to satisfy `ensureUser()`.
- Follow PX controller/use case via factory; keep controllers free of business logic.
- Maintain the "no `as any`" guideline; prefer precise typings and adapters where needed.
- Be disciplined with fixtures: if you add data to the wrong fixture while iterating (e.g., set a flag in `comprehensiveTestFixtures` but the test uses `stateFilterFixtures`), remove the incorrect changes. Keep fixture mutations minimal and scoped to the test that requires them to avoid cross-test pollution.
