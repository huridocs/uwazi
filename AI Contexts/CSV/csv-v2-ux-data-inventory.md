# CSV V2 UX Data Inventory

Date: 2026-02-19  
Owner: CSV Import V2 initiative  
Audience: UX design team

## Purpose

This document lists what CSV V2 currently stores in each backend collection so UX can design:

- import list/detail information architecture,
- progress and diagnostics surfaces,
- terminology for user-facing labels.

It is intentionally focused on persisted data, not endpoint contracts.

## Collections Overview

| Collection | UX meaning | Primary key(s) |
|---|---|---|
| `csv_imports` | One import process (one row in an imports list) | `_id` (import id) |
| `csv_import_rows` | Staged source rows from `import.csv` after extraction (pipeline work buffer) | `importId` + `index` |
| `csv_import_row_errors` | Per-row failures produced during import processing | `importId` + `rowIndex` |
| `csv_import_thesauri_values` | Preflight thesauri pending/applied mappings for this import | `importId` + `thesaurusId` |
| `csv_import_relationships_pending_values` | Relationship titles detected during scan, grouped by target template | `importId` + `templateId` |
| `csv_import_relationships_values` | Final relationship label-to-entity mapping used by import stage | `importId` + `templateId` |

## `csv_imports` (master import record)

This is the primary source for import cards, status timeline, and high-level diagnostics.

### Stored fields

- Identity and context:
  - `_id` (import id)
  - `templateId`
  - `createdBy`
  - `createdAt`, `updatedAt`
- Uploaded file metadata:
  - `file.originalName` (original uploaded filename)
  - `file.mimeType`
  - `file.size`
- Internal storage pointer:
  - `storage.path`
- Status and progress:
  - `status`
  - `progress.totalRows`
  - `progress.processedRows`
  - `progress.lastProcessedRow`
  - `progress.batchSize`
- Aggregated stats:
  - `stats.thesaurusValuesObserved`
  - `stats.thesaurusValuesCreated`
  - `stats.thesauriTouched`
  - `stats.relationshipValuesObserved`
  - `stats.relationshipValuesCreated`
  - `stats.entitiesCreated`
  - `stats.rowsProcessed`
  - `stats.rowsFailed`
- Extraction metadata (source upload and ZIP contents):
  - `extraction.sourceType` (`zip` or `csv`)
  - `extraction.originalUploadSizeBytes`
  - `extraction.extractedFilesCount`
  - `extraction.totalFilesInZip` (ZIP only)
  - `extraction.files[]`:
    - `filename`
    - `sizeBytes`
    - `compressedSizeBytes` (ZIP only)
- Failure and diagnostics:
  - `failure.message`
  - `failure.retryable`
  - `failure.at`
  - `failure.stage`
  - `failure.code` (optional)
  - `failure.issues[]` (optional, structured details)
  - `rowErrors` (summary object used by report flow)

## `csv_import_rows` (staged CSV rows)

Internal processing buffer. Usually not directly exposed to end users.

### Stored fields

- `importId`
- `index`
- `headers[]`
- `values[]`

## `csv_import_row_errors` (row-level failures)

Detailed error list behind failed-row count and support diagnostics.

### Stored fields

- `importId`
- `rowIndex`
- `message`
- `createdAt`

## `csv_import_thesauri_values` (thesauri preflight/apply data)

Stores pending and applied thesauri mappings built from CSV scan.

### Stored fields

- `importId`
- `thesaurusId`
- `createdAt`
- `entries[]`:
  - `propertyId`
  - `propertyName`
  - `thesaurusId`
  - `type` (`select` or `multiselect`)
  - `roots[]`:
    - `label`
    - `normalized`
    - `languages` (language-to-label map)
    - `children[]` (`label`, `normalized`, `languages`)
- Apply outcome:
  - `appliedAt`
  - `appliedValues[]` (`label`, optional `parentLabel`, `valueId`)
  - `stats.valuesObserved`
  - `stats.valuesCreated`

## `csv_import_relationships_pending_values` (relationships scan output)

Stores discovered relationship titles before relationship entity creation/resolution.

### Stored fields

- `importId`
- `templateId`
- `titles[]`
- `createdAt`

## `csv_import_relationships_values` (relationship mapping output)

Stores resolved relationship mapping used by entity import stage.

### Stored fields

- `importId`
- `templateId`
- `values[]`:
  - `label`
  - `matches[]`:
    - `sharedId`
    - `templateId`
- `createdAt`

## Notes for UX terminology

- Use `file.originalName` as the display label for "uploaded file" in import lists/details.
- Use `extraction` fields for ZIP/source-file level progress and diagnostics (counts and sizes).
- Treat `csv_import_rows` and most preflight mapping collections as operational/internal data unless a diagnostics view explicitly needs them.
