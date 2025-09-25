# IX "use for training" — Working Context

Last updated: 2025-09-25 (end of day)

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
6. Extend `/api/suggestions/train` request schema to accept `options.samplePolicy`; tests. (DONE)
7. Implement dataset selection honoring `samplePolicy` (Text and PDF), preserving existing filtering logic. (DONE)
8. Include `useForTraining` in outbound payloads to IX service (Text `labeled_data`, PDF materials); tests/e2e. (PENDING)

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

- Training entrypoint schema and persistence (samplePolicy):

  - Train route schema updated to accept `options.samplePolicy` (allowed values: `only_marked` | `marked_plus_labeled`). File: `app/api/suggestions/routes.ts`.
  - `InformationExtraction.trainModel(extractorId, suggestionsToFind?, options?)` persists `processRun.samplePolicy` via `ixmodels.setProcessRun` AFTER `ixmodels.startTraining`. File: `app/api/services/informationextraction/InformationExtraction.ts`.
  - Model typing extended to include `processRun.samplePolicy`:
    - Schema: `app/shared/types/IXModelSchema.ts`
    - Emitted types: `app/shared/types/IXModelType.d.ts`
  - Ajv strict mode: optional fields must be omitted from `required`; do not use `optional` keyword in JSON schemas. Train route schema updated accordingly.

- Selection implemented with agreed two-stage strategy (Stage A/Stage B):

  - Property/Text flow: `getPropertyTrainingEntities(extractor)` in `app/api/services/informationextraction/FetchMaterialsForTraining.ts`
    - Stage A: includes all marked suggestions by `(sharedId, language)` for the extractor, bypassing the "is labeled" requirement in selection.
    - Stage B: draws from existing `getEntitiesForTraining(...)`, excludes Stage A by `(sharedId, language)`, and uses remaining budget = `MAX_TRAINING_ENTITIES_NUMBER - StageACount`.
    - Gates: if `processRun.samplePolicy === 'only_marked'`, Stage B is skipped.
  - PDF flow: `getPdfTrainingProcess(extractor)` in the same file returns a `process` that:
    - Yields Stage A materials first, built from marked suggestions with a ready segmentation by `fileId` (XML enforced). Dedupe by `fileId`.
    - Then yields up to the remaining budget from the base PDF iterator (Stage B), skipping duplicates.
    - Gates: if `processRun.samplePolicy === 'only_marked'`, Stage B is skipped.
    - Note: currently Stage A only considers suggestions with `fileId`. Marked suggestions without `fileId` are not included (fallback via entity is not implemented).
  - Train use cases read these helpers right before iteration:
    - Text: `app/api/services/informationextraction/TrainModelForText.ts`
    - PDF: `app/api/services/informationextraction/TrainModelForPDF.ts`
    - TypeScript: select-like values mapping uses destructuring `{ value, label }` to satisfy `MetadataObjectSchema` (label optional).

- Shared property-value derivation (parity across Stage A and Stage B):

  - New helper: `deriveTrainingPropertyValue` in `app/api/services/informationextraction/propertyValue.ts` centralizes how training values are derived.
  - Behavior (unchanged vs earlier flows, now explicit in one place):
    - For select/multiselect/relationship: returns `[{ value, label }, ...]` from entity metadata values.
    - For other types (text/markdown/date/etc.): prefers `currentValue` when provided; falls back to selection text; normalizes epoch-like dates to `YYYY-MM-DD`.
  - Both Stage A (files path) and Stage B (aggregation path) call this helper so value semantics are identical.

- Stage A (files-based) implementation details and parity guarantees:

  - Module: `app/api/services/informationextraction/FetchMaterialsForTraining.ts`.
  - Entity access: uses `entitiesModel.getUnrestricted({ sharedId, language })` to ensure the correct entity-language variant is read without permission constraints, matching previous training flows.
  - Language source on materials: Stage A sets the `FileWithAggregation.language` to the entity-language (`entityLang.language`) when available; otherwise uses the file’s language. This ensures the outbound `language_iso` reflects the entity language (e.g., 'es').
  - File selection: Stage A pulls marked files (`useForTraining: true`) and builds materials only for files with ready segmentations; deduped by `fileId`.
  - Flag propagation: `useForTraining` is set to `true` on Stage A materials only; Stage B materials default to `false`.
  - Budget: Remaining budget for Stage B is `MAX_TRAINING_FILES_NUMBER - StageACount`. If `samplePolicy === 'only_marked'`, Stage B is skipped.

- Stage B (aggregation-based) unchanged behavior:

  - Module: `app/api/services/informationextraction/ixMaterials.ts`.
  - Continues to use balanced sampling within process constraints; now calls the shared helper for value derivation.
  - `useForTraining` remains `false` for Stage B materials.

- Tests added for selection and route:

  - Route accepts `options.samplePolicy`: `app/api/suggestions/specs/routes.spec.ts`.
  - Selection tests: `app/api/services/informationextraction/specs/FetchMaterialsForTraining.spec.ts`
    - Property: includes marked unlabeled entities; Stage B gated by policy; deduped by `(sharedId, language)`.
    - PDF: Stage A first; XML missing/processing skipped; Stage B gated by policy; no duplicates; budget respected.
  - Helper tests: `app/api/services/informationextraction/specs/propertyValue.spec.ts` validate select/text/date behaviors.
  - Route tests: expectations updated to reflect `options.samplePolicy` acceptance and `useForTraining` boolean in payloads.

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

- Encapsulate Stage A + Stage B orchestration in a small helper module (DONE) — `app/api/services/informationextraction/FetchMaterialsForTraining.ts`.
- Use present indexes: `{ extractorId, useForTraining }` on `ixsuggestions` for fast cohort discovery. (IN PLACE)
- Language precision: suggestions are per entity-language; Stage A includes the corresponding language variant in Text flow. (IN PLACE)
- PDF Stage A currently requires a ready segmentation (XML); suggestions without `fileId` are ignored (no entity fallback yet). (KNOWN LIMITATION)
- Telemetry (optional): record StageA/StageB counts in `processRun` if future progress feedback is needed (not required now). (NOT IMPLEMENTED)

Test plan (selection-only)

- Text:
  - Marked unlabeled entities are included; labeled guards are bypassed for Stage A.
  - Stage B returns exactly `max - StageACount` additional entities, excluding duplicates.
- PDF:
  - Marked files are included if XML exists; absent XML still skips as today.
  - Stage B returns exactly `max - StageACount` additional files, excluding duplicates.
  - If `fileId` is missing on marked suggestion, inclusion falls back via entity association if feasible; otherwise skip (documented).

## What remains (next steps)

1. Include `useForTraining` in outbound payloads to the IX service (Text and PDF), then add tests/e2e.
   - Text: add `useForTraining` to each `labeled_data` record.
   - PDF: include `useForTraining` in materials payload (decide per-file or per-item granularity; current selection already enforces curated files first).
2. Optional: implement PDF Stage A fallback by entity when `fileId` is missing on marked suggestions, if feasible without breaking current flows.
3. Optional: telemetry of Stage A/Stage B counts into `processRun` for progress reporting.

## Findings, pitfalls, and parity notes (important)

- Ajv strict-mode schemas: do not use the `optional` keyword; optionality is controlled via omission from `required`. This affected the train route when adding `options.samplePolicy`.
- No `as any`: removed all remaining casts in the new code paths, notably:
  - Segmentation lookups filter out entries with missing `fileID` before building maps (`FetchMaterialsForTraining`).
  - `FileWithAggregation` now includes an optional `useForTraining?: boolean` and reuses the shared `PropertyValue` type.
- Stage A parity with Stage B:
  - Entity-language and value must come from the entity-language record; do not rely on `file.language` (which can be ISO639-3 like 'spa'). Stage A sets `item.language` to `entityLang.language` when available so the outbound `language_iso` matches the entity (e.g., 'es').
  - Value derivation must prefer the entity’s current value over selection text; both paths now call the same helper to enforce this.
  - `useForTraining` must be `true` only for Stage A (marked) materials; `false` for Stage B.
- PDF payload language:
  - The outbound `language_iso` in the materials is sourced from `FileWithAggregation.language`. Since Stage A sets this to the entity’s language where available, the payload mirrors previous behavior without extra normalization.
- Logging: temporary console logs were added during debugging (in `propertyValue.ts`, Stage A builder, and `TrainModelForPDF`). These should be removed once the flow is stable.

## Handoff context (for a new Agent)

Key modules and responsibilities:

- `app/api/suggestions/routes.ts`: adds `options.samplePolicy` validation to `POST /api/suggestions/train`.
- `app/api/services/informationextraction/InformationExtraction.ts`: persists `processRun.samplePolicy` after `ixmodels.startTraining` (ordering matters because `startTraining` unsets `processRun`).
- `app/api/services/informationextraction/propertyValue.ts`: shared helper for value derivation across Stage A and Stage B.
- `app/api/services/informationextraction/FetchMaterialsForTraining.ts`: Stage A implementation for Property and PDF:
  - Property: `getPropertyTrainingEntities` ensures marked cohort inclusion (dedupe by `(sharedId, language)`), honors `samplePolicy` for Stage B gating.
  - PDF: `getPdfTrainingProcess` yields Stage A first (marked files with ready XML), then Stage B up to remaining budget; attaches `useForTraining: true` to Stage A materials and sets `item.language` from the entity-language when available.
- `app/api/services/informationextraction/ixMaterials.ts`: Stage B path; unchanged semantics but now delegates value derivation to the shared helper.
- `app/api/services/informationextraction/TrainModelForText.ts` and `TrainModelForPDF.ts`: use the derived materials and send to the external IX service; no payload format changes besides including `useForTraining` (boolean).

Tests of interest:

- Selection tests: `FetchMaterialsForTraining.spec.ts` (Stage A gating, dedupe, budget; XML-ready enforcement).
- Helper tests: `propertyValue.spec.ts` (select, text, date behaviors).
- Integration tests: `InformationExtraction.spec.ts` (including a case that marks the Spanish file to assert `useForTraining: true`, `label_text` from the entity, and `language_iso: 'es'`).

Open items to consider post-handoff:

- Remove debugging console logs once stability is confirmed.
- Add e2e tests for payloads that include `useForTraining` in both Text and PDF.
- Consider a fallback for PDF Stage A when `fileId` is missing on marked suggestions (documented limitation).

## Notes for future implementers

- Keep `suggestionsToFind` unchanged on `/api/suggestions/train`.
- PDF/Text training specifics are deferred; marking logic is independent.
- When adding tests that import `api/suggestions/routes.ts`, mock `api/services/informationextraction/InformationExtraction` to avoid Redis handles.
- Prefer injecting `req.user` through the `setUpApp` callback in tests to satisfy `ensureUser()`.
- Follow PX controller/use case via factory; keep controllers free of business logic.
- Maintain the "no `as any`" guideline; prefer precise typings and adapters where needed.
- Be disciplined with fixtures: if you add data to the wrong fixture while iterating (e.g., set a flag in `comprehensiveTestFixtures` but the test uses `stateFilterFixtures`), remove the incorrect changes. Keep fixture mutations minimal and scoped to the test that requires them to avoid cross-test pollution.
- Testing UX: route tests log unexpected responses (status/body) when assertions fail to ease debugging in CI without polluting production logs.

## Handoff context (for a new Agent)

- Entry points and main files touched:

  - Train route schema: `app/api/suggestions/routes.ts` (accepts `options.samplePolicy`).
  - Training start and persistence: `app/api/services/informationextraction/InformationExtraction.ts` (sets `processRun.samplePolicy` after `startTraining`).
  - Selection orchestration (Stage A/B): `app/api/services/informationextraction/FetchMaterialsForTraining.ts`
    - Property: `getPropertyTrainingEntities`
    - PDF: `getPdfTrainingProcess`
  - Use cases consuming selection:
    - Text: `app/api/services/informationextraction/TrainModelForText.ts`
    - PDF: `app/api/services/informationextraction/TrainModelForPDF.ts`
  - IX model typing for `samplePolicy`:
    - Schema: `app/shared/types/IXModelSchema.ts`
    - Types: `app/shared/types/IXModelType.d.ts`

- Tests to review:

  - Route: `app/api/suggestions/specs/routes.spec.ts` (asserts `options.samplePolicy` accepted).
  - Selection: `app/api/services/informationextraction/specs/FetchMaterialsForTraining.spec.ts` (policy gating, unlabeled inclusion in selection, XML skip, budget, dedupe).

- Behavioral notes and assumptions:
  - Selection guarantees inclusion of all marked items (Stage A) within the configured caps; Stage B fills the remaining budget unless `samplePolicy === 'only_marked'`.
  - Outbound payloads remain unchanged for now. As a consequence, some Stage A items without labels in Text flow will still be skipped during send by existing logic; this is expected until step 8 is completed.
  - PDF Stage A currently includes only files with ready segmentations; suggestions marked without `fileId` are ignored. Implementing an entity-based fallback is optional and pending.
  - UI has not been updated to send `options.samplePolicy`; backend supports it and defaults to Stage B execution when policy is absent (equivalent to `marked_plus_labeled`).
