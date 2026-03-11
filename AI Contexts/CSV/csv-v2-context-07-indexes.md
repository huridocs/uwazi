# CSV Import V2 — Context 07 Indexes and Row Index Naming

Date: 2026-03-11  
Owner: CSV Import V2 initiative  
Purpose: Track Mongo index decisions and the `index` vs `rowIndex` naming alignment discussion for `csv.v2`.

## 1) Why this document exists

This file is the handoff context for the current indexing conversation so another agent can continue without re-discovery.

It records:

- the proposed baseline Mongo indexes for CSV v2 collections,
- rationale based on current query patterns in code,
- open decision about `csv_import_rows.index` naming consistency,
- migration implementation notes.

## 2) Current query patterns observed (code reality)

### `csv_imports`

- read by `_id` (`getById`, cancellation checks),
- list all imports sorted by `createdAt DESC` (`getAll`),
- status-based updates/cancel transitions by `_id` (default `_id` index already applies).

### `csv_import_rows`

- `countDocuments({ importId })`,
- paged reads: `find({ importId }).sort({ index: 1 }).skip(offset).limit(limit)`,
- selective reads: `find({ importId, index: { $in: indexes } }).sort({ index: 1 })`,
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

## 3) Proposed baseline indexes (to implement via migration)

### `csv_imports`

1. `createdAt_desc`
   - `{ createdAt: -1 }`
2. `status_updatedAt`
   - `{ status: 1, updatedAt: 1 }`
   - intended for polling and terminal-state cleanup scans.

### `csv_import_rows`

1. `importId_rowIndex_unique` (or `importId_index_unique` if renaming is deferred)
   - `{ importId: 1, index: 1 }` currently
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

## 4) Naming consistency issue: `index` vs `rowIndex`

Question raised: in `csv_import_rows` we store `index`, while in `csv_import_row_errors` we store `rowIndex`. Should `csv_import_rows.index` be renamed to `rowIndex`?

### Assessment

- **Value:** yes, this improves clarity and consistency across CSV v2.
- **Complexity:** **moderate** (not hard, but not trivial one-file change).
- **Blast radius (current):**
  - `CsvImportRow` domain shape and constructors,
  - `MongoCsvImportRowsDataSource` queries/sorts,
  - row staging/reader/preflight/import services that reference `row.index`,
  - entities import error/report wiring that maps row positions,
  - integration/unit tests + fixtures,
  - UX inventory and context docs that reference `{ importId, index }`.

### Recommendation

- **Do it now** (before wider rollout and before index migration ships), because:
  - this field is internal operational data (not a public API contract),
  - future migration/index naming will be cleaner,
  - delaying increases churn and dual-meaning confusion.

## 5) Suggested implementation sequence (if renaming approved)

1. Rename model/DS field usage from `index` to `rowIndex` in `csv.v2`.
2. Build index on `{ importId: 1, rowIndex: 1 }` unique.
3. Update tests and docs (`csv-v2-ux-data-inventory.md`, context docs).
4. Run focused CSV v2 suites and migration specs.

Important clarification (Mar 2026):

- This rename has **not** shipped to production yet.
- Therefore, **no data backfill migration is required** for `index -> rowIndex`.
- We can apply the rename directly in code and tests first, then create indexes using the final field name.

## 6) Alternative (if we defer rename)

If rename is postponed, keep current storage field as `index` and only:

- standardize language in docs as "row index (`index` field)",
- keep index name `importId_index_unique`,
- revisit rename in a dedicated refactor.

## 7) Migration implementation notes

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

## 8) Open decisions for next agent

1. `csv_import_rows.index -> rowIndex` rename is approved and should be treated as the baseline naming.
2. Confirm whether `status_updatedAt` is needed immediately or bundled with cleanup implementation.
3. Confirm migration delta number and naming (next after `184` at time of writing).

