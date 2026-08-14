# Translations V2 Hex Migration Context

## Objective

Move translations backend ownership into `app/api/core` hexagonal architecture so the module can later move to Postgres with a **single** by-item store — without forcing a frontend rewrite in this phase.

Keep:

- Mongo collection **`translationsV2`** (by-item) as the only runtime store
- Public HTTP contracts for `/api/translations*` (legacy locale DTO shape) identical
- Public HTTP contracts for `/api/v2/translations` (by-item)

Replace:

- Runtime dependence on `app/api/i18n/translations.ts` façade and `app/api/i18n.v2` as the “home” of the module
- `Legacy*TranslationService` bridges that call the façade
- Application-layer **Upsert** as a paradigm (create/update split instead)

**Postgres phase (later):** to be documented in [`translations-postgres.md`](./translations-postgres.md) (not written yet). Do not implement Postgres in this phase.

**Related prior work (principles only):** [`../Relationship Types/relationship-types-v2-migration.md`](../Relationship%20Types/relationship-types-v2-migration.md), [`../Relationship Types/relationship-types-postgres.md`](../Relationship%20Types/relationship-types-postgres.md).

---

## Scope

- Backend (`app/api`), with a documented follow-up for FE cutover (Phase 1b) — not required to finish Phase 1.
- Reimplement legacy `/api/translations*` as **core V2 hex** controllers (same path/auth/I/O).
- Keep `/api/v2/translations` under core as the by-item API.
- Migrate all internal writers off `#api/i18n/translations` onto core mutation use cases / ports.
- Mutations = UseCases; GETs = thin controller → QueryService/DAO (team direction).
- No application `Upsert*UseCase`. Controllers may branch create vs update.

### Explicit non-goals (this phase)

- Postgres schema, feature flag, sync handler branch, Mongo→PG data copy
- Rewriting Settings Translations UI / `translationsAtom` / sockets to by-item-only
- Removing mammoth HTTP or `translationsChange` socket
- Fixing `GetRelationshipTypesUseCase` (separate team debt; do not copy that pattern)
- Entity per-language metadata (`EntityTranslation`) or automatic-translation integrations

---

## Transferable principles (from Relationship Types work)

These are architecture rules to reuse — not RelationshipType-specific detail:

| Principle                                  | Apply to translations                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Stable external contract, internal rewrite | Mammoth + by-item HTTP stay; ownership moves to core                      |
| Hex layers in `app/api/core`               | Domain → application (use cases + contracts) → infrastructure             |
| Explicit mutations; no application upsert  | Create / Update / Delete (+ ImportPredefined orchestration)               |
| Contract-driven side effects               | Templates/thesaurus/RT/settings call translation ports/use cases          |
| Facades optional                           | Prefer controllers → factories/use cases (or thin query services for GET) |
| Integration-first tests                    | Prefer DB assertions; auth middleware mock OK at route boundary           |
| Postgres later, separate doc               | One store only; no dual-write; flag/copy/cutover when that phase starts   |
| Avoid incomplete peer patterns             | Do not copy Entities partial cutover; do not copy RT Get*UseCase          |

---

## Current diagnosis

### Naming (three different “v2”s)

| Name                     | Meaning                                                    |
| ------------------------ | ---------------------------------------------------------- |
| **translations v2 (DB)** | By-item Mongo collection `translationsV2` (migration 144+) |
| **`app/api/i18n.v2`**    | Proto-hexagonal module (contract, DS, services, models)    |
| **Core V2 hex**          | Target home under `app/api/core` (this migration)          |

Unrelated: `EntityTranslation`, `externalIntegrations.v2/automaticTranslation`.

### Storage (already by-item)

- Collection: `translationsV2`
- Document: `{ _id, language, key, value, context: { type, label, id } }`
- Unique index: `{ language, key, context.id }`
- Legacy mammoth collection `translations` is **not** the runtime store (blank-state/sync leftovers may still mention it)
- Sync namespace in active use: **`translationsV2`**

### Code layers today

```
HTTP /api/translations*          HTTP /api/v2/translations
        │                                 │
        ▼                                 ▼
 app/api/i18n/translations.ts ◄──┐   translations.v2StructureSave
        │                        │
        ▼                        ▼
 app/api/i18n/v2_support.ts ─── Create / Upsert / Delete / Get services
        │
        ▼
 TranslationsDataSource → MongoTranslationsDataSource → translationsV2
```

- **Façade** (`i18n/translations.ts`): mammoth API (`get/save/addContext/updateContext/deleteContext/updateEntries/addLanguage/removeLanguage/importPredefined/...`)
- **Bridge** (`v2_support.ts`): reshape mammoth ↔ by-item; registers `models.translationsV2` for sync
- **Proto-hex** (`i18n.v2`): DS contract, Mongo DS, cache, sync DS, services including `UpsertTranslationsService`

### Public HTTP (must stay stable for Phase 1)

| Method      | Path                             | Shape                                        | Auth   |
| ----------- | -------------------------------- | -------------------------------------------- | ------ |
| GET         | `/api/translations`              | Mammoth `{ rows: [{ locale, contexts[] }] }` | public |
| POST        | `/api/translations`              | Mammoth locale doc                           | admin  |
| POST        | `/api/translations/import`       | multipart + context                          | admin  |
| POST        | `/api/translations/populate`     | `{ locale }`                                 | admin  |
| POST        | `/api/translations/setasdeafult` | `{ key }` (typo is stable)                   | admin  |
| POST/DELETE | `/api/translations/languages`    | language install/delete                      | admin  |
| GET         | `/api/languages`                 | available languages                          | public |
| GET         | `/api/v2/translations`           | flat by-item list                            | public |
| POST        | `/api/v2/translations`           | by-item array                                | admin  |

Sockets:

- `translationsChange` — one mammoth locale document (Settings atom / `t()`)
- `translationKeysChange` — by-item entries (inline TranslateModal)

### Frontend still on mammoth for Settings

- Settings Translations list/edit/import → `I18NApi.get` / `save` / import (mammoth)
- Inline `TranslateModal` → `postV2` (by-item)
- `translationsAtom` + `translationsChange` expect mammoth per-locale docs
- `getV2` exists client-side but Settings list/edit do not use it

### Language install (hybrid today)

- `AddLanguageUseCase`: `translationsDS.cloneForLanguage` inside TX (by-item)
- `importPredefined` via Legacy template translation service → façade CSV path (**outside** TX)
- Controller emits mammoth `translationsChange` via `translations.get({ locale })`

### Why RelationshipTypes used Legacy adapters

RT deferred translations ownership: copied Templates’ port + `Legacy*TranslationService` → `#api/i18n/translations` so RT could ship without redesigning i18n. Thesaurus already spoke `TranslationsDataSource` more directly. That was **scope control**, not the end-state. This migration replaces those bridges.

---

## Decision record (locked)

| ID  | Decision                                                                                                         | Status |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| D1  | Phase 1 = V2 hex in `app/api/core` on Mongo `translationsV2` only                                                | Locked |
| D2  | Keep legacy `/api/translations*` **contracts** identical; reimplement as **core hex**                            | Locked |
| D3  | Keep `/api/v2/translations` by-item API under core                                                               | Locked |
| D4  | Internal callers migrate off `#api/i18n/translations` to core mutation use cases/ports; retire Legacy\* wrappers | Locked |
| D5  | **No application Upsert.** Create / Update / Delete (+ ImportPredefined). HTTP may branch create vs update       | Locked |
| D6  | Sockets `translationsChange` (legacy locale DTO) and `translationKeysChange` (by-item) stay until FE cutover     | Locked |
| D7  | FE Settings/atom cutover = Phase 1b follow-up, not required to close Phase 1                                     | Locked |
| D8  | Postgres = later doc; one store; sync namespace `translationsV2` kept                                            | Locked |
| D9  | Tests: integration-first; parity with current behavior; auth mock OK at routes                                   | Locked |
| D10 | **GETs = thin controller → QueryService/DAO; mutations = UseCases.** No `GetTranslationsUseCase`                 | Locked |
| D11 | **A UseCase exists only if a controller or job needs it.** Tests must not invent UseCases; they orchestrate via helpers that call `TranslationsService` (or the DS) inside `TM.run()` | Locked |
| D12 | **`TranslationsService` is orchestration-only.** Keep `insertEntries` / `upsertEntries` / `saveEntries` / `createContext` / `updateContext`. Single DS writes (`insert`, `deleteBy*`, `updateContext`, …) stay on `TranslationsDataSource` inside the parent `TM.run()`. `ensureTransaction` only on remaining service methods — not on the DS | Locked |
| D13 | **Locale write input is map-only** `{ [key]: string }`. Indexed maps are a GET mapper. Flatten at the UseCase edge. Do not accept `TranslationValue[]` on `SaveLocaleTranslations` | Locked |

### D5 detail — upsert is convenience, not unavoidable

Current `UpsertTranslationsService` matches “POST a batch, insert-or-replace.” Domain operations are:

- Create context / create entries
- Update context / update entries (value edits, renames, key deletes)
- Delete context / delete by language
- Import predefined System CSV (orchestration)

Composite context update (template/thesaurus/settings) is an **Update\* use case** that orchestrates renames/deletes/creates internally — same class of thing as `UpdateTemplate`, not an application Upsert paradigm.

Idempotent sync writes may remain at sync/DS infrastructure without an application `UpsertTranslationsUseCase`.

### D10 detail — getter pattern to follow

| Module             | GET approach                                                |
| ------------------ | ----------------------------------------------------------- |
| Templates          | `GetTemplatesController` → `TemplatesDAOFactory`            |
| Thesauri           | `GetThesauriController` → `ThesauriDAOFactory`              |
| Users              | `GetUsersController` → `UsersQueryServiceFactory`           |
| Entities           | `GetEntityController` → query service / DAO                 |
| Relationship types | `GetRelationshipTypesUseCase` — **known debt; do not copy** |

Translations GETs (mammoth get, by-item get, available languages) follow the thin controller pattern from day one.

---

## Target hex architecture

```
HTTP /api/translations* (legacy locale DTO)     HTTP /api/v2/translations (by-item)
        │                                          │
        ▼                                          ▼
 core express controllers (Zod)
   GET  → TranslationsQueryService / DAO + mapper (thin)
   POST/DELETE → mutation use cases (create vs update branch at edge)
        │
        ▼
 Mutation use cases (only those with a controller or job caller):
   SaveLocaleTranslations / SaveTranslationEntries / UpdateEntriesByContext
   AddLanguage / DeleteLanguage (language clone + DS deleteByLanguage; no extra translation UCs)
   ImportPredefined is a service (populate + AddLanguage), not a UseCase
   Settings Menu/Filters: V1 `settings.ts` calls `TranslationsService.updateContext` inside the same `TM.run` as `settingsModel.save` (no translation UseCase)
        │
        ▼
 TranslationsService (orchestration: saveEntries / createContext / updateContext)
   or TranslationsDataSource (single writes inside parent TM.run())
        │
        ▼
 TranslationsDataSource (+ Cached*) → Mongo translationsV2
```

### Domain concepts (keep)

- **Contexts:** `Uwazi UI` (`System` / `Menu` / `Filters`), `Entity` (template id), `Thesaurus` (thesaurus id), `Relationship Type` (relation type id)
- **Key / value / language** with invariant: keys should exist for all configured languages on create paths
- **TranslationContextModel** / diff semantics for context updates — consolidate thesaurus vs template update paths under one model where possible

### Architecture references

- Mutation split / HTTP branch: templates mutation controller + relationtypes create/update POST split
- Thin GET: `GetTemplatesController`, `GetThesauriController`, `GetUsersController`
- Thesaurus-style direct DS usage for **single** writes; `TranslationsService` only when the method orchestrates multiple steps (Entities-style `saveEntries` / `createContext` / `updateContext`)
- **Aggregate-owned translation sync:** Template / RelationshipType / Thesaurus know how to write their own translation contexts. Ports live on the aggregate (`domain/template/TemplateTranslationService`, `domain/relationshipType/RelationshipTypeTranslationService`); implementations stay in `application/templateTranslationService` / `application/relationshipTypeTranslationService` / `application/thesaurusTranslationService`. Do **not** move them into `application/translation`. UseCase deps are `templateTranslationService` / `relationshipTypeTranslationService` / `thesaurusTranslationService` — never a generic `translationService` next to `TranslationsService`.
- Folder/module structure: other `app/api/core` domains (relationshipType, thesaurus, template)

---

## Side-effect / caller migration map

All writers must stop calling `#api/i18n/translations` and use core ports/use cases.

| Caller                                | Today                                                                    | Target                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Create/Update Template                | `TemplateTranslationService` → `TranslationsService.createContext` / `updateContext` (shared TM) | Done |
| Delete Template                       | `translationsDS.deleteByContextId` (+ `bulkDeleteKeysByContext`)                                 | DS inside parent `TM.run()` (D12) |
| Thesaurus create/update               | `ThesaurusTranslationService` → DS `insert` (create); label diffs then `getContext` / `applyChanges` / `updateContext` (update) | Keep Thesaurus-style; do not proxy through `TranslationsService` (D12) |
| Thesaurus delete                      | `DeleteThesaurusUseCase` → `translationsDS.deleteByContextId`                                    | DS inside parent `TM.run()` (D12) |
| Create/Update RelationshipType        | `RelationshipTypeTranslationService` → `TranslationsService.createContext` / `updateContext`     | Done |
| Delete RelationshipType               | `RelationshipTypeTranslationService.delete` → `translationsDS.deleteByContextId`                 | DS inside parent `TM.run()` (D12) |
| Settings Menu / Filters               | `translations.updateContext`                                             | V1 `settings.ts` → `TranslationsService.updateContext` in the same `TM.run` as `settingsModel.save` (B1/B5) |
| CSV v1/v2 thesauri translations       | façade `updateEntries` / DS upsert                                       | `UpdateEntriesByContext` (job + csvLoader); no Create/Update-entries UseCases      |
| AddLanguage                           | DS clone + façade `importPredefined`                                     | Keep clone in use case; `ImportPredefinedTranslationsService` (outside TX)         |
| DeleteLanguage                        | DS `deleteByLanguage`                                                    | Same: `DeleteLanguageUseCase` → `translationsDS.deleteByLanguage` (no extra UC)    |
| Sync                                  | `translationsV2` + sync DS                                               | Keep namespace; handler uses core DS/sync adapter                                  |
| Denorm / search / dataviz (reads)     | façade get or cached DS                                                  | Thin query / cached query under core                                               |

---

## Delivery phases

### Phase 1 — V2 hex on Mongo (this doc)

1. Introduce core domain/contracts/DS (move or re-home from `i18n.v2`).
2. Mutation use cases (create/update/delete/import); no Upsert use case.
3. Thin GET controllers + query/DAO; legacy DTO reshape mapper at delivery edge.
4. Wire `/api/translations*` and `/api/v2/translations` to core controllers.
5. Migrate callers (templates, RT, thesaurus, settings, CSV, languages); remove Legacy\* façade adapters.
6. Remove runtime `app/api/i18n` façade / `i18n.v2` as home (leave only what must remain temporarily, then delete).
7. Parity tests (façade behavior, routes, caller side effects, sync).

### Phase 1b — FE cutover (follow-up)

- Settings list/edit/import → by-item API (or client-side group)
- Atom/sockets: prefer `translationKeysChange` / by-item hydration; retire mammoth `translationsChange` when safe
- Then delete legacy DTO reshape delivery surface

### Phase 2 — Postgres (later doc)

- Schema + RLS, PG DS, per-tenant flag, sync branch, one-time copy, one-way flag
- Still **one** logical store (no mammoth collection in PG)
- Sync namespace remains `translationsV2` unless a coordinated rename is separately approved

---

## Risks / hard edges

1. **~~Dual `updateContext` semantics~~ (A2 landed)** — Template/RT/Settings and Thesaurus update now share `TranslationContextModel.applyChanges` + `translationsDS.updateContext`. Thesaurus still owns *which* labels changed (nested / duplicate-label identity). Create of a new thesaurus still uses `insert` (B3).
2. **Thesaurus label-as-key + metadata propagation** — translation value edits can rename denormalized entity select labels; easy to break.
3. **AddLanguage TX boundary** — `importPredefined` / CSVLoader outside TX today; redesign carefully under ImportPredefined use case.
4. **Sync legacy `translations` namespace leftovers** — live path is `translationsV2`; do not regress Menu/Filters preserve logic.
5. **Legacy DTO reshape cost** — `resultsToV1TranslationType` stays until Phase 1b; acceptable for Phase 1.
6. **`core` must not depend on external modules** — moving DS/contracts into core (or core contracts + infra adapters) is required; today’s `#api/i18n.v2` imports from core are temporary debt.
7. **CSV dual stacks** — v1 `updateEntries` validation vs v2 gateway upsert; align on create/update use cases.

---

## TODOs (Phase 1)

- [x] Core domain + `TranslationsDataSource` contract + Mongo DS (+ cache) under `app/api/core`
- [x] Mutation use cases: create/update/delete context & entries; language delete (ImportPredefined still via façade CSV path)
- [x] **D11 peel:** deleted test-only translation UseCases (`Create/DeleteTranslationContext`, `Create/UpdateTranslationEntries`, `DeleteTranslationsByLanguage`). Specs seed via fixtures; the i18n parity suite calls `TranslationsService` / DS locally inside `TM.run()`
- [x] Thin GET query service + legacy locale DTO mapper (`TranslationsQueryService`)
- [x] Core express routes for `/api/translations*` and `/api/v2/translations` (`api.js` → core `translationsRoutes`); GETs via QueryService; mutations still delegate façade for thesaurus/CSV side effects
- [x] Migrate Templates / RelationshipTypes / Thesaurus / language factories onto core DS/use cases; Legacy\* no longer call façade for context CRUD
- [x] Peel internal reads off `getLegacy` (csvExporter / denormalize / search / SaveTranslationEntries → by-item QueryService lookups)
- [x] Peel mammoth `save` / `updateEntries` onto core orchestrator UseCases (`SaveLocaleTranslations`, `UpdateEntriesByContext`)
- [x] TX ownership = Entities model: UseCases own `transactionManager.run()`; `TranslationsService` is ambient-TX / TX-free (no nested UCs, no `runInTransaction`)
- [x] **Kill façade as module home** — no production imports of `#api/i18n/translations`
  - [x] Move `availableLanguages` → `AvailableLanguagesQueryService`; wire `GET /api/languages`
  - [x] Move real `importPredefined` into core `ImportPredefinedTranslationsService` (populate + AddLanguage)
  - [x] Point populate / languages routes at core
  - [x] Shrink façade to test/legacy convenience wrappers only (delegates to core)
  - [x] Peel SSR `entry-server.tsx` off façade → QueryService + mapper
  - [x] Register `models.translationsV2` from sync (`registerSyncHandlers` → `registerTranslationsV2SyncModel`); delete `i18n/v2_support`
  - [x] Delete `i18n/translations.ts` façade; migrate remaining specs to core factories / QueryService (no façade-shaped helper module)
- [x] **2A polish (superseded by D12):** do **not** extend `TranslationsService` with pass-through DS ops. Thesaurus / DeleteTemplate / RT delete / DeleteLanguage call `TranslationsDataSource` directly inside the parent `TM.run()`. Service keeps only multi-step orchestration (`insertEntries` / `upsertEntries` / `saveEntries` / `createContext` / `updateContext`)
- [x] **D13:** locale save input is map-only; `flattenLocaleTranslation` at the UseCase write edge. HTTP AJV already `values: object`. Removed array-input / duplicate-key tests (maps cannot duplicate keys)
- [x] **A1 + A3 (diagnosis):** `getLegacy` / `toLegacyDto` emit maps (GET-only); writes snapshot with `getByLanguageAndContext` / `getByContext`; propagate diffs maps; CSV import patches one context. No array layover; no `prepareLocaleTranslation`; controllers/SSR no longer wrap `toIndexedTranslations`
- [x] **A2 (diagnosis):** Thesaurus update persists through `TranslationContextModel.applyChanges` + `translationsDS.updateContext` (same primitive as Template/RT/Settings). Label identity diffs stay in `ThesaurusTranslationService`. Removed `updateKeysByContext` / `updateKeysByContextV2` / `updateContextLabel` / `deleteKeysByContext`. `bulkDeleteKeysByContext` stays (DeleteTemplate)
- [x] Parity tests for façade + RT/thesaurus/language + core DS/domain; expand syncWorker smoke as routes move
- [x] **Sync handler factory peel (motor seam)** — see dedicated section below
- [x] `preserve.createEmptyThesauri` → `CreateThesaurusUseCase` (stop ad-hoc `TM.run` around `ThesauriService`)
- [ ] Document Phase 1b FE checklist; open `translations-postgres.md` when starting Postgres

### Done — Sync `translationsV2` → SyncHandlerFactory + registry

**Implemented**

1. `TranslationsSyncHandlerFactory` + `MongoTranslationsSyncHandler` under `app/api/sync/`
2. Handler `save` preserves historical semantics: delete by natural key (`language` + `key` + `context.id`) then upsert
3. Registered in `registerSyncHandlers()` as `translationsV2`
4. Removed `translationsV2` special-case from `POST /api/sync` (uses registry like peers)
5. Deleted `registerTranslationsV2SyncModel.ts` / `models.translationsV2` production registration
6. Postgres branch deferred to `translations-postgres.md` (factory seam is ready)

### Assessment — façade kill (1) vs write-API polish (2)

**Façade remaining surface**

| Surface                                                              | Today                                | Target                                              |
| -------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------- |
| `get` / `save` / `updateEntries` / `v2StructureSave` / `addContext`  | Thin → core factories / `v2_support` | Controllers + QueryService / UseCases; specs follow |
| `deleteContext` / `updateContext` / `addLanguage` / `removeLanguage` | `v2_support` UC factories            | Call factories directly                             |
| `availableLanguages`                                                 | GitHub FS + `#shared/language`       | Core query helper                                   |
| `importPredefined`                                                   | tmp file + `CSVLoader` + System      | Core service (ops-sensitive)                        |
| Types re-exports                                                     | From mapper                          | Import mapper from core                             |

**Effort (1):** ~1–2 days. Long poles: `importPredefined` + spec churn. Phase 1 bar = no **production** imports; specs may keep a thin test façade one PR longer.

**Thesaurus / DeleteTemplate → `TranslationsService` (2) — reversed (D12)**

Single DS writes do not belong on `TranslationsService`. Callers that already share the parent TM use `TranslationsDataSource` directly (Thesaurus, DeleteTemplate, RT delete, DeleteLanguage). `ensureTransaction` stays on the remaining orchestrating service methods only — not on the DS (Mongo can still auto-commit without a session; the parent UseCase already owns `TM.run()`).

## Implementation status (in progress)

**Process note:** update this section whenever a peel/migration slice lands — not only at pause points.

- Domain/models/errors live in `app/api/core/domain/translation`
- Contract: `app/api/core/application/contracts/TranslationsDataSource.ts`
- Mongo DS/cache/sync + mappers under `app/api/core/infrastructure/mongodb/translation`
- Factories: `TranslationsDataSourceFactory`, `TranslationsServiceFactory`, mutation + orchestrator UseCase factories, `TranslationsQueryServiceFactory`, `PropagateThesaurusTranslationServiceFactory`
- Use cases (own `TM.run`, controller/job only — D11): `SaveLocaleTranslations`, `SaveTranslationEntries`, `UpdateEntriesByContext`, `AddLanguage`, `DeleteLanguage`
- Deleted test-only UseCases (were thin `TM.run` wrappers around `TranslationsService`): `CreateTranslationContext`, `DeleteTranslationContext`, `CreateTranslationEntries`, `UpdateTranslationEntries`, `DeleteTranslationsByLanguage`
- Tests: seed writes with `translationsV2` fixtures (or collection insert). Do **not** add a core test-helper write API. The leftover i18n parity spec may call `TranslationsService` and/or `TranslationsDataSource` in-file inside `TM.run()`
- Application services: `TranslationsService` (orchestration only + `ensureTransaction` on remaining methods), `TranslationsQueryService` (reads), `ValidateTranslationsService`, `PropagateThesaurusTranslationService` (post-commit)
- Transaction boundaries: UseCases open one `transactionManager.run()` then call `TranslationsService` **or** `TranslationsDataSource`; no UC→UC nesting; thesaurus entity propagate runs **after** successful commit (outside TX)
- Locale write DTO: `LocaleTranslationInput` is map-only. Writes flatten maps → entries (`flattenLocaleTranslation` → `saveEntries`). GET mammoth is maps (`getLegacy` / `toLegacyDto`); `toIndexedTranslations` remains only for leftover array `TranslationType` (mapper spec). `prepareLocaleTranslation` deleted
- QueryService by-item lookups: `getContextValueMap`, `getLanguageValueMaps`; `getLegacy` is GET-only (maps + System/Menu/Filters → `Uwazi UI`). Save paths snapshot with `getByLanguageAndContext` / `getByContext`, not `getLegacy`
- `PropagateThesaurusTranslationService.propagate({ locale, contextId, type, previous, next })` diffs maps
- CSV `loadTranslations` reads one context per language column and saves only that context
- Cross-aggregate writers (same shared TM as parent UseCase):
  - Templates create/update: `TemplateTranslationService` → `TranslationsService.createContext` / `updateContext`
  - Relationship types create/update: `RelationshipTypeTranslationService` → `TranslationsService.createContext` / `updateContext`
  - Relationship types delete: `RelationshipTypeTranslationService.delete` → `translationsDS.deleteByContextId`
  - Thesaurus create: `ThesaurusTranslationService` → `translationsDS.insert`
  - Thesaurus update: `ThesaurusTranslationService` diffs labels (nested / duplicate-label rules) then `translationsDS.getContext` + `TranslationContextModel.applyChanges` + `updateContext`
  - Thesaurus delete / DeleteTemplate / DeleteLanguage: `translationsDS` inside parent `TM.run()`
  - Settings Menu/Filters: V1 `settings.ts` → `TranslationsService.updateContext` inside the same `TM.run` as `settingsModel.save` (`dbSessionContext.setTransactionManager`; no translation UseCase)
  - AddLanguage / populate predefined CSV: `ImportPredefinedTranslationsService` (core; FS+CSV; outside TX)
  - `AvailableLanguagesQueryService` for `GET /api/languages`
- Removed misleading `Legacy*TranslationService` adapters (they were domain sync services, not old translations)
- Tests: unit `TranslationsService.spec`; integration specs for real UseCases only; `i18n/specs/translations.spec.ts` uses QueryService / remaining UC factories / in-file `TranslationsService` + DS (no façade, no test-only UCs, no core test-helper module)
- Express: GET → QueryService; languages → AvailableLanguagesQueryService; populate → PopulateTranslationsController; Save* → orchestrator UseCase factories
- Thesaurus metadata rename: `ThesaurusMetadataRenamerAdapter` → `denormalizeThesauriLabelInMetadata`
- `app/api/i18n.v2/` removed; `i18n/routes` deleted; **`i18n/translations.ts` + `i18n/v2_support.ts` deleted**
- Sync: `TranslationsSyncHandlerFactory` + `MongoTranslationsSyncHandler` on `SyncHandlerRegistry` (`translationsV2`); compound-key delete lives in handler `save`; no `models.translationsV2` / route special-case
- Peeled production callers: Settings; csvExporter / denormalize / search; csvLoader + PendingThesauri; Save* controllers; languages + populate; denormalizeAllEntities; **entry-server SSR**; **preserve → CreateThesaurusUseCase**
- TX ownership: UseCases / Jobs open `TM.run()`; ambient services (`TranslationsService`, `ThesauriService`, `PendingThesauriValuesApplier.apply`) do not. CSV job owns TX around thesaurus append; translation value updates via `UpdateEntriesByContext` UC after commit.
- Follow-ups deferred:
  - Phase 1b FE checklist + `translations-postgres.md` (Postgres sync handler branch when that phase starts)
- Phase 1 “module home killed” + sync motor seam: done for current Mongo runtime

## V2 complete checklist (Phase 1)

- [x] Legacy `/api/translations*` served by core controllers with unchanged contracts
- [x] `/api/v2/translations` served by core controllers
- [x] GETs use QueryService/DAO (no Get*UseCase)
- [x] Mutations use Create/Update/Delete use cases — no application Upsert use case
- [x] Translation UseCases exist only for controller/job callers — no test-only UCs. Settings Menu/Filters inlines `TranslationsService` in V1 `settings.ts` (B1)
- [x] Internal non-delivery callers do not use `getLegacy` (csvExporter / denormalize / search / Save* writes / CSV import). `getLegacy` is GET-only maps (HTTP, SSR, socket body, CSV import return)
- [x] CSV / SaveTranslationsController / PendingThesauriValuesApplier do not call façade `save`/`updateEntries` (use core factories)
- [x] No runtime production imports of `#api/i18n/translations` (façade deleted; SSR uses QueryService)
- [x] Template/RT **create/update** via `TemplateTranslationService` / `RelationshipTypeTranslationService` → `TranslationsService` (no Legacy adapters; shared parent TM). RT **delete**, Thesaurus, DeleteTemplate, DeleteLanguage → `TranslationsDataSource` (D12)
- [x] Translation side effects for relationship types / thesaurus / language covered by existing integration tests
- [x] Sync namespace `translationsV2` still green in syncWorker specs after route cutover
- [x] Sync `translationsV2` served via `TranslationsSyncHandlerFactory` + registry (no `models.translationsV2` / route special-case) — motor seam for Postgres later

## Phase 1b checklist (FE — later)

- [ ] Settings Translations list/edit/import use by-item API
- [ ] `translationsAtom` / `t()` hydration does not require mammoth GET
- [ ] `translationsChange` removed or unused; `translationKeysChange` (or successor) sufficient
- [ ] Legacy DTO reshape mapper deleted from backend

---

## Alignment review (post-ship)

Critical pass after the V2 hex peel and the production SSR CPU outage. Further slices will land here; do not treat the original “mutation use cases (examples)” list as the current surface.

### D11 — UseCases are delivery, not test API

**Request:** UseCases exist only if a controller or job needs them. Tests that need to orchestrate writes do so explicitly (helpers), not by shipping production UseCases.

**Finding:** several translation UseCases were thin `transactionManager.run()` wrappers around `TranslationsService` and were called only from specs (or never). Production already does the same work via domain services sharing the parent UseCase TM (`TemplateTranslationService`, `ThesaurusTranslationService`, `RelationshipTypeTranslationService`) or via `DeleteLanguageUseCase` → DS.

| UseCase | Verdict | Callers at review |
| --- | --- | --- |
| `CreateTranslationContextUseCase` | **Deleted** | specs only (`CreateTranslationContext.spec`, `SaveLocaleTranslations.spec`, `i18n/specs/translations.spec`) |
| `DeleteTranslationContextUseCase` | **Deleted** | specs only |
| `CreateTranslationEntriesUseCase` | **Deleted** | `syncWorker.spec` fixture setup only |
| `UpdateTranslationEntriesUseCase` | **Deleted** | **zero callers** (dead factory) |
| `DeleteTranslationsByLanguageUseCase` | **Deleted** | `i18n/specs/translations.spec` only; `DeleteLanguageUseCase` already deletes via DS |
| `SaveTranslationEntriesUseCase` | **Keep** | `SaveTranslationEntriesController` |
| `SaveLocaleTranslationsUseCase` | **Keep** | `SaveTranslationsController` (+ `csv/csvLoader.ts`) |
| `UpdateEntriesByContextUseCase` | **Keep** | `CsvCreateThesauriValuesJob` (+ `csv/csvLoader.ts`) |
| `UpdateTranslationContextUseCase` | **Deleted (B1)** | was V1 `settings.ts` Menu/Filters — TX shell, not a controller or job |

`CreateTranslationContext.spec.ts` existed only to exercise the deleted wrappers; `TranslationsService.spec.ts` covers the remaining orchestrating methods.

**Tests (not a core helper module):** a shared `core/testing/translationsTestHelpers` write API was the same mistake as the UseCases (named production-shaped surface for specs). Do not put it back.

- Setup/seed → `translationsV2` fixtures or collection insert (`SaveLocaleTranslations.spec`, `syncWorker.spec` host data already in fixtures)
- Sync tests that need a change to be picked up must seed `updatelogs` (that is the sync contract), not call `TranslationsService`
- Behavior under test in the leftover i18n parity suite → file-local `withTranslationWrites` (`TM.run()` + `TranslationsService` and/or `TranslationsDataSource`). Dies with that spec.

### D12 / D13 — service vs DS; map-only locale writes

**Request:** shrink `TranslationsService` to orchestration (Entities-style). Single operations go through `TranslationsDataSource` inside the parent `TM.run()`. Locale save input is map-only; indexed maps stay a GET mapper; flatten at the UseCase edge. Do not accept `TranslationValue[]`.

**Finding:** ~60% of the service was a DS proxy plus `ensureTransaction` as a runtime lint. Mongo still writes without a session (auto-commit). Parent UseCases already own `TM.run()`. Putting `ensureTransaction` on the DS would have been the wrong fix.

Kept on `TranslationsService` (with `ensureTransaction`):

- `insertEntries` / `upsertEntries` / `saveEntries` (validation + partition)
- `createContext` (keys × languages then insert)
- `updateContext` (load `TranslationContextModel`, `applyChanges`, persist)

Callers of pass-through methods now use the DS: Thesaurus, DeleteTemplate, DeleteThesaurus, RT delete, DeleteLanguage, i18n parity deletes.

HTTP `POST /api/translations` AJV already requires `values` as object/map. Array / `TranslationValue[]` was a façade leftover. `LocaleTranslationInput` is map-only; `flattenLocaleTranslation` is the write edge. Duplicate-key checks are gone (maps cannot duplicate keys).

### A1 + A3 — no third shape; saves do not load the locale mammoth

**Request (diagnosis):** persistence and domain stay flat `Translation`. HTTP legacy stays maps. Stop assembling `TranslationValue[]` as an internal interchange. Snapshot writes with `getByLanguageAndContext` / `getByContext`, not `getLegacy({ locale })`.

**Landed:**

- `TranslationsQueryService.toLegacyDto` / `getLegacy` emit `IndexedTranslations` (maps) and coerce System/Menu/Filters → `Uwazi UI`. GET controllers, Save response/socket, populate, AddLanguage socket, SSR, and CSV import return call `getLegacy` directly — no `toIndexedTranslations` wrap
- `prepareLocaleTranslation` deleted. Writes: maps → `flattenLocaleTranslation` → `saveEntries`
- `PropagateThesaurusTranslationService.propagate` diffs `previous`/`next` maps (new keys absent from previous still do not rename metadata)
- `SaveLocaleTranslations` snapshots only payload contexts via `getByLanguageAndContext`. `UpdateEntriesByContext` loads that context per locale, not the whole language. `SaveTranslationEntries` still uses `getByContext`
- `csvLoader.loadTranslations` patches **one** context per language column (`getByLanguageAndContext` + `SaveLocaleTranslations` with that context only). Final HTTP return can still `getLegacy()` (import contract)
- Empty-string skip on flatten/propagate kept for parity

**Not this slice:** B2–B4, C1–C2 (`toIndexedTranslations` still exists for array `TranslationType` in the mapper spec).

### A2 — one context-update engine

**Request (diagnosis):** one rename/delete/create primitive for a context. Do not wrap Thesaurus DS calls in `TranslationsService`. Thesaurus label identity stays on the thesaurus module.

**Landed:**

- `ThesaurusTranslationService.update` still computes `LabelChanges` (nested labels, duplicate labels across parents, name-as-key)
- Persist is `translationsDS.getContext` → `applyChanges(keyChanges, valueChanges, keysToDelete)` → `updateContext` — the same path Template/RT/Settings already use
- Removed from the DS contract and Mongo adapter: `updateKeysByContext`, `updateKeysByContextV2`, `updateContextLabel`, `deleteKeysByContext`
- `bulkDeleteKeysByContext` remains for DeleteTemplate (delete keys across many contexts without loading a model)
- Rename persistence is insert-new-key + delete-old-key (same as Template). Specs that compared collection order now sort by language+key

### B1 + B5 — Settings Menu/Filters in the same TX

**Request (diagnosis):** `UpdateTranslationContextUseCase` was only `TM.run` + `updateContext`. Menu/Filters translations committed before `settingsModel.save`. Drop the shell UseCase; do not invent `SaveSettingsUseCase` just to wrap this.

**Landed:**

- Deleted `UpdateTranslationContextUseCase` and its factory
- V1 `settings.save` opens one `TransactionManager.run()`, `dbSessionContext.setTransactionManager` so mongoose `settingsModel.save` joins the native session, then `TranslationsService.updateContext` for Menu and Filters with that same TM (`TranslationsServiceFactory.default({ transactionManager })`)
- Link/filter **diff** (`getUpdatesAndDeletes`) stays in `settings.ts`
- `newNameGeneration` template updates stay **after** the TX (same as before)
- Specs mock `TranslationsServiceFactory`; one unmocked test asserts Menu keys in `translationsV2`
- No `translationsChange` on settings save (routes already emit `updateSettings`)

### Production SSR CPU (keep these; do not regress)

Root cause was not Mongo. Every SSR HTML request:

1. `TranslationsQueryService.getLegacy({ locale })` loaded **all** translations for the language (System + every thesaurus/template/RT)
2. `toIndexedTranslations` → `prepareContexts` built value maps with `{ ...values, [key]: value }` inside `reduce` → **O(n²) per context**
3. `onlySystemTranslations()` then threw away everything except System

On a large tenant (~24k `translationsV2` docs, ~9.6k thesaurus keys/language) `toIndexedTranslations` was ~16s Node CPU per request.

Shipped:

- Linear `prepareContexts` in `LegacyTranslationDtoMapper` (mutating assignment)
- SSR `entry-server.tsx` calls `getLegacy({ locale, context: 'System' })`
- `getByLanguageAndContext` on the DS; `getLegacy` honors both `locale` and `context`
- `toLegacyDto` loads the result set **after** `getLanguageKeys()` (thunk) so the Mongo cursor is not opened across that await (session/TX mismatch)

Explicitly **not** shipped: process/tenant-wide translations read cache. Topology is 12 API nodes × 3 servers, 500+ tenants, 5 job workers. In-process invalidation cannot be consistent; memory is unbounded; workers would fill it too. Mongo stays the shared source of truth. `CachedMongoTranslationsDataSource` remains the **old per-UseCase memo** (instance `Map`, `.all()` only, cleared on that TM’s commit) — same pattern as templates/settings. SSR/search do not use it unless `cached: true`.

### Spec isolation (csv thesauri)

`csvLoaderThesauri.spec.ts` tests that `setDefaultLanguage('fr'|'es')` must restore `'en'` in `finally`. If a load/TX throws, leftover French default made later nesting tests assert English labels against French CSV columns. Nesting `beforeEach` also resets to `'en'`.

---

## To keep an eye on

- Temporary mammoth delivery surface must not become permanent without a scheduled Phase 1b
- Do not reintroduce application Upsert “because the old service had it”
- Do not add `GetTranslationsUseCase` “because relationship types still have Get*”
- Do not add a translations UseCase because a spec needs to create/update/delete data — seed fixtures, or call `TranslationsService` / `TranslationsDataSource` inside `TM.run()` in that spec. Do not add a core `translationsTestHelpers` module
- Do not put pass-through DS methods (`insert`, `deleteBy*`, `updateContext`, …) back on `TranslationsService`, and do not add `ensureTransaction` to the DS
- Do not re-widen `LocaleTranslationInput` / `SaveLocaleTranslations` to accept `TranslationValue[]` — HTTP and CSV already send maps; `getLegacy` already returns maps
- Do not put `getLegacy` back on save/propagate/CSV import writes — snapshot with `getByLanguageAndContext` / `getByContext`
- Do not reintroduce process-wide / tenant-wide translations read cache (12 Node processes × 3 servers, 500+ tenants, 5 workers; in-process invalidation cannot be consistent)
- When Postgres starts: data copy before flag; one-way flag; RLS in same schema migration; keep sync namespace `translationsV2`
- Do not leave sync on direct `new MongoTranslationsSyncDataSource` / `models.translationsV2` once the SyncHandlerFactory peel lands — that blocks motor swap
- Do not move Template / RelationshipType / Thesaurus translation sync into `application/translation`. Those aggregates own their ports and services; core translations stays generic (`TranslationsService` / DS)
- Do not reintroduce `updateKeysByContext` / `updateKeysByContextV2` / `updateContextLabel` / `deleteKeysByContext` — context mutation goes through `TranslationContextModel` + `updateContext`
- Do not reintroduce `UpdateTranslationContextUseCase` — Settings Menu/Filters stay in the parent `settings.save` TX via `TranslationsService.updateContext`
