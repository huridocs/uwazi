# IX PDF Suggestions Loop on Production Branch

## Scope

This note is a standalone handoff context for debugging the IX PDF suggestions loop on `production`.

## Branch and workspace state

- Branch verified: `production`
- Local dirty file at check time: `app/api/config.ts` (unrelated to diagnosis)

## Problem statement

In IX PDF extractor runs, training succeeds, but "Get suggestions" can loop indefinitely with no visible progress in Uwazi.

Observed runtime behavior from prior reproduction:

- PME returns suggestions and reports them saved.
- Uwazi receives suggestions payload successfully.
- Uwazi remains in suggestions-processing loop.
- `ixsuggestions` aggregate for extractor remains:
  - `total: 21`
  - `nonProcessed: 21`
  - `readyHealthy: 0`

## Production code check (current branch)

### 1) Suggestions save path still matches by `fileId: segmentation.fileID`

File: `app/api/services/informationextraction/InformationExtraction.ts`

- `saveSuggestionsForPdfSource` does:
  - find segmentation by `xmlname`
  - fetch original suggestion by:
    - `entityId`
    - `extractorId`
    - `fileId: segmentation.fileID`

This is still present on `production`.

### 2) Placeholder creation path still goes through DAO

File: `app/api/suggestions/useCases/createBlankSuggestionsForPdf.ts`

- Uses `FilesDAOFactory.default().getByQuery<ProcessedPDFDBO>(...)`
- Then calls `SuggestionFactory.createForPdf({ file, ... })`

### 3) Placeholder `fileId` source

File: `app/api/suggestions/suggestionFactory.ts`

- `createForPdf` sets `fileId: file._id`

### 4) Segmentation side type

File: `app/api/services/pdfsegmentation/segmentationModel.ts`

- `segmentations.fileID` is explicitly `ObjectId`.

## Diagnosed mismatch

From previous reproduction DB evidence:

- `segmentations.fileID` values are `ObjectId`.
- `ixsuggestions.fileId` values for affected extractor rows were `string`.

With current save query using `fileId: segmentation.fileID`, this can cause lookup misses for all suggestions.

If `originalSuggestion` is not found consistently:

- progress counters do not advance on the expected rows
- loop continues dispatching suggestions

## Root cause correction (confirmed)

The previous "likely culprit" attribution to June 2026 (`2032b31ce4` / `#9225`) was a hypothesis and is now superseded.

Confirmed primary root cause for the clean-environment mismatch is older:

- `PDFPostProcessJob` emits `FileUpdatedEvent` with `toDTO()` payload.
- That makes `after._id` string in event payload.
- IX `AfterFileUpdatedListener` consumed this payload and created blank PDF suggestions with string `fileId`.
- Later, result saving matches by `fileId: segmentation.fileID` (`ObjectId`), causing misses.

Evidence:

- `git blame` on `app/api/core/application/PDFPostProcessJob.ts` lines emitting `before/after` shows `toDTO()` introduced in:
  - commit `49ac674a5b`
  - date `2025-12-11`
- This aligns with the "about 6 months old" timeline and predates the June 2026 DAO refactor.

Secondary issue identified during debugging:

- when `originalSuggestion` lookup misses in `saveSuggestionsForPdfSource`, the old path could persist malformed suggestion rows (missing key linkage fields), which then survive normal delete listeners.

## Current validated remediation direction

1. Keep `FileUpdatedEvent` DTO-based in new architecture (string IDs at contract boundary).
2. Normalize to `ObjectId` at IX listener boundary before blank suggestion creation (legacy IX/Mongo boundary).
3. Keep `ixsuggestions.fileId` normalized in Mongo (`ObjectId`) via migration.
4. Guard `saveSuggestionsForPdfSource` to skip when `originalSuggestion` is missing (prevent malformed inserts).
5. Migration `196` also removes malformed suggestion rows missing required linkage fields.

## Relevant files

- `app/api/services/informationextraction/InformationExtraction.ts`
- `app/api/suggestions/useCases/createBlankSuggestionsForPdf.ts`
- `app/api/suggestions/suggestionFactory.ts`
- `app/api/services/pdfsegmentation/segmentationModel.ts`
- `app/api/core/infrastructure/mongodb/files/MongoFilesDAO.ts`
- `app/api/core/infrastructure/mongodb/files/schemas/filesTypes.ts`
