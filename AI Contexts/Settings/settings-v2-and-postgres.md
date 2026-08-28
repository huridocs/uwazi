# Settings → V2 hex + Postgres

## Objective

Give Settings the same two-step treatment as relationship types and translations:

1. **V2 hex in `app/api/core`**, still on Mongo `settings`, same public HTTP.
2. **Postgres cutover** behind a per-tenant flag, one store, no dual-write.

This is the planning doc for both phases. Pattern sources: [`../Relationship Types/relationship-types-v2-migration.md`](../Relationship%20Types/relationship-types-v2-migration.md), [`../Relationship Types/relationship-types-postgres.md`](../Relationship%20Types/relationship-types-postgres.md), [`../Translations/translations-v2-migration.md`](../Translations/translations-v2-migration.md), [`../Translations/translations-postgres.md`](../Translations/translations-postgres.md).

## Status

- **Phase 1 (V2 hex, Mongo)** — **done.** Review queue below is all `[x]`. Core owns reads/writes. Factory uses `ExecutionContext.transactionManager` only (no TM fallback). Tests that need a settings DS outside HTTP/jobs use `SettingsDSWithContext` from `testingEnvironment` — they do **not** wrap Jest globally and they do **not** import `SettingsDataSourceFactory` for fixture patches. V2 adapters that already have a TM take an injected `settingsDS`.
- **Phase 2 (Postgres)** — **in progress.** Contract is locked (`readFields` / `readFeature` / `readSyncConfig`, slice columns not `SELECT document`). Schema is **017** (016 is entities published default).

Do not re-investigate these; they are done and should stay this way:

- No `SettingsService`. Inject `settingsDS` (with the TM you already have).
- Factory uses `ExecutionContext.transactionManager` only (no TM fallback).
- Tests that patch settings fixtures use `SettingsDSWithContext`. Do not wrap Jest globally. Do not import the factory just to seed fixtures.
- PG DS does not mint `_id`. Copy preserves Mongo `_id`. Upsert conflict is `tenant_id`.
- Sync handler is the existing DS-backed class. Factory branching on `postgresSettings` is enough.
- Dual-backend tests must pass `postgresMirror: ['settings']` explicitly. Do not add `settings` to default `MIRRORED_COLLECTIONS` (settings fixtures include entities that are not PG-ready).
- JSONB `links` store `_id` as hex strings. `custom` is JSONB — objects only, not a string.

### Phase 2 progress

- [x] Schema `017-create-settings-table.sql` (`settings` + RLS in the same migration)
- [x] `PostgresSettingsMapper` + specs (columns, JSONB groups, `extras`, drop `__v`)
- [x] `PostgresSettingsDataSource` + specs (CRUD, singleton `tenant_id`, RLS as `app_user`, projections)
- [x] Feature flag `postgresSettings` (config / tenantContext / tenantsModel; local via `FEATURE_FLAG_POSTGRES_SETTINGS=true`)
- [x] `SettingsDataSourceFactory` branches on the flag; `cached()` returns the PG DS when on
- [x] Sync handler stays DS-backed (`MongoSettingsSyncHandler` + factory). No separate PG handler — inbound still patches the tenant singleton via `SettingsDataSource`.
- [x] `SettingsMigrationConfig` + CLI `--collection settings` (fail on 0 or >1 Mongo docs)
- [x] Dual-backend `SaveSettings.spec` (`describe.each`). Remaining: HTTP routes, `newNameGeneration`, add/delete language.
- [ ] Local dry-run: schema → copy → flag → GET/POST / links / languages / filters / public vs admin

---

## First review (2026-08-26)

Developer notes, **verbatim**. Interpretation, corrections, and TODOs follow in the next subsection. No code was changed for this review.

### Developer questions (raw)

- Why ajv?  I thought there is a very clear directive to use zod and where in the path (useCases, controllers, etc.) should they reside upon.  This should be part of the Settings v2 migration, and a big part of it.
- I think we need a more "pure" approach to this.  I understand settings is sometimes orchestrating things from other logics, but I think we need to be a little more organized.  `ensureLinkIds` really doesn't seem like a "settings" problem.  A helper, sure.  A util? See how other modules are doing this, but polluting the saveSettingsUseCase with an ensureLinkIds seems like the wrong thing to do.  Please argue against this if you think it's the right path, I don't want praise of "uh, you are very clever", I want your opinion on why this should or should not be there.
- This last point is even more critical for the template save orchestration upon changing of the newNameGeneration.  Surely this is a purely TEMPLATE issue, that is templates the one that should know how to do, not settings.  Maybe we create a tech debt for this (don't create any issues for me, I'll do that), but this seems like the wrong thing to do when saving settings.  Maybe I'm wrong.
- Same point 2 for "links" (which is also a name I think is terribly picked... these are menu items in the navbar, the fact that they are links is a secondary side effect of what is stored as value... these are menu items!  The routes probably would need to stay, but the internal naming not necessarily)
- Same for sync... we probably want a separate sync module altogether... we are not doing this right now, but to keep in mind
- We are moving to a safe-first type of approach.  Can we make it here so that omitHiddenSettingsFields (which I don't really like the name... they are not hidden, lets go with omitPrivate ? What do you think) is a de-facto applied and not a thing you need to remember everytime to exclude?  For example, the `patch` flow you introduced, after upate, returns a raw .get with all the data, including passwords, so the SaveSettingsUseCase actually returns all that to the client.  Do we want that? Maybe yes, I'm leaning towards "probably not".  That's why you are having to call a return with omitHiddenSettings nested with applyDefaults in so many places.  This seems like a smell and not ideal that the developer needs to remember to do all these things.  UpdateFiltersNameUseCase is apparently also returning everything?
- The filterTree (why tree?) has remove and rename.  How are append, or add or create paths handled?
- getForHttp is also a name I don't like... why http is different? Not because of the protocol, but because of who consumes it.  So getPublic, getClientVisible, getPermitted, getAllowed?  Lets align. Ask for this with your suggestions
- Here's maybe a more critical thing: What is the restrictions applied to UseCases inside the Agents.md file?  Can we simply use UseCases like you are doing in the TemplateMutationController? Or is that a violation of instantiating UseCases?  And that one appears like a really glaring security problem: that updateSettings is being broadcasted to all connected clients, but this includes ALL the settings!  Is this reading correct? Maybe that was already the case, but I think that mongo's defaults came to the rescue... here they are not.  Maybe we need to do a much more indepth search into how we are dealing with returns of this settings? Maybe that is the problem of wildly using UseCases outside of their scoped intended use case?
- Same problem with DeleteTemplateController
- What is this TM resolver in SettingsDataSourceFactory???
- On TaskService.ts (IXTaskService you getDefaultLanguage then .key, but on another location you have a dedicated method detDefaultLanguageKey, do we need both approaches? Can we be consistent?  Maybe we don't need that extra method and extract the key like here on other places? Lets be consistent and tidy up all these nonsense
- We store in Settings things like the custom CSS and JavaScript of the collection.  I can see places like the tocService that is getting the settings to extract { features }, but for that it needs to load ALL the custom CSS that can be text of multiple Kbs. Same for the languageMiddleware.  Not limited to these two scenarios, just examples. I think this is a problem we should try to address on this development and, at least those two and Sync, we should ONLY returned when specifically asked for, and not excluded only when someone remembers to exclude them.  Obviously this needs to survive partial updates, and I don't know how PG is going to work with that, mongo more or less does it natively

### Interpretation

This is one problem with several symptoms: **Settings is still a singleton dump of unrelated concepts**, and the first V2 cut treated that dump as the application model. Use cases, QueryService, sockets, and “omit after read” are all ways of living with the blob instead of splitting **who may see what** from **what a given caller needs**.

The migration is not “move `settings.save` into a use case.” It is: stop having one document-shaped API in the core. HTTP paths can stay ugly; the core should not.

#### What is more important (priority)

1. **Safe-by-default outputs (sockets + use-case return types).** Highest. This is the only item that can leak credentials/config to every connected client. It is also the smell behind `omit* + applyDefaults` copied through Save / SetDefaultLanguage / filter UCs.
2. **Opt-in reads (projections), not opt-out.** Highest for *this* development, not a later polish. `languageMiddleware` and `tocService` loading `customCSS` / `customJS` (multi-KB) to get languages or `features` is the frankenstein made expensive. Sync passwords on the same document is the same rule: **absent unless asked**. This must be designed on the **port** now, or Postgres `SELECT document` will clone the problem.
3. **Zod at the use-case boundary** (and controller DTO only if HTTP needs a different shape). Explicit V2 rule in AGENTS.md (`Input` may include Zod, e.g. `MultiUpdateEntity.InputSchema`). AJV was cargo-culted from V1 `validateSettings` / `emitSchemaTypes`. This is a large, intentional part of Settings V2, not a follow-up.
4. **Concept boundaries and names** (navbar menu items, filters, sync-as-a-later-module). Internal naming can move without changing `/api/settings/links`. Sync extraction is **not** this slice; the read model must still treat `sync` as a dedicated slice so we do not keep dragging it through QueryService.
5. **`newNameGeneration` → templates.** Real layering bug (`SaveSettings` → `TemplateFacade` → v1 templates). Acceptable as **named tech debt** if templates are not opened in this slice; not acceptable as “Settings knows how to rewrite every template.”
6. **`ensureLinkIds` off `SaveSettings`.** Correctness is fine; placement is the V1 god-save. Follows menu-item naming.
7. **TM fallback in `SettingsDataSourceFactory`.** Compatibility hack; delete once callers have ExecutionContext.
8. **`getDefaultLanguage` vs `getDefaultLanguageKey`.** Tidy while touching reads; not architectural. Do not invent a third helper.

#### Wrong or incomplete assumptions

- **“Mongoose defaults came to the rescue on `updateSettings`.”** Only for fields that were `select: false`: `sync` (passwords), `evidencesVault`, `publicFormDestination`. **`mailerConfig` (SMTP secrets), `contactEmail`, `customCSS`, `customJS`, `features` were already on V1 `settings.save()` / `updateFilterName` returns** and were already socketed from template mutate/delete. Native `findOne` made the *select:false* trio easier to leak if someone returns `SettingsDataSource.get()` / `patch()` raw. It did **not** newly invent broadcasting mailer/CSS. The template controllers are still wrong relative to `SaveSettingsController`, which sockets **`getPublicSettingsPayload`**.
- **`SaveSettingsUseCase` “returns all that to the client” including sync passwords.** As written, `execute` returns `omitHiddenSettingsFields(applySettingsDefaults(saved))`, so **`sync` / `evidencesVault` / `publicFormDestination` are stripped** before HTTP POST JSON. `patch()` itself **does** return the raw document (passwords included). The bug is **layering**: persistence `get()` is a full row; delivery was supposed to remember to omit. `UpdateFilterName` returns that SaveSettings output — **not** sync passwords, **yes** mailerConfig, CSS, JS, features, languages, filters, …
- **`TemplateMutationController` using `UpdateFilterNameUseCaseFactory.default().execute()` is a UseCase instantiation violation.** It is **not**. AGENTS.md: factories are the wiring; ExecutionContext is **only** for factories; controllers are delivery adapters and **should** call `Factory.default()`. The violation would be `new UpdateFilterNameUseCase(...)` or `ExecutionContext.transactionManager` inside the controller. The *real* smell is **using a command whose output is “the settings document” as a socket payload** from a **template** flow — wrong output type for that consumer, not a forbidden Factory call.
- **`filterTree` is missing append/create.** Collection UI **POSTs the whole `filters` array** through `SaveSettings`. Remove/rename exist as extra use cases because **template rename/delete** must patch nested ids without the Settings screen. There is no “add filter” use case because that is not a separate application action today.
- **“getForHttp is different because it is HTTP.”** The boolean is **who the actor is** (admin vs everyone else), plus a public whitelist. Mixing that with protocol in the name hid that QueryService is doing **authorization shaping**, not transport.

#### Further assumptions drawn from this review

- Settings is **not one aggregate**. Languages, navbar, library filters, feature flags, mail, sync credentials, and theme assets share a **storage row**, not a **domain**. V2 use cases per *HTTP verb on /api/settings* still treat them as one thing. The review is asking to model **slices** (and later modules) even while Mongo/PG keep one row.
- **Safe-first** means the default application read is never the persistence row. `SettingsDataSource` may return secrets; **nothing above it should, unless the call is explicitly `readSyncConfig()` / `getPrivateFormDestination()` / etc.** Developers should not be able to “forget omit.”
- **Postgres:** `document JSONB` can still `SELECT document` and pull CSS every time. Opt-in is `document->'languages'`, generated columns, or a port method `read(paths)`. Partial `$set` in Mongo and `jsonb_set` / `document ||` in PG both preserve unmentioned keys **if the write is a patch of a slice**, not a full-document replace. The first cut’s `patch({ ...incoming })` is already a field `$set`; fat **reads** are the gap, not fat writes.
- `SaveSettings` calling `TemplateFacade` is a **core → v1_layer** dependency from the wrong module. Even a “use case tells the full story” argument only justifies **dispatching** “apply new name generation,” not implementing template walks inside Settings.
- **AJV is gone from Settings.** `validateSettings` had no remaining callers. Comparison with the other three blobs:

  | Module | JSON schema + `emitSchemaTypes` | AJV at runtime | Types consumed as |
  | --- | --- | --- | --- |
  | Entities | `entitySchema.ts` (no Ajv import) | No — V1 `validateEntity` is gone; core has `domain/entity/Entity` | generated `entityType.d.ts` |
  | Templates | `templateSchema.ts` (constructs unused `Ajv`) | No — core has `domain/template/Template` | generated `templateType.d.ts` |
  | Users | `userSchema.ts` (no Ajv; `UserRole` enum is the live export) | No — core has `domain/user/User` | generated `userType.d.ts` |
  | Settings | **deleted** `settingsSchema.ts` | **deleted** | hand-written `settingsType.ts` |

  Emit-types is still how entities/templates/users present **shared DTO** types. That pipeline is not the Settings contract anymore. Input validation is Zod on the use-case (`SaveSettingsInputSchema`). Do not regenerate Settings types via `yarn emit-types`.

#### Opinions asked for

**`ensureLinkIds` on `SaveSettings` — should not stay there.**  
Stable `_id`s exist so Menu/Filters translation diffs can match rows (`toString()` on `_id`). That is a **navbar menu item identity** rule (mongoose used to auto-`_id` subdocs). Reimplementing mongoose in the nearest use case is how V1 logic spreads. A helper/util is fine; a `NavbarMenu` / menu-item collection that assigns ids on write is better. Putting it on `SaveSettings` teaches the next person that “settings save” is the place for every nested-array quirk.

**`newNameGeneration` template rewrite — you are not wrong.**  
The flag lives on settings; the **meaning** of the flag is “template property `name`s are generated with the new algorithm.” Templates must own the algorithm. Settings may **notify** (event) or **call a template use case** when the flag flips false→true. Walking all templates via `TemplateFacade.update` inside `SaveSettings` is the wrong owner and the wrong layer. Tech debt is reasonable **if** it is an explicit “Templates: apply newNameGeneration” ticket you file — not if the code stays unnamed in Settings.

**`omitHidden` vs `omitPrivate`.**  
`hidden` is mongoose `select: false` jargon; drop it. `omitPrivate` is better and still **the wrong primitive**: it is an opt-out after a full load. Prefer a **positive** default (`getPublic()` / `getForAdmin()` that never had secrets). If we keep an omit helper for a transition, `omitPrivate` is the rename. Also: today’s list is **not** all private data — `mailerConfig` is private in the English sense and is **not** omitted.

**`getForHttp` naming (suggestion).**  
Do **not** keep a protocol word. Do **not** keep a single `isAdmin` function that merges three policies (public whitelist, admin extras, `themeCustomization`). Split:

| Suggested | Meaning |
| --- | --- |
| `getPublic()` | Unauthenticated / non-admin client: whitelist only (today `getPublicSettingsPayload`) |
| `getForAdmin()` | Admin UI: public ∪ admin-only fields that are **not** secrets (`mailerConfig`, `contactEmail`, `publicFormDestination`, `features`, …). Explicit allowlist, not “everything minus three keys.” |
| `readSyncConfig()` | Server-only; passwords. Never sockets, never QueryService default. |

Avoid `getClientVisible` (client = browser vs API is ambiguous). `getPermitted` / `getAllowed` need an actor parameter to be honest — then they collapse to the two methods above plus server-only slices.

**UseCases in AGENTS.md vs TemplateMutationController.**  
Allowed: factory in a controller. Not allowed: ExecutionContext outside factories; use cases as generic “get me the settings blob.” Output of `UpdateFilterName` / `RemoveTemplateFromFilters` for sockets should be **`getPublic()`** (or a dedicated `NavbarAndFiltersChanged` DTO), never the command’s persistence result.

**TM resolver.**  
`ExecutionContext.getStore() ? EC.transactionManager : TransactionManagerFactory.default()`. Added so mailer / languageMiddleware / tests without `runWithContext` would not throw after the V1 sweep. It **violates** “factory defaults come from ExecutionContext.” It is not a Settings-domain concept. **Remove it.** Production callers that actually run outside request/job context (legacy `tenants.run` loops) must be given a real `ExecutionContext` (`runInJobContext` or HTTP middleware) — that is fixing production, not a factory compatibility shim. Tests wrap `testingEnvironment.runWithContext()`.

#### Tests do not mandate production code

Nothing in production exists to make the current tests pass as they are. If a test needs a particular shape, flow, or method, **change the test**, adapt the assertion, or add a test helper. Do **not** keep or add production branches, fallbacks, aliases, or return types whose reason is “so mailer / languageMiddleware / tests without `runWithContext` would not throw after the V1 sweep.” Even when the resulting production code would still satisfy factory defaults, it is the wrong owner: tests follow the core, the core does not follow tests.

That includes:

- TM / ExecutionContext fallbacks so a spec can call `Factory.default()` after `setUp()` without wrapping context.
- Keeping `QueryService.get()` / `getDefaultLanguage()` / `omitHidden*` because existing specs import them.
- Returning a fat settings document from a use case so a controller test can socket the UC output unchanged.
- AJV (or any other) error-message compatibility in production to match an old `validations[0].message` string.

If a test was taking advantage of a particularity that is gone (mongoose `select: false`, implicit TM, omit-after-read), the test is wrong, not the new boundary.

**`getDefaultLanguage` vs `getDefaultLanguageKey`.**  
Keep **`SettingsDataSource.getDefaultLanguageKey()`** — that is already the V2 convention (Add/DeleteLanguage, translations, entities, CSV v2, dataviz, IX-adjacent core). **Delete** `SettingsQueryService.getDefaultLanguage()` as a V1 shim. Callers that did `getDefaultLanguage().key` (TaskService, InformationExtraction, preserveSync, csvLoader tests) should call `getDefaultLanguageKey()`. Do **not** standardize on “load the whole settings object and pick `.key`.”

#### TODOs (work queue, no tickets created)

- [x] **P0 — Inventory every settings return path** — table below. Template mutate/delete vs `SaveSettingsController` socket mismatch confirmed (UC blob vs public payload).
- [x] **P0 — Safe-by-default:** DS `get`/`patch` stay full-row (persistence). Use cases / QueryService **never** return `sync` / vault / other secrets. Delivery adapters must not re-fetch raw DS for sockets. Template mutate/delete emit **public** payload if filters changed; filter UCs return `boolean`.
- [x] **P0 — Replace “omit after full read”** with allowlisted `getPublic` / `getForAdmin` and server-only slice methods. `hidden` is gone. Admin POST JSON includes `mailerConfig` for the saving admin only — not on sockets.
- [x] **P0 — Projection port:** `readFields`, `readFeature`, `readSyncConfig()`. `languageMiddleware`, `tocService`, and sync use slices. Writes remain patch-of-provided-keys so CSS/JS/`sync` survive. JSONB path reads should match this port (`document->'languages'`, not only `SELECT document`).
- [x] **P1 — Zod:** `SaveSettings` / menu-item save / `SetDefaultLanguage` / filter UCs have `InputSchema`. Controllers parse HTTP with the same schema.
- [x] **P1 — AJV / emit-types:** Deleted `settingsSchema.ts` and generated `settingsType.d.ts`. Types live in `settingsType.ts`. Runtime validation is Zod only.
- [x] **P1 — Internal names:** menu-item helper + `SaveMenuItemsUseCase`. HTTP `/api/settings/links` stays. `sync` is isolated on `readSyncConfig()`.
- [x] **P2 — `ensureLinkIds`:** `assignMenuItemIds` on the menu-item write path, not a `SaveSettings` private method.
- [x] **P2 — `newNameGeneration`:** Settings flips the flag; `TemplateFacade.applyNewNameGeneration` owns the template walk. File the templates ticket separately.
- [x] **P2 — Remove `resolveTransactionManager` fallback.** Factory uses `ExecutionContext.transactionManager` only. Tests wrap `runWithContext`. Legacy `tenants.run` job loops that read settings use `runInJobContext`.
- [x] **P3 — One default-language API:** `getDefaultLanguageKey()` only; QueryService `getDefaultLanguage()` is gone.
- [x] **P3 — `filterTree`:** renamed to `libraryFilters`. Create = `SaveSettings({ filters })`. No append UC.

#### Return-path inventory (2026-08-26)

| Caller | Today | Intended audience | Target |
| --- | --- | --- | --- |
| `GET /api/settings` | `getForHttp(isAdmin)` | browser, public vs admin | `getPublic()` / `getForAdmin()` |
| `POST /api/settings` JSON | UC `omitHidden(applyDefaults(saved))` | saving admin | UC / controller: `pickAdminFields` (mailerConfig yes, sync never) |
| `POST /api/settings` socket | `getPublicSettingsPayload(saved)` | all connected clients | keep public |
| `GET /api/settings/links` | `QueryService.get().links` | any authenticated? currently unauthenticated GET | public `links` slice |
| `POST /api/settings/links` JSON / socket | UC blob / public payload | admin / all clients | admin JSON + public socket |
| `POST /api/translations/setasdeafult` | UC blob on JSON **and** socket | admin / all clients | admin JSON + **public** socket |
| Add/Delete language sockets | `QueryService.get()` (omitHidden, includes mailer/CSS) | all clients | `getPublic()` |
| Template mutate/delete sockets | `UpdateFilterName` / `RemoveTemplateFromFilters` UC output | all clients | `getPublic()` if filters changed; UC returns `boolean` |
| SSR `entry-server` | `QueryService.get()` then `shapeSettingsForSSR` | HTML / Redux | `getPublic` / `getForAdmin` + tenant feature flags (do not hydrate preserve tokens for non-admin) |
| Outbound sync `processNamespaces.settings()` | DS `find()` then `{ _id, languages }` | sync peer | `readFields(['languages'])` (Mongo still includes `_id`) |
| Inbound `MongoSettingsSyncHandler` | DS `find` / `patch` | server | keep full-row persistence |
| `syncWorker` | DS `find()` then `stored.sync` | server | `readSyncConfig()` |
| `languageMiddleware` | `QueryService.get()` → `languages` | request | `readFields(['languages'])` |
| `tocService` | `QueryService.get()` → `features` | job | `readFeature('tocGeneration')` |
| mailer / contact / OCR / IX / preserve / … | `QueryService.get()` for one field | server | `readFields` / `readFeature` / `getDefaultLanguageKey()` |

---

## Why Settings is different

It is **one document per tenant**, not a collection of named rows. The Mongo collection is schemaless (legacy mongoose `strict: false`). Several fields are HTTP secrets (`publicFormDestination`, `sync`, `evidencesVault`). All reads/writes go through core (`SettingsDataSource` / use cases / query service). Language add/delete stay on the existing `AddLanguageUseCase` / `DeleteLanguageUseCase`.

| Aspect | Settings | Closest PG module |
| --- | --- | --- |
| Cardinality | **Singleton** per tenant | Nothing else; users/thesauri are many rows |
| Shape | Large nested blob (`languages`, `links`, `filters`, `features`, `sync`, …) | Templates mix columns + JSONB; usergroups `members` JSONB |
| Schema | Mongoose `strict: false` (unknown keys exist, e.g. `evidencesVault`) | Must round-trip extras — JSONB, not a frozen column list |
| Secrets | `publicFormDestination`, `sync`, `evidencesVault` (`select: false`); admin GET opts into `+publicFormDestination` only | Application-layer whitelist stays (`publicSettings.ts`) |
| Translations | Menu / Filters contexts updated on save | Same `TranslationsService.updateContext` as today |
| Sync | Namespace `settings` via `MongoSettingsSyncHandler` | Inbound POST **applies onto the existing singleton `_id`**. Outbound `processNamespaces.settings()` sends **`{ _id, languages }` only** |
| ES | None | Same as thesauri / relationship types / translations |
| HTTP | `GET/POST /api/settings`, `GET/POST /api/settings/links` | Stable, like `/api/relationtypes` |

**Do not** copy Entities’ partial flag. **Do not** normalize `languages` / `links` / `filters` into child tables in v1 — every language mutation today is `$push` / `$set` / `$pull` on the same document.

---

## Current architecture (after Phase 1)

```
HTTP /api/settings*                    Other callers (mailer, IX, templates, …)
        │                                          │
        ▼                                          ▼
 core express controllers              QueryService / use-case factories / DS
        │                                          │
        ▼                                          ▼
 SaveSettings / SetDefaultLanguage / filter UCs / SettingsQueryService
        │
        ▼
 SettingsDataSource (MongoSettingsDataSource)
        │
        ▼
 Mongo collection `settings`
```

- **`SettingsQueryService.getPublic()` / `getForAdmin()`** — allowlisted reads. No `get()`, no omit-after-read.
- **`SettingsDataSource.find()` / `get()` / `patch()`** — persistence; full row including secrets. `find()` returns null; `get()` throws if missing; `patch()` is a `$set` merge onto the singleton. Document projections are `read*` (`readFields`, `readFeature`, `readSyncConfig`). Derived values stay `get*` (`getDefaultLanguageKey`, `getLanguageKeys`).
- **Language HTTP** uses `AddLanguageUseCase` / `DeleteLanguageUseCase`, then `getPublic()` for `updateSettings`.
- **Template HTTP** uses `UpdateFilterNameUseCase` / `RemoveTemplateFromFiltersUseCase` (boolean); sockets emit `getPublic()` when filters changed.
- **Secrets** live in Mongo. Nothing above the DS returns them unless the call is explicitly `readSyncConfig()` (or a future destination/vault getter).

### Public HTTP (must stay)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/settings` | Admin: stored doc (minus `sync`/`evidencesVault`) + `publicFormDestination` + public payload overlay. Others: `getPublicSettingsPayload` whitelist |
| POST | `/api/settings` | Admin. Socket `updateSettings` with **public** payload |
| GET | `/api/settings/links` | `settings.links` |
| POST | `/api/settings/links` | Body is the links array; **partial** `$set` of `links` onto the stored singleton |

Socket: `updateSettings`.

Callers that previously imported `#api/settings` now use `SettingsQueryServiceFactory` (safe reads), `SettingsDataSourceFactory` (secrets / language mutators / sync), or the save/filter/links use-case factories.

---

## Transferable principles

| Principle | Apply to Settings |
| --- | --- |
| Stable external contract | Paths, GET whitelist, sockets, AJV save rules stay |
| Hex in `app/api/core` | Domain / use cases / contract / adapters / factories / express |
| No application upsert | Explicit Save / SetDefaultLanguage / SaveLinks / filter mutators |
| Contract-driven side effects | Menu/Filters translations via `TranslationsService`, not a settings-owned i18n façade |
| Integration-first tests | DB assertions; auth mock OK at routes |
| One store + flag/copy/cutover | After V2; no dual-write of the settings row |
| Mixed Mongo+PG is not 2PC | Same P12 as translations: one `this.transactionManager.run()`; no DualStore |

---

## Phase 1 — V2 hex (Mongo)

### Goal

Core owns Settings **reads and writes**. `app/api/settings` becomes a thin re-export or is deleted. Collection stays `settings`. No Postgres in this phase.

### Expand `SettingsDataSource`

Today the contract is a language/feature helper. It has to become the persistence port for the singleton:

- `get()` — full document (including secrets). Public shaping stays in HTTP / `publicSettings.ts`, not in the DS.
- `save(settings)` — replace the singleton (preserve `_id`).
- Existing language mutators stay (AddLanguage / DeleteLanguage already depend on them).
- Filter/link helpers can be use-case logic on `get` + `save`, or DS methods if they stay `$` operators. Prefer **load → domain change → save** so Mongo and PG share one path. The singleton is small.

`get(query, select)` mongoose projections are an HTTP/admin concern. Do **not** put `+publicFormDestination` string syntax on the port. Admin vs public is `publicSettings.ts` + an explicit “include destination” flag on the GET controller.

### Use cases (mutations)

| Use case | Replaces | Side effects |
| --- | --- | --- |
| `SaveSettings` | `settings.save` | AJV (or domain invariants); Menu/Filters `TranslationsService.updateContext`; if `newNameGeneration` flips on → template name-generation update (today `TemplateFacade.update`) |
| `SaveSettingsLinks` | `POST /api/settings/links` | Merge `links` onto stored doc, then same translation path as save |
| `SetDefaultLanguage` | `settings.setDefaultLanguage` / translations `setasdeafult` | Languages array only |
| `UpdateFilterName` | template rename | Nested filters; translations via save path |
| `RemoveTemplateFromFilters` | template delete | Nested filters; translations via save path |

Language add/delete **already exist** — do not create a second pair. Point leftover V1 `addLanguage` / `deleteLanguage` at the DS or delete them.

GET `/api/settings` and GET links: **QueryService or thin controller → DS.get()**. No `GetSettingsUseCase` (do not copy RT’s Get* use case).

### HTTP

Reimplement `/api/settings*` as core controllers (Zod where useful, same I/O). Keep `updateSettings` socket + public payload overlay.

### Sync (still Mongo)

Settings is the last major namespace on raw ODM (`models.settings().save`). Inbound `/api/sync` **forces** `data._id` to the target singleton `_id`. Outbound only `{ _id, languages }`.

**Do this in Phase 1:** `SettingsSyncHandler` + registry entry for `settings`, preserving:

1. Target `_id` rewrite (singleton).
2. Merge/replace semantics of today’s ODM save (inbound payload is usually languages-only).
3. Outbound `processNamespaces.settings()` still `{ _id, languages }` until product says otherwise.

Then Phase 2 is a factory flag, not a new sync protocol.

### Tests

Integration-first: save + Menu/Filters translation keys, links merge, default language, filter nest, public vs admin GET, `newNameGeneration` template touch, sync `_id` rewrite. Dual-backend `describe.each` comes in Phase 2.

### Phase 1 non-goals

- Postgres schema, flag, copy CLI
- Changing GET whitelist or exposing `sync` / `evidencesVault` on GET
- Changing outbound sync to a full document
- Frontend Settings UI rewrite
- Child tables for languages/links/filters

---

## Phase 2 — Postgres

**Prerequisite:** Phase 1. The factory cannot switch a mongoose `settingsModel.save` that other modules still call.

### Locked decisions

| ID | Decision |
| --- | --- |
| S1 | PG table **`settings`**. Sync namespace stays **`settings`**. |
| S2 | **`tenant_id` is PRIMARY KEY** (singleton identity). RLS is `tenant_id = current_tenant()` only — never `AND _id`. |
| S3 | **`_id TEXT NOT NULL` is a sync surrogate**, not identity. 24-char ObjectId hex. Copy **preserves** Mongo `_id`. `SyncLogWriter` / updatelogs still use it. Inbound settings handler **ignores** payload `_id` and patches the tenant row. Do not special-case the settings namespace to drop `_id`. `PostgresTable` upsert conflict is `{ columns: ['tenant_id'] }`. |
| S4 | **No single `document` blob.** Slice columns + semantic JSONB groups (mail, analytics, map, branding, site_preferences). Unknown Mongo keys go in **`extras JSONB`**, not `custom`. `__v` dropped on copy. |
| S5 | RLS + `tenant_isolation` in the **same** schema migration as `CREATE TABLE` (next delta: **017** — 016 is entities published default). |
| S6 | One store. Copy Mongo → PG, flip `postgresSettings`. No dual-write of the settings row. Flag is **one-way** after any PG write. |
| S7 | New row (blank tenant) mints `_id` via `IdGenerator` in the use case / DS factory wiring — **not** `new ObjectId()` inside the PG DS. |
| S8 | Language `$push`/`$pull` become read-modify-write of the **`languages` JSONB column** inside the PG TM (singleton). Do not add a `settings_languages` table in v1. |
| S9 | `cached()`: when the flag is on, return the same PG DS as `default()` (translations pattern). Optional later: cache `languageKeys` with `onCommitted` clear — not required to ship. |
| S10 | Sync handler factory branches on the same flag. Inbound still applies onto the tenant singleton (ignore payload `_id`). Outbound still `{ _id, languages }` until a separate product change. |
| S11 | Public/admin field filtering stays in HTTP (`publicSettings.ts`), not in SQL column grants. Secrets live in `sync` / `mail` / `public_form_destination`; GET still omits them for non-admin. |
| S12 | Mixed store is P12: one use-case `run()`. While hybrid, Mongo TM for leftover Mongo collections; PG settings auto-commit unless the use-case TM **is** the PG TM (both settings and translations flags on → pass `postgresTransactionManager` as `this.transactionManager`). No DualStore. Staging-only hybrid. |

### Schema (locked)

`app/api/core/infrastructure/postgresql/schema_migrations/017-create-settings-table.sql`

```sql
CREATE TABLE IF NOT EXISTS settings (
  "tenant_id"                   TEXT NOT NULL PRIMARY KEY,
  "_id"                         TEXT NOT NULL,

  "languages"                   JSONB,
  "links"                       JSONB,
  "filters"                     JSONB,
  "features"                    JSONB,
  "theme_vars"                  JSONB,
  "theme_assets"                JSONB,
  "site_name"                   TEXT,
  "custom_css"                  TEXT,
  "custom_js"                   TEXT,
  "sync"                        JSONB,
  "private"                     BOOLEAN,
  "new_name_generation"         BOOLEAN,
  "open_public_endpoint"        BOOLEAN,
  "allowed_public_templates"    JSONB,
  "public_form_destination"     TEXT,
  "ocr_service_enabled"         BOOLEAN,
  "filter_unauthorized_related" BOOLEAN,
  "project"                     TEXT,
  "custom"                      JSONB,

  "mail"                        JSONB,
  -- mailerConfig, contactEmail, senderEmail (admin)

  "analytics"                   JSONB,
  -- analyticsTrackingId, matomoConfig (public)

  "map"                         JSONB,
  -- mapApiKey, mapLayers, mapStartingPoint, tilesProvider (public)

  "branding"                    JSONB,
  -- site_logo, favicon (public)

  "site_preferences"            JSONB,
  -- home_page, defaultLibraryView, allowcustomJS, cookiepolicy (public)

  "extras"                      JSONB NOT NULL DEFAULT '{}'
  -- unknown Mongo top-level keys only; not `custom`; drop __v on copy
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON settings
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
```

JSONB group envelopes (mapper, not extra SQL types):

| Column | Keys |
| --- | --- |
| `mail` | `mailerConfig`, `contactEmail`, `senderEmail` |
| `analytics` | `analyticsTrackingId`, `matomoConfig` |
| `map` | `mapApiKey`, `mapLayers`, `mapStartingPoint`, `tilesProvider` |
| `branding` | `site_logo`, `favicon` |
| `site_preferences` | `home_page`, `defaultLibraryView`, `allowcustomJS`, `cookiepolicy` |

`current_tenant()` already exists (004). Do not use a composite (`_id`, `tenant_id`) PK. Upsert conflict is `{ columns: ['tenant_id'] }`.

### Adapter

1. `PostgresSettingsMapper` — `_id` is a sync field on the row; slices/groups map to columns; unknown keys → `extras`. Strip `__v`.
2. `PostgresSettingsDataSource` extends `PostgresDataSource`, table `settings`, implements the Phase 1 contract.
3. Deps: `tenantId` + `mongoDb` (updatelogs) + `pgTransactionManager`. **No** Mongo TM in the PG DS (no ES hook).
4. `sync: { syncNamespace: 'settings', syncDb }`.
5. `SettingsDataSourceFactory` — Templates/Thesauri/Translations shape: flag from `ExecutionContext.currentTenant`, PG TM from EC, fail loudly if flag on without PG context.

### Feature flag

| Surface | Name |
| --- | --- |
| Tenant flag | `postgresSettings` |
| Local ENV | `FEATURE_FLAG_POSTGRES_SETTINGS=true` (do not flip `config.ts` defaults) |

Wire: `config.ts` → `tenantContext.ts` → `tenantsModel.ts` → DS factory → sync handler factory → dual-backend tests.

Cutover per tenant: schema (cluster-wide) → copy → flip flag → smoke GET/POST settings, links, add/delete language, template rename/delete filters, admin vs public GET.

**One-way after flip:** Mongo `settings` goes stale (languages, site name, sync config, filters).

### Data copy

`MigrateCollectionToPostgres` + `SettingsMigrationConfig`:

- `mongoCollection: 'settings'`, `pgTable: 'settings'`
- Map `_id` to hex (sync surrogate); peel known keys into columns; remainder → `extras` JSONB (keep former `select:false` fields in their columns; copy is ops, not GET)
- Tenant must have **exactly one** Mongo settings doc; fail loudly if 0 or >1
- Idempotent skip if the tenant already has any PG row (engine default)
- CLI: `--collection settings` on `scripts/scripts.v2/migrateToPostgres.ts`

### Hybrid inventory (after flag on, other collections maybe Mongo)

Same class of risk as translations P12. Notable:

| Location | Settings write | Notes |
| --- | --- | --- |
| `SaveSettings` | PG upsert | Menu/Filters translations may already be PG (`postgresTranslations`) or Mongo |
| `AddLanguageUseCase` | `addLanguage` + `setLanguageInstalling` | Clone translations + entity clone jobs; settings row is not last |
| `DeleteLanguageUseCase` | `deleteLanguage` | Inverse |
| Template create/update/delete | filter name / remove template | Socket `updateSettings` |
| `syncWorker` | reads `sync` via `SettingsDataSource.find()`; disable via `deactivateSyncConfig` | Must not go through `SettingsQueryService.get()` (that strips `sync`) |
| Inbound `/api/sync` settings | upsert by rewritten `_id` | Handler, not ODM |

`persistSettingsAndTranslations` (Mongo TM + `dbSessionContext` + mongoose save) **dies in Phase 1**. Replacement is `SaveSettings` + `TranslationsService` inside one `run()`.

---

## Implementation order

### Phase 1 (V2 / Mongo)

1. Expand `SettingsDataSource` + Mongo DS + specs (`save`, full `get`, no mongoose select strings).
2. Domain invariants (default language, link URLs) — Zod `SaveSettingsInputSchema` / `SaveMenuItemsInputSchema` at the use-case boundary.
3. `SaveSettings` / `SaveSettingsLinks` / `SetDefaultLanguage` / filter use cases + Menu/Filters translations.
4. Core HTTP controllers for `/api/settings*`; keep sockets + public payload.
5. `SettingsSyncHandler` + registry; keep `_id` rewrite and languages-only outbound.
6. Sweep `#api/settings` / `settingsModel` runtime imports to factories/DS (mailer, contact, IX, syncWorker, template controllers, …).
7. Delete or shrink `app/api/settings` to re-exports if anything external still needs the path.
8. Update this MD.

### Phase 2 (Postgres)

1. Schema `017` + RLS.
2. Mapper + PG DS + specs (CRUD, singleton unique, RLS as `app_user`, JSONB extras).
3. Flag `postgresSettings` + factory + `cached()`.
4. Sync handler PG branch.
5. `SettingsMigrationConfig` + CLI + specs (0/1/>1 Mongo docs).
6. Dual-backend use-case and route specs (`describe.each`).
7. Local dry-run: schema → copy → flag → GET/POST / links / languages / template filters / public vs admin.
8. Update this MD (pitfalls, dry-run).

---

## Do not

- Dual-write Mongo + PG
- Enable the flag by default
- Turn the flag off after PG writes
- Put `ObjectId` / `new ObjectId()` in the PG DS
- Split languages/links/filters into child tables in v1
- Encode mongoose `select: false` as “column missing in PG” — store them, hide them in HTTP
- Change `/api/settings` contracts or the public whitelist as part of this work
- Expand outbound sync to the full document without a product decision (passwords live on `sync`)
- Skip Phase 1 and branch the factory on mongoose
- Copy Entities’ table-without-RLS or query-only flag
- Nest a second `TM.run()` / invent DualStore
- Reintroduce `GetSettingsUseCase`

---

## Key reference files

| Concern | Path |
| --- | --- |
| V1 façade | `app/api/settings/settings.ts` |
| V1 mongoose | `app/api/settings/settingsModel.ts` |
| Save + Menu/Filters translations | `app/api/settings/settingsTranslations.ts` |
| Public GET whitelist | `app/api/settings/publicSettings.ts` |
| HTTP | `app/api/settings/routes.ts` |
| Shared Settings types | `app/shared/types/settingsType.ts` |
| V2 DS + cache | `app/api/core/infrastructure/mongodb/MongoSettingsDataSource.ts`, `CachedMongoSettingsDataSource.ts` |
| Contract / factory | `app/api/core/application/contracts/SettingsDataSource.ts`, `…/factories/SettingsDataSourceFactory.ts` |
| Language UCs | `app/api/core/application/AddLanguage.ts`, `DeleteLanguage.ts` |
| Inbound sync `_id` rewrite | `app/api/sync/routes.ts` (`namespace === 'settings'`) |
| Outbound sync subset | `app/api/sync/processNamespaces.ts` (`settings()`) |
| Copy engine / CLI | `…/postgresql/migrations/MigrateCollectionToPostgres.ts`, `scripts/scripts.v2/migrateToPostgres.ts` (`--collection settings`) |
| Settings copy map | `…/postgresql/migrations/configs/SettingsMigrationConfig.ts` |
| Settings PG schema | `…/schema_migrations/017-create-settings-table.sql` |
| Settings PG adapter | `…/postgresql/settings/PostgresSettingsMapper.ts`, `PostgresSettingsDataSource.ts` |
| RLS pattern | `…/schema_migrations/015-create-translations-table.sql` |
| Tenant flags | `app/api/config.ts`, `tenants/tenantContext.ts`, `tenants/tenantsModel.ts` |
| Test helper (settings fixture patches) | `SettingsDSWithContext` in `app/api/utils/testingEnvironment.ts` |

---

## Open (do not block schema / DS)

Phase 1 is closed. Remaining items are cutover, not contract.

- Staging collision: any tenant with **zero or multiple** `settings` docs — copy must fail; fix data before flag.
- Outbound sync remaining `{ languages }` only — never `password` without a separate design (aligns with opt-in `readSyncConfig()`).
- Templates ticket: `applyNewNameGeneration` ownership (named debt; not this slice).
- Dual-backend remaining: settings HTTP routes, `SaveSettings.newNameGeneration`, add/delete language.
