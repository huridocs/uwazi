## CSV Import V2 — Context Doc 05 (Thesauri Creation Job)

**Date:** 2025-11-26
**Owner:** CSV Import V2 initiative
**Scope:** Design + requirements for the post-preflight stage that actually creates thesaurus values and translations (formerly called “apply pending values”).

---

### 1. Purpose

- Extend Context Docs 01–04 with a focused design for the stage after `CsvPreflightJob`.
- Nail down naming, responsibilities, and data contracts for creating thesaurus values in V2.
- Capture all V1 behaviors (from `validateColumns.ts`, `arrangeThesauri.ts`, `typeParsers/*`) that must remain true as we refactor.
- Record tech debt and TODOs so the next contributor can continue without rediscovery.
- Reinforce the non-negotiable verification requirements (TypeScript + ESLint) for **every** file we touch or create in this effort, so we stop wasting cycles on preventable regressions.

Read order: `csv-v2-context-01.md → ... → csv-v2-context-04.md → this file`.

---

### 2. V1 recap (what the legacy flow actually did)

Source files audited: `app/api/csv/validateColumns.ts`, `arrangeThesauri.ts`, `typeParsers/select.ts`, `typeParsers/multiselect.ts`, `typeParsers/shared.ts`, `typeParsers/relationship.ts`, `csvLoader.ts`.

Key guarantees:

- **Column validation** (`validateColumns`):
  - Sanitizes headers using template-safe names.
  - Forbids mixing language and non-language columns on the same property.
  - Only `text|markdown|select|multiselect|link|nested|title|file` may use language suffixes.
  - Requires the default-language column when any language suffix is present.
- **arrangeThesauri**:
  - Streams the CSV once, using sanitized rows (`toSafeName`) and per-property heuristics (parent/child detection, multiselect parsing).
  - Tracks existing normalized labels per parent to avoid duplicates, and errors on standalone group labels.
  - Sanitizes labels before inserting, but keeps the unsanitized string for comparison parity.
  - Appends new values via `thesauri.appendValues` and immediately calls `translations.updateEntries` for every new label (per language).
  - Returns `propNameToThesauriId` so downstream steps map column names to thesaurus IDs.
- **typeParsers/select & multiselect**:
  - Resolve metadata values by looking up thesaurus entries.
  - Emit warnings when format is invalid or values are missing.
  - Rely on `generateMetadataValue` to populate `{ value, label, parent }`.
- **typeParsers/relationship**:
  - Ensures related entities exist (creating them for constrained templates) before import.

This new stage must keep every guarantee highlighted above and explicitly document any intentional deviations.

---

### 3. Current V2 state (Nov 26)

- `CsvPreflightJob` now:
  - Uses `CsvHeaderAnalyzer` for the column checks above.
  - Reads staged rows from `csv_import_rows`.
  - Builds per-thesaurus pending data in `csv_import_thesauri_values` via `CsvThesauriPendingValuesBuilder`.
  - Persists aggregated failures and status transitions (`preflight:thesauri`, `...:done`) and dispatches the next stage inside the same transaction.
- `CsvCreateThesauriValuesJob` (new):
  - Runs immediately after preflight.
  - Streams each pending doc, compares it with the live thesaurus using `CsvThesauriValuesDiff`, writes any missing values through the legacy adapters, upserts translations, updates per-import stats, and records progress/events for tenant admins.
  - Supports retries/idempotency by persisting `appliedAt`, `appliedValues`, and per-doc stats in `csv_import_thesauri_values`.
- Relationships preflight and downstream stages remain TODO, but the extraction → preflight → thesaurus creation chain is now fully automatic.

---

### 4. Naming & boundaries

- Application-layer job: `CsvCreateThesauriValuesJob`.
- Queue dispatcher: `CsvCreateThesauriValuesJobHandler`.
- Rationale:
  - “Create” states exactly what happens (writes entries + translations).
  - Drop “plan/apply” wording to reduce confusion—`csv_import_thesauri_values` stores the full, per-thesaurus map of labels observed in the CSV (some already exist, some still pending).
- Domain note: we don’t yet have a dedicated `Thesaurus` domain model in v2. This job will rely on a transitional adapter (wrapping the legacy `thesauri` module or `MongoThesauriDataSource`) until we migrate that area. Capture every place where `_id` leaks so we can replace it with domain `id` once the migration is ready.
- Jobs vs JobHandlers:
  - Jobs live in `app/api/csv.v2/application/jobs`.
  - JobHandlers live in `app/api/csv.v2/infrastructure/queue`.
  - Do **not** resurrect “UseCase” terminology for queue stages.

---

### 5. Data contracts

#### 5.1 Pending-value documents (existing collection `csv_import_thesauri_values`)

`CsvPreflightJob` now groups entries per `{ importId, thesaurusId }` and stores the following shape:

```ts
{
  importId: string;
  thesaurusId: string;
  propertyId: string;            // helps map warnings back to template props
  pendingRoots: Array<{
    label: string;               // sanitized label to insert
    normalizedLabel: string;
    translations: Record<string, string>; // language -> label
    children: Array<{
      label: string;
      normalizedLabel: string;
      translations: Record<string, string>;
    }>;
  }>;
  warnings?: PendingWarning[];
  createdAt: number;
  appliedAt?: number;            // set by the create job; do NOT delete the doc
  appliedValues?: Array<{ label: string; valueId: string }>;
}
```

Notes:

- Each document represents the complete set of labels found in the CSV for a given `{propertyId, thesaurusId}`. `CsvCreateThesauriValuesJob` compares them against the live thesaurus to determine inserts.
- **Do not delete** these docs after creation. Later stages (e.g., relationships or final import) may need the mapping between the human label and the generated `valueId`.
- `appliedValues` lets subsequent jobs look up the newly created IDs without re-querying the thesaurus.
- Indexed by `{ importId, thesaurusId }` for quick lookups.

#### 5.2 Domain responsibility vs DS

- The `MongoCsvImportThesauriValuesDataSource` currently performs label shaping and translation prep. That logic belongs in the domain layer (e.g., helper methods on `CsvImportThesauriValues` or a dedicated service).
- **Tech debt TODO**: move transformations/sanitization decisions out of the DS and into domain helpers. DS should only CRUD.
- **V1 bridge for thesauri/translations**: until we have proper v2 domain objects, we’ll use a transitional adapter that:
  - Reads legacy `_id` values but re-expresses them as `id` strings before returning to the job.
  - Accepts domain-style inputs (`{ id, label, children }`) and converts them to whatever the legacy module needs.
  - Lives close to the job so the eventual v2 migration touches a narrow surface.

---

### 6. `CsvCreateThesauriValuesJob` responsibilities

1. Load the `csv_imports` record, ensure it is in `preflight:thesauri:done`.
2. Load template + settings (available languages, default language, newNameGeneration) via the same DS factories used by preflight.
3. Load all pending-value docs for the import (group them by thesaurus).
4. For each thesaurus (batch inside a single TM `run`):
   - Fetch current thesaurus via the transitional adapter around `MongoThesauriDataSource` (see §5.2) so the job can speak in domain `id`s even though the underlying module still uses `_id`.
   - Determine which pending roots/children are still absent (honor normalized-label comparisons exactly like V1).
   - Build the payload for `thesauri.appendValues` (or the v2 equivalent) using sanitized labels.
   - Upsert translations through i18n v2 (`TranslationsDataSource`). Match V1 behavior: translations are keyed on the sanitized label, but values retain localized text.
   - Persist `appliedValues` (label → new value id) back into the pending-doc before marking it applied. Leave the doc intact with `appliedAt` timestamp for future jobs to consume.
5. Update `csv_imports`:
   - Clear `failure` (if any) for the thesauri stage.
   - Set status to `preflight:thesauri:create:done`.
   - Dispatch the next job (relationships preflight) inside the same transaction block.
6. Emit socket events via callbacks passed from the handler:
   - `csvImport:preflight:thesauri:create:start`
   - `...:progress` (per thesaurus or per batch, whichever granularity we pick)
   - `...:success`
   - `...:error`

Failure handling:

- Wrap execution in the standard job catch:
  - Persist `failure` `{ message, stage: 'preflight:thesauri:create', retryable }`.
  - Set status to `retrying` or `failed`.
  - Emit `...:error`.
  - Rethrow so the worker respects retry/backoff policies.

Idempotency:

- Rerunning the job must be a no-op if `appliedAt` is already set and all values exist.
- When new labels are partially applied (e.g., crash after writing the thesaurus but before marking applied), re-reading the thesaurus + pending doc should detect that nothing else needs to be created.

---

### 7. `CsvCreateThesauriValuesJobHandler` responsibilities

- Extend `UserAwareDispatchable`.
- Resolve tenant/admin sockets, pass callbacks to the job, and call `heartbeat()` after each thesaurus batch.
- Translate errors from the job into queue-level retries. On last retry, ensure `CsvImport` is marked `failed`.

---

### 8. Translation updates (V1 parity requirement)

- Must reproduce `arrangeThesauri`’s `translations.updateEntries` logic:
  - Only update entries for labels that were actually inserted in this run.
  - Support parent + child translations.
  - Accept sanitized duplicates gracefully (if the original unsanitized entry exists, we should not create a second sanitized copy; translations should reference the actual stored label).
- Implementation detail:
  - Build a `Record<language, Record<label, translation>>` per thesaurus.
  - Call the i18n DS once per thesaurus within the TM `run`.
  - Store the translations object on the pending doc so reruns don’t have to recompute it.

---

### 9. Status & events

- DB statuses introduced by this job:
  - Use the existing `CsvImportStatus` enum (camelCase) for persistence, mapping to colon-based emit strings. Example: enum value `PreflightThesauriCreate` ↔ emitted event `preflight:thesauri:create`.
  - We still record status transitions in `csv_imports.statusHistory` (if present) so downstream analytics can read either representation.
- Events:
  - `csvImport:preflight:thesauri:create:start|progress|success|error`.
  - Use `emitToTenantAdmins(tenantName, ...)` only; no session events.
- Mapping helper TODO: add a small utility near the jobs that maps enum → colon string to keep the decision centralized.

---

### 10. Mapping newly created values to IDs

- Subsequent stages (relationships preflight, eventual import) need `label → valueId`.
- Approach:
  - When we append values, capture the returned `_id`s (both root and child).
  - Update the same pending doc with `appliedValues`.
  - Provide a helper method on `CsvImportThesauriValues` to expose `{ label, parentLabel?, valueId }`.
  - Consumers read this mapping instead of re-querying the thesaurus for every row.

---

### 11. TODOs & tech debt

0. **Populate existing value IDs**: we currently write the newly generated `_id`s for inserted roots/children to `appliedValues`, but we do not keep the IDs for existing entries. As a result downstream stages must re-fetch the thesauri to resolve IDs before entity creation. Capture those IDs during thesauri creation when we already have the full documents so later jobs can read mappings without another round-trip.
1. **DS/domain cleanup**: finish moving any shaping/aggregation logic out of `MongoCsvImportThesauriValuesDataSource` into domain helpers so the DS is pure CRUD.
2. **Legacy adapter hardening**: replace `LegacyThesauriRepository` / `LegacyTranslationsRepository` with proper transaction-aware v2 repositories so we can drop direct `api/thesauri` and `api/i18n/translations` dependencies.
3. **Relationships preflight follow-up**: once that stage exists, ensure it reads `appliedValues`, emits tenant-admin events, and inherits the lint/TS rules defined here.
4. **Tests still pending**:
   - Integration coverage for `CsvCreateThesauriValuesJob` (happy path, translation failure, retry/idempotency).
   - Unit tests for `CsvThesauriValuesDiff` edge cases (case-insensitive roots, sanitized duplicates, nested structures).
5. **Metrics wiring**: expose the new counters (`thesaurusValuesObserved`, `thesaurusValuesCreated`, `thesauriTouched`) through whatever telemetry/monitoring we standardize on, and document how to consume them.
6. **Documentation hygiene**: keep this file plus Contexts 03/04 updated whenever the pipeline or terminology changes; treat lint/TS checks as part of “done”.
7. **Thesaurus domain migration roadmap**: spike a follow-up to define `Thesaurus`, `ThesaurusValue`, and `TranslationContext` domain objects so `_id` never leaks outside adapters.

---

### 12. Open questions

- **Status naming decision** (Context 04 ToDo #10) still unresolved. We currently assume colon-based values are acceptable in DB.
- **Batching strategy**: do we need intra-job batching (per N values) or is “per thesaurus” enough? If we later chunk by N values, ensure progress events include counts.
- **Maximum payload**: we currently expect only a handful to a few hundred values per thesaurus, so one doc per `{ importId, thesaurusId }` is acceptable. Revisit if we encounter larger datasets.
- **Future consumers**: relationships preflight is deliberately postponed. Once extraction → preflight → thesaurus creation → entity insertion flows are stable, we’ll circle back and design relationships preflight using these context docs as the single source of truth.

---

### 13. Import-wide metrics (new)

We want richer telemetry once a CSV import finishes:

- `csv_imports.stats` (or a peer collection) should eventually include:
  - `entitiesCreated` (during main import job).
  - `thesaurusValuesCreated` (from this job).
  - `relationshipEntitiesCreated` (future stage).
  - `thesauriReferenced` (count distinct thesauri touched in the CSV).
  - `entitiesReferenced` (count distinct entity titles referenced via relationships).
- During this job we can at least accumulate:
  - `thesaurusValuesObserved` (total labels parsed) vs `thesaurusValuesCreated`.
  - Distinct thesauri touched.
- TODO: design the shared `CsvImportStats` domain object and decide whether stats live directly on `csv_imports` or a separate `csv_import_stats` collection to avoid document bloat.

---

### 14. Detailed design checklist (current decisions)

- **Lint / TS verification (non-negotiable)**

  - Every file we edit or introduce in this pipeline **must** pass TypeScript type-checking and ESLint before we consider the task “done”.
  - That means running the appropriate `tsc` / `eslint` targets (or the repo’s checker) on each touched path, not just trusting CI to tell us later.
  - If a file cannot be linted/typechecked locally (rare), call it out explicitly in PR notes so reviewers know the gap—but the default expectation is “zero unchecked files”.

- **Existing thesauri/translation surfaces**

  - We do **not** have v2 domain models for thesauri yet. The only reusable pieces today are:
    - `api/thesauri` (legacy module with `get`, `save`, `appendValues`).
    - `api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.ts` (read-heavy DS already used by templates.v2).
    - `api/i18n/translations` (legacy translations module).
  - Plan: introduce thin adapters in csv.v2 (`ThesauriRepositoryAdapter`, `TranslationsRepositoryAdapter`) that wrap those modules but expose v2-style interfaces (`findByIdWithValues`, `appendValues`, `updateEntries`). Adapters will map `_id` ↔ `id` internally so the job only sees strings.

- **Pending-values schema**

  - Target TypeScript shape (to be enforced in DS + domain mapper):
    ```ts
    type CsvImportThesauriPendingValues = {
      importId: string;
      thesaurusId: string;
      propertyId: string;
      pendingRoots: Array<{
        label: string;
        normalizedLabel: string;
        translations: Record<string, string>;
        children: Array<{
          label: string;
          normalizedLabel: string;
          translations: Record<string, string>;
        }>;
      }>;
      warnings?: PendingWarning[];
      createdAt: number;
      appliedAt?: number;
      appliedValues?: Array<{ label: string; parentLabel?: string; valueId: string }>;
      stats?: {
        valuesObserved: number;
        valuesCreated: number;
      };
    };
    ```

- **Comparison helper**

  - We will mirror V1’s logic from `arrangeThesauri.ts`: compute normalized-label sets per parent, use the same “sanitize then compare” rules, and treat `::`/multiselect parsing identically. The helper lives in a pure service (`CsvThesauriValuesDiff`) so both the job and future tests reuse it.

- **Stats persistence**

  - Store counters under `csv_imports.stats`. Initial schema:
    ```ts
    stats?: {
      thesaurusValuesObserved?: number;
      thesaurusValuesCreated?: number;
      thesauriTouched?: number;
    };
    ```
  - Future jobs (row import, relationships) will extend `stats` with their own counters.

- **Failure payload schema**

  - Reuse the pattern from `CsvPreflightJob`: `failure = { message, retryable, stage, issues? }`.
  - Stage identifiers for this job: `preflight:thesauri:create`, `preflight:thesauri:create:translations`.
  - Issues array (when present) uses `{ code: string, details?: Record<string, any> }` so the UI can render structured feedback.

- **Progress events & heartbeat**

  - Emit one `csvImport:preflight:thesauri:create:progress` per thesaurus doc processed with payload `{ importId, thesaurusId, processedThesauri, totalThesauri, createdValues }`.
  - Call `heartbeat()` alongside each progress emission. No per-value heartbeats for now.

- **Status enum additions**

  - Add `PreflightThesauriCreate` + `PreflightThesauriCreateDone` to `CsvImportStatus`.
  - Mapping helper (shared util) converts enum → colon string for socket emissions and vice versa for logs/tests.

- **Testing strategy**

  - Keep the v2 rule: prefer integration-style tests with real Mongo + filesystem; mock only queue/socket adapters.
  - Test matrix:
    1. Happy path with one thesaurus (roots + children).
    2. Sanitized duplicate scenario (existing label should be skipped).
    3. Translation write failure → job retries and records failure.
    4. Idempotency (rerunning job with `appliedAt` set does nothing).
    5. Stats updated correctly (`stats.thesaurusValuesCreated` increments).
    6. Full pipeline test (registration → extraction → preflight → create job) once the downstream jobs exist.

- **Thesauri/translation migration**
  - After this job lands, create a follow-up epic to:
    - Promote the adapters to full-fledged v2 data sources.
    - Define `Thesaurus` + `ThesaurusValue` domain objects with transaction-aware repos.
    - Replace direct usage of `api/thesauri` / `api/i18n/translations` across csv.v2 with the new repos so `_id` leakage disappears.

These decisions should unblock implementation; update this section as any detail changes.

---

Keep this document synchronized with the code. Any change to the job behavior, data schema, or naming must be reflected here so the next agent can jump in without re-reading V1. Only after these decisions/tests are in place should we touch the code.

### 15. Testing convention addendum

- Integration specs **must** follow the entities.v2/templates.v2 playbook:
  - Build fixtures exclusively via `getFixturesFactory()` and pass them to `testingEnvironment.setUp(fixtures, indexName)`. No ad-hoc object literals for templates/thesauri/settings.
  - Reuse the production builders (`CSVImportEntitiesFactories`, `TemplatesDataSourceFactory`, `SettingsDataSourceFactory`, `MongoThesauriDataSource`, `TransactionManagerFactory.default()`) so every test exercises the actual Mongo-aware data sources and transaction manager.
  - The only mocks allowed are the outer queue/socket dispatchers; all persistence, staging, and domain adapters must be the real implementations to catch regressions.
  - Stage CSV rows by calling the real `CsvImportRowsDataSource.insertMany` (via helpers) and persist imports through `CsvImportsDataSource.insert`; never short-circuit those writes.
  - Lifecycle: `beforeAll` seeds fixtures once, `afterEach` resets to the canonical fixtures via `testingEnvironment.setFixtures(fixtures)` and deletes only the stage-specific collections (`csv_imports`, `csv_import_rows`, `csv_import_thesauri_values`), `afterAll` tears everything down.
  - Always run `npx jest`, `npx eslint <touched files>`, and `npx tsc --noEmit` locally before handing off—even test-only changes must remain type/lint clean to honor the “non-negotiable” gate above.

### 16. Code review follow-up

- The recent review of `CsvExtractUploadedZipJob` uncovered concerns about optional guards around `storage.path` and `existing` import documents. The reasoning, failure scenarios, and suggested tightening strategies (dispatcher-level assertions, payloading the storage path, domain helpers) live in `csv-v2-context-05-codeReview.md` so future contributors can see the thought process and follow-up plan.

### 17. Domain modeling convention

- Follow the `Template` domain pattern (`app/api/core/domain/template/Template.ts`) for every CSV V2 domain:
  - Define each persisted field (e.g., `importId`, `thesaurusId`, `entries`, `createdAt`, optional `appliedAt`, etc.) as `readonly` class properties.
  - Add getters that expose derived data instead of leaking raw shapes.
  - Encapsulate mutations (status/failure updates, applied-value merges, stats increments) via domain methods that return new instances.
  - Provide a `toPersistence()` helper so DS adapters always persist the canonical shape.
- Apply this consistently to:
  - `CsvImport` / `CsvImportRow`
  - `CsvThesauriPendingValues` / `CsvImportThesauriValues`
  - Any future domain objects (relationships, stats, etc.)
- Sketch (to be codified later):

```ts
class CsvImportThesauriValues {
  readonly importId: string;
  readonly thesaurusId: string;
  readonly entries: CsvThesauriPendingEntry[];
  readonly createdAt: number;
  readonly appliedAt?: number;
  readonly appliedValues?: CsvImportThesauriAppliedValue[];
  readonly stats?: CsvImportThesauriStats;

  private constructor(history: {
    importId: string;
    thesaurusId: string;
    entries: CsvThesauriPendingEntry[];
    createdAt: number;
    appliedAt?: number;
    appliedValues?: CsvImportThesauriAppliedValue[];
    stats?: CsvImportThesauriStats;
  }) {
    Object.assign(this, history);
  }

  static create(props: {
    importId: string;
    thesaurusId: string;
    entries: CsvThesauriPendingEntry[];
    createdAt: number;
    appliedAt?: number;
    appliedValues?: CsvImportThesauriAppliedValue[];
    stats?: CsvImportThesauriStats;
  }) {
    return new CsvImportThesauriValues(props);
  }

  withAppliedValues(
    summary: Pick<PendingValuesDiffSummary, 'observedValues' | 'createdCount'>,
    incoming: CsvImportThesauriAppliedValue[]
  ) {
    const appliedValues = this.mergeAppliedValues(incoming);
    const stats = this.combineStats(summary);
    return new CsvImportThesauriValues({
      importId: this.importId,
      thesaurusId: this.thesaurusId,
      entries: this.entries,
      createdAt: this.createdAt,
      appliedAt: Date.now(),
      appliedValues,
      stats,
    });
  }

  private mergeAppliedValues(incoming: CsvImportThesauriAppliedValue[]) {
    const seen = new Set(
      (this.appliedValues ?? []).map(
        value => `${value.parentLabel || ''}::${value.label}::${value.valueId}`
      )
    );
    const additions = incoming.filter(value => {
      const key = `${value.parentLabel || ''}::${value.label}::${value.valueId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    return [...(this.appliedValues ?? []), ...additions];
  }

  private combineStats(summary: Pick<PendingValuesDiffSummary, 'observedValues' | 'createdCount'>) {
    const previous: CsvImportThesauriStats = this.stats ?? {
      valuesObserved: summary.observedValues,
      valuesCreated: this.appliedValues?.length ?? 0,
    };
    return {
      valuesObserved: summary.observedValues,
      valuesCreated: previous.valuesCreated + summary.createdCount,
    };
  }

  toPersistence() {
    return {
      importId: this.importId,
      thesaurusId: this.thesaurusId,
      entries: this.entries,
      createdAt: this.createdAt,
      appliedAt: this.appliedAt,
      appliedValues: this.appliedValues,
      stats: this.stats,
    };
  }
}
```

- Document similar sketches in the relevant context files so every domain designer follows the same blueprint before implementation. Let me know when you want me to formalize each class.
