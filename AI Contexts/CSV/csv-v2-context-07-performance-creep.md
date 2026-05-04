# CSV V2 Context 07 — Performance Creep Diagnosis and Fix Status

Date: 2026-04-23  
Scope: Progressive slowdown during long-running CSV entities import (`csv.v2`), with cross-application impact analysis.

## 1) Problem statement

Long CSV imports show **in-run throughput degradation**:

- early batches are fast,
- later batches in the same run become progressively slower,
- rerunning the same file starts fast again and creeps again.

This is a time-creep pattern, not a fixed per-row cost.

## 2) Confirmed root cause

Primary root cause is in `MongoTransactionManager` lifecycle, not CSV mapping logic:

- transaction commit/retry handlers were accumulating across repeated `run()` executions in the same manager instance,
- per-row transactional flows register handlers repeatedly,
- handler accumulation inflated transaction overhead over time.

Relationship sync queue pressure is **not** the primary cause of this creep.

## 3) Affected runtime paths

### 3.1 Import path where creep becomes visible

- `app/api/csv.v2/application/jobs/CsvImportEntitiesRowsProcessor.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesBatchProcessor.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesContextLoader.ts`

### 3.2 Core side-effect paths impacted by transaction handler semantics

- `app/api/core/application/EntitiesService.ts`
- `app/api/core/application/FilesService.ts`
- `app/api/entities.v2/database/MongoMultiLanguageEntityDataSource.ts`
- `app/api/core/infrastructure/mongodb/files/MongoFilesDataSource.ts`
- `app/api/core/infrastructure/mongodb/template/MongoTemplatesDataSource.ts`
- `app/api/core/infrastructure/elasticSearch/entities/MongoSlotsDAO.ts`

## 4) Current Stage 1 solution (implemented)

Stage 1 applies a **backward-compatible core fix** in:

- `app/api/core/infrastructure/mongodb/common/MongoTransactionManager.ts`

### 4.1 Stage 1 design

Internal handler lifetime split:

- persistent handlers (manager-lifetime),
- run-scoped handlers (cleared per `run()`).

Routing behavior:

- registration during active transaction -> run-scoped,
- registration outside active transaction -> persistent.

### 4.2 Stage 1 addresses

- **X.** Removes run-scoped handler accumulation across repeated transactions (eliminates creep driver).
- **Y.** Preserves existing constructor-level persistent behavior used by core caching/indexing paths.

### 4.3 Stage 1 verification state

- targeted manager spec passes:
  - `app/api/core/infrastructure/mongodb/common/specs/MongoTransactionManager.spec.ts`
- added coverage includes:
  - no run-to-run leakage for `onCommitted`,
  - no run-to-run leakage for run-scoped `onRetry`,
  - persistent handlers still execute across runs.

## 5) Why Stage 1 is intentionally not strict-scoped yet

Several existing implementations currently rely on constructor-level persistent registrations.
If strict scoped-only registration is enforced immediately, those paths lose behavior.

### 5.1 Implementations that would lose behavior under immediate strict scoped-only

1. `app/api/core/infrastructure/mongodb/CachedMongoSettingsDataSource.ts`  
   Missing: automatic settings cache invalidation after commit.

2. `app/api/core/infrastructure/mongodb/thesauri/CachedMongoThesauriDataSource.ts`  
   Missing: automatic thesauri cache invalidation.

3. `app/api/i18n.v2/database/CachedMongoTranslationsDataSource.ts`  
   Missing: automatic translations cache invalidation.

4. `app/api/core/infrastructure/mongodb/template/CachedMongoTemplatesDataSource.ts`  
   Missing: automatic templates/default-template cache invalidation.

5. `app/api/core/infrastructure/elasticSearch/entities/MongoSlotsDAO.ts`  
   Missing: slot cache invalidation on commit/retry.

6. `app/api/entities.v2/database/MongoMultiLanguageEntityDataSource.ts`  
   Missing: post-commit entity indexing and delete propagation.

7. `app/api/core/infrastructure/mongodb/files/MongoFilesDataSource.ts`  
   Missing: post-commit file/full-text reindex/delete propagation.

8. `app/api/core/infrastructure/mongodb/template/MongoTemplatesDataSource.ts`  
   Missing: post-commit template mapping updates.

## 6) Missing Stage 2 solution

Stage 2 is the contract-hardening phase to remove call-site ambiguity and centralize lifecycle policy.

### A) API contract hardening

- Make app-facing `onCommitted` / `onRetry` strictly transaction-scoped.
- Throw on registration outside active transaction.
- Keep this as the only app-facing behavior.

### B) Persistent hook centralization

- Move persistent cross-transaction hooks to infrastructure bootstrap/factory only.
- Do not let feature/use-case code choose persistent vs scoped.
- Keep persistent registration hidden from app-facing interfaces.

### C) Migration and guardrails

- Migrate constructor-level registrations to centralized bootstrap.
- Add guardrails:
  - type/module boundary between app-facing manager and bootstrap API,
  - runtime assertions for late persistent registration,
  - lint/rule protections against persistent registration in feature code.

## 7) Target end state

One implementer mental model in feature code:

- register handlers only for the current transaction.

And one infrastructure responsibility:

- own and wire persistent system-level post-commit/retry behavior.

This keeps CSV-v2 creep fixed while preserving required core indexing/cache functionality across the application.

