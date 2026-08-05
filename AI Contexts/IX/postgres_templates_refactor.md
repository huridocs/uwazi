# Postgres Templates Refactor - Debugging Notes

## Observed Symptoms

- The **Train model** process appears to disappear from the UI while the model is still deep in training.  
  - Symptom is confirmed and should be diagnosed later.

## IX PDF Suggestions Loop Diagnosis

### Summary

We diagnosed a regression in the IX PDF suggestions flow where Uwazi keeps dispatching `suggestions` tasks and no suggestions appear in the UI as processed.

This is **not** a PME callback URL issue anymore (that was fixed in local setup).  
The current blocker is in Uwazi suggestion persistence/matching.

### Symptoms observed

- `create_model` completes successfully.
- `suggestions` tasks keep reappearing in queue processor logs.
- Uwazi remains in "Finding suggestions".
- In `uwazi_development.ixsuggestions` for extractor `6a35a43eda86037f4bfd8a30`:
  - `total: 21`
  - `nonProcessed: 21`
  - `readyHealthy: 0`

### Verified runtime evidence

#### 1) PME -> Uwazi callback is valid and reachable

Uwazi debug logs show:

- `data_url: http://127.0.0.1:5056/get_suggestions/default/6a35a43eda86037f4bfd8a30`
- Response parsed successfully:
  - `isArray: true`
  - `length: 21`

So transport + endpoint reachability is working.

#### 2) Uwazi receives and attempts to save all 21

Debug in `saveSuggestionsForPdfSource` reports:

- `rawCount: 21`
- `missingEntity: 0`
- `missingSegmentation: 0`
- `saved: 21`

But also:

- `firstSavedSuggestionId: ''`
- `persistedSample: undefined`
- `readyHealthyInDB: 0`
- `nonProcessedInDB: 21`

This indicates no update of existing placeholder suggestions occurred.

### Root cause

In `saveSuggestionsForPdfSource`, Uwazi looks up original suggestion with:

- `entityId: entity.sharedId`
- `extractorId: extractor._id`
- `fileId: segmentation.fileID`

The issue is a **BSON type mismatch** on `fileId`:

- `segmentations.fileID` is `ObjectId`
- `ixsuggestions.fileId` (for this extractor) is `string`

Therefore lookup misses all records, `originalSuggestion` is undefined, and the flow does not update the expected placeholder docs.

As a result, progress counters never increase for the extractor's tracked docs, and the suggestions loop continues.

### Additional integrity issue found

Malformed suggestion documents are being inserted without `extractorId` (and other key linkage fields), e.g. docs containing only:

- `status: "ready"`
- `suggestedValue`
- `date`

This suggests that when `originalSuggestion` is missing, the save path still allows persistence of partially built objects instead of failing/guarding.

### Why this likely surfaced now

The behavior is consistent with refactor-induced schema/typing inconsistencies (templates/thesauri/postgres migration work touching IX-related data flow), specifically around `fileId` representation and matching assumptions.

### Recommended fixes

1. Normalize `fileId` typing end-to-end (choose one canonical type for IX suggestions and matching).
2. In `saveSuggestionsForPdfSource`, add a hard guard:
   - if `originalSuggestion` is missing, do not persist malformed suggestion;
   - log and count it explicitly.
3. Add regression tests for PDF flow to ensure:
   - `originalSuggestion` lookup succeeds for mixed BSON/string scenarios;
   - no suggestion can be saved without required linkage fields (`extractorId`, `entityId`, `fileId`).
4. Optional: add one-time cleanup/migration for malformed docs already written.

### Reproduction references

Extractor used during diagnosis:

- `extractorId = 6a35a43eda86037f4bfd8a30`

Key DB checks used:

- `ixsuggestions` aggregate remained `nonProcessed: 21`, `readyHealthy: 0`
- `ixsuggestions.fileId` type grouped as `string`
- `segmentations.fileID` confirmed `ObjectId`
- count of malformed docs without `extractorId` was non-zero
