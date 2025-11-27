## CSV Import V2 — Context Doc 03 (Header Analyzer Addendum)

**Date:** 2025-11-18
**Owner:** CSV Import V2 initiative
**Scope:** CsvHeaderAnalyzer rewrite + specs

### Purpose

This addendum captures _everything_ required to continue the CsvHeaderAnalyzer work without needing ad‑hoc explanations. Hand this file to any agent joining midstream: it contains the architectural guardrails, the V1 parity requirements, the V2-only dependencies, testing expectations, and the current plan of record.

### Source context

Read `csv-v2-context-01.md → 02 → 03` first. They describe the program-wide constraints (hexagonal architecture, staged rows, job sequencing, status/event rules, DS factories, etc.). This addendum narrows the lens to the header analyzer + tests.

**Naming note (Nov 2025):** Job logic now lives under `app/api/csv.v2/application/jobs/*Job.ts`, while queue-facing dispatchers live under `infrastructure/queue/*JobDispatcher.ts`. Whenever this doc mentions a “job”, it refers to the application-layer class (e.g., `CsvPreflightJob`); emitters/queues use the dispatcher counterpart.

### Current status

- `app/api/csv.v2/application/CsvHeaderAnalyzer.ts` is a placeholder that:
  - Depends on `TemplateSchema` + `propertyTypes` from v1.
  - Skips header sanitization, mixed-column checks, and the full validation matrix from V1’s `validateColumns.ts`.
  - Lacks dedicated error types/tests.
- `CsvPreflightJob` already imports this analyzer, so once we give it the new signature (Template domain, settings data) TypeScript will force the follow-up fixes in that job.
- No standalone spec exists for the analyzer yet.

### Goal (non-negotiable)

Produce a V2-compliant analyzer that matches (and improves upon) V1’s `validateColumns` behavior while integrating with the new domain model and settings DS. No shortcuts, no “MVP” logic. If V1 validated or emitted an error, we must do the same (or better).

### Architectural guardrails (must follow)

1. **V2-only dependencies**
   - Import the `Template` domain (`app/api/core/domain/template/Template`) instead of legacy `TemplateSchema`.
   - Use `PropertyName.fromLabel(label, { newNameGeneration })` for header sanitization, not `shared/propertyNames.safeName`. This keeps us aligned with templates.v2 property naming.
   - Fetch settings (`availableLanguages`, `defaultLanguage`, `newNameGeneration`) through the V2 `SettingsDataSource`. Do **not** import legacy configs.
2. **Hexagonal rules**
   - Analyzer is pure application logic (no IO, no DS calls). Inputs include the Template domain instance and the raw headers (usually from staged rows).
   - Any persistence/reactions happen in the calling use case.
3. **No v1 module usage**
   - Do not import `validateColumns`, `templateUtils`, or other v1 helpers. Replicate the logic directly in the analyzer using V2 primitives.

### Functional requirements (parity with v1 `validateColumns.ts`)

| Concern                                 | Requirement                                                                                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header sanitization                     | Sanitize every header using `PropertyName.fromLabel(header, { newNameGeneration })`. Support both legacy and new name generation behavior (flag from settings).                                    |
| Partition                               | Split sanitized headers into `headersWithoutLanguage` vs suffixed (language columns). Language suffix format is `__{lang}` (`csvConstants.languageHeaderSeparator`).                               |
| propertiesByName                        | Build a lookup map keyed by property name, including common properties. Title must always be present (enforced by Template domain), so no custom fallback necessary.                               |
| Validation 1 (mutual exclusivity)       | A property cannot have both unsuffixed and suffixed columns simultaneously. Raise an error listing offenders.                                                                                      |
| Validation 2 (supported types)          | Only properties with types `text`, `markdown`, `select`, `multiselect`, `link`, `nested`, `title` may have language columns. `file` remains an allowed exception. Throw if any other type appears. |
| Validation 3 (default language present) | For every property that uses language columns, ensure the default language column exists.                                                                                                          |
| Outputs                                 | Return the sanitized `headersWithoutLanguage`, `languagesPerHeader`, and (if needed downstream) `propertiesByName`. These feed later stages (thesauri preflight, entity extraction, etc.).         |
| Error clarity                           | Introduce `CsvHeaderAnalyzerError` (with reason + property/header metadata). Callers can convert it to `NonRetryableJobError` and persist user-friendly failure objects.                           |

**Analyzer API (current)**
`CsvHeaderAnalyzer.analyze(headers, template, { availableLanguages, defaultLanguage, newNameGeneration })`
The template must be the V2 domain object; the options object comes directly from `SettingsDataSource`.

**Implementation notes (2025-11-18)**
- `LANGUAGE_SUPPORTED_TYPES` currently lives inside the analyzer and mirrors the same enumeration V1 used (`text`, `markdown`, `select`, `multiselect`, `link`, `nested`, plus `title` special-case). Entities.v2 does not yet expose a “supports language columns” flag, so keep this list in sync with the property translation rules until we can promote it to shared metadata (see `AI Contexts/PropertyTranslationRules_V1.md` for the rationale).
- Columns such as `id`, `_id`, or `sharedId` are accepted as part of `headersWithoutLanguage`. Because the language-only validations trigger exclusively on suffixed columns, these reserved identifiers can continue to flow through for update workflows exactly as in V1.
- Current specs cover every failure path present in `app/api/csv/specs/validateColumns.spec.ts` (mixed columns, unsupported types, missing default language) plus an extra happy-path case for `file__{lang}` and a new-name-generation sanitization test that V1 never asserted explicitly. Keep both the analyzer and specs updated whenever that legacy suite grows to ensure parity remains demonstrable.

### Error classification & messaging

- Analyzer errors are deterministic and therefore **non-retriable**. They should bubble up as `NonRetryableJobError` from the use case, set the import status to `failed`, and persist a failure payload on the import document (`{ message, retryable: false, at: 'preflight:thesauri', stage: 'header-analyzer' }` or similar).
- Analyzer aggregates *all* header issues per run. `CsvHeaderAnalyzerError` now exposes `issues: AnalyzerIssue[]` so clients can emit/persist multi-error feedback instead of surfacing one failure per upload attempt. `CsvPreflightJob` persists these issues into `csv_imports.failure.issues` (and marks the import `failed`) before rethrowing a `NonRetryableJobError`.
- Suggested error reasons: `MixedLanguageColumns`, `UnsupportedLanguageColumn`, `MissingDefaultLanguage`, `PropertyNotFound`, `InvalidLanguageSuffix`. Payload should mention the offending columns/properties to aid users.
- Keep messages user-friendly (plain language, actionable). Avoid internal jargon like “PropertyName.fromLabel” in errors.

### Testing requirements

Create `app/api/csv.v2/application/specs/CsvHeaderAnalyzer.spec.ts` (or similar) with at least:

1. **Happy path**: language columns for supported types, verifies sets/maps.
2. **Mixed columns error**: same property appearing both with and without suffix.
3. **Unsupported type error**: e.g., numeric property with `__en` column.
4. **Missing default language**: property has `__es` but not default (e.g., `__en`).
5. **`file` exception**: ensure columns like `file__es` stay allowed despite type not being in the default set.
6. **Sanitization**: raw headers with spaces/punctuation produce template-safe names matching Template domain property names.
7. **Multiple languages**: confirm `languagesPerHeader` accumulates multiple codes and uses Sets.

Testing approach:

- Use real `Template` domain instances (e.g., build via TemplateBuilder helper under `app/api/core/domain/template/specs/TemplateBuilder.ts` or manually instantiate). Do not mock `TemplateSchema`.
- Cover both `newNameGeneration = false` and `true`.
- Keep tests deterministic and align with V2 practices (no reliance on v1 modules).

### Next actions (Nov 18, 2025)

1. **Document context** (this file) ✅
2. **Rewrite analyzer** ✅
   - Analyzer now receives the Template domain + analyzer options (`availableLanguages`, `defaultLanguage`, `newNameGeneration`) and throws `CsvHeaderAnalyzerError` on failures.
3. **Add analyzer specs** ✅
   - Covers all v1 scenarios plus `file__` behavior and new-name-generation sanitization.
4. **Update `CsvPreflightJob`** ✅
   - Retrieves the Template domain via `templatesDS.getById`, pulls analyzer options from `settingsDS`, and wraps analyzer errors in `NonRetryableJobError`.
5. **Propagate status/error handling** (future)
   - Ensure job/use-case emits informative session events when analyzer fails.
- **Fix CsvPreflightJob integration spec** ⛔ (TODO)
   - The job spec under `app/api/csv.v2/application/jobs/specs/CsvPreflightJob.spec.ts` is still out of date (TS/lint/runtime errors). Update once the apply-stage exists.

### References

- V1 behavior: `app/api/csv/validateColumns.ts`
- Template domain naming: `app/api/core/domain/template/PropertyName.ts`
- Template validation (title/common properties): `TemplateWithMissingCommonPropertyValidator`
- Existing consumer: `app/api/csv.v2/application/jobs/CsvPreflightJob.ts`
- Program-wide contexts: `csv-v2-context-01.md`, `csv-v2-context-02.md`, `csv-v2-context-03.md`

Keep this document updated whenever requirements evolve. The success metric is: a new agent reads this file + the earlier context docs and can continue the analyzer work without any additional oral history.
