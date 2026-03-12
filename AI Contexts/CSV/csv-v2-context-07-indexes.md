# CSV Import V2 — Context 07 Indexes

Date: 2026-03-12  
Owner: CSV Import V2 initiative  
Purpose: Track Mongo index decisions and migration implementation notes for `csv.v2`.

## 1) Why this document exists

This file is the handoff context for CSV v2 indexing work so another agent can continue without re-discovery.

It records:

- proposed baseline Mongo indexes for CSV v2 collections,
- rationale based on current query patterns in code,
- migration implementation/testing notes.

## 2) Current query patterns observed (code reality)

### `csv_imports`

- read by `_id` (`getById`, cancellation checks),
- list all imports sorted by `createdAt DESC` (`getAll`),
- status-based updates/cancel transitions by `_id` (default `_id` index already applies).

### `csv_import_rows`

- `countDocuments({ importId })`,
- paged reads: `find({ importId }).sort({ rowIndex: 1 }).skip(offset).limit(limit)`,
- selective reads: `find({ importId, rowIndex: { $in: indexes } }).sort({ rowIndex: 1 })`,
- cleanup: `deleteMany({ importId })`.

### `csv_import_row_errors`

- `countDocuments({ importId })`,
- report reads: `find({ importId }).sort({ rowIndex: 1 })`,
- cleanup: `deleteMany({ importId })`.

### `csv_import_thesauri_values`

- `find({ importId })`,
- `updateOne({ importId, thesaurusId }, { $set: ... })`,
- `deleteMany({ importId })`.

### `csv_import_relationships_pending_values`

- `find({ importId })`,
- `deleteMany({ importId })`,
- insert per `{ importId, templateId }` document.

### `csv_import_relationships_values`

- `find({ importId })`,
- `deleteMany({ importId })`,
- insert per `{ importId, templateId }` document.

## 3) Baseline indexes (implemented via migration `185`)

### `csv_imports`

1. `createdAt_desc`
   - `{ createdAt: -1 }`

### `csv_import_rows`

1. `importId_rowIndex_unique`
   - `{ importId: 1, rowIndex: 1 }`
   - `unique: true`
   - supports ordered paging, selective lookups, counts, and import cleanup.

### `csv_import_row_errors`

1. `importId_rowIndex`
   - `{ importId: 1, rowIndex: 1 }`

### `csv_import_thesauri_values`

1. `importId_thesaurusId_unique`
   - `{ importId: 1, thesaurusId: 1 }`
   - `unique: true`

### `csv_import_relationships_pending_values`

1. `importId_templateId_unique`
   - `{ importId: 1, templateId: 1 }`
   - `unique: true`

### `csv_import_relationships_values`

1. `importId_templateId_unique`
   - `{ importId: 1, templateId: 1 }`
   - `unique: true`

## 4) Migration implementation status and notes

Status: **Implemented and tested**.

- Migration:
  - `app/api/migrations/migrations/185-csv_v2_indexes/index.ts`
- Spec:
  - `app/api/migrations/migrations/185-csv_v2_indexes/specs/185-csv_v2_indexes.spec.ts`
- Focused verification command:
  - `DEBUG=true node --no-experimental-fetch ./node_modules/.bin/jest app/api/migrations/migrations/185-csv_v2_indexes/specs/185-csv_v2_indexes.spec.ts`
- Latest verification result (Mar 2026): pass (7/7 tests).

Implementation conventions retained for future index migrations:

- Follow existing migration style under `app/api/migrations/migrations/*/index.ts`.
- Use `176-update_entity_title_indexes` as the concrete reference pattern for this work:
  - inspect existing indexes before create/drop,
  - emit explicit progress logs,
  - create idempotent index changes with explicit options.
- Use explicit index names in `createIndex` options.
- Make migration idempotent:
  - avoid blind drops when names differ by environment.
- Add migration spec(s) that assert:
  - indexes exist with expected keys/options,
  - no duplicate/conflicting index definitions are introduced.

## 5) Open decisions / follow-up triggers

1. **Resolved (Mar 2026):** `status_updatedAt` is intentionally deferred.
   - Rationale: keep index set minimal until real status+time query paths exist in production usage.
   - Follow-up trigger: add it when cleanup/finalizer/status-sweep queries are implemented.
2. **Resolved (Mar 2026):** use migration delta `185` for CSV v2 index work.

## 6) Next active priority after indexes

With index migrations complete, the next active CSV v2 priority is:

- **Complete CSV v2 boundary cleanup from v1 dependencies** in `app/api/csv.v2/**`.

