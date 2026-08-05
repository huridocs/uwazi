# IX Entity V2 Integration Diagnosis (01)

Last updated: 2026-05-28
Status: diagnosis + implementation in progress (step 1 and core naming rollout implemented)

## Purpose of this document

This file is a handoff context for future agents working on IX (Information Extraction / Metadata Extraction) regressions after v2 entity create/update rollout.  
Goal: avoid re-discovery, preserve alignment decisions, and separate **agreed direction** from **open discussion**.

## Implementation update (2026-05-26)

Implemented work from the recommended sequence:

1. **Compatibility emits for v2 entity update paths are now in place.**
   - `app/api/core/application/EntitiesService.ts` now emits legacy `EntityUpdatedEvent` on `applicationEventsBus` in:
     - `update(...)`
     - `updateMultiple(...)` (one event per changed entity)
   - Existing core domain `EntityUpdatedEvent` emission on v2 `eventEmitter` was preserved.
   - Legacy event naming is explicit via aliasing (`LegacyEntityUpdatedEvent`); core domain event keeps its normal name (`EntityUpdatedEvent`).

2. **v2 create path compatibility status**
   - `EntityCreatedEvent` compatibility emission on `applicationEventsBus` was already present in `insert(...)` and `bulkInsert(...)`; no behavior change was needed there.

3. **Verification**
   - Updated and passed tests in:
     - `app/api/core/application/specs/EntitiesService.spec.ts`
   - Validation command used:
     - `node --no-experimental-fetch ./node_modules/.bin/jest app/api/core/application/specs/EntitiesService.spec.ts --testTimeout=30000 -w=1`

## Implementation update (2026-05-28)

Implemented and validated:

1. **Core contract naming migrated to `propertySelections` semantics.**
   - Shared schema/type names were renamed from `ExtractedMetadata*` to `PropertySelection*` (types, schema exports, and downstream imports/usages).
   - Root file payload naming remains `propertySelections` with unchanged item footprint (`selection.selectionRectangles`, `name`, `propertyID`, etc.).

2. **Entity update v2 now supports core `propertySelections` persistence.**
   - v2 DTO schema + mapper accept/map `propertySelections`.
   - v2 `UpdateEntity` use case persists selections through `filesDS.savePropertySelections(...)`.
   - File ownership check was added before persisting selections on v2 update.

3. **Files data-source contract and implementation were aligned semantically.**
   - `FilesDataSource` now exposes `savePropertySelections`, `deletePropertySelections`, `renamePropertySelections`.
   - MongoDB implementation follows same names and behavior.

4. **Legacy `__extractedMetadata` was removed from Uwazi-internal contracts/routes.**
   - Internal entity/file payload handling now uses `propertySelections` terminology.
   - Any legacy naming should only remain where explicitly required for historical migration context or external ML boundary translation.

5. **Validation**
   - Targeted backend + frontend suites covering mapper/schema/use case/files datasource/IX flows passed after rename + v2 integration.

6. **New test coverage added for introduced functionality gaps**
   - Added `savePropertySelections` behavior tests in:
     - `app/api/core/infrastructure/mongodb/files/specs/MongoFilesDataSource.spec.ts`
       - merge + deduplicate + `deleteSelection` filtering persistence path,
       - no-op when target file does not exist.
   - Added v2 guard-path test in:
     - `app/api/core/application/specs/UpdateEntity.spec.ts`
       - does not persist selections when `propertySelections.fileId` does not belong to the entity.
   - Validation command used:
     - `node --no-experimental-fetch ./node_modules/.bin/jest app/api/core/infrastructure/mongodb/files/specs/MongoFilesDataSource.spec.ts app/api/core/application/specs/UpdateEntity.spec.ts -w=1`

## Behavior assessment (2026-05-28)

Current runtime behavior after implementation:

1. **v2 entity update path (`POST /api/entities` with `v2UpdateEntity`)**
   - If request includes `propertySelections`, v2 persists them via `UpdateEntityUseCase` -> `filesDS.savePropertySelections(...)`.
   - If request omits `propertySelections`, existing file `propertySelections` are left untouched.
   - Persistence is guarded by file ownership check (`filesExistForEntities`) to prevent writing selections to unrelated files.

2. **Merge semantics for selection updates**
   - `savePropertySelections` merges incoming + stored selections by property `name`, preserves non-mentioned items, and removes only entries explicitly marked with `deleteSelection`.
   - This avoids destructive replace-all behavior when clients send partial selection payloads.

3. **Suggestion acceptance / auto-accept paths**
   - Manual `POST /api/suggestions/accept` and auto-accept do not go through v2 `UpdateEntityUseCase`.
   - They update entity values through `suggestions/updateEntities.ts` and update file `propertySelections` through `suggestions/suggestions.ts` (`updatePropertySelections` -> `files.save(file)`).

4. **ML service boundary contract status**
   - Uwazi does not send `__extractedMetadata` to ML service.
   - ML boundary payloads use materials + suggestion DTOs (`xml_file_name`, `label_text`, `label_segments_boxes`, `values`, `entity_name`, etc.).
   - ML service response parsing is based on suggestion DTO schemas, not `__extractedMetadata`.

5. **File update behavior**
   - `files.save` uses partial update semantics; omitting `propertySelections` in a file update does not implicitly delete them.
   - Explicit writes to `propertySelections` can overwrite that field (as expected for direct file writes).

## Naming note

In code and UI, both names appear:
- `Information Extraction` (backend service/class naming)
- `Metadata extraction` (settings/UI labels and feature flag naming)

They refer to the same subsystem in this context.

## Legacy naming transition note

- Historical sections in this document still mention legacy names (`__extractedMetadata`, `files.extractedMetadata`) because they describe what existed at the time of diagnosis.
- Forward-looking design/implementation decisions in this document use the approved naming (`propertySelections` / `files.propertySelections`).
- Interpretation rule for future work: when historical findings mention legacy names, treat them as the predecessor of the approved `propertySelections` contract unless explicitly talking about ML boundary translation.

## Original reported symptoms

Reported from production/users:

1. In IX sidepanel, using **Click to fill** for entity **title** appears to save title on entity, but suggestion denormalization/UI does not reflect update.
2. In IX sidepanel, **Click to fill** for **text** property is reportedly not persisted on entity.
3. For **select** value in UI, value is reportedly saved on entity, but suggestions still do not reflect update.
4. Unclear if regressions are only with v2 flags enabled or systemwide.
5. Additional clarification from product side: issues are observed in **labeling phase**, and users are often blocked there (cannot reliably move forward to later acceptance flow).  
   We still reviewed downstream acceptance stages and found additional potential issues. These are **not secondary in importance**; they are equally relevant risks, but not yet validated in user flow because labeling currently blocks progression.

## What has been investigated already

### A) Frontend IX flows (V2 settings screen)

Reviewed:
- `app/react/V2/Routes/Settings/IX/IXSuggestions.tsx`
- `app/react/V2/Routes/Settings/IX/components/sidepanel/PDFSidepanel.tsx`
- `app/react/V2/Routes/Settings/IX/components/sidepanel/PropertySidepanel.tsx`
- `app/react/V2/Routes/Settings/IX/components/sidepanel/SidepanelForms.tsx`
- `app/react/V2/Routes/Settings/IX/helpers/sidepanelFunctions.ts`
- `app/react/V2/Routes/Settings/IX/components/TableElements.tsx`

Key findings:
- There are two distinct actions called “accept” in UX:
  - **Sidepanel Accept (labeling phase)**: saves entity via `POST /api/entities`; optionally toggles training set.
  - **Table Accept**: sends `POST /api/suggestions/accept`.
- Reported symptoms are coming from the **labeling sidepanel flow** itself (not from table-accept flow).
- Sidepanel save is gated by `dirtyFields.field` and relies on RHF behavior in `SidepanelForms`.
- Text/date/numeric `TextInput` uses `register + watch + controlled value`. This is currently marked as a **loose hypothesis only** for text-not-saved behavior and likely **not** the primary root cause (it reportedly worked before).

### B) Backend suggestion refresh / denormalization path

Reviewed:
- `app/api/suggestions/eventListeners.ts`
- `app/api/suggestions/listeners/afterEntityUpdatedListener.ts`
- `app/api/suggestions/useCases/updateSuggestionsAfterEntityUpdate.ts`
- `app/api/suggestions/suggestions.ts`
- `app/api/suggestions/updateEntities.ts`
- `app/api/suggestions/routes.ts`

Key findings:
- Suggestion refresh (`currentValue`, match state, etc.) after entity updates depends on listeners attached to legacy `applicationEventsBus`.
- Manual `POST /api/suggestions/accept` returns `202` immediately, then processes async; failures can be socket-notified later.
- In `updateEntitiesWithSuggestion`, non-validation errors are logged and swallowed (can produce silent non-persistence from user perspective).

### C) Backend v2 entity update path

Reviewed:
- `app/api/core/application/EntitiesService.ts`
- `app/api/entities/routes.js`
- `app/api/core/infrastructure/express/entity/UpdateEntityController.ts`
- `app/api/core/infrastructure/express/entity/Schemas.ts`
- `app/api/core/infrastructure/express/entity/ExpressEntityMapper.ts`
- `app/api/entities/entities.js`
- `app/api/entities/metadataExtraction/saveSelections.ts`

Key findings:
- `POST /api/entities` routes to v2 update when `v2UpdateEntity` flag is enabled.
- Legacy entity save path emits `EntityUpdatedEvent` on `applicationEventsBus`; IX listener is attached here.
- v2 `EntitiesService.update` emits a different domain event on v2 `eventEmitter`, not on `applicationEventsBus`.
- This creates a likely integration gap: entity updates can succeed while IX suggestion refresh listener never runs.
- For PDF labeling, sidepanel includes `__extractedMetadata` payload; legacy path persists it via `saveSelections`.
- v2 update request schema/mapper does not include `__extractedMetadata`; this is currently the **main suspected regression vector** for labeling selection persistence in v2 mode.

Update (2026-05-26):
- The update-event integration gap above was addressed in `EntitiesService` by adding legacy `EntityUpdatedEvent` emits to v2 update paths while preserving v2 domain event emits.
- Remaining open concern in this area is labeling payload compatibility (`__extractedMetadata`) for v2 update requests.

### D) Test coverage review

Reviewed backend, frontend, Cypress, Playwright IX tests.

Key gaps:
- No strong matrix coverage for v2 flags in IX labeling + refresh flows.
- Assertions often verify partial behavior (e.g., click/notification) without asserting both:
  1) entity persistence and
  2) suggestion denormalization refresh.
- Labeling phase (sidepanel save + property selections persistence + refresh) is under-asserted.

### E) Additional findings: regular entity click-to-fill flow (not only IX settings)

Reviewed:
- `app/react/Metadata/components/MetadataExtractor.tsx`
- `app/react/Viewer/actions/documentActions.js`
- `app/react/Library/actions/saveEntityWithFiles.ts`
- `app/api/entities/entities.js`
- `app/api/entities/metadataExtraction/saveSelections.ts`
- `app/react/Viewer/components/PageSelections.tsx`
- `app/api/services/informationextraction/InformationExtraction.ts`
- `app/api/services/informationextraction/TrainModelForPDF.ts`
- `app/api/services/informationextraction/IXServices.ts`

Findings (to validate further, no design decision yet):
- Legacy/regular viewer metadata workflow also sends `__extractedMetadata` when saving entities (same transport mechanism as IX sidepanel PDF flow).
- Backend persistence happens through `saveSelections` and writes into `files.extractedMetadata` (not entity metadata fields directly).
- In viewer UX, `files.extractedMetadata` drives PDF highlight overlays and clear-selection behavior.
- IX training/inference pipelines consume `files.extractedMetadata` as labeled PDF context (selection text/rectangles), so this data is not only UI decoration.
- `__extractedMetadata` appears to be a legacy transport-level field name, while persisted data is file-level property selections.
- With `v2UpdateEntity` enabled, flows that relied on passing `__extractedMetadata` through `/api/entities` may regress if v2 DTO/mapper path ignores this payload.
- `entities.save` itself does not contain direct IX model/suggestion orchestration logic; IX behavior is triggered via dedicated IX endpoints/use-cases and event/listener flows.  
  (Exception in scope: `entities.save` persists file selections via `saveSelections`, which IX later reads from files.)

## Consolidated problem hypotheses

### High-probability root causes

1. **Event integration mismatch (legacy bus vs v2 emitter)**  
   Sidepanel labeling saves entity but IX suggestion refresh listener may not run under v2 update path.

2. **Labeling payload compatibility gap (`__extractedMetadata`) under v2 update**  
   PDF labeling selection persistence likely depends on legacy save hook and is dropped in v2 path.

3. **Regular viewer click-to-fill compatibility gap under v2 update**  
   Non-IX document metadata editing appears to use the same `__extractedMetadata` transport and may be impacted by the same v2 payload drop.

4. **Text labeling save gate / form state fragility (low-confidence hypothesis)**  
   `dirtyFields.field` + current RHF input wiring could theoretically miss saves, but this is **not prioritized** and may be incorrect.

### Secondary/related causes

4. Async accept route and swallowed errors can mask failures as “saved but not reflected.”
5. UI may revalidate before denormalization update completes in some async paths, exposing stale values (low priority for this backend fix; keep under observation).

## Suggested fix paths

### Path 1: Event bridge for IX refresh (minimal cross-domain coupling)

Introduce an adapter/listener bridge so v2 entity updates trigger IX refresh without pulling IX logic into core domain model.

Implementation concept:
- Keep IX update logic in `app/api/suggestions/*`.
- In infrastructure layer, subscribe to v2 `EntityUpdatedEvent` and call IX use case (`UpdateSuggestionsAfterEntityUpdate`) through an adapter.
- **Hard rule:** NO IX INSIDE CORE domain/application packages.

Why this path:
- Solves “entity saved, suggestions stale” across title/select/text.
- Preserves clean architecture boundary by putting integration in adapter/listener layer.

### Path 2: Handle labeling selections in v2-safe way

For sidepanel PDF labeling:
- add a dedicated IX endpoint/use case for labeling selections persistence and call it explicitly from IX sidepanel save flow.
- then orchestrate entity update through existing v2 entity update paths (without teaching core about `__extractedMetadata`).

Why this path:
- Prevents silent loss of labeled selection context when v2 update is enabled.

### Path 3: Improve failure visibility in suggestion accept/update loops

Avoid silent partial success patterns where persistence fails but UI shows generic success.

Why this path:
- Reduces operator confusion and false positives.

### Path 4 (investigation track): model `__extractedMetadata` as file-annotation semantics

Investigation question (not decided):
- Should we formalize this as a file-annotation contract (persisted in `files.extractedMetadata`) and stop relying on ad-hoc `__extractedMetadata` payload pass-through in entity update DTOs?

Why this path is being explored:
- Same mechanism appears in both regular viewer metadata flow and IX labeling flow.
- Could provide a cleaner boundary: entity update remains entity-focused; file-annotation updates use explicit contract/use case.

### Path 5 (approved naming/intervention track): rename root field to `propertySelections`

Approved naming direction:
- Persisted file property: rename `files.extractedMetadata` -> `files.propertySelections`.
- Keep the stored item footprint identical for now (including `selection.selectionRectangles`, `name`, `propertyID`, `deleteSelection`, `timestamp`, etc.).
- Keep property keying by current property name for now (future enhancement can migrate to stable property ID keying).
- Rename semantics application-wide (not only field keys): domain terms, type names, schema exports, function names, and contract names should use `propertySelection(s)` terminology whenever they refer to this file-root selection data.

Approved transition rule:
- Do not keep/introduce backward compatibility with `__extractedMetadata` in Uwazi contracts and internal code.
- The only allowed mention/use of legacy naming is at the Uwazi->ML service boundary if that external contract still requires it.

Approved intervention shape:
1. Introduce/keep explicit file-selection update contract/use case (backend-owned), using `propertySelections` naming.
2. Update regular viewer and IX labeling callers to this contract naming.
3. Keep entity update contract clean (entity fields only), while allowing orchestration from IX/metadata endpoints.
4. Extend IX internals to read/write renamed file property consistently.
5. Run migration-based rename for persisted data and caller payload naming.
6. Keep ML contract unchanged for now and translate only at boundary if needed.

## Alignment status (important for future agents)

### Already aligned / agreed direction

1. This is likely larger than a single tiny patch.
2. We should keep IX integration out of core domain logic.
3. Preferred approach is integration via adapters/listeners (infrastructure boundary), not embedding IX behavior in core entities/use cases.
4. Labeling phase must be treated as first-class scope (not only table accept path).
5. **Non-negotiable:** NO IX INSIDE CORE, period.
6. v2 entity update path must keep producing legacy-compatible entity update emits/signals consumed by current IX listeners.
   - This is considered a required compatibility part of the solution, not a temporary workaround.
   - It should remain in place while IX is not fully migrated to a v2-native event contract.
   - **Implementation status (2026-05-26): done for `EntitiesService.update` and `EntitiesService.updateMultiple`.**
7. Naming decision is approved:
   - `files.extractedMetadata` is renamed to `files.propertySelections`.
   - Root rename only for now: keep item payload/geometry shape intact (`selection.selectionRectangles` stays as-is).
8. Property keying remains by property name in this phase; move to property ID can be done later.
9. No backward compatibility for `__extractedMetadata` in Uwazi internal/API contracts.
   - Only ML boundary translation is allowed if external ML contract still uses legacy naming.

### Under discussion / not yet aligned

1. Exact mechanism for v2→IX bridge:
   - bridge listener in app process,
   - bridge in worker context,
   - or explicit post-save invocation from IX-specific endpoint.
2. Whether `POST /api/suggestions/accept` should become synchronous/transactional vs remain async with stronger error reporting.
3. Final API shape for dedicated IX labeling persistence endpoint and how it orchestrates v2 entity update.
4. Scope and sequencing (single release hardening vs staged rollout).
5. Exact runtime wiring for v2 event bridge in multi-instance deployments (app instances + queue workers).
6. Whether to treat current file-selection behavior as IX-only concern or shared file-annotation concern used by both IX and regular viewer workflows.
7. Whether to move property keying from property name to stable property ID in a later phase.
8. Whether ML service naming is translated at boundary or updated end-to-end to new contract.

## Recommended implementation sequence (for future work)

1. ✅ Implement the already-decided compatibility step:
   - ensure v2 entity update path emits legacy-compatible entity update events/signals for existing IX listeners.
   - Status: completed on 2026-05-26 (`EntitiesService.update` + `EntitiesService.updateMultiple`).
2. Add observability first (temporary targeted logs/metrics) around:
   - sidepanel entity save path (v1 vs v2),
   - IX refresh listener execution,
   - property selections persistence.
3. Implement v2-safe labeling selection persistence path.
4. Add tests for full matrix:
   - title/text/select,
   - sidepanel labeling and table accept,
   - v2 flags ON/OFF,
   - persistence + suggestion refresh assertions.
5. Add targeted regression tests for regular viewer click-to-fill + save path under v2 flags, verifying file-level property selections persistence.
6. Execute end-to-end rename rollout tasks:
   - migration scripts to rename persisted file root field `extractedMetadata` -> `propertySelections`,
   - caller migration (viewer + IX) to `propertySelections`,
   - data migration/check script,
   - no compatibility alias for `__extractedMetadata` in Uwazi contracts,
   - ML boundary translation only if external ML contract still requires legacy naming.

## Follow-up checklist (post-implementation)

1. **Run persisted-data migration (mandatory)**
   - Create and run migration to rename stored file field `extractedMetadata` -> `propertySelections`.
   - Include verification script/report:
     - count files still containing `extractedMetadata`,
     - count files containing `propertySelections`,
     - sample diff/spot-check.
   - Ensure migrations are deployment-safe and decoupled from release rollout.

2. **Add regression tests for accept/auto-accept data safety**
   - Assert manual accept updates `propertySelections` correctly for text/select-like properties.
   - Assert auto-accept updates `propertySelections` correctly and does not regress existing values unexpectedly.

3. **Strengthen no-destructive-update guarantees**
   - Add explicit test that v2 update with no `propertySelections` leaves existing file selections intact.
   - Add explicit test that partial `propertySelections` payload does not remove unmentioned properties unless `deleteSelection` is set.

4. **Review/align file-list contract in v2 entity update**
   - Confirm client behavior always sends intended `files` list.
   - Document and/or protect against unintended file removal side effects from incomplete `files` payloads.

5. **Keep ML boundary contract explicit**
   - Keep current ML payload DTO unchanged unless external service versioning is coordinated.
   - If ML naming changes later, implement translation only at boundary adapters.

## After IX is fully compatible with V2 (explicitly out of current scope)

The following is intentionally **not** part of this development scope, but should be treated as a high-priority architectural follow-up once IX is fully stable on v2 paths:

1. **Migrate suggestion acceptance write paths to v2-owned application contracts**
   - Current `Suggestions.accept` still writes through legacy-oriented paths (`updateEntitiesWithSuggestion` + direct `files.save(...)` update flow).
   - Target direction is to use v2 application/use-case boundaries for both entity value updates and file `propertySelections` updates.

2. **First, migrate file selection writes in suggestions to v2 files data source contract**
   - Replace direct file-model save behavior with v2 files DS behavior (`savePropertySelections`) to consolidate merge/delete semantics in one place.
   - Keep behavior parity with current acceptance and auto-accept flows.

3. **Then, migrate entity updates in suggestions to a v2-safe use case**
   - Do not directly force current suggestion updates through existing `UpdateEntityUseCase` without contract review, because that use case currently manages file lists and may remove files when payloads are incomplete.
   - Prefer either:
     - a dedicated v2 suggestion-accept use case, or
     - a hardening/refactor of v2 update contracts that supports metadata-only updates safely.

4. **Why to watch this closely**
   - This area is a likely source of regressions if migrated partially.
   - A staged migration (files path first, then entity path) is recommended to avoid accidental data loss and keep acceptance/auto-accept behavior stable.

5. **Scope guard**
   - These items are documented as **future work** and should not block the current propertySelections rollout/migration.

## Explicit constraints for future agents

- Do not move IX logic into core domain models.
- NO IX INSIDE CORE. No exceptions.
- Do not assume unresolved items are approved; check “Under discussion” section above.
- Preserve backward compatibility for tenants with mixed feature-flag states.
- Keep changes reviewable by isolating:
  - integration bridge,
  - labeling payload handling,
  - tests.

## Runtime topology note: legacy workers vs JobHandlers (for design discussions)

This section summarizes how events/jobs run today, to reason about IX + v2 entities in distributed deployments.

### Process types currently present

1. **Main app instance** (`app/server.js`)
   - Registers legacy `applicationEventsBus` listeners via `registerEventListeners(applicationEventsBus)`.
   - In non-cluster mode it also starts queue processing in-process with `setupQueueWorker({ standAloneProcess: false })`.

2. **Standalone queue worker process** (`app/queueWorker.ts` -> `setupQueueWorker({ standAloneProcess: true })`)
   - Runs queue consumers (`QueueWorker`) and registers job classes from `app/queueRegistry.ts`.
   - In standalone mode it also registers legacy `applicationEventsBus` listeners.

3. **External services worker** (`app/worker.ts`)
   - Runs OCR/IX/PDF segmentation/etc service loops.
   - Not the same as queue-job consumer path.

### Legacy event bus behavior

- `applicationEventsBus` is in-memory per process (`new EventsBus()`), not distributed.
- Emit/listen happens only inside the same process unless additional shared infra is explicitly used.

### v2 eventEmitter behavior

- v2 `EntityUpdatedEvent` is emitted through `EventEmitterFactory`/`AsyncEventEmitter`.
- `AsyncEventEmitter` dispatches listener jobs through the queue (`jobsDispatcher.dispatchMany(...)`), not by in-process callback execution.
- Listener registration is done through `EventEmitterFactory.registry.register(...)` side-effect imports; job registration happens in `queueRegistry.ts` (`ListenerClass.asJob()` registrations).

### Implication for this IX issue

- If v2 entity update runs in a queue worker context, subsequent v2-listener logic can run **only if**:
  1) listener classes are registered in the emitter registry in that runtime, and
  2) corresponding listener jobs are registered/executable by queue workers.
- If no IX bridge listener exists for v2 entity events, then v2 emit will not trigger IX refresh logic.
- Therefore IX + entities v2 needs explicit runtime wiring for that bridge (and not assumptions about automatic cross-talk).

## Quick reference files

- IX UI:
  - `app/react/V2/Routes/Settings/IX/IXSuggestions.tsx`
  - `app/react/V2/Routes/Settings/IX/components/sidepanel/PDFSidepanel.tsx`
  - `app/react/V2/Routes/Settings/IX/components/sidepanel/PropertySidepanel.tsx`
  - `app/react/V2/Routes/Settings/IX/components/sidepanel/SidepanelForms.tsx`
  - `app/react/V2/Routes/Settings/IX/helpers/sidepanelFunctions.ts`
- Suggestions backend:
  - `app/api/suggestions/eventListeners.ts`
  - `app/api/suggestions/listeners/afterEntityUpdatedListener.ts`
  - `app/api/suggestions/suggestions.ts`
  - `app/api/suggestions/updateEntities.ts`
  - `app/api/suggestions/routes.ts`
- Entity backend:
  - `app/api/entities/routes.js`
  - `app/api/entities/entities.js`
  - `app/api/entities/metadataExtraction/saveSelections.ts`
  - `app/api/core/application/EntitiesService.ts`
  - `app/api/core/infrastructure/express/entity/Schemas.ts`
  - `app/api/core/infrastructure/express/entity/ExpressEntityMapper.ts`

