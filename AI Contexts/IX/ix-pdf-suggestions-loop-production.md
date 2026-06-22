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

## Likely introducing change (time-correlated)

Strongest suspect in "worked a few days ago" window:

- Commit: `2032b31ce4`
- PR: `#9225` (`create mongo files dao`)
- Date: 2026-06-17
- Reason:
  - changed `createBlankSuggestionsForPdf` from `files.get(...)` to `FilesDAOFactory...getByQuery(...)`
  - this is the path that creates placeholder suggestions used later by the save matcher

Important nuance:

- The strict matcher in `InformationExtraction.saveSuggestionsForPdfSource` is older.
- Newer changes likely altered data shape/type flowing into that matcher.

## Secondary related refactor

- Commit: `925844b2ad`
- PR: `#9215` (`Refactor/remove update file feature flag`)
- touched files/events/suggestions architecture broadly, but did not directly modify `createBlankSuggestionsForPdf.ts`.
- Keep as secondary context in case interaction effects matter.

## Suggested next steps for next agent

1. Reproduce on `production` with one extractor and capture:
   - Uwazi fetched payload length
   - counts before/after in `ixsuggestions`
   - type grouping for `ixsuggestions.fileId`
2. Inspect created placeholder docs right after blank suggestion creation:
   - verify `fileId` BSON type
   - verify `extractorId/entityId/fileId` all present
3. Confirm whether `originalSuggestion` query misses due to type mismatch.
4. If confirmed, propose fix and migration strategy:
   - normalize `ixsuggestions.fileId` type across old/new docs
   - add guard to prevent persisting malformed suggestion records when source placeholder lookup fails
5. Add regression test covering PDF placeholder creation + saveSuggestionsForPdfSource end-to-end with strict type assertions.

## Relevant files

- `app/api/services/informationextraction/InformationExtraction.ts`
- `app/api/suggestions/useCases/createBlankSuggestionsForPdf.ts`
- `app/api/suggestions/suggestionFactory.ts`
- `app/api/services/pdfsegmentation/segmentationModel.ts`
- `app/api/core/infrastructure/mongodb/files/MongoFilesDAO.ts`
- `app/api/core/infrastructure/mongodb/files/schemas/filesTypes.ts`
