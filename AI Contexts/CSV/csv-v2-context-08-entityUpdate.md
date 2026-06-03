# CSV Import V2 — Context Doc 08 (Entity Update via `id`)

**Date:** 2026-06-03  
**Owner:** CSV Import V2 initiative  
**Scope:** planning only (no implementation yet)

## 1) Purpose

Capture the agreed direction for adding entity updates to CSV v2 when an `id` column is present, aligned with current V1 behavior where relevant, and explicitly documenting open decisions (notably files/idempotency).

---

## 2) V1 Baseline (what exists today)

### 2.1 Which column triggers updates in V1?

V1 uses **only** `id` from CSV row data, and interprets it as `sharedId`.

- `app/api/csv/importEntity.ts`
  - `currentEntityIdentifiers(toImportEntity.propertiesFromColumns.id, language)`
  - lookup query is `{ sharedId, language }`
- `app/api/csv/specs/csvLoader.spec.js`
  - scenario is literally `describe('when sharedId is provided')`, but the CSV header used is `id`

There is no V1 row-import logic that reads `propertiesFromColumns.sharedId` or `propertiesFromColumns._id`.

### 2.2 Unknown `id` in V1

If `id` is present but not found, V1 falls back to create (no explicit row error).  
For CSV v2, this is intentionally changing (see section 3).

### 2.3 Reserved headers note in V2 docs

`app/api/csv.v2/application/services/CsvHeaderAnalyzer.ts` logic (and context notes) allows `id`, `_id`, `sharedId` to pass as non-language headers, but this is not equivalent to import semantics.  
Current decision for update semantics is in section 3.

---

## 3) Agreed Decisions for CSV v2 Entity Update

1. **Update key column:** CSV column is `id`.
2. **Meaning of `id`:** map to entity `sharedId`.
3. **Aliases:** do **not** implement `_id` or `sharedId` aliases for update behavior in this iteration.
4. **Unknown id behavior:** row-level error (no create fallback).
5. **Error simplification:** keep taxonomy simple for this branch; treat as one business-facing case:
   - `"id not found in template"`  
   (No distinction between “id not found at all” vs “entity exists but belongs to another template”.)
6. **Permissions:** import route is admin-only; no additional entity-level permission branching is required for this flow.
7. **Feature flag/migrations:** no new flag and no DB migration required; this ships under existing CSV v2 rollout path.
8. **Stats/UI:** add persisted update counters and expose them in UI using naming consistent with existing stats fields.

---

## 4) Required Changes (planning scope)

## 4.1 Import flow branch in entities stage

Main touchpoint:
- `app/api/csv.v2/application/jobs/CsvImportEntitiesBatchProcessor.ts`

At row processing time:
- if row has `id` value:
  - resolve entity by `sharedId` inside current template scope
  - if found in template -> update path
  - if not found in template -> row error
- if row has no `id` value:
  - keep current create path

## 4.2 Keep using Services, not direct DS writes

Entity persistence remains through service layer (`EntitiesService` / use-case level orchestration), not direct repository writes from CSV job logic.

Important validation item:
- `app/api/core/application/EntitiesService.ts`
  - `insert(...)` currently triggers relationship sync through dispatcher
  - `update(...)` currently emits `EntityUpdatedEvent` but does not call dispatcher sync directly

CSV import should rely on service behavior; if relationship/indexing side effects are incomplete for update, the fix should live in the service/domain orchestration, not as CSV-specific special handling.

## 4.3 Error taxonomy + tests (simplified)

Keep this branch simple:
- add one row error classification for id-template miss semantics (`id not found in template`)
- tests mirror that simplicity (no extra split for template mismatch vs missing id record)

Primary test area:
- `app/api/csv.v2/application/jobs/specs/CsvImportEntitiesJob.spec.ts`

## 4.4 Stats naming and persistence

Current stats include `entitiesCreated`, `rowsProcessed`, `rowsFailed` in:
- `app/api/csv.v2/domain/CsvImport.ts`

Add one update metric named `entitiesUpdated`, keeping `rowsProcessed` and `rowsFailed` as global counters across both created and updated rows.

Likely touchpoints:
- `app/api/csv.v2/domain/CsvImport.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesRowsProcessor.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesJob.ts`
- `app/api/csv.v2/infrastructure/jobHandlers/CsvImportEntitiesJobHandler.ts`
- UI consumers under `app/react/V2/Routes/Settings/CSVUpload/*`

---

## 5) Files on Update: agreed direction + open risk

### Direction

Preferred behavior: when updating by `id`, **insert new files and keep existing files** (append semantics).

### Risk

Append semantics can create duplicates on retries/non-idempotent reprocessing.

### Open implementation detail (must be decided before coding)

Pick one duplicate-control strategy:

1. **Accept duplicates for now** (fastest, least safe),
2. **Best-effort dedupe during update** (for example by stable file reference/name per entity),
3. **Stronger idempotency keying for file operations** tied to `(importId, rowIndex, fileRef)`.

Given prior retry concerns in imports, option 2 is a pragmatic baseline if low-cost; option 3 is strongest but larger scope.

---

## 6) Impact and Effort (revised)

### Expected impact

- No queue topology changes.
- No migration/new feature flag.
- Behavior change only for CSV files including `id`.
- API/UI impact is additive via new update counter(s).
- Partial CSV update semantics (preserving values for omitted columns on update rows) are out of scope for this iteration; current implementation scope does not include this behavior change.

### Effort estimate (planning)

- **Medium** for core update branching + simplified errors + stats/UI.
- **Medium-to-Large** if robust file idempotency is included in same delivery.

---

## 7) Suggested implementation order (when execution starts)

1. Wire row-level `id -> sharedId` update branch in entities import batch processor.
2. Add simplified row error (`id not found in template`) and integration tests.
3. Add persisted update stats field and propagate to API/UI.
4. Finalize append-file duplicate strategy and implement accordingly.
5. Verify service-side update side effects (relationships/indexing) and adjust at service layer if needed.

---

## 8) Notes for next agent

- Do not expand alias semantics beyond `id` unless explicitly requested.
- Keep error taxonomy minimal for this feature branch.
- Keep all path references relative to project root in future context updates.
