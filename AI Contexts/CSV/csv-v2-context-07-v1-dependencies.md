# CSV Import V2 — Context 07 V1 Dependencies

Date: 2026-03-12  
Owner: CSV Import V2 initiative  
Purpose: Track all remaining V1 dependencies touching `csv.v2`, classify which ones are intentional bridges vs migration targets, and provide a concrete handoff map.

## 1) Why this file exists

This is the dedicated handoff file for the "CSV v2 boundary cleanup from v1 dependencies" priority.

Use it to answer:

- What legacy dependencies still exist in `app/api/csv.v2/**`?
- Which ones must remain temporarily?
- Which ones should be migrated now?
- What architectural naming caveats exist (notably around `i18n.v2`)?

## 2) Current inventory (classified)

### 2.1 Must remain temporarily (intentional compatibility bridges)

1. `app/api/csv.v2/infrastructure/http/routes.ts`
   - Uses `CSVLoader` from `#api/csv/index.js` for the v1 fallback path when `v2CSVImport` is disabled.
   - This is expected while `/api/import` still supports flag-based v1 fallback.

2. `app/api/csv.v2/infrastructure/services/CsvV1CompatEmitter.ts`
   - Emits old `IMPORT_CSV_*` events under `featureFlags.v1CSVImportCompat`.
   - Wired through CSV v2 job handlers and `app/queueRegistry.ts`.
   - This is temporary and removable once v2 UI/socket contract is fully adopted.

### 2.2 Test-only dependency status (`createTestingZip`)

Status: **Decoupled from v1 (Mar 2026)**.

3. CSV v2 now uses a local helper:
   - `app/api/csv.v2/specs/helpers/createTestingZip.ts`
   - updated imports:
     - `app/api/csv.v2/application/jobs/specs/CsvExtractUploadedZipJob.spec.ts`
     - `app/api/csv.v2/infrastructure/jobHandlers/specs/CsvExtractUploadedZipJobDispatcher.spec.ts`
   - typing alignment:
     - added dev dependency `@types/yazl`
     - helper import uses named export (`import { ZipFile } from 'yazl'`)
     - temporary ambient shim `app/shared/types/yazl.d.ts` was removed after installing real types

What this helper does:

- Creates a zip file from fixture paths using `yazl`.
- Writes it under `<directory>/zipData/<fileName>`.
- It is generic test tooling (zip synthesis), not CSV business logic.

Why this approach was used:

- We intentionally recreated (not moved) the helper so:
  - v1 tests remain unchanged,
  - no v1 file imports from CSV v2 tests remain,
  - eventual `app/api/csv/**` removal will not break CSV v2 tests.

### 2.3 Production-path legacy dependencies (migration status)

Status: **Thesauri/translation + normalization replacement completed (Mar 2026)**.

What changed:

1. Replaced legacy adapters in thesauri-create stage:
   - Removed:
     - `app/api/csv.v2/infrastructure/services/LegacyThesauriRepository.ts`
     - `app/api/csv.v2/infrastructure/services/LegacyTranslationsRepository.ts`
   - Added:
     - `app/api/csv.v2/infrastructure/services/CsvThesauriRepository.ts`
       - uses core `ThesauriDataSourceFactory` (v2 DS path)
     - `app/api/csv.v2/infrastructure/services/CsvTranslationsRepository.ts`
       - uses `i18n.v2` `DefaultTranslationsDataSource` + `Translation` model (`upsert`)
   - Factory wiring updated:
     - `app/api/csv.v2/infrastructure/factories/CsvCreateThesauriValuesJobFactory.ts`

2. Replaced direct v1 normalization usage:
   - Added:
     - `app/api/csv.v2/application/services/CsvThesaurusLabelNormalizer.ts`
   - Updated callers:
     - `app/api/csv.v2/application/services/CsvThesauriValuesDiff.ts`
     - `app/api/csv.v2/application/services/PendingThesauriValuesApplier.ts`
     - `app/api/csv.v2/application/services/CsvEntitiesImportMapper.ts`

Net result:

- No remaining `#api/thesauri/thesauri.js` imports in `app/api/csv.v2/**`.
- No remaining `#api/i18n/translations.js` imports in `app/api/csv.v2/**`.

## 3) What is available in V2 today

### 3.1 Thesauri (true core v2 contracts exist)

- `app/api/core/application/contracts/ThesauriDataSource.ts`
- `app/api/core/infrastructure/factories/ThesauriDataSourceFactory.ts`
- `app/api/core/infrastructure/mongodb/thesauri/MongoThesauriDataSourceV2.ts`
- `app/api/core/application/ThesauriService.ts`
- `app/api/core/domain/thesaurus/Thesaurus.ts`

### 3.2 Translations ("i18n.v2")

- Data sources and services exist:
  - `app/api/i18n.v2/database/data_source_defaults.ts`
  - `app/api/i18n.v2/contracts/TranslationsDataSource.ts`
  - `app/api/i18n.v2/services/*`

But architecture status is mixed (see section 4).

## 4) Confirmation: `i18n.v2` naming nuance

Confirmed from current code: "`i18n.v2`" is not consistently "true v2 architecture" end-to-end; it is largely a v2 data-structure/service layer with compatibility bridges.

Evidence:

1. Route bridge to legacy i18n module:
   - `app/api/i18n.v2/routes/index.ts`
   - imports legacy `translations` from `#api/i18n/index.js` and calls `translations.v2StructureSave(...)`.

2. Explicit v1-v2 conversion/support layer:
   - `app/api/i18n/v2_support.ts`
   - includes mapping functions like `resultsToV1TranslationType(...)` and mixed usage patterns that bridge formats.

Conclusion:

- The naming intuition is correct: `i18n.v2` reflects newer DB model/APIs and partial service modernization, but it still includes compatibility-era pathways and is not uniformly aligned with the stricter "entities.v2-style" boundaries used as CSV v2 target architecture.

## 5) Migration plan for CSV v2 boundary cleanup

### 5.1 Keep for now (explicitly allowed)

- Keep v1 fallback route in `csv.v2` routes until feature-flag retirement is approved.
- Keep `CsvV1CompatEmitter` until v2 UI no longer depends on `IMPORT_CSV_*`.

### 5.2 Migrate now (next slice)

1. ✅ Done — replace test-only `createTestingZip` imports from `app/api/csv/specs/helpers.js` with CSV v2 local helper.
2. ✅ Done — replace legacy thesauri/translations adapters in CSV create-thesauri flow with V2-native data-source/services usage.
3. ✅ Done — remove direct `normalizeThesaurusLabel` imports from `#api/thesauri/thesauri.js` in CSV services via CSV v2 local normalizer utility.

### 5.3 Guardrails while migrating

- Do not change core queue/router/dispatcher/controller/result/error contracts.
- Keep file scope to `app/api/csv.v2/**` (plus docs) unless explicit approval is given.
- Preserve existing CSV behavior; migrate dependencies without semantic regressions.

## 6) Suggested execution order

1. ✅ Completed: test helper decoupling (`createTestingZip`).
2. ✅ Completed: normalization import decoupling (`normalizeThesaurusLabel`).
3. ✅ Completed: thesauri-create repository replacement off legacy adapters.
4. Next candidate: remove temporary compatibility bridges (`v1CSVImportCompat`, v1 route fallback) when product/UI rollout allows.

## 7) Verification checklist for this workstream

- No `app/api/csv.v2/**` production file imports from:
  - `#api/csv/**` (except intentional v1 fallback in `infrastructure/http/routes.ts`)
  - `#api/thesauri/thesauri.js`
  - `#api/i18n/translations.js`
- V1 fallback route and compat emitter remain only where intentionally allowed.
- Focused Jest specs for touched CSV v2 flows pass with the standard command.
- This file and `csv-v2-context-07.md` are updated in the same iteration.

## 8) Latest progress update (Mar 2026)

- `createTestingZip` decoupling completed without touching v1 files.
- Focused verification passed:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/csv.v2/application/jobs/specs/CsvExtractUploadedZipJob.spec.ts app/api/csv.v2/infrastructure/jobHandlers/specs/CsvExtractUploadedZipJobDispatcher.spec.ts`
  - result: pass (2 suites, 9 tests).
- Migration spec output-noise cleanup applied:
  - `app/api/migrations/migrations/185-csv_v2_indexes/specs/185-csv_v2_indexes.spec.ts` now mocks `process.stdout.write` in `beforeAll`.
  - focused spec still passes after change.
- Thesauri-v2 replacement verification passed:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/csv.v2/application/services/specs/PendingThesauriValuesApplier.spec.ts app/api/csv.v2/application/services/specs/CsvEntitiesImportMapper.spec.ts app/api/csv.v2/application/jobs/specs/CsvCreateThesauriValuesJob.spec.ts`
  - result: pass (3 suites, 17 tests).

### 8.1 Clarifications from review (Mar 2026)

- **Normalization semantics (important):**
  - V1 `normalizeThesaurusLabel` uses `trim().toLowerCase()` for matching/dedup.
  - Stored labels are not forced to lowercase; lowercasing is used for comparison keys.
  - Effective behavior remains case-insensitive uniqueness for matching (no separate values differing only by case).
- **Adapter rationale:**
  - Current `CsvThesauriRepository` and `CsvTranslationsRepository` were introduced as an incremental bridge to remove v1 imports from `csv.v2` production code while minimizing service-level churn.
  - This is transitional and should be collapsed in the next pass (see section 9).
- **TS fix applied:**
  - `CsvThesauriRepository` no longer initializes `thesauriDS` from `this.transactionManager` in a field initializer.
  - DS initialization now happens in constructor (fixes "used before initialization" error).

### 8.2 Adapter-collapse completion (Mar 2026)

Status: **Completed**.

Changes:

- Removed temporary CSV adapter layer:
  - deleted `app/api/csv.v2/infrastructure/services/CsvThesauriRepository.ts`
  - deleted `app/api/csv.v2/infrastructure/services/CsvTranslationsRepository.ts`
- Removed temporary CSV adapter contracts:
  - deleted `app/api/csv.v2/application/contracts/ThesauriRepository.ts`
  - deleted `app/api/csv.v2/application/contracts/TranslationsRepository.ts`
- Refactored thesauri-create wiring to consume v2-native contracts directly:
  - `CsvCreateThesauriValuesJobFactory` now injects:
    - core `ThesauriDataSource` (`ThesauriDataSourceFactory.default(...)`)
    - `i18n.v2` `TranslationsDataSource` (`DefaultTranslationsDataSource(...)`)
  - `PendingThesauriValuesApplier` now reads/updates thesauri through `ThesauriDataSource`
    and upserts translations through `TranslationsDataSource`, with no CSV-local repository wrappers.

Verification:

- `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/csv.v2/application/services/specs/PendingThesauriValuesApplier.spec.ts app/api/csv.v2/application/jobs/specs/CsvCreateThesauriValuesJob.spec.ts`
- result: pass (2 suites, 4 tests).
- Follow-up quality pass:
  - extracted helper modules from `PendingThesauriValuesApplier` to reduce complexity/readability load.
  - converted related specs to integration-style DB tests using real data sources/result sets
    (no fake/mocked DS/result-set layer in these specs).
  - adjusted factory to lazily allocate Mongo TM defaults so typed non-Mongo test doubles can be used without app-context errors.

## 9) Updated next candidate in boundary-cleanup track

With temporary thesauri/translations adapters removed, the next candidate in this workstream is:

- remove remaining intentional compatibility bridges when product rollout allows:
  - `v1CSVImportCompat` emitter path
  - v1 fallback route path in `csv.v2` HTTP routing.

### 9.1 Current decision (Mar 2026, latest)

- **Deferred intentionally (not now):** do not remove the remaining compatibility bridges yet.
- Keep current behavior unchanged for:
  - v1 fallback route in `app/api/csv.v2/infrastructure/http/routes.ts`
  - compat emitter flow (`CsvV1CompatEmitter`, `v1CSVImportCompat` flag, queue wiring)
- Next agent should start from this deferred baseline and pick up the next approved task, not bridge removal, unless user/team re-prioritizes explicitly.
