# Translations V2 — critical diagnosis

**Date:** 2026-08-14  
**Mode:** originally a read-only audit. A1 + A3, A2, B1 + B5, B2, B3, B4, and C1–C2 from the work order below have since landed (see [`translations-v2-migration.md`](./translations-v2-migration.md)). This file stays the post-mortem of what was wrong; strike-throughs mark what those slices fixed.  
**Companion:** [`translations-v2-migration.md`](./translations-v2-migration.md) (intent, locked decisions, peel history).

---

## Why this exists

A team review of this work was embarrassing for justified reasons. The same class of mistakes showed up more than once:

1. **UseCases invented for tests**, then treated as the module’s public API.
2. **`ensureTransaction` wrapped around every DS call** as a runtime lint, including pass-throughs that did not need a service at all.
3. **Production types widened because a test (and TypeScript) still spoke a deprecated array shape** — instead of fixing the test to the real HTTP contract.

Those three were partially walked back in later slices (D11–D13). This document is the line-by-line pass that should have happened before presenting the work: what is actually correct, what is leftover, what was copied from `i18n.v2` without redesign, and what will not survive years of development on top of it.

**Rule used throughout:** compare with Thesaurus, Users, and Entities only when the *scenario* matches. Entities has a service because one insert coordinates entities + access policy + relationship sync + committed events. That is not a license to put a service in front of `deleteByContextId`.

---

## How this was audited

Every production path that reads or writes `translationsV2` was traced: HTTP controllers, language add/delete, CSV v1/v2, Template / RelationshipType / Thesaurus create-update-delete, Settings Menu/Filters, SSR, sync, denormalize, search, csvExporter, dataviz, preserve.

Read in full (not grepped only):

- Domain: `Translation`, `TranslationCollection`, `TranslationContextModel`, `TranslationContextDiff`, `translationContextIndex`, `errors`
- Application: `TranslationsService`, `ValidateTranslationsService`, `TranslationsQueryService`, `localeTranslationDto`, `ImportPredefinedTranslationsService`, `PropagateThesaurusTranslationService`, `AvailableLanguagesQueryService`, all six remaining UseCases, Template / RT / Thesaurus translation services
- Infrastructure: Mongo DS + cache + sync DS + mappers + bulk ops, express `routes.ts` + every translation/language controller, factories
- Callers: `settings.ts`, `csvLoader.ts`, csv.v2 job (`UpdateEntriesByContext`), `entry-server.tsx`, sync handler, DeleteTemplate / DeleteThesaurus / DeleteLanguage
- Leftover tree: `app/api/i18n/` (`defaultTranslations` + its spec + CSV fixtures)
- Shared types: `translationType.d.ts`, `translationSchema.ts`
- FE contracts: `ClientTranslationSchema`, sockets, `I18NApi`

---

## Executive summary

The **storage model is right**: one by-item collection (`translationsV2`), domain `Translation`, unique `{ language, key, context.id }`. The **HTTP contracts were kept** (D2/D3). The **façade is gone**. Template / RT / Thesaurus own their sync (not core translations knowing how to translate templates). SSR no longer loads the whole tenant.

What is **not** right yet is the **interior leftover types and DS quality** (C3–C4). Dead files, the unused UpdateThesaurus dep, and leftover i18n specs have been removed or moved (C1–C2). GET mammoth assembly, the second thesaurus update engine, the Settings TX shell UseCase, public `insertEntries`/`upsertEntries`, duplicated keys×languages fan-out, and QueryService DS pass-throughs have been removed (A1–A3, A2, B1+B5, B2, B3, B4).

None of that is “MVP leftover we can live with.” It is the kind of interior that the next person will copy.

---

## Classification of findings

| ID | Severity | Kind | Finding |
| --- | --- | --- | --- |
| A1 | **P0 — landed** | Interior dual shape | ~~`getLegacy` / `toLegacyDto` still build `values: {key,value}[]`~~ GET now emits maps. Writes flatten maps. Propagate diffs maps. `toIndexedTranslations` is unused on production GET. |
| A2 | **P0 — landed** | Two update engines | ~~Thesaurus used `deleteKeysByContext` + `updateKeysByContextV2` + `updateContextLabel`~~ Update now goes through `TranslationContextModel.applyChanges` + `updateContext`. Thesaurus still owns label-identity diffs. |
| A3 | **P0 — landed** | Write cost | ~~`SaveLocaleTranslations` and `UpdateEntriesByContext` call `getLegacy({ locale })`~~ Saves snapshot scoped reads. CSV import writes one context. Controllers still `getLegacy` **after** save for the HTTP/socket contract. |
| B1 | **P1 — landed** | Not a UseCase | ~~`UpdateTranslationContextUseCase` is `TM.run` + `translationsService.updateContext`~~ Deleted. V1 `settings.ts` calls `TranslationsService.updateContext` inside the same `TM.run` as `settingsModel.save`. |
| B2 | **P1 — landed** | D5 tension | ~~`insertEntries` / `upsertEntries` public~~ Private internals of `saveEntries`. Batch save is not an Upsert UseCase; HTTP still does not branch create vs update. |
| B3 | **P1 — landed** | Validation gap | ~~Three doors into create-rows~~ `Translation.forLanguages` is the keys × languages helper. `createContext` and Thesaurus create use it (Thesaurus still `DS.insert`). `saveEntries` still validates all-languages because locale POST can send one language. |
| B4 | **P1 — landed** | QueryService | ~~Four DS pass-throughs; unused `cached` option~~ QueryService is `getLegacy` + value-map aggregations. Snapshots and GET v2 use the DS. |
| B5 | **P1 — landed** | Settings TX | ~~Menu/Filters translations commit in their own UC TX **before** `settingsModel.save`~~ Same `TM.run` as settings save (`dbSessionContext.setTransactionManager`). No `translationsChange` socket (routes already emit `updateSettings`). |
| C1 | **P2 — landed** | Dead code | ~~`ContextDoesNotExist`; `i18n/systemKeys.js`; `PendingThesauriTranslationsGateway`; unused UpdateThesaurus translation-service dep~~ Deleted. Sync `get()` stub **kept** (`SyncDBDataSource` obligation; handler never calls it). |
| C2 | **P2 — landed** | Test / folder pollution | ~~`app/api/i18n/specs/*` hosted the parity suite~~ Moved under `core/application/translation/specs/`. `i18n/` is predefined CSV only. GET assertions are maps. |
| C3 | **P2** | Type duplicates | `TranslationEntryInput` ≈ domain `Translation`; `ContextLike` / `LocaleTranslationLike` ≈ shared types; `IndexedTranslations` defined twice (mapper + locale DTO) |
| C4 | **P2** | DS quality | `upsert` is sequential `reduce` of `updateOne`s; `calculateNonexistentKeys` is `findOne` + aggregate |
| D1 | Keep | Correct | By-item store; façade gone; D11 leftover UCs deleted; service no longer proxies delete/insert; locale **input** is map-only; aggregate-owned translation services; SSR scoped to System |
| D2 | Do not “fix” | Contract | Unauthenticated `GET /api/translations` and `GET /api/v2/translations` are the **stable public contract** (public `t()`, Settings). Missing auth is not a regression. Unbounded load **is** a problem. |

---

## What is actually correct (do not undo)

### Storage and domain core

- Collection `translationsV2`, document `{ language, key, value, context: { type, label, id } }`, unique index on `{ language, key, context.id }`.
- Domain `Translation` is a real value object (string `context.id`, non-null value). Thin, but honest.
- `TranslationContextModel` + `getDiff` + `buildTranslationContextBulkOps` is a real domain write path (renames, deletes, creates, label change) for Template / RT / Settings.
- `TranslationCollection` is used in production (dataviz, select property assignment) — not a decorative domain class.

### Delivery split (D10)

- GETs are controllers → `TranslationsQueryService` (no `GetTranslationsUseCase`). That matches Templates / Thesauri / Users.
- Mutations that have an HTTP or job caller are UseCases that own `transactionManager.run()`.

### Aggregate ownership (do not invert)

Templates, relationship types, and thesauri **create their own translation rows**. Core translations does not have `translateTemplate()`. That is the right direction:

| Aggregate | Port | Implementation | Persistence |
| --- | --- | --- | --- |
| Template | `domain/template/TemplateTranslationService` | `application/templateTranslationService` | `TranslationsService.createContext` / `updateContext` |
| Relationship type | `domain/relationshipType/RelationshipTypeTranslationService` | `application/relationshipTypeTranslationService` | create/update via service; **delete via DS** |
| Thesaurus | (no port — concrete class) | `application/thesaurusTranslationService` | **DS directly** (insert / key ops / label) |

DeleteTemplate, DeleteThesaurus, DeleteLanguage also talk to the DS inside the parent `TM.run()`. That is correct. Do not put those back on `TranslationsService`.

### `ensureTransaction` that remains

On `TranslationsService` it now only guards methods that orchestrate (validate + partition, or load model + apply + persist). That matches `EntitiesService`. It must **not** be added to the DS, and must **not** be re-spread onto Thesaurus DS calls as a “consistency” pass.

Thesaurus has no `ensureTransaction`. That is OK **as long as** `ThesauriService` is only called from a parent `TM.run()` (it is, today). A guard would be a safety net, not a design requirement — Entities needed it because the service is a wide write API that many UCs call. Thesaurus translation is a private collaborator of `ThesauriService`.

### Façade and leftover UseCases (already removed)

These are **gone** and must stay gone:

- `#api/i18n/translations`, `i18n.v2`, `i18n/v2_support`
- `CreateTranslationContext`, `DeleteTranslationContext`, `CreateTranslationEntries`, `UpdateTranslationEntries`, `DeleteTranslationsByLanguage`
- Shared `core/testing/translationsTestHelpers`
- Array **input** on `SaveLocaleTranslations` / `LocaleTranslationInput`

### SSR

`getLegacy({ locale, context: 'System' })` + linear `prepareContexts` is the right fix. Do not reintroduce a process-wide translations cache.

### Language UseCases

`AddLanguage` and `DeleteLanguage` are real UseCases: settings + translations + events + jobs. Import-predefined CSV stays outside the Mongo TX on purpose (FS). That boundary is documented and correct even if it is operationally awkward.

---

## P0 — will rot the module if left

### A1. The array mammoth is still the internal currency

**HTTP (keep):** `values` is a map. POST AJV: `additionalProperties: { type: 'string' }`. GET runs `toIndexedTranslations`. FE `ClientTranslationSchema.values` is `{ [key: string]: string }`. CSV import patches maps.

**Internal (problem):** `TranslationsQueryService.toLegacyDto` still groups rows into `TranslationType` with `values: TranslationValue[]`. Then:

| Path | What happens |
| --- | --- |
| GET `/api/translations` | arrays → mapper → maps |
| POST `/api/translations` | maps → `prepareLocaleTranslation` → arrays → `flattenLocaleTranslation` → `TranslationEntryInput[]` → domain `Translation` |
| `UpdateEntriesByContext` | `getLegacy` arrays, mutate `context.values` as list, flatten, save |
| `PropagateThesaurusTranslationService` | diffs `values` as `{ key, value }[]` (`ContextLike`) |
| `SaveLocaleTranslations` return type | `TranslationType` (arrays); controller ignores it except `locale`, then `getLegacy`s again |

This is **exactly** the dual-typing bug, relocated. We stopped accepting arrays on the UseCase input. We did not stop *producing* arrays as the write/read interchange format.

`shared/translationType.d.ts` (auto-generated from `translationSchema.ts`) still describes array `values`. `validateTranslation` / that AJV schema have **zero production importers**. POST uses the inline schema in `routes.ts`. The generated type is lying about the HTTP contract and anchoring `getLegacy`.

**What “survives years” looks like:**

- Persistence and domain: flat `Translation`.
- HTTP legacy: maps (until Phase 1b).
- No third shape. Propagate diffs maps or flat snapshots (`getByLanguageAndContext`), not `TranslationValue[]`.
- `prepareLocaleTranslation` either dies or becomes “maps → flat entries” without the array layover.

**Not a test problem.** Production HTTP never sent arrays. The array layer is `i18n.v2` / mammoth reconstruction that we lifted into core instead of deleting.

### A2. Two context-update engines

**Engine 1 — `TranslationContextModel`** (Template, RT, Settings Menu/Filters):

1. `getContext` loads every row for the context.
2. `applyChanges(keyChanges, valueChanges, keysToDelete)`.
3. Rename sets the **default language value to the new key** (`updateDefaultLanguageForRenames`).
4. Persist via bulk insert/update/delete.

**Engine 2 — Thesaurus DS primitives:**

1. Diff thesaurus labels in `ThesaurusTranslationService`.
2. `deleteKeysByContext` / `insert` / `updateKeysByContextV2` (aggregation pipeline: default language value becomes the new key) / `updateContextLabel`.

Both encode “on rename, default language value := new key.” They do it in different layers with different extra rules (thesaurus nested labels, duplicate labels across parents, `keysWithMultipleToOneRename`).

This is the migration-doc risk #1 (“dual `updateContext` semantics”) **still open**. The next feature (e.g. “don’t reset default-language value on rename”) will be implemented in one engine and missed in the other.

**Do not** “fix” this by wrapping Thesaurus DS calls in `TranslationsService`. Thesaurus label identity *is* the translation key — that is domain, and it belongs on the thesaurus module. **Do** make one persistence/domain primitive for “rename keys in a context” and have both engines call it — or fold thesaurus label diffs into `TranslationContextModel` with explicit hooks. Until that happens, the module does not have a single source of truth for context mutation.

### A3. Save paths still load the whole locale

The production CPU incident was GET/SSR. The same `getLegacy({ locale })` is still on:

- `SaveLocaleTranslations` — snapshot previous contexts for propagate (loads System + every template/thesaurus/RT for that language).
- `UpdateEntriesByContext` — **once per language being updated**.
- `SaveTranslationsController` — **again after save** to build the socket/HTTP body.
- `csvLoader.loadTranslations` — **once per CSV language column**, then a final `getLegacy()` of **everything**.

`SaveTranslationEntries` already does the right thing: `getByContext(contextId)` only. Locale save should snapshot **the contexts being written**, not the tenant.

This is not a contract. It is us calling the mammoth query because it was convenient.

---

## P1 — structural, will be copied

### B1. `UpdateTranslationContextUseCase` is not a UseCase

```18:28:app/api/core/application/UpdateTranslationContext.ts
class UpdateTranslationContextUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(...) {
    await this.transactionManager.run(async () => {
      await this.deps.translationsService.updateContext({ ... });
    });
  }
}
```

Callers: V1 `settings.ts` `saveLinksTranslations` / `saveFiltersTranslations` only. No dedicated integration spec (settings tests mock the factory).

Template and RelationshipType already call `TranslationsService.updateContext` **inside the parent UseCase TX**. Settings is the outlier: orchestration (diff of links/filters) lives in V1; the “UseCase” is a transaction shell.

**This is the same smell as the deleted test-only UCs**, except it has a production caller so D11 did not catch it. A UseCase that only opens a TX around one service method is not an application action.

**Directions (do not do all three):**

- Inline `TranslationsService` + `TM.run` in `settings.ts` (honest, ugly, matches today’s ownership).
- Fold Menu/Filters sync into a future `SaveSettingsUseCase` that owns settings row + translations in **one** TX (right long-term).
- Keep a UseCase only if it absorbs `getUpdatesAndDeletes` and the settings write.

**Landed:** first direction. Deleted `UpdateTranslationContextUseCase` + factory. `settings.save` opens one `TM.run`, sets `dbSessionContext` so V1 `settingsModel.save` joins the native session, then `saveLinksTranslations` / `saveFiltersTranslations` call `translationsService.updateContext` with that same TM. Diff logic (`getUpdatesAndDeletes`) stays in V1. Did **not** invent `SaveSettingsUseCase` (would peel validate / `newNameGeneration` / TemplateFacade). `newNameGeneration` template updates stay **after** the TX.

### B2. `saveEntries` vs D5 (“no application Upsert”)

D5 said: no `UpsertTranslationsUseCase`; HTTP may branch create vs update. What shipped:

- HTTP POST `/api/translations` always hits `SaveLocaleTranslations` → `saveEntries`.
- `saveEntries` partitions via `calculateNonexistentKeys` then `insertEntries` / `upsertEntries`.
- `insertEntries` / `upsertEntries` are **public on the service** but **no UseCase calls them**. Only `saveEntries` and unit tests do.

So we deleted the Upsert *UseCase* and kept an Upsert *service method*, then made the UseCase always call it. That is not a create/update split at the edge. It is the old `UpsertTranslationsService` renamed.

**When a partitioner is justified:** a batch of mixed new and existing keys from one HTTP body (locale save, v2 by-item save, CSV). Callers cannot reasonably branch. That is a different scenario from Entities’ explicit Create vs Update UseCases.

**Honest options:**

- Keep `saveEntries` as the named batch write, document it as “batch save, not an Upsert UseCase,” and **stop exporting `insertEntries`/`upsertEntries` as if they were the API** (private, or tests call `saveEntries`).
- Or actually split at HTTP: v2 POST could be “update these keys” (already closer: `upsertEntries` rejects missing keys) vs a create endpoint. Locale POST is inherently mixed.

Current state is the worst of both: D5 in the doc, upsert in the service, extra public methods that exist so `TranslationsService.spec.ts` can call them.

**Landed:** first option. `insertEntries` / `upsertEntries` are private. Public API is `saveEntries` / `createContext` / `updateContext`. Specs call `saveEntries`. D5 still holds: there is no Upsert *UseCase*; mixed HTTP bodies still need one partitioner.

### B3. Three doors into “create translation rows”

| Door | Validates languages exist? | Validates all-languages completeness? | `ensureTransaction`? |
| --- | --- | --- | --- |
| `TranslationsService.insertEntries` | yes | yes | yes |
| `TranslationsService.createContext` | no | no (fans out all langs itself) | yes (after settings read) |
| `ThesaurusTranslationService.create` → `DS.insert` | no | no (fans out via `getInstalledLanguages`) | no |

`createContext` uses `settingsDS.getLanguageKeys()`. Thesaurus uses `getInstalledLanguages()` then `.key`. Same idea, two APIs.

A new key saved through locale POST in **one** language hits `insertEntries` and **will fail** `translationsWillExistsInAllLanguages` unless other languages already exist in DB for that key (`calculateNonexistentKeys` is language-agnostic). Template create never hits that path. That may be the intended invariant — it is not documented, and `createContext` does not share the validator, so nobody can see the rule in one place.

`ValidateTranslationsService.translationsWillExistsInAllLanguages` is also named backwards: `missingLanguages` is populated with languages **present** in the payload/DB, then the real missing set is computed. Copied from `i18n.v2`. Unreadable.

**Landed:** `Translation.forLanguages(context, values, languages)` is the one cartesian product. `TranslationsService.createContext` and `ThesaurusTranslationService.create` use it. Template/RT already went through `createContext`. Thesaurus create still `DS.insert` (D12). Both create paths use `settingsDS.getLanguageKeys()`. They skip `translationsWillExistsInAllLanguages` **because they fan out every installed language**. `saveEntries` (locale/by-item/CSV) still runs that validator: a one-language payload is a real incomplete create.

### B4. `TranslationsQueryService` is two components in one coat

**Keep:** `getLegacy` / `toLegacyDto` (legacy delivery), `getContextValueMap`, `getLanguageValueMaps` (real aggregations used by csvExporter, denormalize, search).

**Noise:** `getAll`, `getByLanguage`, `getByContext`, `getByLanguageAndContext` — one-line DS proxies. `SaveTranslationEntries` and `GetTranslationEntriesController` could use the DS. Users’ query service is not a DS proxy; it maps to a response DTO. Copy **that**, not a pass-through layer.

`TranslationsQueryServiceFactory.default({ cached: true })` is **never passed**. Cache is used only when callers take `TranslationsDataSourceFactory.cached()` (denormalize-thesaurus job, dataviz). The QueryService option is dead API.

**Landed:** removed the four pass-throughs and the unused `cached` factory option. QueryService keeps `getLegacy` / `getContextValueMap` / `getLanguageValueMaps`. Save* UseCases, csvLoader snapshots, and `GET /api/v2/translations` use `TranslationsDataSource`.

### B5. Settings save vs translation TX

```152:158:app/api/settings/settings.ts
    await saveLinksTranslations(...);   // own TM.run via UpdateTranslationContextUseCase
    await saveFiltersTranslations(...); // own TM.run
    const result = await settingsModel.save(...); // separate
```

Translations can commit, then settings save fails. No `translationsChange` socket — connected Settings UI stays stale until refetch. Compare CreateTemplate: template row + translation context in **one** `TM.run`.

**Landed:** Menu/Filters + settings row share one `TM.run`. Socket left as `updateSettings` only — do not dump `getLegacy()` onto settings save just to emit `translationsChange`.

### Other P1 notes

**CSV v1 `loadThesauri`:** V1 `thesauri.save` then a **separate** `UpdateEntriesByContext` TX. Structure and translations are not atomic. Inherited, still true.

**CSV v2 job:** `TM.run` around `ThesauriService.update` (creates default key=label rows), then a **second** `UpdateEntriesByContext` TX for CSV values. Documented as two-pass; still a consistency window.

**AddLanguage sockets:** `translationsChange` fires after clone + **before** predefined CSV import and **before** `CloneLanguageEntitiesJob` finishes. Clients can hydrate an incomplete System context. `translationsInstallDone` is the later signal — easy to get wrong in FE.

**Populate:** no socket; import outside TX; partial languages possible. Historical, but the controller is still a script in HTTP clothing.

**Import CSV route** in `routes.ts` is still an inline handler (not a controller), loops `SaveLocaleTranslations` per language, emits a full mammoth `translationsChange` per locale, then `getLegacy()` of the whole tenant for the response.

**`PropagateThesaurusTranslationService`:** justified (translations → entity metadata). Types are ad-hoc `ContextLike` with optional fields and array values — it is glued to the mammoth snapshot. After A1, this should take `{ locale, contextId, previous: Map, next: Map }`.

**`createContext` `ensureTransaction` order:** settings `getLanguageKeys()` runs *before* the TX check. Failure mode is “read settings then throw,” not “write without TX.” Minor, sloppy.

**RT factory still constructs `TranslationsService` on Delete** even though delete only needs the DS. Harmless wiring, confusing to read.

---

## P2 — dead, duplicate, leftover

### Dead

| Item | Evidence |
| --- | --- |
| `TranslationsDataSource.updateKeysByContext` (v1/v2) + `updateContextLabel` + `deleteKeysByContext` | **Deleted (A2).** Context mutation is `getContext` / `applyChanges` / `updateContext`. |
| `ContextDoesNotExist` | **Deleted (C1).** Was exported from `domain/translation/errors.ts`; never thrown or imported. |
| `app/api/i18n/systemKeys.js` | **Deleted (C1).** Static list with no importers. Predefined keys live in CSV via `defaultTranslations.ts`. Migrations keep local `systemKeys` arrays. |
| `PendingThesauriTranslationsGateway.ts` | **Deleted (C1).** `upsertThesaurusTranslations` had no production importer. csv.v2 uses `UpdateEntriesByContext`. |
| `MongoTranslationsSyncDataSource.get` | **Kept (C1).** Throws `"not implemented"`. Required by `SyncDBDataSource`; `MongoTranslationsSyncHandler` never calls it. Do not implement unless the generic sync contract changes (C4). |
| `UpdateThesaurusUseCase` dep `thesaurusTranslationService` | **Removed (C1).** Factory still constructs it for `ThesauriService`. `execute` only uses `thesauriService`. |

### Duplicate types

- `TranslationEntryInput` (ValidateTranslationsService) vs domain `Translation` — always `new Translation(...)` immediately.
- `LocaleTranslationInput` vs `IndexedTranslations` (LegacyTranslationDtoMapper) — same map-shaped locale doc.
- Domain `TranslationContext` vs shared `TranslationContext` (the latter has `values[]`). Same name, different shapes.
- FE V2 `TranslationValue` (`language, key, value`) vs shared `TranslationValue` (`key, value`). Same name.
- `EntityTranslation` is **unrelated** (per-language entity metadata). Leave it; do not “namespace” it into i18n. The name collision is real but out of scope.

### Folder / test pollution

`app/api/i18n/` after killing the façade (**C2 landed**):

| Keep | Moved or deleted |
| --- | --- |
| `defaultTranslations.ts` (predefined CSV lookup — used by ImportPredefined + AvailableLanguages) | `specs/translations.spec.ts`, `specs/routes.spec.ts`, `specs/fixtures.ts`, `specs/sortByLocale.ts` → `core/application/translation/specs/` |
| `specs/defaultTranslations.spec.ts` + `specs/test_contents/` | `systemKeys.js` — deleted (C1) |

`application/translation/specs/translations.spec.ts` keeps a local `withTranslationWrites` that calls `TranslationsService` / DS inside `TM.run()`. That is the agreed test style (D11). GET assertions use maps (A1). `sortByLocale` is `IndexedTranslations` only.

### DS implementation leftovers (copied from i18n.v2)

- `upsert`: sequential await per document. Fine for small Settings edits; bad for CSV/locale save of large contexts.
- `calculateNonexistentKeys`: `findOne` to see if context exists, then `$setDifference` aggregate. Works; opaque.
- `cloneForLanguage`: cursor + sequential bulk upsert. OK for language install (one-shot).

### `localeTranslationDto.indexedValuesToList`

`filter(key => indexedValues[key])` **drops empty-string values**. A translator clearing a string silently omits the key from the write. Possibly inherited; not tested; dangerous.

### `ImportPredefinedTranslationsService`

A const object `{ execute }` plus two named functions. Fine as a boundary, overdressed as a “service.” Not wrong.

### `AvailableLanguagesQueryService`

Filesystem + `availableLanguages` list. Could live in the controller. Harmless.

---

## Flow-by-flow (production)

### HTTP legacy

| Route | Auth | Path | Notes |
| --- | --- | --- | --- |
| `GET /api/translations` | public | QueryService `getLegacy` → maps | Unbounded if no query. **Contract.** |
| `POST /api/translations` | admin | SaveLocaleTranslations → saveEntries; re-getLegacy; `translationsChange` mammoth | A1 + A3 |
| `POST /api/translations/import` | admin | inline CSVLoader; N TXes; N sockets; full-tenant getLegacy | not a controller |
| `POST /api/translations/populate` | admin | ImportPredefined (no UC, no TX, no socket) | historical |
| `POST /api/translations/setasdeafult` | admin | `settings.setDefaultLanguage` only | typo is contract |
| `POST/DELETE /api/translations/languages` | admin | Add/DeleteLanguage UCs | real UCs |
| `GET /api/languages` | public | AvailableLanguagesQueryService | metadata |

### HTTP by-item

| Route | Auth | Path | Notes |
| --- | --- | --- | --- |
| `GET /api/v2/translations` | public | DS `getAll().all()` | **Entire tenant, no filter, no pagination.** Contract to keep *shape*; load is hostile. `getV2` exists on FE and Settings does not use it. |
| `POST /api/v2/translations` | admin | SaveTranslationEntries; `translationKeysChange` body | Best write path in the module (scoped snapshot). |

### Aggregates

| Action | Translation write | Same TX as aggregate? |
| --- | --- | --- |
| Create/Update Template | TemplateTranslationService → TranslationsService | yes |
| Delete Template | DS `bulkDeleteKeysByContext` + `deleteByContextId` | yes |
| Create/Update RT | RTTranslationService → TranslationsService | yes |
| Delete RT | DS `deleteByContextId` | yes |
| Create Thesaurus | ThesaurusTranslationService → DS.insert | yes (via ThesauriService) |
| Update Thesaurus | ThesaurusTranslationService → DS primitives | yes |
| Delete Thesaurus | DS `deleteByContextId` | yes |
| Settings Menu/Filters | `TranslationsService.updateContext` from V1 `settings.ts` | **yes** (same `TM.run` as `settingsModel.save`) |

### Other

| Caller | Verdict |
| --- | --- |
| SSR `entry-server` | Correct (System + locale) |
| csvExporter / search | Scoped maps (`getContextValueMap`) — good |
| denormalize.ts | `getLanguageValueMaps` = **full language** when not preloaded — hot-path cost, pre-existing |
| dataviz | DS `getByContext` + TranslationCollection — good |
| sync `translationsV2` | Handler deletes by natural key then upsert; bypasses validation — correct for replication |
| sync leftover `preserveTranslations` on namespace `translations` | Dead mammoth branch if still in `sync/routes.ts`; live namespace is `translationsV2` |
| preserve empty thesaurus | CreateThesaurusUseCase — good |

---

## UseCase inventory (after D11)

| UseCase | Production caller | Real orchestration? | Verdict |
| --- | --- | --- | --- |
| `SaveLocaleTranslations` | POST `/api/translations`, csvLoader import | DTO + snapshot + save + propagate | **Keep**, but kill array layover and full-locale getLegacy |
| `SaveTranslationEntries` | POST `/api/v2/translations` | Scoped snapshot + save + conditional propagate | **Keep** (best of the save UCs) |
| `UpdateEntriesByContext` | csvLoader thesauri, csv.v2 job | Multi-locale prep + save + propagate | **Keep**, same getLegacy problem |
| ~~`UpdateTranslationContext`~~ | deleted | TX shell | **Deleted (B1)** |
| `AddLanguage` | POST languages | settings + clone + events + jobs + import | **Keep** |
| `DeleteLanguage` | DELETE languages | guard + settings + DS + event + job | **Keep** |

No unused UseCases remain. The failure mode now is **thin UseCases with a production caller**, not test-only ones.

`insertEntries` / `upsertEntries` are private internals of `saveEntries` (B2).

---

## Comparison with peers (without copying blindly)

### Entities

`EntitiesService.insert` is a service because it coordinates **multiple** write models and post-commit events. `TranslationsService.saveEntries` coordinates validation + partition + one DS. Weaker justification, but not zero: the partitioner is real. **Do not** add `EntitiesService`-style wrapping around Thesaurus deletes.

`ensureTransaction` on Entities exists because many UCs share a wide write API. Copy that **only** onto `TranslationsService`’s remaining orchestrating methods (already done). Do not copy it onto `ThesaurusTranslationService`.

### Thesaurus

Thesaurus is the **better** local pattern for “I am an aggregate and I write my translation rows”: concrete service, DS, parent TM. Template going through `TranslationsService.createContext` is also fine (fan-out is shared via `Translation.forLanguages`). The mistake would be forcing Thesaurus through `createContext`/`updateContext` and losing nested-label diffs — or duplicating the cartesian product (B3 removed that).

### Users

GET → QueryService that **shapes a response**. Translations QueryService now does that for mammoth GET (`getLegacy`) and value-map aggregations. GET v2 is DS → JSON (still unshaped domain dump; mapping can wait for Phase 1b).

### What we wrongly copied from `i18n.v2`

- `toLegacyDto` array contexts as the hub
- `ValidateTranslationsService` as a separate class with inverted names
- `updateKeysByContext` + `updateKeysByContextV2` side by side
- sequential `upsert`
- `save` = partition upsert
- Tests living next to the old module

The hex folders are new. A lot of the *behavior graph* is a move, not a redesign.

---

## Tests: what they protect vs what they distort

**Good:** integration specs that hit factories and assert `translationsV2` (`SaveLocaleTranslations.spec`, `SaveTranslationEntries.spec`, Thesaurus/RT translation specs, Add/DeleteLanguage).

**Distorting:**

- `TranslationsService.spec` covers public `saveEntries` / `createContext` / `updateContext` (B2).
- `application/translation/specs/translations.spec.ts` asserts map GET (`getLegacy`). Local `withTranslationWrites` is D11.
- `denormalization.spec` calling `SaveLocaleTranslations` with a map is **correct** (HTTP shape). It looked surprising only because the test had been using the internal array shape.
- Settings tests still mock `TranslationsServiceFactory` for most cases; one unmocked spec asserts Menu rows in `translationsV2`.

Do not add UseCases or widen types to make a spec compile.

---

## Recommended work order (not done in this audit)

When this gets fixed, do it in this order so we do not invent another dual type:

1. **A1 + A3 — done:** flatten writes from maps; snapshot with `getByLanguageAndContext` / `getByContext`; stop `getLegacy` on save; make propagate map-based. `toLegacyDto` is GET-only maps.
2. **A2 — done:** one rename/delete/create primitive for a context (`TranslationContextModel` + `updateContext`); Thesaurus label diffs call it. Deleted `updateKeysByContext` v1/v2, `updateContextLabel`, `deleteKeysByContext`.
3. **B1 + B5 — done:** Settings Menu/Filters in the same TX as settings save. Dropped `UpdateTranslationContextUseCase`. No `SaveSettingsUseCase` this slice.
4. **B2 — done:** `insertEntries`/`upsertEntries` private; `saveEntries` is the batch API. Documented vs D5 (no Upsert UseCase; mixed bodies still partition).
5. **B3 — done:** `Translation.forLanguages` for Template/RT (`createContext`) and Thesaurus create. Validator stays on `saveEntries`; create-context paths skip it because they fan out.
6. **B4 — done:** QueryService = aggregations + legacy GET mapper. Controllers/DS for the rest. Removed unused `cached` option.
7. **C1–C2 — done:** deleted dead files/deps (`ContextDoesNotExist`, `systemKeys.js`, `PendingThesauriTranslationsGateway`, unused UpdateThesaurus translation-service dep). Kept sync `get()` stub (`SyncDBDataSource`). Moved i18n parity/routes specs under `core/application/translation/specs/`. `i18n/` is predefined CSV only.

Do **not** start with renaming more services or adding `ensureTransaction` to the DS.

---

## Explicit non-problems (for the next review)

- Public GET without auth — product contract for public sites.
- `POST /api/translations/setasdeafult` typo — contract.
- Dual HTTP APIs (mammoth vs by-item) until Phase 1b — D6/D7.
- ImportPredefined outside Mongo TX — FS/CSV.
- Propagate after commit — same as thesaurus entity denorm jobs; metadata is eventual.
- Sync bypassing `ValidateTranslationsService` — replication.
- `EntityTranslation` name — different subdomain.
- Port and class both named `TemplateTranslationService` with a `*Port` alias — TypeScript tax, acceptable.
- Thesaurus having no domain port — concrete class is enough; do not invent a port for symmetry.

---

## Inventory of translation-owned files (core)

```
domain/translation/          Translation, Collection, ContextModel, Diff, index helpers, errors
domain/template/             TemplateTranslationService (port)
domain/relationshipType/     RelationshipTypeTranslationService (port)

application/translation/     TranslationsService, QueryService, Validate, locale DTO,
                             ImportPredefined, Propagate, AvailableLanguages
application/templateTranslationService/
application/relationshipTypeTranslationService/
application/thesaurusTranslationService/
application/SaveLocaleTranslations.ts
application/SaveTranslationEntries.ts
application/UpdateEntriesByContext.ts
application/AddLanguage.ts / DeleteLanguage.ts
application/contracts/TranslationsDataSource.ts

infrastructure/mongodb/translation/
infrastructure/express/translation/
infrastructure/express/language/
infrastructure/factories/Translations* + Save* + Propagate + AvailableLanguages
```

Callers outside that tree are listed in the flow section. `app/api/i18n/` should not be a home anymore; it still is for specs and predefined CSV.

---

## One-line standard for the next change

If a change exists to make a test compile, to “be consistent with Entities,” or to wrap a single DS call in a new type — it is the wrong change. If a change removes a shape, a second engine, or a UseCase that only opens a transaction — it is the right change.
