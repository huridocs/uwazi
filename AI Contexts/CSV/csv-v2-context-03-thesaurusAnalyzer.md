## CSV Import V2 — Context Doc 03 (Thesaurus Preflight Addendum)

**Date:** 2025-11-18
**Owner:** CSV Import V2 initiative
**Scope:** Thesauri preflight analysis → plan generation → execution

---

### Why this addendum exists

We discovered that the current `CsvPreflightPreparationUseCase` only performs a shallow, incomplete version of v1’s `arrangeThesauri` logic, and lumps parsing + DB writes into one step. This doc spells out:

1. What v1 actually did and why.
2. What the current v2 code is missing.
3. How we will evolve the flow into two clear responsibilities:
   - **Preparation**: analyze staged rows, replicate v1 parsing, surface _all_ deterministic errors, and persist a “plan” of missing values/translations.
   - **Application**: consume the plan and perform idempotent thesaurus writes plus translation updates.

New agents should be able to pick up this plan without re-litigating the legacy behavior.

---

### V1 behavior recap (`arrangeThesauri`)

File: `app/api/csv/arrangeThesauri.ts` + `specs/arrangeThesauri.spec.ts`

Key responsibilities:

1. **Input filtering & sanitation**
   - Uses safe-named headers from `validateColumns`.
   - Only considers template properties of type `select` / `multiselect`.
   - Always reads the default-language column for each property, even if multi-language columns exist.
2. **Parsing semantics**
   - Splits multiselect cells using v1’s separator rules.
   - Supports multiple parent-child syntaxes (`Parent::Child`, `Parent : Child`, etc.) and preserves order for nested creation.
   - Detects invalid group usage (standalone group label without children, conflicting parent definitions) and throws typed errors.
   - Trims/sanitizes labels but respects existing unsanitized entries (avoids creating sanitized duplicates).
3. **Aggregation & dedupe**
   - Builds sets of new root labels and nested children per thesaurus, case-insensitive.
   - Checks existing thesaurus entries before inserting (no duplicates).
4. **Translations**
   - Tracks labels per language so new values are created with the appropriate translation map.
   - Uses i18n entries to upsert translations for newly added values.
5. **Error reporting**
   - Throws deterministic errors for invalid structures (group without child, parent reused inconsistently, invalid syntax).
   - V1 surfaces these errors in the request thread; any fix should aim to report all violations together.
6. **Testing coverage**
   - `arrangeThesauri.spec.ts` covers parent/child creation, duplicates, trimming, case-insensitive behavior, translation updates, error scenarios, and idempotency.

---

### Current V2 implementation (pre-refactor)

File: `app/api/csv.v2/services/CsvPreflightPreparationUseCase.ts`

Issues / gaps:

1. **Parsing**
   - Only splits on `::`; ignores other parent-child syntaxes and multiselect separators.
   - No support for sanitized fallbacks or label normalization beyond a basic trim.
2. **Language handling**
   - Reads only `prop.name__defaultLanguage` via naive string match; doesn’t use analyzer insights (no fallback if columns are missing or localized differently).
3. **Error handling**
   - Throws on first error; no aggregation, no persistence of which rows/properties failed.
4. **Translations**
   - Does not handle translations at all; inserts base labels only.
5. **Deduplication**
   - Collects roots/nested entries per import run without checking existing thesaurus values.
6. **Responsibility mixing**
   - Parses the CSV _and_ performs DB writes in the same use case, making it hard to retry/extend.
7. **Testing**
   - The spec file is still the old v1 integration test (and currently broken). No coverage for the missing scenarios listed above.

---

### Proposed architecture

#### Stage 1: `CsvPreflightPreparationUseCase` (analysis-only)

Responsibilities:

1. Load staged rows (`csv_import_rows`), template, and settings (for newNameGeneration + languages).
2. Run `CsvHeaderAnalyzer` (already done) and persist aggregated header issues if any.
3. For each select/multiselect property:
   - Use a new parser that mirrors v1 `arrangeThesauri` logic (multi-value splitting, parent/child semantics, sanitization, trimming, warnings).
   - Build a **Thesauri Plan** structure:
     ```ts
     type ThesauriPlan = {
       importId: string;
       createdAt: number;
       selects: Array<{
         propertyId: string;
         thesaurusId: string;
         defaultLanguage: string;
         newRoots: Array<{ label: string; languages: Record<string, string> }>;
         newChildren: Array<{
           parent: string;
           child: string;
           languages: Record<string, string>;
         }>;
       }>;
       warnings?: Array<{ property: string; message: string; row?: number }>;
     };
     ```
   - Persist this plan (option TBD: `csv_imports.plan` or a separate `csv_import_plans` collection for larger payloads).
4. Aggregate **all** deterministic errors (invalid group usage, missing parents, duplicated conflicting entries) and throw a single `CsvPreflightPreparationError`, persisting `{ failure: { stage: 'preflight:preparation:thesauri', issues } }`.
5. On success, set status to `preflight:thesauri:done` and invoke `transactionManager.onCommitted(...)` to dispatch Stage 2.

#### Stage 2: `CsvApplyThesauriPlanJob` (mutation)

Responsibilities:

1. Load the persisted Thesauri Plan for the import.
2. Fetch current thesauri values + translations, compute missing entries, and perform idempotent writes:
   - Append new roots/nested entries (skip duplicates).
   - Upsert translations via i18n services.
3. On error, set status → `failed` (with failure info) respecting retry semantics.
4. On success, either (a) delete the plan or (b) mark it applied; then dispatch the next preflight stage (relationships).

#### Data persistence

- `csv_imports.failure`: now includes aggregated analyzer + parser issues (`failure.issues`).
- `csv_import_thesauri_values`: new collection storing one plan document per `{ importId, thesaurusId }`. Each document contains the pending root/child labels + translations for that thesaurus. This avoids `csv_imports` documents growing past Mongo’s 16 MB limit and keeps Stage 2 idempotent.

#### Socket emissions

- Keep current `start/success/error` events minimal (just `importId` + `message` for error), with the expectation that the frontend will fetch `GET /csv_imports/{importId}` to read `failure.issues`.
- Later, when the API endpoint exists, ensure it exposes both `status` and the plan/failure metadata.

---

### Implementation plan

1. **Parser extraction** ✅
   - Implemented `CsvThesauriValuesBuilder` (see specs) to read staged rows, mirror v1 parsing behaviors, emit aggregated issues, and return plan entries grouped per thesaurus. Plans are now stored in `csv_import_thesauri_values`.
2. **Preparation use case updates**:
   - Replace inlined parsing with the builder.
   - Persist plan documents in `csv_import_thesauri_values` and aggregated issues (`failure.issues`) before throwing.
   - Dispatch the new “apply plan” job after successful plan creation.
3. **Apply-plan job/use case**:
   - Build `CsvApplyThesauriPlanUseCase` + job similar to extraction job patterns.
   - Wire it in `queueRegistry`, reusing the same `thesauriDS` etc.
4. **Testing**:
   - Add unit tests for the parser (covering v1 scenarios).
   - Add integration tests for the preparation use case (plan persisted, failure issues saved).
   - Add integration tests for the apply-plan job (idempotent writes, translations).
5. **Docs + TODOs**:
   - Keep this addendum updated as we implement each step.
   - Ensure TODO list references plan persistence, apply job, and spec repairs.

---

### Current TODOs (from this addendum)

1. Implement `CsvThesauriPlanBuilder` (v1 parity parser).
2. Modify `CsvPreflightPreparationUseCase` to use the builder, persist plans, and aggregate/persist errors.
3. Introduce `CsvApplyThesauriPlanUseCase` + job; dispatch it after preparation completes.
4. Implement `csv_import_thesauri_values` schema + DS for plan persistence.
5. Revive/replace `CsvPreflightPreparationUseCase.spec.ts` to cover the new behavior.
6. Document the plan format and failure schema for the future `/csv_imports/{importId}` endpoint.

Keep this document synchronized with reality so the next agent can pick up any remaining steps without digging through history.
