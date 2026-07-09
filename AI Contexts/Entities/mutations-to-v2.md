# Entities Mutations to V2

## Scope

Move legacy entity mutations from `app/api/entities/entities.js` to V2-backed paths and remove V1-only dead code on the Mongo -> Postgres migration path.

## GitHub Issue Replacement Draft

### Current status (plainly)

We are **not** at the target yet. `entities.js save` is still a hybrid compatibility layer (V2-first + V1 fallback), not a thin façade.

### 1) What still uses old logic today (runtime)

#### A) Direct runtime callers still using `entities.save` (legacy façade)

- `app/api/documents/documents.js`
- `app/api/csv/importEntity.ts`
- `app/api/csv/typeParsers/relationship.ts`
- `app/api/suggestions/updateEntities.ts`
- `app/api/services/twitterintegration/TwitterIntegration.ts`
- `app/api/entities.v2/database/MongoDeprecatedEntitiesDataSource.ts` (`updateMetadataValues`)

#### B) Legacy fallback path still inside `entities.js save`

Inside `app/api/entities/entities.js`, `save` still contains:

- legacy coercion/normalization (`normalizeLegacyEntityForFacade`)
- forced-legacy conditions (`shouldForceLegacyCreate`, `shouldForceLegacyUpdate`)
- compatibility-error fallback (`isLegacyCompatibilityError`)
- fallback writes via old internals (`createEntity` / `updateEntity`)

So even when routed to V2, the function can still drop to old V1 persistence logic.

#### C) V1-only persistence still callable in entities module

- `createEntity(...)`
- `updateEntity(...)`
- `updateMetdataFromRelationships(...)` internally calls `updateEntity(...)`

This means old write paths are still alive and reachable.

### 2) Key blockers preventing "save = V2 only"

1. **Legacy payload shape mismatch**
   - Existing callers still pass legacy-shaped docs (`_id`, legacy user/doc fields, mixed metadata shape, etc.).
   - V2 contracts are stricter; current bridge/fallback absorbs this mismatch.

2. **Side effects currently coupled to legacy save**
   - Relationship denormalization/update (`relationships.saveEntityBasedReferences`)
   - Search indexing calls
   - includeDocuments hydration behavior after write
   - property selections handling
   - These are intertwined with current `save` flow, so removing fallback requires explicit relocation/ownership decisions.

3. **Deprecated data source bridge still tied to `entities.save`**
   - `MongoDeprecatedEntitiesDataSource.updateMetadataValues` explicitly uses V1 save path (with a comment noting it as a hack).
   - This is a core blocker for fully removing legacy write behavior.

4. **Deprecated Documents compatibility surface still live**
   - `POST/GET/DELETE /api/documents` deprecated routes still active.
   - `documents.save` is still a wrapper over `entities.save`.
   - Activity log parsing/mapping still includes `/api/documents` route keys.

5. **Contract still present for deprecated metadata update**
   - `DeprecatedEntitiesDataSource.updateMetadataValues` remains in interface + implementation.
   - Even if static call sites are scarce, contract presence keeps legacy behavior supported.

### 3) Non-blocking but important context

- `generatedToc` now has a dedicated wrapper (`EntityFacade.updateGeneratedToc`) and no longer relies on forced legacy `save` fallback.
- This is good progress, but it does **not** solve the broader `entities.save` legacy fallback problem.

### 4) Team decisions needed (explicit)

1. **Compatibility strategy**
   - Keep a temporary adapter that rewrites legacy payloads into strict V2 input, or force caller-by-caller migration first.

2. **Side-effect ownership**
   - Decide which side effects must move into V2 use-cases vs remain in caller/orchestrator layer.

3. **Deprecated documents surface**
   - Keep temporarily for integrators (e.g. Tella) with timeline, or schedule removal now.

4. **DeprecatedEntitiesDataSource**
   - Remove `updateMetadataValues` now (if truly unused), or replace with a V2-equivalent operation first.

5. **Cutover policy**
   - Big-bang removal of fallback, or phased (update path first, then create path).

### 5) Proposed execution plan (recommended)

#### Phase 1 — Safety inventory + hard evidence

- Confirm real runtime usage of `/api/documents` (logs/integration owners).
- Confirm real runtime usage of `updateMetadataValues` (not just static refs).
- Lock a list of must-preserve behaviors per `entities.save` caller.

#### Phase 2 — Remove fallback from UPDATE path first

- Migrate update-oriented callers to V2-compatible payloads.
- Remove `shouldForceLegacyUpdate` + update fallback branch.
- Keep create fallback temporarily if needed.

#### Phase 3 — Remove fallback from CREATE path

- Migrate remaining create callers.
- Delete `shouldForceLegacyCreate`, `isLegacyCompatibilityError`, `normalizeLegacyEntityForFacade` from save flow (or move to temporary adapter module if still needed during cutover).

#### Phase 4 — Delete legacy internals and wrappers

- Remove `createEntity/updateEntity` usage from `save`.
- Remove deprecated `documents.save` wrapper and deprecated `/api/documents` routes once usage is confirmed zero.
- Remove `DeprecatedEntitiesDataSource.updateMetadataValues` if replaced/unused.

### 6) Definition of done for this refactor objective

- `entities.js save` only orchestrates:
  - choose create/update
  - call V2 (`EntityFacade.create` / `EntityFacade.update`)
  - no V1 fallback branches
- No reachable runtime path from `entities.save` to legacy V1 persistence methods.
- Deprecated documents compatibility surface either removed or explicitly deferred with owner + date.
- Deprecated metadata update bridge resolved (removed or replaced).
- Affected integration suites green after each phase.

### 7) Files to focus discussion on

- `app/api/entities/entities.js`
- `app/api/entities.v2/database/MongoDeprecatedEntitiesDataSource.ts`
- `app/api/entities.v2/contracts/DeprecatedEntitiesDataSource.ts`
- `app/api/documents/documents.js`
- `app/api/documents/deprecatedRoutes.js`
- `app/api/csv/importEntity.ts`
- `app/api/csv/typeParsers/relationship.ts`
- `app/api/suggestions/updateEntities.ts`
- `app/api/services/twitterintegration/TwitterIntegration.ts`
- `AI Contexts/Entities/mutations-to-v2.md`

## Mutation Inventory

| Mutator | Previous Implementation | Current Status | Decision |
| --- | --- | --- | --- |
| `save` | V1 `createEntity` / `updateEntity` writes via `entitiesModel` | migrated (hybrid) | Delegates to `EntityFacade.create` / `EntityFacade.update` with legacy fallback for incompatible payloads |
| `delete` | Deprecated V1 delete path | kept (deprecated) | Restored for backward compatibility wrappers |
| `updateMetadataValues` (deprecated DS method) | V1 `entities.save` bridge | kept (deprecated) | Restored for compatibility safety; no static callers found |
| `entitySavingManager.saveEntity` | Wrapper around `entities.save` | deleted | File removed (no runtime importers) |
| `generatedIdPropertyAutoFiller.populateGeneratedIdByTemplate` | Legacy bulk update helper | deleted | File removed (no call sites) |

## V2 Compatibility Adjustments

- `EntityFacade.update` added to mirror create delegation.
- `EntityFacade.updateGeneratedToc` added as a dedicated V2-side mutation wrapper for TOC status writes (`generatedToc`) without moving legacy fallback logic into core use cases.
- `entities.save` now normalizes legacy docs before V2 delegation and falls back to legacy mutation path when V2 rejects legacy-shaped payloads (compatibility guard).
- Core contract rollback applied:
  - `title` remains required in core update schema.
  - `generatedToc` handling was removed from core mapper/use case changes.
  - legacy-sensitive behavior stays only in `entities.js`.

## Compatibility Issue (Current)

`entities.save` legacy behavior differed from strict V2 behavior in some save scenarios. This is now addressed with explicit legacy-boundary fallback rules.

- fixed cases included:
  - legacy user/id preservation expectations on create with explicit `_id` / `user`
  - update flows involving relationship denormalization and language translation assumptions
  - template-change metadata carry-over parity in legacy update paths

Current state remains a hybrid bridge: V2-first delegation with guarded fallback for legacy-shaped payloads.
`generatedToc` no longer uses the legacy-forced fallback branch in `entities.save`.

### Additional Compatibility Guardrails Added (CSV/template legacy shapes)

During validation we hit CSV import failures caused by legacy template shapes that current V2 template mapping rejects in `CreateEntity` path. To preserve migration safety, `entities.save` compatibility fallback detection was extended for these error families:

- unknown property type:
  - `The Property type "..." was not handled`
- missing common properties in template:
  - `TemplateWithMissingCommonProperty`
  - `Template has the missing Property`
- legacy template shape causing mapper crash:
  - `Cannot read properties of undefined (reading 'map')`

Outcome:

- affected CSV suite recovered:
  - `app/api/csv/specs/csvLoader.spec.js` passed (37/37)

Important:

- this is explicitly a **temporary migration guardrail** to keep V2-first behavior without breaking legacy data shapes.
- this is **not** the end-state architecture; final objective remains removing fallback logic and migrating callers/templates to fully V2-compatible contracts.

## Boundary Rule (Important)

Legacy compatibility fallbacks must stay in legacy boundaries only:

- allowed: `app/api/entities/entities.js` (legacy facade/adapter boundary)
- not allowed: core/domain/use case code under `app/api/core/**`

Implemented rule in this pass:

- fallback logic is only in `entities.js` save facade
- core V2 code changes are limited to shape compatibility (`Schemas`, mapper, use case input), not legacy branching/fallback orchestration
- fallback trigger was tightened for known legacy-sensitive payloads and legacy compatibility errors, without introducing fallback logic inside `app/api/core/**`
- numeric empty-value expectation was explicitly standardized in specs to canonical normalized output (`[]`, not `undefined`)

## Deprecated Wrapper/Route Cleanup

- Deprecated wrappers/routes were initially removed, then restored for backward compatibility:
  - `POST /api/documents` restored.
  - `documents.save` and `documents.delete` restored.

## Evidence Notes

- `entities.save` production callers (CSV, IX, TOC, Twitter, files) remain and now pass through V2 facade.
- TOC-related `generatedToc` updates now use `EntityFacade.updateGeneratedToc` directly from `tocService` and `files.tocReviewed`.
- Removed code paths had no production runtime callers (test-only or orphaned).

## Remaining Validation Checklist

- Run focused tests for:
  - entities save/update compatibility
  - TOC reviewed flow (`generatedToc`)
  - CSV import paths
  - suggestions acceptance flow
  - deprecated documents routes affected specs
- Confirm no non-test imports remain for removed files/methods.

## Cleanup TODOs (Pending Deletion Assessment)

- TODO: Validate whether deprecated `POST /api/documents` is used by any external integrator (e.g. Tella) before removal.
  - Check API access logs/activity logs for `POST/api/documents`.
  - Confirm with product/integrations owners whether third-party clients still use it.
  - If unused, remove route + wrapper and adjust related activitylog parsing.

- TODO: Validate whether `DeprecatedEntitiesDataSource.updateMetadataValues` is required in any runtime flow.
  - Confirm no dynamic invocation paths (jobs, plugin-style loading, external scripts) rely on it.
  - Re-check v1 and v2 relationships/denormalization paths after current refactor lands.
  - If truly unused, remove from contract + implementation in a dedicated cleanup step.

## Validation Run Log

- Passed:
  - `app/api/core/infrastructure/express/entity/specs/Schemas.spec.ts`
  - `app/api/core/infrastructure/express/entity/specs/ExpressEntityMapper.spec.ts`
  - `app/api/documents/specs/deprecatedRoutes.spec.js`
  - `app/api/documents/specs/documents.spec.ts`
- Postgres confirmed (after local container startup):
  - `app/api/core/application/specs/UpdateEntity.spec.ts` passed (Mongo + Postgres matrix)
  - `app/api/core/infrastructure/postgresql/common/specs/PostgresDataSource.spec.ts` passed
- Broader affected rerun:
  - final affected suites run passed:
    - `app/api/core/infrastructure/express/entity/specs/Schemas.spec.ts`
    - `app/api/core/infrastructure/express/entity/specs/ExpressEntityMapper.spec.ts`
    - `app/api/documents/specs/deprecatedRoutes.spec.js`
    - `app/api/documents/specs/documents.spec.ts`
    - `app/api/core/application/specs/UpdateEntity.spec.ts`
    - `app/api/core/infrastructure/postgresql/common/specs/PostgresDataSource.spec.ts`
    - `app/api/entities/specs/entities.spec.js`
    - `app/api/entities.v2/database/specs/MongoDeprecatedEntitiesDataSource.spec.ts`
    - `app/api/toc_generation/specs/tocService.spec.ts`
    - `app/api/files/specs/routes.spec.ts`
  - aggregate: 9 suites passed, 229 tests passed
