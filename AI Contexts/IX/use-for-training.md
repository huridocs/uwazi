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

## What remains (next steps)

1. Extend aggregation to include a `useForTraining` count; add tests
2. Extend GET `/api/suggestions` filter to filter by `useForTraining`; add tests
3. Update `/api/suggestions/train` to accept `options.samplePolicy` (mutually exclusive: `only_marked` | `marked_plus_labeled`); add tests
4. Implement training dataset selection honoring `samplePolicy` for Text and PDF, preserving existing filtering logic
5. Include `useForTraining` in outbound payloads to IX service (Text `labeled_data`, PDF materials); add tests/e2e

## Notes for future implementers

- Keep `suggestionsToFind` unchanged on `/api/suggestions/train`.
- PDF/Text training specifics are deferred; marking logic is independent.
- When adding tests that import `api/suggestions/routes.ts`, mock `api/services/informationextraction/InformationExtraction` to avoid Redis handles.
- Prefer injecting `req.user` through the `setUpApp` callback in tests to satisfy `ensureUser()`.
- Follow PX controller/use case via factory; keep controllers free of business logic.
- Maintain the "no `as any`" guideline; prefer precise typings and adapters where needed.
- Be disciplined with fixtures: if you add data to the wrong fixture while iterating (e.g., set a flag in `comprehensiveTestFixtures` but the test uses `stateFilterFixtures`), remove the incorrect changes. Keep fixture mutations minimal and scoped to the test that requires them to avoid cross-test pollution.
