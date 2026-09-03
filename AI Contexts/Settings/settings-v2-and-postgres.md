# Settings → V2 hex + Postgres

## Objective

Give Settings the same two-step treatment as relationship types and translations:

1. **V2 hex in `app/api/core`**, still on Mongo `settings`, same public HTTP.
2. **Postgres cutover** behind a per-tenant flag, one store, no dual-write.

This is the planning doc for both phases. Pattern sources: [`../Relationship Types/relationship-types-v2-migration.md`](../Relationship%20Types/relationship-types-v2-migration.md), [`../Relationship Types/relationship-types-postgres.md`](../Relationship%20Types/relationship-types-postgres.md), [`../Translations/translations-v2-migration.md`](../Translations/translations-v2-migration.md), [`../Translations/translations-postgres.md`](../Translations/translations-postgres.md).

## Status

- **Phase 1 (V2 hex, Mongo)** — **done.** Review queue below is all `[x]`. Core owns reads/writes. Factory uses `ExecutionContext.transactionManager` only (no TM fallback). Tests that need a settings DS outside HTTP/jobs use `SettingsDSWithContext` from `testingEnvironment` — they do **not** wrap Jest globally and they do **not** import `SettingsDataSourceFactory` for fixture patches. V2 adapters that already have a TM take an injected `settingsDS`.
- **Phase 2 (Postgres)** — **in progress.** Contract is locked (`readFields` / `readFeature` / `readSyncConfig`, slice columns not `SELECT document`). Schema is **018** (production took **017** for pages).

Do not re-investigate these; they are done and should stay this way:

- No `SettingsService` as a TM/factory wrapper. Inject `settingsDS` (with the TM you already have). Peer review §5 proposes a *different* SettingsService (filter/menu translation orchestration). That is not this decision; see Peer review below.
- Factory uses `ExecutionContext.transactionManager` only (no TM fallback).
- Tests that patch settings fixtures use `SettingsDSWithContext`. Do not wrap Jest globally. Do not import the factory just to seed fixtures.
- PG DS does not mint the **document** `_id`. Copy preserves Mongo `_id`. Upsert conflict is `tenant_id`.
- Nested **menu items** identity is `id`. `toPersistableMenuItems` mints `id` for new items and strips leftover mongoose `_id`. `toReadableMenuItems` lifts stored `_id` → `id` on GET (does **not** generate). Menu translations match `id` after that lift, so leftover Mongo `_id` still diffs correctly before the next save. Menu table `rowId` is `id`.
- Nested **filters** identity is `id` (template id or group id) — same as thesaurus values / template property domain `id`. Translations, rename, and remove-template already use `id`. Do **not** mint filter `_id`. `toPersistableFilters` strips leftover mongoose `_id` on save. Filters table `rowId` is `id`.
- Languages table `rowId` is `key` (the language identity). Do not mint language `_id` for the UI.
- Sync handler is DS-backed (`SettingsSyncHandler`). Factory branching on `postgresSettings` is enough; there is no Mongo-specific handler.
- Dual-backend tests must pass `postgresMirror: ['settings']` explicitly. Do not add `settings` to default `MIRRORED_COLLECTIONS` (settings fixtures include entities that are not PG-ready).
- JSONB `links` store `id` as strings. Copy/`toRow` lifts leftover menu `_id` onto `id`. `custom` is JSONB — objects only, not a string.

### Phase 2 progress

- [x] Schema `018-create-settings-table.sql` (`settings` + RLS in the same migration)
- [x] `PostgresSettingsMapper` + specs (columns, JSONB groups, `extras`, drop `__v`)
- [x] `PostgresSettingsDataSource` + specs (CRUD, singleton `tenant_id`, RLS as `app_user`, projections)
- [x] Feature flag `postgresSettings` (config / tenantContext / tenantsModel; local via `FEATURE_FLAG_POSTGRES_SETTINGS=true`)
- [x] `SettingsDataSourceFactory` branches on the flag; `cached()` returns the PG DS when on
- [x] Sync handler is DS-backed (`SettingsSyncHandler` + factory). No separate PG class — inbound still patches the tenant singleton via `SettingsDataSource`.
- [x] `SettingsMigrationConfig` + CLI `--collection settings` (fail on 0 or >1 Mongo docs)
- [x] Dual-backend: `SaveSettings.spec`, `SaveSettings.newNameGeneration.spec`, settings HTTP routes + links, `AddLanguage` / `DeleteLanguage` (`describe.each`).
- [x] Filter identity is `id` (`formatFilters` / `toPersistableFilters`). No `assignFilterIds`. Menu identity is `id` (`formatMenuLinks` / `toPersistableMenuItems` / `toReadableMenuItems`). Languages table `rowId` is `key`.
- [x] Local dry-run: schema → copy → flag → GET/POST / links / languages / filters / public vs admin

---

## First review (2026-08-26)

Developer notes, **verbatim**. Interpretation, corrections, and TODOs follow in the next subsection. No code was changed for this review.

### Developer questions (raw)

- Why ajv? I thought there is a very clear directive to use zod and where in the path (useCases, controllers, etc.) should they reside upon. This should be part of the Settings v2 migration, and a big part of it.
- I think we need a more "pure" approach to this. I understand settings is sometimes orchestrating things from other logics, but I think we need to be a little more organized. `ensureLinkIds` really doesn't seem like a "settings" problem. A helper, sure. A util? See how other modules are doing this, but polluting the saveSettingsUseCase with an ensureLinkIds seems like the wrong thing to do. Please argue against this if you think it's the right path, I don't want praise of "uh, you are very clever", I want your opinion on why this should or should not be there.
- This last point is even more critical for the template save orchestration upon changing of the newNameGeneration. Surely this is a purely TEMPLATE issue, that is templates the one that should know how to do, not settings. Maybe we create a tech debt for this (don't create any issues for me, I'll do that), but this seems like the wrong thing to do when saving settings. Maybe I'm wrong.
- Same point 2 for "links" (which is also a name I think is terribly picked... these are menu items in the navbar, the fact that they are links is a secondary side effect of what is stored as value... these are menu items! The routes probably would need to stay, but the internal naming not necessarily)
- Same for sync... we probably want a separate sync module altogether... we are not doing this right now, but to keep in mind
- We are moving to a safe-first type of approach. Can we make it here so that omitHiddenSettingsFields (which I don't really like the name... they are not hidden, lets go with omitPrivate ? What do you think) is a de-facto applied and not a thing you need to remember everytime to exclude? For example, the `patch` flow you introduced, after upate, returns a raw .get with all the data, including passwords, so the SaveSettingsUseCase actually returns all that to the client. Do we want that? Maybe yes, I'm leaning towards "probably not". That's why you are having to call a return with omitHiddenSettings nested with applyDefaults in so many places. This seems like a smell and not ideal that the developer needs to remember to do all these things. UpdateFiltersNameUseCase is apparently also returning everything?
- The filterTree (why tree?) has remove and rename. How are append, or add or create paths handled?
- getForHttp is also a name I don't like... why http is different? Not because of the protocol, but because of who consumes it. So getPublic, getClientVisible, getPermitted, getAllowed? Lets align. Ask for this with your suggestions
- Here's maybe a more critical thing: What is the restrictions applied to UseCases inside the Agents.md file? Can we simply use UseCases like you are doing in the TemplateMutationController? Or is that a violation of instantiating UseCases? And that one appears like a really glaring security problem: that updateSettings is being broadcasted to all connected clients, but this includes ALL the settings! Is this reading correct? Maybe that was already the case, but I think that mongo's defaults came to the rescue... here they are not. Maybe we need to do a much more indepth search into how we are dealing with returns of this settings? Maybe that is the problem of wildly using UseCases outside of their scoped intended use case?
- Same problem with DeleteTemplateController
- What is this TM resolver in SettingsDataSourceFactory???
- On TaskService.ts (IXTaskService you getDefaultLanguage then .key, but on another location you have a dedicated method detDefaultLanguageKey, do we need both approaches? Can we be consistent? Maybe we don't need that extra method and extract the key like here on other places? Lets be consistent and tidy up all these nonsense
- We store in Settings things like the custom CSS and JavaScript of the collection. I can see places like the tocService that is getting the settings to extract { features }, but for that it needs to load ALL the custom CSS that can be text of multiple Kbs. Same for the languageMiddleware. Not limited to these two scenarios, just examples. I think this is a problem we should try to address on this development and, at least those two and Sync, we should ONLY returned when specifically asked for, and not excluded only when someone remembers to exclude them. Obviously this needs to survive partial updates, and I don't know how PG is going to work with that, mongo more or less does it natively

### Interpretation

This is one problem with several symptoms: **Settings is still a singleton dump of unrelated concepts**, and the first V2 cut treated that dump as the application model. Use cases, QueryService, sockets, and “omit after read” are all ways of living with the blob instead of splitting **who may see what** from **what a given caller needs**.

The migration is not “move `settings.save` into a use case.” It is: stop having one document-shaped API in the core. HTTP paths can stay ugly; the core should not.

#### What is more important (priority)

1. **Safe-by-default outputs (sockets + use-case return types).** Highest. This is the only item that can leak credentials/config to every connected client. It is also the smell behind `omit* + applyDefaults` copied through Save / SetDefaultLanguage / filter UCs.
2. **Opt-in reads (projections), not opt-out.** Highest for _this_ development, not a later polish. `languageMiddleware` and `tocService` loading `customCSS` / `customJS` (multi-KB) to get languages or `features` is the frankenstein made expensive. Sync passwords on the same document is the same rule: **absent unless asked**. This must be designed on the **port** now, or Postgres `SELECT document` will clone the problem.
3. **Zod at the use-case boundary** (and controller DTO only if HTTP needs a different shape). Explicit V2 rule in AGENTS.md (`Input` may include Zod, e.g. `MultiUpdateEntity.InputSchema`). AJV was cargo-culted from V1 `validateSettings` / `emitSchemaTypes`. This is a large, intentional part of Settings V2, not a follow-up.
4. **Concept boundaries and names** (navbar menu items, filters, sync-as-a-later-module). Internal naming can move without changing `/api/settings/links`. Sync extraction is **not** this slice; the read model must still treat `sync` as a dedicated slice so we do not keep dragging it through QueryService.
5. **`newNameGeneration` → templates.** Real layering bug (`SaveSettings` → `TemplateFacade` → v1 templates). Acceptable as **named tech debt** if templates are not opened in this slice; not acceptable as “Settings knows how to rewrite every template.”
6. **`ensureLinkIds` off `SaveSettings`.** Correctness is fine; placement is the V1 god-save. Follows menu-item naming.
7. **TM fallback in `SettingsDataSourceFactory`.** Compatibility hack; delete once callers have ExecutionContext.
8. **`getDefaultLanguage` vs `getDefaultLanguageKey`.** Tidy while touching reads; not architectural. Do not invent a third helper.

#### Wrong or incomplete assumptions

- **“Mongoose defaults came to the rescue on `updateSettings`.”** Only for fields that were `select: false`: `sync` (passwords), `evidencesVault`, `publicFormDestination`. **`mailerConfig` (SMTP secrets), `contactEmail`, `customCSS`, `customJS`, `features` were already on V1 `settings.save()` / `updateFilterName` returns** and were already socketed from template mutate/delete. Native `findOne` made the _select:false_ trio easier to leak if someone returns `SettingsDataSource.get()` / `patch()` raw. It did **not** newly invent broadcasting mailer/CSS. The template controllers are still wrong relative to `SaveSettingsController`, which sockets **`getPublicSettingsPayload`**.
- **`SaveSettingsUseCase` “returns all that to the client” including sync passwords.** As written, `execute` returns `omitHiddenSettingsFields(applySettingsDefaults(saved))`, so **`sync` / `evidencesVault` / `publicFormDestination` are stripped** before HTTP POST JSON. `patch()` itself **does** return the raw document (passwords included). The bug is **layering**: persistence `get()` is a full row; delivery was supposed to remember to omit. `UpdateFilterName` returns that SaveSettings output — **not** sync passwords, **yes** mailerConfig, CSS, JS, features, languages, filters, …
- **`TemplateMutationController` using `UpdateFilterNameUseCaseFactory.default().execute()` is a UseCase instantiation violation.** It is **not**. AGENTS.md: factories are the wiring; ExecutionContext is **only** for factories; controllers are delivery adapters and **should** call `Factory.default()`. The violation would be `new UpdateFilterNameUseCase(...)` or `ExecutionContext.transactionManager` inside the controller. The _real_ smell is **using a command whose output is “the settings document” as a socket payload** from a **template** flow — wrong output type for that consumer, not a forbidden Factory call.
- **`filterTree` is missing append/create.** Collection UI **POSTs the whole `filters` array** through `SaveSettings`. Remove/rename exist as extra use cases because **template rename/delete** must patch nested ids without the Settings screen. There is no “add filter” use case because that is not a separate application action today.
- **“getForHttp is different because it is HTTP.”** The boolean is **who the actor is** (admin vs everyone else), plus a public whitelist. Mixing that with protocol in the name hid that QueryService is doing **authorization shaping**, not transport.

#### Further assumptions drawn from this review

- Settings is **not one aggregate**. Languages, navbar, library filters, feature flags, mail, sync credentials, and theme assets share a **storage row**, not a **domain**. V2 use cases per _HTTP verb on /api/settings_ still treat them as one thing. The review is asking to model **slices** (and later modules) even while Mongo/PG keep one row.
- **Safe-first** means the default application read is never the persistence row. `SettingsDataSource` may return secrets; **nothing above it should, unless the call is explicitly `readSyncConfig()` / `getPrivateFormDestination()` / etc.** Developers should not be able to “forget omit.”
- **Postgres:** `document JSONB` can still `SELECT document` and pull CSS every time. Opt-in is `document->'languages'`, generated columns, or a port method `read(paths)`. Partial `$set` in Mongo and `jsonb_set` / `document ||` in PG both preserve unmentioned keys **if the write is a patch of a slice**, not a full-document replace. The first cut’s `patch({ ...incoming })` is already a field `$set`; fat **reads** are the gap, not fat writes.
- `SaveSettings` calling `TemplateFacade` is a **core → v1_layer** dependency from the wrong module. Even a “use case tells the full story” argument only justifies **dispatching** “apply new name generation,” not implementing template walks inside Settings.
- **AJV is gone from Settings.** `validateSettings` had no remaining callers. Comparison with the other three blobs:

  | Module    | JSON schema + `emitSchemaTypes`                              | AJV at runtime                                                    | Types consumed as              |
  | --------- | ------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------ |
  | Entities  | `entitySchema.ts` (no Ajv import)                            | No — V1 `validateEntity` is gone; core has `domain/entity/Entity` | generated `entityType.d.ts`    |
  | Templates | `templateSchema.ts` (constructs unused `Ajv`)                | No — core has `domain/template/Template`                          | generated `templateType.d.ts`  |
  | Users     | `userSchema.ts` (no Ajv; `UserRole` enum is the live export) | No — core has `domain/user/User`                                  | generated `userType.d.ts`      |
  | Settings  | **deleted** `settingsSchema.ts`                              | **deleted**                                                       | hand-written `settingsType.ts` |

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

| Suggested          | Meaning                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getPublic()`      | Unauthenticated / non-admin client: whitelist only (today `getPublicSettingsPayload`)                                                                                                          |
| `getForAdmin()`    | Admin UI: public ∪ admin-only fields that are **not** secrets (`mailerConfig`, `contactEmail`, `publicFormDestination`, `features`, …). Explicit allowlist, not “everything minus three keys.” |
| `readSyncConfig()` | Server-only; passwords. Never sockets, never QueryService default.                                                                                                                             |

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
- [x] **P2 — `ensureLinkIds`:** `toPersistableMenuItems` on the menu-item write path (identity and translations match `id`; leftover mongoose `_id` is lifted then dropped). Filters do **not** get a parallel mongoose `_id` — identity is already `id` (`toPersistableFilters` strips leftover `_id`). GET lifts leftover menu `_id` via `toReadableMenuItems` so a save is not required first.
- [x] **P2 — `newNameGeneration`:** Settings flips the flag; `TemplateFacade.applyNewNameGeneration` owns the template walk. File the templates ticket separately.
- [x] **P2 — Remove `resolveTransactionManager` fallback.** Factory uses `ExecutionContext.transactionManager` only. Tests wrap `runWithContext`. Legacy `tenants.run` job loops that read settings use `runInJobContext`.
- [x] **P3 — One default-language API:** `getDefaultLanguageKey()` only; QueryService `getDefaultLanguage()` is gone.
- [x] **P3 — `filterTree`:** renamed to `libraryFilters`. Create = `SaveSettings({ filters })`. No append UC.

#### Return-path inventory (2026-08-26)

| Caller                                       | Today                                                      | Intended audience                                | Target                                                                                            |
| -------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `GET /api/settings`                          | `getForHttp(isAdmin)`                                      | browser, public vs admin                         | `getPublic()` / `getForAdmin()`                                                                   |
| `POST /api/settings` JSON                    | UC `omitHidden(applyDefaults(saved))`                      | saving admin                                     | UC / controller: `pickAdminFields` (mailerConfig yes, sync never)                                 |
| `POST /api/settings` socket                  | `getPublicSettingsPayload(saved)`                          | all connected clients                            | keep public                                                                                       |
| `GET /api/settings/links`                    | `QueryService.get().links`                                 | any authenticated? currently unauthenticated GET | public `links` slice                                                                              |
| `POST /api/settings/links` JSON / socket     | UC blob / public payload                                   | admin / all clients                              | admin JSON + public socket                                                                        |
| `POST /api/translations/setasdeafult`        | UC blob on JSON **and** socket                             | admin / all clients                              | admin JSON + **public** socket                                                                    |
| Add/Delete language sockets                  | `QueryService.get()` (omitHidden, includes mailer/CSS)     | all clients                                      | `getPublic()`                                                                                     |
| Template mutate/delete sockets               | `UpdateFilterName` / `RemoveTemplateFromFilters` UC output | all clients                                      | `getPublic()` if filters changed; UC returns `boolean`                                            |
| SSR `entry-server`                           | `QueryService.get()` then `shapeSettingsForSSR`            | HTML / Redux                                     | `getPublic` / `getForAdmin` + tenant feature flags (do not hydrate preserve tokens for non-admin) |
| Outbound sync `processNamespaces.settings()` | DS `find()` then `{ _id, languages }`                      | sync peer                                        | `readFields(['languages'])` (Mongo still includes `_id`)                                          |
| Inbound `SettingsSyncHandler`                | DS `find` / `patch`                                        | server                                           | keep full-row persistence                                                                         |
| `syncWorker`                                 | DS `find()` then `stored.sync`                             | server                                           | `readSyncConfig()`                                                                                |
| `languageMiddleware`                         | `QueryService.get()` → `languages`                         | request                                          | `readFields(['languages'])`                                                                       |
| `tocService`                                 | `QueryService.get()` → `features`                          | job                                              | `readFeature('tocGeneration')`                                                                    |
| mailer / contact / OCR / IX / preserve / …   | `QueryService.get()` for one field                         | server                                           | `readFields` / `readFeature` / `getDefaultLanguageKey()`                                          |

---

## Why Settings is different

It is **one document per tenant**, not a collection of named rows. The Mongo collection is schemaless (legacy mongoose `strict: false`). Several fields are HTTP secrets (`publicFormDestination`, `sync`, `evidencesVault`). All reads/writes go through core (`SettingsDataSource` / use cases / query service). Language add/delete stay on the existing `AddLanguageUseCase` / `DeleteLanguageUseCase`.

| Aspect       | Settings                                                                                                               | Closest PG module                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Cardinality  | **Singleton** per tenant                                                                                               | Nothing else; users/thesauri are many rows                                                                                              |
| Shape        | Large nested blob (`languages`, `links`, `filters`, `features`, `sync`, …)                                             | Templates mix columns + JSONB; usergroups `members` JSONB                                                                               |
| Schema       | Mongoose `strict: false` (unknown keys exist, e.g. `evidencesVault`)                                                   | Must round-trip extras — JSONB, not a frozen column list                                                                                |
| Secrets      | `publicFormDestination`, `sync`, `evidencesVault` (`select: false`); admin GET opts into `+publicFormDestination` only | Application-layer whitelist stays (`publicSettings.ts`)                                                                                 |
| Translations | Menu / Filters contexts updated on save                                                                                | Same `TranslationsService.updateContext` as today                                                                                       |
| Sync         | Namespace `settings` via `SettingsSyncHandler`                                                                         | Inbound POST **applies onto the existing singleton `_id`**. Outbound `processNamespaces.settings()` sends **`{ _id, languages }` only** |
| ES           | None                                                                                                                   | Same as thesauri / relationship types / translations                                                                                    |
| HTTP         | `GET/POST /api/settings`, `GET/POST /api/settings/links`                                                               | Stable, like `/api/relationtypes`                                                                                                       |

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

| Method | Path                  | Notes                                                                                                                                              |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/settings`       | Admin: stored doc (minus `sync`/`evidencesVault`) + `publicFormDestination` + public payload overlay. Others: `getPublicSettingsPayload` whitelist |
| POST   | `/api/settings`       | Admin. Socket `updateSettings` with **public** payload                                                                                             |
| GET    | `/api/settings/links` | `settings.links`                                                                                                                                   |
| POST   | `/api/settings/links` | Body is the links array; **partial** `$set` of `links` onto the stored singleton                                                                   |

Socket: `updateSettings`.

Callers that previously imported `#api/settings` now use `SettingsQueryServiceFactory` (safe reads), `SettingsDataSourceFactory` (secrets / language mutators / sync), or the save/filter/links use-case factories.

---

## Transferable principles

| Principle                     | Apply to Settings                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| Stable external contract      | Paths, GET whitelist, sockets, AJV save rules stay                                    |
| Hex in `app/api/core`         | Domain / use cases / contract / adapters / factories / express                        |
| No application upsert         | Explicit Save / SetDefaultLanguage / SaveLinks / filter mutators                      |
| Contract-driven side effects  | Menu/Filters translations via `TranslationsService`, not a settings-owned i18n façade |
| Integration-first tests       | DB assertions; auth mock OK at routes                                                 |
| One store + flag/copy/cutover | After V2; no dual-write of the settings row                                           |
| Mixed Mongo+PG is not 2PC     | Same P12 as translations: one `this.transactionManager.run()`; no DualStore           |

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

| Use case                    | Replaces                                                    | Side effects                                                                                                                                                                    |
| --------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SaveSettings`              | `settings.save`                                             | AJV (or domain invariants); Menu/Filters `TranslationsService.updateContext`; if `newNameGeneration` flips on → template name-generation update (today `TemplateFacade.update`) |
| `SaveSettingsLinks`         | `POST /api/settings/links`                                  | Merge `links` onto stored doc, then same translation path as save                                                                                                               |
| `SetDefaultLanguage`        | `settings.setDefaultLanguage` / translations `setasdeafult` | Languages array only                                                                                                                                                            |
| `UpdateFilterName`          | template rename                                             | Nested filters; translations via save path                                                                                                                                      |
| `RemoveTemplateFromFilters` | template delete                                             | Nested filters; translations via save path                                                                                                                                      |

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

| ID  | Decision                                                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | PG table **`settings`**. Sync namespace stays **`settings`**.                                                                                                                                                                                                                                                                                                         |
| S2  | **`tenant_id` is PRIMARY KEY** (singleton identity). RLS is `tenant_id = current_tenant()` only — never `AND _id`.                                                                                                                                                                                                                                                    |
| S3  | **`_id TEXT NOT NULL` is a sync surrogate**, not identity. 24-char ObjectId hex. Copy **preserves** Mongo `_id`. `SyncLogWriter` / updatelogs still use it. Inbound settings handler **ignores** payload `_id` and patches the tenant row. Do not special-case the settings namespace to drop `_id`. `PostgresTable` upsert conflict is `{ columns: ['tenant_id'] }`. |
| S4  | **No single `document` blob.** Slice columns + semantic JSONB groups (mail, analytics, map, branding, site_preferences). Unknown Mongo keys go in **`extras JSONB`**, not `custom`. `__v` dropped on copy.                                                                                                                                                            |
| S5  | RLS + `tenant_isolation` in the **same** schema migration as `CREATE TABLE` (delta **018** — production took **017** for pages).                                                                                                                                                                                                                                       |
| S6  | One store. Copy Mongo → PG, flip `postgresSettings`. No dual-write of the settings row. Flag is **one-way** after any PG write.                                                                                                                                                                                                                                       |
| S7  | New **document** `_id` (blank tenant) is minted via `IdGenerator` in the use case — **not** `new ObjectId()` inside the PG DS. Nested `links[]` mint **`id`** via `toPersistableMenuItems` (Menu translation identity). Nested `filters[]` do **not** mint `_id`; identity is `id`; persist strips mongoose leftovers (`toPersistableFilters`).                       |
| S8  | Language `$push`/`$pull` become read-modify-write of the **`languages` JSONB column** inside the PG TM (singleton). Do not add a `settings_languages` table in v1.                                                                                                                                                                                                    |
| S9  | `cached()`: when the flag is on, return the same PG DS as `default()` (translations pattern). Optional later: cache `languageKeys` with `onCommitted` clear — not required to ship.                                                                                                                                                                                   |
| S10 | Sync handler factory branches on the same flag. Inbound still applies onto the tenant singleton (ignore payload `_id`). Outbound still `{ _id, languages }` until a separate product change.                                                                                                                                                                          |
| S11 | Public/admin field filtering stays in HTTP (`publicSettings.ts`), not in SQL column grants. Secrets live in `sync` / `mail` / `public_form_destination`; GET still omits them for non-admin.                                                                                                                                                                          |
| S12 | Mixed store is P12: one use-case `run()`. While hybrid, Mongo TM for leftover Mongo collections; PG settings auto-commit unless the use-case TM **is** the PG TM (both settings and translations flags on → pass `postgresTransactionManager` as `this.transactionManager`). No DualStore. Staging-only hybrid.                                                       |

### Schema (locked)

`app/api/core/infrastructure/postgresql/schema_migrations/018-create-settings-table.sql`

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

| Column             | Keys                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `mail`             | `mailerConfig`, `contactEmail`, `senderEmail`                      |
| `analytics`        | `analyticsTrackingId`, `matomoConfig`                              |
| `map`              | `mapApiKey`, `mapLayers`, `mapStartingPoint`, `tilesProvider`      |
| `branding`         | `site_logo`, `favicon`                                             |
| `site_preferences` | `home_page`, `defaultLibraryView`, `allowcustomJS`, `cookiepolicy` |

`current_tenant()` already exists (004). Do not use a composite (`_id`, `tenant_id`) PK. Upsert conflict is `{ columns: ['tenant_id'] }`.

### Adapter

1. `PostgresSettingsMapper` — `_id` is a sync field on the row; slices/groups map to columns; unknown keys → `extras`. Strip `__v`.
2. `PostgresSettingsDataSource` extends `PostgresDataSource`, table `settings`, implements the Phase 1 contract.
3. Deps: `tenantId` + `mongoDb` (updatelogs) + `pgTransactionManager`. **No** Mongo TM in the PG DS (no ES hook).
4. `sync: { syncNamespace: 'settings', syncDb }`.
5. `SettingsDataSourceFactory` — Templates/Thesauri/Translations shape: flag from `ExecutionContext.currentTenant`, PG TM from EC, fail loudly if flag on without PG context.

### Feature flag

| Surface     | Name                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| Tenant flag | `postgresSettings`                                                       |
| Local ENV   | `FEATURE_FLAG_POSTGRES_SETTINGS=true` (do not flip `config.ts` defaults) |

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

| Location                      | Settings write                                                                   | Notes                                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SaveSettings`                | PG upsert                                                                        | Menu/Filters translations may already be PG (`postgresTranslations`) or Mongo. Filters persist by `id` (`toPersistableFilters`). Menu items persist by `id` (`toPersistableMenuItems`). |
| `AddLanguageUseCase`          | `addLanguage` + `setLanguageInstalling`                                          | Clone translations + entity clone jobs; settings row is not last                                                                                                                        |
| `DeleteLanguageUseCase`       | `deleteLanguage`                                                                 | Inverse                                                                                                                                                                                 |
| Template create/update/delete | filter name / remove template                                                    | Socket `updateSettings`                                                                                                                                                                 |
| `syncWorker`                  | reads `sync` via `SettingsDataSource.find()`; disable via `deactivateSyncConfig` | Must not go through `SettingsQueryService.get()` (that strips `sync`)                                                                                                                   |
| Inbound `/api/sync` settings  | upsert by rewritten `_id`                                                        | Handler, not ODM                                                                                                                                                                        |

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

1. Schema `018` + RLS.
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
- Mint mongoose `_id` on filters or menu items, or use leftover `_id` as table `rowId` (`id` is the identity; thesaurus values / template properties work the same way)
- Fall back `rowId` between `_id` and `id` — one identity field per nested collection
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

| Concern                                | Path                                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| V1 façade                              | `app/api/settings/settings.ts`                                                                                                |
| V1 mongoose                            | `app/api/settings/settingsModel.ts`                                                                                           |
| Save + Menu/Filters translations       | `app/api/settings/settingsTranslations.ts`                                                                                    |
| Public GET whitelist                   | `app/api/settings/publicSettings.ts`                                                                                          |
| HTTP                                   | `app/api/settings/routes.ts`                                                                                                  |
| Shared Settings types                  | `app/shared/types/settingsType.ts`                                                                                            |
| V2 DS + cache                          | `app/api/core/infrastructure/mongodb/MongoSettingsDataSource.ts`, `CachedMongoSettingsDataSource.ts`                          |
| Contract / factory                     | `app/api/core/application/contracts/SettingsDataSource.ts`, `…/factories/SettingsDataSourceFactory.ts`                        |
| Language UCs                           | `app/api/core/application/AddLanguage.ts`, `DeleteLanguage.ts`                                                                |
| Filter identity                        | `app/api/core/application/settings/libraryFilters.ts` (`toPersistableFilters`)                                                |
| Menu nested ids                        | `app/api/core/application/settings/menuItems.ts` (`toPersistableMenuItems`, `toReadableMenuItems`)                            |
| Inbound sync                           | `app/api/sync/SettingsSyncHandler.ts` + factory                                                                               |
| Outbound sync subset                   | `app/api/sync/processNamespaces.ts` (`settings()`)                                                                            |
| Copy engine / CLI                      | `…/postgresql/migrations/MigrateCollectionToPostgres.ts`, `scripts/scripts.v2/migrateToPostgres.ts` (`--collection settings`) |
| Settings copy map                      | `…/postgresql/migrations/configs/SettingsMigrationConfig.ts`                                                                  |
| Settings PG schema                     | `…/schema_migrations/018-create-settings-table.sql`                                                                           |
| Settings PG adapter                    | `…/postgresql/settings/PostgresSettingsMapper.ts`, `PostgresSettingsDataSource.ts`                                            |
| RLS pattern                            | `…/schema_migrations/015-create-translations-table.sql`                                                                       |
| Tenant flags                           | `app/api/config.ts`, `tenants/tenantContext.ts`, `tenants/tenantsModel.ts`                                                    |
| Test helper (settings fixture patches) | `SettingsDSWithContext` in `app/api/utils/testingEnvironment.ts`                                                              |

---

**Hybrid pitfall:** `AddLanguage` runs inside the Mongo TM. PG settings upserts do **not** join that transaction. If `cloneForLanguage` fails after `addLanguage`, Postgres can keep the new language while Mongo translations roll back. Same class as translations-PG vs Mongo settings.

**Nested identity:** mongoose used to auto-`_id` array subdocs. Native Mongo / PG JSONB do not. That is not a reason to reimplement mongoose. **Filters** already have domain `id` (translations match `id`). **Menu** identity is also `id`: persist mints `id` for new items, GET lifts leftover mongoose `_id` without generating, translations match `id` after that lift. Copy/`toRow` lifts menu `_id` → `id` so PG JSON is clean; leftover `_id` in Mongo (flag off) still works because the same V2 read/write path is used. Next save drops leftover `_id` (lazy cleanup, not required for GET/Delete). **Languages** identity is `key`. Tenant storage is `key`, `label`, `default`, `installing` — not catalog copies (`ISO639_3`, `localized_label`, `rtl`, `elastic`, `ISO639_1`, `translationAvailable`) and not leftover mongoose `_id`. GET / QueryService **joins** `LanguageUtils.fromISO639_1(key)` so `/api/settings` still presents those fields. Sync copies stored languages as they are (no catalog join, no persistable rewrite). Our UI does not treat stored catalog fields as source of truth (autonyms and RTL from the catalog). SaveSettings/SetDefaultLanguage run the persistable shape so an application save does not write catalog fields back. Do not backfill `ISO639_3` onto seeded English. A Filters Delete bug during dry-run was the table using leftover mongoose `_id` as `rowId`; the fix is `rowId = id`, not minting `_id`. Same for Menu.

---

## Open (do not block schema / DS)

Phase 1 is closed. Remaining items are cutover, not contract — plus the peer-review queue below.

- Staging collision: any tenant with **zero or multiple** `settings` docs — copy must fail; fix data before flag.
- Outbound sync remaining `{ languages }` only — never `password` without a separate design (aligns with opt-in `readSyncConfig()`).
- Templates ticket: `applyNewNameGeneration` ownership (named debt; not this slice).
- **Peer review §6:** dispatch `newNameGeneration` rewrite as a **job**. **Do not implement in this PR.** File a tech-debt issue after merge. Durability/retry, not throughput.
- AddLanguage / Mongo TM vs PG settings: failed clone does not roll back the PG languages column (hybrid pitfall above).
- Peer review items 1–12: full original below. Working decisions in the next subsection; not all are this PR.

---

## Peer review (2026-09-03)

Source: chat attachment `settings-v2-pg-review.txt`. The numbered review is **verbatim** in the last subsection. The attachment intro mentions a final “looked at, deliberately not changing” section; that section is **not in the file** (it ends at Suggested sequencing).

### Our working decisions (confirmed 2026-09-03)

Reviewer sequencing: **§1 + §11 + §12** first → **§4 + §2** (with **§3**) → **§5 + §9 + §10** (skip §6) → **§7** (one parse if we touch controllers) / **§8 after merge**.

Confirmed with Rafael:

1. **Settings only.** Other modules only if this PR already drilled TM / Context into them. Not Entities, Templates, Files, etc.
2. **§12 is in** — small, same two-TM class as §1.
3. **§4 shared helpers under `infrastructure/`**, imported by Mongo + PG.
4. **§5, §9, §10 after wave 2, still this PR**, then stop. **§6 and §8 stay after merge.**

Existing Phase 1 locks that the review reopens — keep both notes, do not silently overwrite:

- “No SettingsService” was **no TM/factory wrapper**. §5 is a different thing: filter/menu write + translation reconcile as one operation.
- “PG DS does not mint the document `_id`” was **copy preserves Mongo `_id`**. §2 is the empty-insert branch minting `_id` in the DS instead of `SaveSettings`. Copy still must not invent a new document id.
- Mapping helpers in `application/settings/` (menu / filters / languages) were an explicit Phase 2 choice. §4 says they belong in infrastructure. That is a move, not a revert of identity rules (`id` / `key`).

| # | This PR? | How |
| --- | --- | --- |
| 1 | **Done** | Settings UC factories read `ExecutionContext.transactionManager`; do not drill `{ transactionManager }` into `SettingsDataSourceFactory`. Kept the DS override for non-settings callers. `TranslationsServiceFactory` fallback is EC TM. AddLanguage / DeleteLanguage dropped the settings DS drill. CloneLanguage job stopped drilling settings DS. |
| 2 | **Yes, with §4** | `get()` not `find() ?? {}`. DS mints `_id` on insert only. Keep `current` for translations and `newNameGeneration`. |
| 3 | **Yes, with §4** | TDD: `undefined` = omit, `null` = clear. |
| 4 | **Yes** | Shared pure functions under `infrastructure/`. Collapse `toReadableFilters`. `idGenerator` leaves SaveSettings. |
| 5 | **Yes, after wave 2** | SettingsService + SettingsTranslationService. Delete SaveMenuItemsUseCase. Template cleanup listeners. |
| 6 | **No** | Tech-debt issue after merge. |
| 7 | **One parse if we touch those controllers; contract/rename later** | Do not swap `IdSchema`. |
| 8 | **After merge** | Stage languages cluster first. |
| 9 | **Yes, after wave 2 (with §5)** | One broadcast listener. Always-public payload. |
| 10 | **Yes, after wave 2** | Factory-injected actor; `get()`; `forBroadcast()`. |
| 11 | **Done** | Dead exports removed. `pickAdminFields` stays until §10. |
| 12 | **Done** | Dropped nested `runInJobContext` in IX/OCR `processResults`. PDFSegmentation handler no longer calls `tenants.run`. Tests that were the entry point now open context (`runWithContext` / `runInJobContext`). Tenant-loop at PDFSegmentation ~247 stays. |

### Original review (verbatim)

# Settings V2 / Postgres — Code Review

> **Status: review complete.** This covers the whole PR. Items 1-12 are pending work; the
> section at the end records one thing we looked at and deliberately decided not to change.

## How to read this

Items 1-12 are **pending work**. Questions that came up while I was reviewing and that we
resolved as "no change needed" are deliberately left out, so if it's numbered here it's
something I want us to change. The one exception is the last section, which records a
problem we found and consciously chose to leave alone — flagged so it doesn't look like
something I missed.

Every item follows the same order: **the code I'm talking about**, then **what I'm seeing**,
then a **proposed solution**. The snippets are shape and intent only — not drop-in code, and
naming is open to discussion. Several of these are questions more than verdicts; where I'm
unsure I say so.

## Summary

| # | Topic | Scope | Effort |
|---|-------|-------|--------|
| 1 | Transaction manager must come from `ExecutionContext` | 9 factories | S |
| 2 | Is `Settings` really nullable? And who should create `_id`? | 4 use cases + PG data source | S |
| 3 | `PostgresSettingsMapper` — `null` vs `undefined` is untested | 1 spec | S |
| 4 | Client→persistence mapping is in the application layer | 5 files | M |
| 5 | Use cases calling use cases → `SettingsService` + `SettingsTranslationService` | 4 use cases, 2 controllers | L |
| 6 | `newNameGeneration` fan-out should be a job | 1 use case | S |
| 7 | Validating twice, and no API contract | 4 controllers + schemas | S |
| 8 | `SettingsDirectory` — a read side for internal modules | new contract, 26 call sites | L |
| 9 | The same socket broadcast written 5 times | 5 call sites | M |
| 10 | The admin/public decision is made in 3 places | query service + 2 entry points | M |
| 11 | Dead exports in `publicSettings.ts` | 1 file | XS |
| 12 | `runInJobContext` nested — the caller already opened the context | 3 services | S |

---

## 1. Transaction manager must come from `ExecutionContext`

**The code.**

```ts
// SaveSettingsUseCaseFactory.ts:11-14
const transactionManager = TransactionManagerFactory.default();
const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
const translationsService = TranslationsServiceFactory.default({ transactionManager });
```

**What I'm seeing.** Two things here, and they're related. The factory is building its own
transaction manager, and then prop drilling it into every child factory.

The transaction manager is a cross-cutting concern. It's scoped to the request, not to the
component, so each factory should get its own from the execution context instead of
receiving it as an argument. When we pass it down like this the call site *looks* like it's
wiring something meaningful, and it isn't — it's just moving a request-scoped object around
by hand.

**To be fair to you:** `TransactionManagerFactory.default()` shows up around 130 times
across `app/api`, so this is the older pattern and not something you invented. The
convention for new code is the execution context — see
[AddLanguageUseCaseFactory.ts:19](app/api/core/infrastructure/factories/AddLanguageUseCaseFactory.ts#L19)
and [BulkCleanupEntityUseCaseFactory.ts:15](app/api/core/infrastructure/factories/BulkCleanupEntityUseCaseFactory.ts#L15).
I only want what this PR adds to follow it.

**Where it happens — building its own manager:**

- [SaveSettingsUseCaseFactory.ts:11](app/api/core/infrastructure/factories/SaveSettingsUseCaseFactory.ts#L11)
- [SetDefaultLanguageUseCaseFactory.ts:7](app/api/core/infrastructure/factories/SetDefaultLanguageUseCaseFactory.ts#L7)
- [UpdateFilterNameUseCaseFactory.ts:8](app/api/core/infrastructure/factories/UpdateFilterNameUseCaseFactory.ts#L8)
- [RemoveTemplateFromFiltersUseCaseFactory.ts:8](app/api/core/infrastructure/factories/RemoveTemplateFromFiltersUseCaseFactory.ts#L8)
- [SaveMenuItemsUseCaseFactory.ts:8](app/api/core/infrastructure/factories/SaveMenuItemsUseCaseFactory.ts#L8)
- [EntitiesQueryServiceFactory.ts:22](app/api/core/infrastructure/factories/EntitiesQueryServiceFactory.ts#L22)

**Where it happens — reads the context correctly, but then drills it:**

- [FilesServiceFactory.ts:34](app/api/core/infrastructure/factories/FilesServiceFactory.ts#L34)
- [MongoRelationshipsV1DataSourceFactory.ts:15](app/api/core/infrastructure/factories/MongoRelationshipsV1DataSourceFactory.ts#L15)
- [BulkCleanupEntityUseCaseFactory.ts:17,23](app/api/core/infrastructure/factories/BulkCleanupEntityUseCaseFactory.ts#L17)
- [EntitiesQueryServiceFactory.ts:37,39](app/api/core/infrastructure/factories/EntitiesQueryServiceFactory.ts#L37)

### Proposed solution

```ts
class SaveSettingsUseCaseFactory {
  static default(overrides?) {
    return new SaveSettingsUseCase({
      transactionManager: ExecutionContext.transactionManager,
      settingsDS: SettingsDataSourceFactory.default(),        // gets its own from the context
      translationsService: TranslationsServiceFactory.default(),
      ...overrides,
    });
  }
}
```

The good news is that the second group is nearly free: `SettingsDataSourceFactory` already
falls back to `ExecutionContext.transactionManager` when no override is passed, so there we
just **delete the argument** and nothing changes behaviourally.

Once the call sites are clean I'd like us to drop the `{ transactionManager? }` override
from `SettingsDataSourceFactory` entirely, so the drilled form isn't even expressible
anymore.

---

## 2. Is `Settings` really nullable? And who should create `_id`?

**The code.** Three of the new use cases start the same way:

```ts
// UpdateFilterName.ts:30 · RemoveTemplateFromFilters.ts:32 · SaveSettings.ts:31
const current = (await this.deps.settingsDS.find()) ?? {};
```

**What I'm seeing.** `find()` is typed `Promise<SettingsType | null>`, so that `?? {}` looks
like it's handling a real case. But is it? Can the settings really be missing? Settings is a
singleton and it's provisioned when the tenant is created — I don't think there's any moment
where a tenant exists and its settings don't.

So where is this `null` actually coming from? I think it's the driver. Mongo's `findOne` and
Postgres' `first()` both return `null` for "no row", and we're passing that straight up
through the data source into the application layer. So we're not handling a business case
here, we're absorbing a persistence detail — and worse, we're inventing an empty `Settings`
object that claims a tenant has no settings at all.

And that invented object doesn't stay put. Look at what it already forced downstream:

```ts
// settingsDefaults.ts:8 — this branch only exists to survive the fabricated {}
const applySettingsDefaults = (settings: Settings): Settings => {
  if (!Object.keys(settings).length) {
    return {};
  }
  ...
```

That's the cost, made concrete. A `null` that was never a real case gets absorbed at one
boundary, and three files away we have a special case defending against it
([settingsDefaults.ts:8](app/api/core/application/settings/settingsDefaults.ts#L8)).

The contract already makes the distinction for us
([SettingsDataSource.ts:13-14](app/api/core/application/contracts/SettingsDataSource.ts#L13-L14)):
`find()` returns `null` for the genuinely optional case, `get()` throws when settings are
really absent. And you already reach for `get()` in this same PR at
[SetDefaultLanguage.ts:29](app/api/core/application/SetDefaultLanguage.ts#L29) — it's the
other three that are inconsistent.

**About the ResultType idea.** I floated it while reviewing and then talked myself out of
it, so let me record why: `Result` earns its place when absence is a legitimate outcome the
caller has to branch on. Settings can't be absent, so a `Result` would encode an impossible
case and leave us doing the same shrug in nicer clothing. Compare with `UsersDirectory`,
which uses `ResultType` correctly — a user genuinely can be missing. That contrast is the
test.

### The `_id` half of the same problem

**The code.**

```ts
// SaveSettings.ts:31-32
const current = (await this.deps.settingsDS.find()) ?? {};
const id = current._id ?? this.idGenerator.generate();
```

```ts
// PostgresSettingsDataSource.ts:49-57 — what the data source does with it
if (current?._id) { /* update branch */ }
const id = incomingId != null ? String(incomingId) : '';
if (!id) {
  throw new Error('Cannot create settings without an _id');
}
```

**What I'm seeing.** The data source re-reads the settings, works out for itself whether
this is an insert or an update, and then throws because the caller didn't pre-generate an id
— for a branch that the data source is the one identifying. Both sides are asking the same
question and only one of them is in a position to answer it. Creating the id belongs where
the insert happens.

### Proposed solution

Use `get()` in the three use cases, and let the data source create the id.

```ts
// application — absence is a fault, not a branch
const current = await this.deps.settingsDS.get();
...
return this.deps.settingsDS.patch(toPersist);       // no _id passed in

// infrastructure — the insert branch mints its own id
if (!current?._id) {
  await this.writeRow({ ...fields, _id: new ObjectId().toHexString() });
}
```

What we get out of it: the `?? {}` disappears from the three use cases, `idGenerator` leaves
`SaveSettings` entirely (together with §4), the defensive branch in `settingsDefaults.ts`
can be deleted, and `find()` stays on the contract for the genuine bootstrap path where a
`null` really does mean something.

**One thing to be careful with.** Don't delete the read at
[SaveSettings.ts:31](app/api/core/application/SaveSettings.ts#L31). My original note said we
could remove the check at this level and I was only half right — `current` is still needed at
[line 53](app/api/core/application/SaveSettings.ts#L53) for the translation diff and at
[line 60](app/api/core/application/SaveSettings.ts#L60) for the `newNameGeneration` guard.
Only the `_id` *reason* for reading goes away. Removing the fetch would silently break menu
and filter translations.

---

## 3. `PostgresSettingsMapper` — `null` vs `undefined` is untested

**The code.**

```ts
// PostgresSettingsMapper.ts — toRow keeps undefined out
keys.forEach(key => {
  if (source[key] !== undefined) { picked[key] = source[key]; }
});

// PostgresSettingsMapper.ts:145-147 — but toSettings drops null as well
if (value !== undefined && value !== null) {
  settings[settingsKey] = value;
}
```

**What I'm seeing.** I hope this class is unit tested, especially because we accept partial
updates. With partial updates the two absent-ish values mean different things: `undefined`
should mean "don't overwrite, leave it alone", and `null` should mean "remove this value,
please".

Right now the two directions don't agree. `toRow` skips `undefined`, which is correct — it
never overwrites. But `toSettings` skips **both** `undefined` and `null`, so a column we
deliberately cleared comes back as an absent key instead of an explicit removal.

There is a spec — `PostgresSettingsMapper.spec.ts`, six tests: known columns, JSONB groups,
`__v`/extras, round-trip, menu `_id` lift, ObjectId stringify. None of them covers this. So
the semantic we most depend on is the one we're not testing, and I'd rather pin it now than
after more code starts depending on whatever it happens to do today.

### Proposed solution

Decide what `null` means on the way out, make `toSettings` agree with `toRow`, and pin both
directions with tests so the rule stops being implicit.

```ts
it('leaves a field untouched when undefined and clears it when null', () => {
  expect(PostgresSettingsMapper.toRow({ site_name: undefined })).not.toHaveProperty('site_name');
  expect(PostgresSettingsMapper.toRow({ site_name: null })).toHaveProperty('site_name', null);
});
```

---

## 4. Client→persistence mapping is in the application layer

**The code.**

```ts
// SaveSettings.ts:41-48
const toPersist = {
  ...incoming,
  ...(incoming.links
    ? { links: toPersistableMenuItems(incoming.links, () => this.idGenerator.generate()) }
    : {}),
  ...(incoming.filters ? { filters: toPersistableFilters(incoming.filters) } : {}),
  ...(incoming.languages ? { languages: toPersistableLanguages(incoming.languages) } : {}),
};
```

```ts
// SetDefaultLanguage.ts:31-36 — another mapping that wouldn't be needed here
const languages = toPersistableLanguages(
  (current.languages || []).map(language => ({ ...language, default: language.key === key }))
);
```

**What I'm seeing.** You can think of this like a mapper — we're mapping client-side data
shape to persistence data shape, at the application layer level. Strip `_id`, mint `id`,
reduce a language to the fields worth storing, re-hydrate catalogue metadata on the way
back. Every one of those decisions is about *how rows are stored*.

I'm not saying it's wrong, because settings doesn't need a domain layer — it's pure CRUD
operations, and the only rule we enforce is the shape of the input, which the schema already
handles. There's no domain model being hidden here. My question is narrower: given that this
is a mapper, is the application layer the one interested in it? I don't think so. The data
sources are essentially the guys interested on the mapping.

And the imports already agree with me:

```ts
// PostgresSettingsMapper.ts:2 — infrastructure importing from application
import { toReadableMenuItems } from '#api/core/application/settings/menuItems.js';
```

That arrow points backwards. Infrastructure needed this mapping badly enough to import it
across a layer boundary, which is about as clear a signal as we're going to get
([PostgresSettingsMapper.ts:2](app/api/core/infrastructure/postgresql/settings/PostgresSettingsMapper.ts#L2)).

**What it's costing us.** Three files exist in `application/settings/` only to host this
mapping — [menuItems.ts](app/api/core/application/settings/menuItems.ts),
[libraryFilters.ts](app/api/core/application/settings/libraryFilters.ts),
[settingsLanguages.ts](app/api/core/application/settings/settingsLanguages.ts) — so it's
back-and-forth across files to follow one write. And `idGenerator` is prop drilled into the
use case for exactly one reason: `toPersistableMenuItems` needs it
([SaveSettings.ts:44](app/api/core/application/SaveSettings.ts#L44)). In infra the mapper
can call `ObjectId` directly and that dependency just disappears — which is also what
unblocks §2.

**One more thing while we're here.** `toReadableFilters` isn't a second mapping:

```ts
// libraryFilters.ts:48
const toReadableFilters = toPersistableFilters;
```

Same function, two names. The read/write symmetry that justifies a
`toPersistable`/`toReadable` pair doesn't exist for filters — both directions only strip
`_id`. The second name suggests a distinction that isn't there.

### Proposed solution

Move the mapping into the data source, so the layer that owns the row shape also owns how
it's built. Postgres already has the right home for it in `PostgresSettingsMapper`; the
Mongo data source gets the equivalent.

```ts
// infrastructure/postgresql/settings/PostgresSettingsMapper.ts
static toRow(settings: SettingsType): SettingsRow {
  return {
    ...columns(settings),
    links:     persistableMenuItems(settings.links),   // ObjectId directly, no idGenerator
    filters:   persistableFilters(settings.filters),
    languages: persistableLanguages(settings.languages),
  };
}
```

The use case then says what it does and nothing else:

```ts
async execute(raw: Input): Promise<Output> {
  const incoming = SaveSettingsUseCase.InputSchema.parse(raw);
  const current  = await this.deps.settingsDS.get();

  return this.transactionManager.run(async () => {
    await this.deps.settingsTranslations.reconcile(incoming, current);
    return this.deps.settingsDS.patch(incoming);       // no reshaping, no idGenerator
  });
}
```

**What moves where:**

| File | Destination |
|---|---|
| [menuItems.ts](app/api/core/application/settings/menuItems.ts) — mapping half | data source mappers (schemas stay, see §7) |
| [libraryFilters.ts](app/api/core/application/settings/libraryFilters.ts) | data source mappers (collapses to one function) |
| [settingsLanguages.ts](app/api/core/application/settings/settingsLanguages.ts) | data source mappers |
| [settingsDefaults.ts](app/api/core/application/settings/settingsDefaults.ts) | `SettingsQueryService` — read side, not persistence |
| `idGenerator` dep in `SaveSettings` | deleted |

**Something we should decide explicitly**, not by accident: there are two data source
implementations, and today these helpers served both. Once the mapping moves down, either
each implementation owns its own version, or the pure functions live somewhere shared under
`infrastructure/` and both import them. The second is less duplication; the first is honest
about Mongo and Postgres genuinely storing these differently. I don't have a strong
preference — I just want it to be a decision.

**And be careful with `applySettingsDefaults`.** It's not persistence mapping at all. The
`mapStartingPoint` fallback is a read-side presentation default, so it belongs with the
component that shapes data for the UI — the query service — which gives us one less file and
better cohesion. But it can't just move: it's currently also applied on the **write** path
to shape what the endpoint returns ([SaveSettings.ts:67](app/api/core/application/SaveSettings.ts#L67),
[SetDefaultLanguage.ts:42](app/api/core/application/SetDefaultLanguage.ts#L42)). Moving it
before the write path stops shaping its own response would silently change what
`POST /api/settings` returns. Order matters here.

---

## 5. Use cases calling use cases

**The code.**

```ts
// SaveMenuItems.ts:21
return this.deps.saveSettings.execute({ links });

// UpdateFilterName.ts:39
await this.deps.saveSettings.execute({ filters });

// RemoveTemplateFromFilters.ts:38
await this.deps.saveSettings.execute({ filters: removeTemplateFromFilters(current.filters, templateId) });
```

**What I'm seeing.** A use case shouldn't be another use case's building block — it
represents one complete application operation. Here three of them delegate to `SaveSettings`
just to write one field, and we end up validating twice as needed. Does a filter rename
really need to go through the full save settings logic?

The cost isn't theoretical. A template rename drags full input re-validation, menu item id
minting, language mapping, *and* the `newNameGeneration` check
([SaveSettings.ts:60](app/api/core/application/SaveSettings.ts#L60)) behind it — and that
last one loops every template in the tenant. It's harmless today only because
`incoming.newNameGeneration` is `undefined` when the caller passes `{ filters }`. That's one
careless edit away from a template rename triggering a tenant-wide template rewrite.

**On `SaveMenuItems` specifically.** It's a pure pass-through — validate, then delegate. The
only thing it adds over calling `SaveSettings` directly is making `links` required instead
of optional, and that's a controller-level concern. I'm also not happy with its input type:

```ts
// SaveMenuItems.ts:7
links: NonNullable<Settings['links']>;
```

That shape is defined by the Mongoose model, and the input type should be derived from the
schema definition instead. If we delete the use case the problem goes away with it — there's
no type left to derive.

**On the template cleanup.** This one is a question for us as much as for you. Today:

```ts
// DeleteTemplateController.ts:9-14
const output = await TemplateFacade.delete(...);
const filtersChanged = await RemoveTemplateFromFiltersUseCaseFactory.default().execute({
  templateId: output._id,
});
```

The cleanup runs in a separate transaction after the delete. If it throws, the template is
gone and the filters still point at a template that doesn't exist. So it's either
transactional or it's async — right now it's neither, it just happens to run inline while
the request waits. Same shape in
[TemplateMutationController.ts:22-25](app/api/core/infrastructure/express/template/TemplateMutationController.ts#L22-L25).
I'm favouring the event.

### Proposed solution

Two collaborators, not one. Persisting settings and reconciling translations are different
concerns, so they stay in different components — but composing them is the service's job,
not the caller's. That's the whole point of having an application service: abstraction and
reuse, so no client has to remember both steps.

```ts
class SettingsService {
  constructor(private settingsDS, private translations: SettingsTranslationService) {}

  async saveFilters(filters: SettingsFilterSchema[]) {
    const current = await this.settingsDS.get();
    await this.translations.reconcileFilters(filters, current.filters);  // never the caller's job
    return this.settingsDS.patch({ filters });
  }
}
```

`UpdateFilterName` and the cleanup listener depend on `SettingsService`; neither touches
`SaveSettings`. This also drops `translationsService` out of `SaveSettings`'s deps
([SaveSettings.ts:52](app/api/core/application/SaveSettings.ts#L52)) and dissolves
`menuAndFilterTranslations.ts` into `SettingsTranslationService`.

Then: **delete `SaveMenuItemsUseCase`** and have the controller call `SaveSettings` with a
links-required schema.

And make the cleanup event-driven. Good news — `TemplateDeletedEvent` and
`TemplateUpdatedEvent` **already exist** in
[domain/template/events/](app/api/core/domain/template/events/) and are already emitted, so
this is a listener, not new plumbing. The controllers lose the cleanup call entirely.

```ts
class ReconcileFiltersOnTemplateChange {
  async handle(event: TemplateDeletedEvent) {
    await this.settingsService.removeTemplateFromFilters(event.templateId);
  }
}
```

---

## 6. `newNameGeneration` fan-out should be a job

**The code.**

```ts
// SaveSettings.ts:57-65 — note this is outside the transaction
const saved = await this.transactionManager.run(async () => { ... });

if (!current.newNameGeneration && incoming.newNameGeneration) {
  const defaultLanguage = current.languages?.find(language => language.default)?.key;
  if (defaultLanguage) {
    await TemplateFacade.applyNewNameGeneration(defaultLanguage);
  }
}
```

**What I'm seeing.** Maybe we could trigger this outside of the use case. It's already
outside the transaction, and it can potentially trigger a fan-out process — it loops every
template in the tenant with an update template use case, which by itself can trigger more
fan-out.


The real problem is that it runs *after the transaction committed*, inside the request. If
it throws, settings permanently say `newNameGeneration: true` while the templates were never
rewritten, and nothing retries. So the reason to move it is durability and retry, not
throughput.

### Proposed solution

Dispatch a job instead of running the rewrite inline, so a failure is retried and observable
instead of leaving settings and templates permanently out of step.

```ts
// the use case records the intent only
if (!current.newNameGeneration && incoming.newNameGeneration) {
  await this.dispatcher.applyNewNameGeneration({ defaultLanguage });   // retried, observable
}
```

---

## 7. Validating twice, and no API contract

**The code.**

```ts
// SaveSettingsController.ts:9
const input = SaveSettingsUseCase.InputSchema.parse(this.request.body);
const saved = await SaveSettingsUseCaseFactory.default().execute(input);
```

```ts
// SaveSettings.ts:28 — and the use case parses it again
const incoming = SaveSettingsUseCase.InputSchema.parse(raw);
```

**What I'm seeing.** The use case already validates the input, so we can safely drop it from
the controller. In this settings module it's simpler than usual: both the API contract and
the use case contract share the same input validation. So it's up to us where we place the
schema and call it — controller or use case, it doesn't really matter, since the contract
breaks through all layers. What matters is that it's **one** place. Two parses is two things
to keep in sync and no clarity about which one is authoritative.

Same thing at
[SaveSettingsLinksController.ts:8](app/api/core/infrastructure/express/settings/SaveSettingsLinksController.ts#L8).

**Where is the API contract defined?** It should be written in the `shared/contracts` folder.
That folder already exists and holds `Entities.ts`, `Template.ts`, `Users.ts`,
`Thesaurus.ts`, `Relationships.ts`, `UserGroups.ts` — there's no `Settings.ts`, so the
settings endpoints are the exception to a convention we already follow. Affects
[GetSettingsController.ts:4](app/api/core/infrastructure/express/settings/GetSettingsController.ts#L4),
[GetSettingsLinksController.ts:4](app/api/core/infrastructure/express/settings/GetSettingsLinksController.ts#L4),
[SaveSettingsController.ts:6](app/api/core/infrastructure/express/settings/SaveSettingsController.ts#L6).

**On the schemas file** ([saveSettingsInput.ts](app/api/core/application/settings/saveSettingsInput.ts)).
Two smaller things. Schemas should follow PascalCase, and this file is overloaded with
schemas used by different use cases with similar validation requirements — so
`saveSettingsInput` is a misleading name for it. Something like `SettingsSchemas` describes
what's actually in there. Related, `objectIdValue` lives in
[menuItems.ts:6](app/api/core/application/settings/menuItems.ts#L6) but is imported by
`saveSettingsInput.ts` for filters, preserve tokens and feature configs, and by
`RemoveTemplateFromFilters.ts`. It's a generic id validator hiding in a menu module.

I also wondered about reusing the `IdSchema` we have in `/api/core/libs`, but having looked
at it I don't think it's a straight swap:

```ts
// Id.ts:20
const IdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'must be a valid id');
// vs. menuItems.ts:6
const objectIdValue = z.union([z.string(), z.instanceof(ObjectId)]);
```

`IdSchema` rejects `ObjectId` instances and non-hex strings that currently pass. Worth doing
as a deliberate tightening with its own tests, but not as a drive-by rename.

### Proposed solution

Four independent changes:

```ts
// 1. one parse, not two — the use case already validates
class SaveSettingsController extends AbstractController {
  protected async handle() {
    const saved = await SaveSettingsUseCaseFactory.default().execute(this.request.body);
    this.response.json(saved);
  }
}
```

2. Add `app/shared/contracts/Settings.ts` next to the six that are already there, and have
   the controllers and the front end reference it.
3. Rename `saveSettingsInput.ts` → `SettingsSchemas.ts`.
4. Move `objectIdValue` out of `menuItems.ts` into that schema module.

---

## 8. `SettingsDirectory` — a read side for internal modules

**The code.** Three different modules, three hand-rolled projections:

```ts
// publicAPIMiddleware.ts:7 — auth
(await SettingsDataSourceFactory.default().readFields(['openPublicEndpoint'])) ?? {};

// contact.js:7 — mail
(await SettingsDataSourceFactory.default().readFields(['contactEmail','senderEmail','site_name'])) ?? {};

// exportRoutes.ts:51 — csv export
(await SettingsDataSourceFactory.default().readFields(['dateFormat','site_name'])) ?? {};
```

**What I'm seeing.** These are data sources being used as a read model to feed the needs of
internal modules — here auth, mail and export. Ideally a data source should only contain
methods that support the needs of use cases directly connected with the settings life-cycle.

I'm also not a fan of using projections of the settings like this. Regarding read
projections generally, I really think it's an anti-pattern to let clients define thousands
of their own shapes. Instead let's define a small set of data shapes that clients really
need. The trade-off is delivering more columns than a given caller needs, but that's okay —
we avoid exposing a lot of stuff and it stays controllable in the future.

There are **26 of these call sites** across the codebase today, so nobody can answer "what
does the rest of the system read from settings?" without grepping, and every column rename
becomes an open-ended search.

The ones I marked directly in the code, so you can see the spread — auth, mail, export,
relationships, and three of the external services:
[preserve.ts:17](app/api/preserve/preserve.ts#L17),
[relationships.js:339](app/api/relationships/relationships.js#L339),
[InformationExtraction.ts:631](app/api/services/informationextraction/InformationExtraction.ts#L631),
[OcrManager.ts:64](app/api/services/ocr/OcrManager.ts#L64),
[PDFSegmentation.ts:249](app/api/services/pdfsegmentation/PDFSegmentation.ts#L249).

`preserve.ts:17` is the one I like least, and it isn't even part of the 26 — it doesn't
project at all, it pulls the **entire settings object** with `find()` just to read
`features.preserve`:

```ts
// preserve.ts:17
const currentSettings = (await SettingsDataSourceFactory.default().find()) ?? {};
const preserve: PreserveConfig | undefined = currentSettings?.features?.preserve;
```

That's the end state of having no defined shapes: when there's no method that says what you
want, taking everything is the easiest thing to do.

And here's the part that convinced me this is structural and not just untidy:
`SettingsDataSource` **already has** `getInstalledLanguages()`, `getLanguageKeys()` and
`getDefaultLanguageKey()` — and **nine** call sites bypass all three to hand-roll
`readFields(['languages'])`, because `readFields` is the path of least resistance. As long
as an open projection method exists, the intention-revealing ones get ignored.

**The clustering**, if we look at what those 26 sites actually want: languages ×9 ·
integrations (`metadataExtraction` ×4, `ocr` ×2, `segmentation`, `preserve`,
`tocGeneration`) ×9 · collection policy ×5 · mail ×2.

**The audience is the point.** The client of this directory is **not the UI**. It exists to
serve other backend modules — use cases, other application services, middleware. Three
components, three audiences:

| Component | Audience | Shape |
|---|---|---|
| `SettingsDataSource` | settings' own life-cycle use cases | full write model |
| **`SettingsDirectory`** | **other backend modules** | **internal read models, no role filtering** |
| `SettingsQueryService` | HTTP / SSR clients | allowlisted, role-aware (§10) |

A module reaching for the wrong one is the bug. Today there's only one door, so everyone
walks through it.

### Proposed solution

A directory, designed the same way we did the user directory — few methods, deliberately
broad shapes, and a standard for the format. Four methods cover all 26 call sites.

```ts
// app/api/core/application/contracts/SettingsDirectory.ts
// Internal read side. Serves use cases, application services and middleware.
// NOT the UI — clients are served by SettingsQueryService.
interface SettingsDirectory {
  getLanguages(): Promise<LanguageSettings>;
  getIntegration<K extends IntegrationName>(name: K): Promise<Integrations[K]>;
  getCollectionPolicy(): Promise<CollectionPolicy>;
  getMailerIdentity(): Promise<MailerIdentity>;
}

// app/api/core/application/contracts/SettingsReadModels.ts   (mirrors UserReadModels.ts)
type LanguageSettings = { list: LanguageSchema[]; defaultKey: LanguageISO6391; keys: LanguageISO6391[] };
type CollectionPolicy = {
  siteName: string; dateFormat: string; newNameGeneration: boolean;
  openPublicEndpoint: boolean; allowedPublicTemplates: string[]; ocrServiceEnabled: boolean;
};
type MailerIdentity = { mailerConfig?: string; contactEmail?: string; senderEmail?: string; siteName: string };
```

Three rules behind the shapes:

1. **The method names the need, not the columns.** `getMailerIdentity()` survives a column
   rename; `readFields(['senderEmail'])` spread across modules doesn't.
2. **The set of shapes is finite and reviewable.** "What does the system read from settings?"
   should be answered by reading the interface.
3. **Deliberately over-deliver.** `publicAPIMiddleware` wants one boolean and gets the whole
   `CollectionPolicy`. That's the trade-off I mentioned — more columns than needed, in
   exchange for a small controllable set of shapes.

The directory does **no** role filtering and holds nothing back — `getIntegration('preserve')`
returns `masterToken`, which is right for backend callers and exactly why it must never be
reachable from a controller response.

**No `ResultType` here**, unlike `UsersDirectory` — same reasoning as §2. A user can
genuinely be missing; settings can't. So it returns plain shapes and the `?? {}` disappears
from all 26 sites.

---

## 9. The same socket broadcast written 5 times

**The code.**

```ts
// TemplateMutationController.ts:28-31 · DeleteTemplateController.ts:16-19 · translation/routes.ts:157-158
if (updatedFilters) {
  const publicSettings = await SettingsQueryServiceFactory.default().getPublic();
  this.request.sockets.emitToCurrentTenant('updateSettings', publicSettings);
}
```

Plus [SaveSettingsController.ts:11](app/api/core/infrastructure/express/settings/SaveSettingsController.ts#L11)
and [SaveSettingsLinksController.ts:10](app/api/core/infrastructure/express/settings/SaveSettingsLinksController.ts#L10).

**What I'm seeing.** I believe this kind of logic — updating the client — is a solid
candidate to be done async through events. There are several places that need to update the
same thing, so we could create a single listener listening to the events. Five copies of
"tell the clients settings changed" is five places to keep consistent, and three of them
re-query settings inside the request purely to build a payload nobody is waiting on.

### Proposed solution

One listener owns the broadcast; the controllers stop emitting. This rides along with the
event work in §5.

```ts
class BroadcastSettingsChanged {
  async handle(_event: SettingsChangedEvent) {
    this.sockets.emitToCurrentTenant('updateSettings', await this.settingsQuery.forBroadcast());
  }
}
```

**Separate and mechanical:** [translation/routes.ts:135-160](app/api/core/infrastructure/express/translation/routes.ts#L135-L160)
is still an inline route handler and should be refactored into a controller class —
`AddLanguageController` is used twelve lines below it as the pattern to copy.

---

## 10. The admin/public decision is made in 3 places

**The code.**

```ts
// GetSettingsController.ts:10
const payload =
  this.request.user?.role === 'admin' ? await query.getForAdmin() : await query.getPublic();

// entry-server.tsx:351-353 — the same ternary again
(req.user?.role === 'admin' ? query.getForAdmin() : query.getPublic())

// publicSettings.ts:80 — and a third time
if (user?.role === 'admin') { return { ...pickAdminFields(settingsData), ... }; }
```

**What I'm seeing.** What are your thoughts on this — a model with permission restrictions
on columns? I'm asking implementation-wise: where should this be enforced? Right now the
answer is "in three places", which is the one answer we definitely don't want.

My position is that this is a role/claims check, so it belongs in the application layer —
not in an express controller, and not in the React SSR entry point. Those are delivery
mechanisms; they shouldn't be the ones deciding what a caller is allowed to see.

**I checked whether this currently leaks, and it doesn't — but only by luck.**
`shapeSettingsForSSR` appends `features` outside the public allowlist on *both* branches. It
happens to be safe because its input was already filtered by the second copy of the check.
That correctness rests on a precondition recorded only in a JSDoc comment, and the call site
casts it away with `as any` ([entry-server.tsx:217](app/react/entry-server.tsx#L217)), so the
type system can't hold the line for us. One future caller passing unfiltered settings turns
this into a real exposure — `features.preserve.masterToken` lives in that object.

### Proposed solution

One entry point, and the projection choice isn't the caller's to make. Following the
convention in [AddLanguageUseCaseFactory.ts:47](app/api/core/infrastructure/factories/AddLanguageUseCaseFactory.ts#L47),
the **factory** reads the actor from the execution context and injects it — I don't want the
service reaching into request-scoped state itself, that just hides the dependency and makes
it painful to test.

```ts
// factory — the one place the context is read
new SettingsQueryService(settingsDS, { actor: ExecutionContext.actor });

class SettingsQueryService {
  async get() {                                  // the only actor-resolved way in
    return this.actor?.role === 'admin' ? this.adminProjection() : this.publicProjection();
  }
  private async adminProjection()  { /* ... */ }
  private async publicProjection() { /* ... */ }
}
```

Controller and SSR both call `get()`, and `shapeSettingsForSSR` loses its role branch
entirely.

**One deliberate exception.** The socket broadcast from §9 must be public **regardless of
who triggered the save** — it goes to every connected client in the tenant. If it resolved by
current actor, an admin pressing save would broadcast admin fields to every logged-in
visitor. So `get()` needs a companion method that is explicitly actor-independent. After §9
collapses the five emit sites into one listener there's exactly one caller of it, which
makes it easy to name and hard to misuse.

---

## 11. Dead exports in `publicSettings.ts`

**The code.**

```ts
// publicSettings.ts:94-102
export {
  PUBLIC_ALLOWED_FIELDS,      // not used outside this file
  ADMIN_ALLOWED_FIELDS,       // not used outside this file
  pickPublicFields,           // only the spec
  pickAdminFields,
  getPublicSettingsPayload,
  shapeSettingsForSSR,
  omitInlineCustomization,    // re-export; real consumers import it from #shared directly
};
```

**What I'm seeing.** I checked these and they have no consumers. Exported symbols read as
public API and constrain future refactors, so I'd rather not carry them.

`omitInlineCustomization` is the odd one — it's re-exported here, but every real consumer
imports it from `#shared/settings/omitInlineCustomization.js` directly. Only the spec goes
through the pass-through, so we have two import paths for one function.

### Proposed solution

Make the first two module-private and drop the `omitInlineCustomization` re-export so
there's a single import path. `pickPublicFields` becomes private once §10 makes the
projections internal to the query service.

---

## 12. `runInJobContext` nested — the caller already opened the context

**The code.**

```ts
// InformationExtraction.ts:990-992
processResults = async (_message: IXResultsMessage): Promise<void> => {
  await runInJobContext(_message.tenant, async () => {
    ...
```

```ts
// TaskManager.ts:123-125 — but this is who calls processResults, and it already did it
await runInJobContext(processedMessage.tenant, async () =>
  this.service.processResults!(processedMessage)
);
```

**What I'm seeing.** I was quite sure this was already called somewhere up on the callstack
for `processResults`, and it is. `processResults` is registered on the task manager at
[InformationExtraction.ts:153](app/api/services/informationextraction/InformationExtraction.ts#L153)
and has **no other caller** — the only way in is `TaskManager.checkForResults()`, which
already wraps it. So the inner call is a second, nested context.

It isn't harmless redundancy, which is why I want it fixed rather than just tidied.
`runInJobContext` calls `ExecutionContext.run`, and that creates a **new store**. Since
`getOrInitialize` memoises instances per store, the inner scope builds a **fresh transaction
manager**, different from the one the outer scope is holding. That's §1 all over again,
arriving from a different direction: two transaction managers inside one logical operation,
and nothing tells us about it.

**Two more I found while checking this.**

[OcrManager.ts:198](app/api/services/ocr/OcrManager.ts#L198) has exactly the same nesting —
`processResults` is registered on a `TaskManager` at
[line 266](app/api/services/ocr/OcrManager.ts#L266) and still opens its own context.

[PDFSegmentation.ts:378](app/api/services/pdfsegmentation/PDFSegmentation.ts#L378) does a
third thing: its `processResults` calls `tenants.run(...)` directly instead of
`runInJobContext`, so it re-enters the tenant context but not the execution context. Three
services, three different behaviours for the same hook.

**Not this one:** the `runInJobContext` at
[PDFSegmentation.ts:247](app/api/services/pdfsegmentation/PDFSegmentation.ts#L247) is
correct and should stay — it's inside a loop over every tenant, a batch entry point that
doesn't come through the task manager and genuinely has no context yet.

### Proposed solution

Drop the inner call wherever the task manager is the entry point, and let the one context
the caller already opened be the only one.

```ts
// InformationExtraction.ts and OcrManager.ts
processResults = async (message: IXResultsMessage): Promise<void> => {
  // TaskManager.checkForResults already runs us inside runInJobContext
  ...
};
```

Then normalise `PDFSegmentation.processResults` onto whatever we settle on, so the three
services agree. The rule worth writing down: **whoever owns the entry point opens the
context; the handler never opens its own.**

---

## Suggested sequencing

Several of these are the same refactor seen from different files:

1. **§1, §11, §12** — independent and cheap, land first. §12 is the same class of problem
   as §1, so they read well together.
2. **§4 + §2** — one change. Moving the mapping into infrastructure removes the
   `idGenerator` drill, which is what lets the data source create `_id`. §3 pins the
   mapper's behaviour and should land alongside.
3. **§5 + §6 + §9** — the service extraction, the job and the broadcast listener share the
   event work. §5 depends on §4 landing first.
4. **§10, §7, §8** — independent of the above and of each other. §8 is the biggest and
   touches the most call sites; it can be staged (contract + the languages cluster first).

---
