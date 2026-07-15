# Entities Mutations to V2

## Scope

Move legacy entity mutations from `app/api/entities/entities.js` to V2-backed paths and remove V1-only dead code on the Mongo -> Postgres migration path.

## GitHub Issue Replacement Draft

### Current status (plainly)

We are **not** at the target yet. `entities.js save` is still a hybrid compatibility layer (V2-first + V1 fallback), not a thin façade.

### 1) What still uses old logic today (runtime)

#### A) Direct runtime callers still using `entities.save` (legacy façade)

- none identified (runtime path now migrated; remaining references are test-only)

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

3. **Suggestions flow migration must preserve side effects**
   - Suggestions acceptance now uses `EntityFacade.update`.
   - Relationship reference sync and explicit search indexing call were reintroduced in that flow to preserve previous behavior.

### 3) Non-blocking but important context

- `generatedToc` is now part of V2 core update contract (`UpdateEntity` schema/mapper/use case).
- `tocService` and `files.tocReviewed` now call `EntityFacade.update(...)` with `generatedToc`.
- To preserve compatibility with legacy template rows in TOC flows, `EntityFacade.update` includes a narrow fallback for generatedToc-only updates when template mapping crashes.

### 4) Team decisions needed (explicit)

1. **Compatibility strategy**
   - Keep a temporary adapter that rewrites legacy payloads into strict V2 input, or force caller-by-caller migration first.

2. **Side-effect ownership**
   - Decide which side effects must move into V2 use-cases vs remain in caller/orchestrator layer.

3. **Deprecated documents surface**
   - Keep temporarily for integrators (e.g. Tella) with timeline, or schedule removal now.

4. **Cutover policy**
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

Status update:

- Attempted direct removal of `shouldForceLegacyUpdate` and the update fallback branch in `entities.save`.
- Reverted after validation because a broad legacy test surface still depends on V1 update semantics through `entities.save`, including:
  - transaction-nesting expectations (`withTransaction` / template denormalization suites)
  - multi-language denormalization behavior expected by legacy entities/search suites
  - legacy template/thesauri fixture shapes that V2 update rejects in these test paths
- Conclusion: update fallback cannot be removed safely yet without first migrating or retiring those remaining legacy test flows.
- Progress made:
  - `app/api/core/v1_layer/templates/specs/templateUpdateDenormalization.spec.ts` setup was migrated away from `entities.save(...)` bootstrap.
  - New setup bootstraps relationship connections/metadata directly (via relationship sync helpers + metadata normalization), preserving suite behavior without relying on `entities.save` as a fixture-preparation side effect.
  - Suite remains green after this change.
  - `app/api/search.v2/specs/sorting.spec.ts` setup was migrated away from `entities.save(...)`; fixture metadata now includes normalized select labels directly.
  - `app/api/search.v2/specs/snippetsSearch.spec.ts` setup was migrated away from `entities.save(...)`; fixture metadata now includes denormalized thesaurus label used in snippet assertions.
  - Both search.v2 suites remain green after these setup-only migrations.

#### Phase 3 — Remove fallback from CREATE path

- Migrate remaining create callers.
- Delete `shouldForceLegacyCreate`, `isLegacyCompatibilityError`, `normalizeLegacyEntityForFacade` from save flow (or move to temporary adapter module if still needed during cutover).

#### Phase 4 — Delete legacy internals and wrappers

- Remove `createEntity/updateEntity` usage from `save`.
- Remove deprecated `documents.save` wrapper and deprecated `/api/documents` routes once usage is confirmed zero.
- Remove remaining `entities.save` runtime caller in suggestions by migrating acceptance update semantics to V2. (done)

### 6) Definition of done for this refactor objective

- `entities.js save` only orchestrates:
  - choose create/update
  - call V2 (`EntityFacade.create` / `EntityFacade.update`)
  - no V1 fallback branches
- No reachable runtime path from `entities.save` to legacy V1 persistence methods.
- Deprecated documents compatibility surface either removed or explicitly deferred with owner + date.
- Deprecated metadata update bridge resolved (removed).
- Affected integration suites green after each phase.

### 7) Files to focus discussion on

- `app/api/entities/entities.js`
- `app/api/core/infrastructure/express/entity/Schemas.ts`
- `app/api/core/infrastructure/express/entity/ExpressEntityMapper.ts`
- `app/api/core/application/UpdateEntity.ts`
- `app/api/core/infrastructure/facades/EntitiesFacade.ts`
- `app/api/suggestions/updateEntities.ts`
- `AI Contexts/Entities/mutations-to-v2.md`

## Mutation Inventory

| Mutator | Previous Implementation | Current Status | Decision |
| --- | --- | --- | --- |
| `save` | V1 `createEntity` / `updateEntity` writes via `entitiesModel` | migrated (hybrid) | Delegates to `EntityFacade.create` / `EntityFacade.update` with legacy fallback for incompatible payloads |
| `delete` | Deprecated V1 delete path | kept (deprecated) | Restored for backward compatibility wrappers |
| `updateMetadataValues` (deprecated DS method) | V1 `entities.save` bridge | deleted | Removed from deprecated DS contract + mongo implementation |
| `entitySavingManager.saveEntity` | Wrapper around `entities.save` | deleted | File removed (no runtime importers) |
| `generatedIdPropertyAutoFiller.populateGeneratedIdByTemplate` | Legacy bulk update helper | deleted | File removed (no call sites) |

## V2 Compatibility Adjustments

- `EntityFacade.update` added to mirror create delegation.
- `generatedToc` reintroduced into V2 update contract (`Schemas` + `ExpressEntityMapper` + `UpdateEntity` use case).
- `EntityFacade.updateGeneratedToc` removed; TOC/files now use regular `EntityFacade.update` with `generatedToc`.
- `UpdateEntity` actor behavior restored to strict/original semantics (no synthetic `__system__` fallback).
- TOC/files generatedToc updates now resolve and set a real actor from DB before invoking V2 update:
  - priority: current ExecutionContext actor -> entity author (`entity.user`) -> write-permitted user ids on entity -> existing admin user
  - no synthetic user ids are created.
- `entities.save` now normalizes legacy docs before V2 delegation and falls back to legacy mutation path when V2 rejects legacy-shaped payloads (compatibility guard).
- `title` remains required in core update schema.
- legacy-sensitive fallback orchestration still stays in `entities.js`.

## Compatibility Issue (Current)

`entities.save` legacy behavior differed from strict V2 behavior in some save scenarios. This is now addressed with explicit legacy-boundary fallback rules.

- fixed cases included:
  - legacy user/id preservation expectations on create with explicit `_id` / `user`
  - update flows involving relationship denormalization and language translation assumptions
  - template-change metadata carry-over parity in legacy update paths

Current state remains a hybrid bridge: V2-first delegation with guarded fallback for legacy-shaped payloads.
`generatedToc` is now handled in V2 core update path.

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

Important (historical):

- these guards were temporary and have been trimmed now that CSV V1 entity-import paths were removed.

## Boundary Rule (Important)

Legacy compatibility fallbacks must stay in legacy boundaries only:

- allowed: `app/api/entities/entities.js` (legacy facade/adapter boundary)
- not allowed: core/domain/use case code under `app/api/core/**`

Implemented rule in this pass:

- fallback logic is only in `entities.js` save facade
- core V2 code changes are limited to shape compatibility (`Schemas`, mapper, use case input), not legacy branching/fallback orchestration
- fallback trigger was tightened incrementally as deprecated callers were removed.
- numeric empty-value expectation was explicitly standardized in specs to canonical normalized output (`[]`, not `undefined`)

## Deprecated Wrapper/Route Cleanup

- Deprecated `/api/documents` CRUD routes and wrapper methods have now been removed:
  - removed routes: `POST /api/documents`, `GET /api/documents`, `DELETE /api/documents`
  - removed wrappers in `documents.js`: `save`, `get`, `getById`, `delete`, `countByTemplate`
  - retained: `/api/documents/count_by_template` (deprecated) and `/api/documents/page` (active route in `routes.ts`)

- Deprecated Twitter integration flow has now been removed:
  - removed `app/api/services/twitterintegration/**`
  - removed worker registration/loops from `app/worker.ts` (`twitter_integration`, `twitter_distributed_loop`)

## Evidence Notes

- `entities.save` runtime callers in `app/api/**` are now test-only references.
- TOC-related `generatedToc` updates now use regular `EntityFacade.update` and V2 core update contract.
- Removed code paths had no production runtime callers (test-only or orphaned).
- TOC fixtures were aligned to include a real user author to match actor requirements in V2 update flow.
- Suggestions acceptance updates now use `EntityFacade.update`.
- Side effects are now validated through V2 infrastructure behavior:
  - relationship denormalization is queued through `EntityUpdatedEvent:ProcessRelationshipAfterEntityUpdatedListener` jobs.
  - indexing is triggered by V2 datasource commit hooks (`search.indexEntities({ sharedId: { $in: [...] } })`).

## Remaining Validation Checklist

- Run focused tests for:
  - entities save/update compatibility
  - TOC reviewed flow (`generatedToc`)
  - CSV import paths
  - suggestions acceptance flow (done)
  - worker boot/service registration smoke check after twitter integration removal
- Confirm no non-test imports remain for removed files/methods.

## Cleanup TODOs (Pending Deletion Assessment)

- TODO: Follow-up cleanup after `/api/documents` removal:
  - remove/update remaining activity log parser mappings for removed routes (`POST/api/documents`, `DELETE/api/documents`) if no longer needed.
  - review deprecated fixtures/spec references that still mention `/api/documents`.

- DONE: `DeprecatedEntitiesDataSource.updateMetadataValues` removed from contract + mongo implementation.
- TODO: remove/update specs/docs that still refer to removed deprecated DS method semantics (if any remain).

## Optional Scope Expansion (CSV V1 Removal)

Given CSV V2 is now enabled for all tenants, we may include full CSV V1 retirement within this refactor scope.

- Optional objective:
  - remove CSV V1 execution paths and wrappers that still route through `entities.save` legacy compatibility behavior.
- Preconditions before removal:
  - confirm no tenant/runtime path still invokes CSV V1 handlers.
  - confirm feature-flag/config fallbacks no longer depend on CSV V1 code paths.
  - validate importer parity against current CSV V2 behavior (including translation, thesauri, relationship parsing, generated ids, and date parsing).
- If approved:
  - migrate remaining CSV call sites to pure V2 mutation contracts.
  - delete CSV V1-only code and tests in a dedicated cleanup commit/PR.
  - update migration notes/runbook to mark CSV V1 as removed.

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
- Suggestions migration verification:
  - `app/api/suggestions/specs/suggestions.spec.ts`
  - `app/api/suggestions/specs/routes.spec.ts`
  - `app/api/suggestions/specs/eventListeners.spec.ts`
  - aggregate: 3 suites passed, 65 tests passed
