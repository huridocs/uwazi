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

| Principle | Apply to translations |
|-----------|------------------------|
| Stable external contract, internal rewrite | Mammoth + by-item HTTP stay; ownership moves to core |
| Hex layers in `app/api/core` | Domain → application (use cases + contracts) → infrastructure |
| Explicit mutations; no application upsert | Create / Update / Delete (+ ImportPredefined orchestration) |
| Contract-driven side effects | Templates/thesaurus/RT/settings call translation ports/use cases |
| Facades optional | Prefer controllers → factories/use cases (or thin query services for GET) |
| Integration-first tests | Prefer DB assertions; auth middleware mock OK at route boundary |
| Postgres later, separate doc | One store only; no dual-write; flag/copy/cutover when that phase starts |
| Avoid incomplete peer patterns | Do not copy Entities partial cutover; do not copy RT Get*UseCase |

---

## Current diagnosis

### Naming (three different “v2”s)

| Name | Meaning |
|------|---------|
| **translations v2 (DB)** | By-item Mongo collection `translationsV2` (migration 144+) |
| **`app/api/i18n.v2`** | Proto-hexagonal module (contract, DS, services, models) |
| **Core V2 hex** | Target home under `app/api/core` (this migration) |

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

| Method | Path | Shape | Auth |
|--------|------|-------|------|
| GET | `/api/translations` | Mammoth `{ rows: [{ locale, contexts[] }] }` | public |
| POST | `/api/translations` | Mammoth locale doc | admin |
| POST | `/api/translations/import` | multipart + context | admin |
| POST | `/api/translations/populate` | `{ locale }` | admin |
| POST | `/api/translations/setasdeafult` | `{ key }` (typo is stable) | admin |
| POST/DELETE | `/api/translations/languages` | language install/delete | admin |
| GET | `/api/languages` | available languages | public |
| GET | `/api/v2/translations` | flat by-item list | public |
| POST | `/api/v2/translations` | by-item array | admin |

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

| ID | Decision | Status |
|----|----------|--------|
| D1 | Phase 1 = V2 hex in `app/api/core` on Mongo `translationsV2` only | Locked |
| D2 | Keep legacy `/api/translations*` **contracts** identical; reimplement as **core hex** | Locked |
| D3 | Keep `/api/v2/translations` by-item API under core | Locked |
| D4 | Internal callers migrate off `#api/i18n/translations` to core mutation use cases/ports; retire Legacy\* wrappers | Locked |
| D5 | **No application Upsert.** Create / Update / Delete (+ ImportPredefined). HTTP may branch create vs update | Locked |
| D6 | Sockets `translationsChange` (legacy locale DTO) and `translationKeysChange` (by-item) stay until FE cutover | Locked |
| D7 | FE Settings/atom cutover = Phase 1b follow-up, not required to close Phase 1 | Locked |
| D8 | Postgres = later doc; one store; sync namespace `translationsV2` kept | Locked |
| D9 | Tests: integration-first; parity with current behavior; auth mock OK at routes | Locked |
| D10 | **GETs = thin controller → QueryService/DAO; mutations = UseCases.** No `GetTranslationsUseCase` | Locked |

### D5 detail — upsert is convenience, not unavoidable

Current `UpsertTranslationsService` matches “POST a batch, insert-or-replace.” Domain operations are:

- Create context / create entries
- Update context / update entries (value edits, renames, key deletes)
- Delete context / delete by language
- Import predefined System CSV (orchestration)

Composite context update (template/thesaurus/settings) is an **Update\* use case** that orchestrates renames/deletes/creates internally — same class of thing as `UpdateTemplate`, not an application Upsert paradigm.

Idempotent sync writes may remain at sync/DS infrastructure without an application `UpsertTranslationsUseCase`.

### D10 detail — getter pattern to follow

| Module | GET approach |
|--------|----------------|
| Templates | `GetTemplatesController` → `TemplatesDAOFactory` |
| Thesauri | `GetThesauriController` → `ThesauriDAOFactory` |
| Users | `GetUsersController` → `UsersQueryServiceFactory` |
| Entities | `GetEntityController` → query service / DAO |
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
 Mutation use cases (examples — names flexible):
   CreateTranslationContext / UpdateTranslationContext / DeleteTranslationContext
   CreateTranslationEntries / UpdateTranslationEntries
   DeleteTranslationsByLanguage / ImportPredefinedTranslations
   (language clone already partly owned by AddLanguageUseCase)
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
- Thesaurus-style direct DS usage as the direction for side-effect callers (replace Legacy façade calls)
- Folder/module structure: other `app/api/core` domains (relationshipType, thesaurus, template)

---

## Side-effect / caller migration map

All writers must stop calling `#api/i18n/translations` and use core ports/use cases.

| Caller | Today | Target |
|--------|-------|--------|
| Create/Update Template | `LegacyTemplatesTranslationService` → façade `addContext` / `updateContext` | Core Create/Update translation context use cases (or port implemented in core, not façade) |
| Delete Template | `translationsDS.deleteByContextId` (+ bulk key cleanup) | Same DS/use case under core ownership |
| Thesaurus create/update/delete | `ThesaurusTranslationService` → DS | Keep Thesaurus-style; DS/contract moves under core |
| Create/Update/Delete RelationshipType | `LegacyRelationshipTypesTranslationService` → façade | Same as templates — real core mutations; delete Legacy adapter |
| Settings Menu / Filters | `translations.updateContext` | Core UpdateTranslationContext |
| CSV v1/v2 thesauri translations | façade `updateEntries` / DS upsert | Create/Update entries use cases (branch at edge) |
| AddLanguage | DS clone + façade `importPredefined` | Keep clone in use case; ImportPredefined as core use case (TX boundary to resolve) |
| DeleteLanguage | DS `deleteByLanguage` | Core delete-by-language |
| Sync | `translationsV2` + sync DS | Keep namespace; handler uses core DS/sync adapter |
| Denorm / search / dataviz (reads) | façade get or cached DS | Thin query / cached query under core |

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

1. **Dual `updateContext` semantics** — template path (`UpsertTranslationsService.updateContext` / ContextModel) vs thesaurus (`updateKeysByContextV2`). Must converge under one domain model.
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
- [x] Thin GET query service + legacy locale DTO mapper (`TranslationsQueryService`)
- [x] Core express routes for `/api/translations*` and `/api/v2/translations` (`api.js` → core `translationsRoutes`); GETs via QueryService; mutations still delegate façade for thesaurus/CSV side effects
- [x] Migrate Templates / RelationshipTypes / Thesaurus / language factories onto core DS/use cases; Legacy\* no longer call façade for context CRUD
- [ ] Remove runtime `#api/i18n` façade as module home (still compatibility delivery + importPredefined/CSV/`save` mammoth path)
- [x] Parity tests for façade + RT/thesaurus/language + core DS/domain; expand syncWorker smoke as routes move
- [ ] Document Phase 1b FE checklist; open `translations-postgres.md` when starting Postgres

## Implementation status (in progress)

- Domain/models/errors live in `app/api/core/domain/translation`
- Contract: `app/api/core/application/contracts/TranslationsDataSource.ts`
- Mongo DS/cache/sync + mappers under `app/api/core/infrastructure/mongodb/translation`
- Factories: `TranslationsDataSourceFactory`, mutation use-case factories, `TranslationsQueryServiceFactory`, `PropagateThesaurusTranslationServiceFactory`, `SaveTranslationEntriesServiceFactory`
- Use cases: `Create/Update/DeleteTranslationContext`, `Create/UpdateTranslationEntries`, `DeleteTranslationsByLanguage`
- Application services: `PropagateThesaurusTranslationService` (thesaurus label → entity metadata), `SaveTranslationEntriesService` (by-item save + propagate)
- Express: GET → QueryService; `SaveTranslationEntriesController` → `SaveTranslationEntriesServiceFactory`; mammoth `SaveTranslationsController` still façade (`save` + indexed DTO)
- `app/api/i18n.v2/` removed — callers import core domain/DS/factories/schemas directly
- `v2_support` + Legacy RT/Template translation adapters call core use cases (upsert bridge branches create vs update)
- Peeled reads/updateContext: Settings Menu/Filters, AddLanguageController socket payload, denormalize, search, csvExporter
- Remaining façade: mammoth `save` / `updateEntries` / `importPredefined` / `availableLanguages`; CSV loaders still call `updateEntries`

## V2 complete checklist (Phase 1)

- [x] Legacy `/api/translations*` served by core controllers with unchanged contracts
- [x] `/api/v2/translations` served by core controllers
- [x] GETs use QueryService/DAO (no Get*UseCase)
- [x] Mutations use Create/Update/Delete use cases — no application Upsert use case
- [ ] No runtime imports of `#api/i18n/translations` from domain callers (CSV/`save`/`importPredefined`/`availableLanguages` remain)
- [x] LegacyTemplatesTranslationService / LegacyRelationshipTypesTranslationService call core use cases (not façade context CRUD)
- [x] Translation side effects for relationship types / thesaurus / language covered by existing integration tests
- [x] Sync namespace `translationsV2` still green in syncWorker specs after route cutover

## Phase 1b checklist (FE — later)

- [ ] Settings Translations list/edit/import use by-item API
- [ ] `translationsAtom` / `t()` hydration does not require mammoth GET
- [ ] `translationsChange` removed or unused; `translationKeysChange` (or successor) sufficient
- [ ] Legacy DTO reshape mapper deleted from backend

---

## To keep an eye on

- Temporary mammoth delivery surface must not become permanent without a scheduled Phase 1b
- Do not reintroduce application Upsert “because the old service had it”
- Do not add `GetTranslationsUseCase` “because relationship types still have Get*”
- When Postgres starts: data copy before flag; one-way flag; RLS in same schema migration; keep sync namespace `translationsV2`
- Align thesaurus vs template context-update semantics before freezing the Update use case contract
