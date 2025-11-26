## CSV Import V2 — Context Doc 05 (Thesauri Creation Job)

**Date:** 2025-11-26
**Owner:** CSV Import V2 initiative
**Scope:** Design + requirements for the post-preflight stage that actually creates thesaurus values and translations (formerly called “apply plan”).

---

### 1. Purpose

- Extend Context Docs 01–04 with a focused plan for the stage after `CsvPreflightJob`.
- Nail down naming, responsibilities, and data contracts for creating thesaurus values in V2.
- Capture all V1 behaviors (from `validateColumns.ts`, `arrangeThesauri.ts`, `typeParsers/*`) that must remain true as we refactor.
- Record tech debt and TODOs so the next contributor can continue without rediscovery.

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
  - Builds per-thesaurus pending data in `csv_import_thesauri_values` via `CsvThesauriValuesBuilder`.
  - Persists aggregated failures and status transitions (`preflight:thesauri`, `...:done`).
- There is **no** job yet that consumes `csv_import_thesauri_values` to create actual values and translations. This doc defines that missing stage.

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

#### 5.1 Plan documents (existing collection `csv_import_thesauri_values`)

Keep the per-`{importId, thesaurusId}` documents created by preflight. They should contain:

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

- Each document represents the complete set of labels found in the CSV for a given `{propertyId, thesaurusId}`. The create job will compare them against the live thesaurus to decide which entries are new.
- **Do not delete** these docs after creation. Later stages (e.g., relationships or final import) may need the mapping between the human label and the generated `_id`.
- `appliedValues` (or a similar map) lets subsequent jobs look up the newly created value IDs without round-trips.
- Add indexes on `{ importId, thesaurusId }` for quick lookups.

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

1. **Implement `CsvCreateThesauriValuesJob`** in `application/jobs`.
2. **Implement `CsvCreateThesauriValuesJobHandler`** and register it in `queueRegistry.ts`.
3. **Wire dispatch**: `CsvPreflightJob` must dispatch this job inside the TM block that sets `preflight:thesauri:done`.
4. **Domain cleanup (tech debt)**: move transformation logic from `MongoCsvImportThesauriValuesDataSource` into domain helpers (`CsvImportThesauriValues` or a dedicated service).
5. **Pending doc schema update**: add `appliedAt`, `appliedValues`, `translations`, and indexes.
6. **Translations DS integration**: ensure the job uses the i18n v2 data source (not legacy `translations` module) inside the TM.
7. **Status/emit plumbing**: follow the “start status committed before heavy work” rule; ensure callbacks emit all events.
8. **Tests**:
   - Unit tests for the domain helper that computes “still-missing values”.
   - Integration tests covering: simple root insert, parent/child insert, sanitized duplicates, translation updates, idempotent reruns, failure propagation, socket emissions.
9. **Metrics/diagnostics**: accumulate per-import counters (see §13) and log how many values were inserted per thesaurus; surface the counts via progress events (useful for debugging).
10. **Documentation**: keep this file + Context 04 updated as implementation lands.
11. **Thesaurus domain migration plan**: spike a follow-up to define v2 domain objects (`Thesaurus`, `ThesaurusValue`, `TranslationContext`) so we can eliminate `_id` reliance entirely.

---

### 12. Open questions

- **Status naming decision** (Context 04 ToDo #10) still unresolved. We currently assume colon-based values are acceptable in DB.
- **Batching strategy**: do we need intra-job batching (per N values) or is “per thesaurus” enough? If we later chunk by N values, ensure progress events include counts.
- **Maximum payload**: we currently expect only a handful to a few hundred values per thesaurus, so one doc per `{ importId, thesaurusId }` is acceptable. Revisit if we encounter larger datasets.
- **Future consumers**: relationships preflight is deliberately postponed. Once extraction → preflight → thesaurus creation → entity insertion flows are stable, we’ll circle back and design relationships preflight using these plan docs as the single source of truth.

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

Keep this document synchronized with the code. Any change to the job behavior, data schema, or naming must be reflected here so the next agent can jump in without re-reading V1. Only after these decisions/tests are in place should we touch the code.
