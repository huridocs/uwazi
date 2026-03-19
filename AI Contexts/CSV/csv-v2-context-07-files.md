## CSV Import V2 — Files/Attachments Plan (07-files)

**Date:** 2026-01-29
**Owner:** CSV Import V2 initiative
**Status:** Planning doc for CSV v2 files/attachments integration

### 1) Purpose

Document how to wire CSV v2 imports to create entities **with files** using the current
Entities V2 creation flow and new file storage implementations. This is a handoff
plan that captures the code paths, the required data shapes, and the trade-offs.

---

### 2) Current V2 entity creation with files (what exists today)

**CreateEntityUseCase** (`app/api/core/application/CreateEntity.ts`) already supports
files at creation time:

- Input `inputFiles?: InputFile[]` (uploaded files and URL attachments).
- `PropertyAssignmentCreatorServiceStrategy.bulkCreate(...)` maps metadata values; for
  image/media it can consume `{ attachment: number }` values and resolve to the correct
  `InputFile` by index.
- Files are stored on disk/S3 via `FilesService.storeFiles`.
- File records are inserted in DB via `FilesService.insert` (with PDF post-processing jobs
  and FileCreatedEvent emitted after commit).

**Key file types:**

- `InputFile` types: `document`, `attachment`, `url_attachment`, `custom`, `raw`.
- `InputFile.toEntityFile(...)` yields:
  - `ProcessingPDF` for `document`
  - `FileAttachment` for `attachment`
  - `URLAttachment` for `url_attachment`

**Important:**

- `ImagePropertyAssignmentCreatorService` and `MediaPropertyAssignmentCreatorService`
  accept `{ attachment: number }`, which references the `inputFiles` array (attachments only).
- For images/media that are URLs or `/api/files/...` paths, the value can remain a string.
- There is a separate `FileUploadForEntity` use case for _adding files to existing entities_.
  We do **not** need this for CSV import if we create entities with files at creation time.
- The “uploaded files” concept in v2 is represented by `inputFiles` on `CreateEntityUseCase`.
  The “files” parameter mentioned elsewhere appears to be tied to **editing** flows; this
  needs confirmation before implementing CSV import wiring.

---

### 3) Current CSV v2 import pipeline (files implemented)

`CsvImportEntitiesJob` now supports files/attachments by:

- resolving extracted files into `InputFile[]` per row,
- using `PropertyAssignmentCreatorServiceStrategy.bulkCreate(...)`,
- calling `FilesService.storeFiles` (outside TM) and `FilesService.insert` (inside TM).

Result: CSV v2 **does** import files/attachments using the Entities V2 file flow.

---

### 4) Storage and filesystem context (extracted files)

CSV extraction stores files under:

```
csv-imports/{importId}/extracted/<filename>
```

Storage is handled via `FileStorage`:

- Disk: `FileSystemStorage` uses `PathManager` to resolve tenant paths.
- S3: `S3FileStorage` stores under the same `PathManager`-derived key.

**Implication for CSV import:**

- CSV import should read extracted files through the `FileStorage` abstraction, not
  directly from disk paths, so the solution works for both disk and S3.
- CSV import **does not** own cleanup of any files created by Entities V2 during entity
  creation. Those are managed (or deferred) by the entities subsystem.
- For now, **no cleanup policy** is applied to CSV extracted assets; we keep them and
  revisit retention later. These extracted ZIP assets are still CSV‑owned, but retained
  indefinitely until a retention policy exists.

Safe read approach:

1. `fileStorage.getFile({ type: 'customPath', destination, filename })` → `FileContents`
2. `InputFile.fromStream({ stream, originalname, mimetype, type })` to produce
   an `InputFile` backed by a temp file (works for both disk and S3).

This also gives us a consistent file size and metadata.

---

### 5) CSV semantics to support (parity with v1)

From v1 `importEntity`:

- `file` column: treated as a **document**, extracted from ZIP and stored as document.
- `attachments` column: list of filenames; extracted and stored as attachments.
- Image/media properties can point at attachment filenames; metadata is rewritten to
  `/api/files/{filename}` or equivalent.
- `file` should remain **single-value** for v1 parity.
- `files` is the new explicit multi-document column and supports `|` separation.

For v2, the same behavior should be preserved, but implemented with the Entities V2
creation flow:

- `file` / `file__{defaultLanguage}` → `InputFile(type='document')` from a single filename.
- `files` → one or many `InputFile(type='document')` values (`|`-separated).
- `attachments` → `InputFile(type='attachment')` list for the row.
- Image/media values that match an attachment should be mapped to `{ attachment: index }`,
  so property assignment services resolve to the correct attachment file.

---

### 6) Implemented approach (Entities V2 path)

We should use the **Entities V2 creation flow** for each CSV row that has files.
Two integration options:

#### Option A — Use CreateEntityUseCase per row (simpler, slower)

1. For each row:
   - Build `inputFiles` (attachments + document) using extracted files.
   - Build `propertyAssignments` using CSV mapper, but emit `{ attachment: index }`
     for image/media values that map to attachments.
2. Call `CreateEntityUseCase.execute(...)` with:
   - `templateId`
   - `propertyAssignments`
   - `inputFiles`

Pros:

- Reuses current, proven file-aware flow.
- Handles file storage, DB insert, and events consistently.

Cons:

- Nested transaction behavior may conflict with existing batch transactions.
- Potentially slower (per-row use case + file writes).

#### Option B — Extend CSV batch to use property assignment services (implemented)

1. Added `PropertyAssignmentCreatorServiceStrategy`, `FilesService`, `FileStorage`,
   and `IdGenerator` to the entities-import job deps (wired in `queueRegistry.ts`).
2. For each row:
   - Build `inputFiles` for the row (attachments/documents).
   - Build **property assignment inputs** instead of domain assignments.
     - For image/media: use `{ attachment: index }` when a filename matches an extracted file.
     - For other properties: use existing CSV mapping logic.
   - Use `propertyAssignmentCreatorServiceStrategy.bulkCreate(...)` to create assignments,
     passing the row attachments.
   - Apply assignments to the `Entity`, store files via `FilesService.storeFiles(...)` outside TM,
     and insert entity + file records inside a per-row transaction (`entitiesDS.create` and
     `FilesService.insert`).
   - CSV import does **not** implement file cleanup for files written by Entities V2.

Pros:

- Preserves batching and control of transaction boundaries.
- Avoids nested transaction issues from per-row use case.
  Pros/Cons:
- Requires a mapper refactor to produce `PropertyAssignmentInput` (not domain assignments).

**Recommendation:** Start with Option B to keep batch processing intact and avoid
transaction conflicts. Keep Option A documented for the caveats above.

---

### 7) Data flow (per CSV row, implemented)

1. **Detect file references in row:**

   - `file` (and `file__{defaultLanguage}` when present) → one document filename (v1 parity)
   - `files` (unsuffixed only) → one or multiple document filenames (split by `|`)
   - `attachments` column → list of attachment filenames (split by `|`)
   - image/media values → may reference filenames or URLs

2. **Resolve extracted files to InputFile:**

   - For each filename: load with `fileStorage.getFile` using `customPath`.
   - Convert to `InputFile.fromStream`, set `type` = `attachment` or `document`.
   - Preserve `originalname` from CSV so errors are traceable.

3. **Map property assignments:**

   - For image/media values that match an attachment filename:
     - Use `{ attachment: index }` where index is the position in the attachments list.
   - For URLs or `/api/files/...` values, use `{ value: <string> }`.

4. **Persist (row is atomic):**
   - If any referenced file is missing, **row fails** and no entity is created.
   - Let Entities V2 handle file storage and file-record insertion.
   - CSV import does not perform cleanup for files created by entity creation.

---

### 8) Decisions (based on latest agreement)

- **Attachment order**: keep the row order (split by `|`); it is not semantically
  important but it is consistent and predictable.
- **Row‑level atomicity**: if any referenced file is missing, the **row fails** and
  no entity is created. This is aligned with existing row‑error policies (no new
  “stop immediately” behavior beyond the defined thresholds).
- **`file` column**: reverted to **single value** for full v1 compatibility.
- **`files` column**: new explicit multi-file column; supports one or many values with `|`.
- **Language behavior**:
  - `file__{lang}` remains valid (with default-language requirements handled by header analysis).
  - `files` must be unsuffixed (no `files__{lang}` support).
- **Media timeLinks**: not supported in v1 CSV import (no evidence in `app/api/csv/**`).
  Defer in v2; import media without timelinks and add a TODO for future support.

---

### 9) Implementation checklist (updated)

1. ✅ **Implemented** `CsvImportRowFilesResolver` helper:

   - Input: `importId`, row values, headers, `fileStorage`
   - Output: `{ attachments: InputFile[], documents: InputFile[] }`

2. ✅ **Implemented** mapper output as `PropertyAssignmentInput` values
   (image/media with `{ attachment: index }` when appropriate). The mapper no longer
   normalizes/validates values; that responsibility lives in the property assignment
   services and domain validators.

3. ✅ **Updated** CSV batch processor to:

   - build assignments via `PropertyAssignmentCreatorServiceStrategy`,
   - call `FilesService.storeFiles` (outside TM) + `FilesService.insert` (inside TM),
   - keep batch transactions clean (per-row TM only; batch progress update uses separate TM).

4. **Still needed — add tests:**

   - ✅ `CsvImportRowFilesResolver.spec.ts` now covers:
     - single `file`,
     - default-language `file__{lang}`,
     - `file` piped value treated as a single filename (v1-compatible behavior),
     - `files` piped multi-values + combination with `file`.
   - ✅ `CsvHeaderAnalyzer.spec.ts` now asserts `files__{lang}` is rejected (`UnknownProperty`).
   - Single-row import with an image file + media file + document.
   - Missing extracted file → row error and no entity created.
   - S3 vs disk compatibility (at least unit tests for FileStorage.getFile → InputFile.fromStream).

5. (Optional but recommended) Add a preflight **file existence check**:
   - Scan staged rows for `file`, `files`, and `attachments` filenames.
   - Verify extracted files exist in storage.
   - Surface missing files early as preflight issues to avoid later row failures.

---

### 10) Relevant code references

- `CreateEntityUseCase` — `app/api/core/application/CreateEntity.ts`
- `InputFile` — `app/api/core/infrastructure/files/InputFile.ts`
- `FilesService` — `app/api/core/application/FilesService.ts`
- `PropertyAssignmentCreatorServiceStrategy` — `app/api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.ts`
- `ImagePropertyAssignmentCreatorService` — `.../ImagePropertyAssignmentCreatorService.ts`
- `MediaPropertyAssignmentCreatorService` — `.../MediaPropertyAssignmentCreatorService.ts`
- CSV v1 file handling — `app/api/csv/importEntity.ts`
 - New helper — `app/api/csv.v2/application/services/CsvImportRowFilesResolver.ts`
 - Entities import batch — `app/api/csv.v2/application/jobs/CsvImportEntitiesBatchProcessor.ts`