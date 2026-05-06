# Download segmentation endpoint context (handoff)

## What was requested

The original request was to add an endpoint to download PDF segmentations.

Important clarification from product/engineering:

- We do **not** want the XML file artifact used by downstream services.
- We want the **segmentation data stored after the segmentation service replies**.

## Current implementation status

A new endpoint was implemented:

- `GET /api/v2/files/:id/segmentation`

Current behavior:

- Admin-only route.
- Respects tenant settings gate (`settings.features.segmentation`).
- Returns segmentation data from Mongo (`segmentations` collection), not the XML file.
- Response is JSON (domain-mapped segmentation data).

## Where segmentation data is actually stored after service reply

### Source of truth for post-processed segmentation payload

File: `app/api/services/pdfsegmentation/PDFSegmentation.ts`

- `processResults()` receives successful service response.
- `saveSegmentation()` persists data into Mongo `segmentations` collection:
  - `segmentation.page_height`
  - `segmentation.page_width`
  - `segmentation.paragraphs`
  - plus `status: 'ready'` and `xmlname`

Relevant flow:

1. `requestResults(message)` fetches:
   - JSON payload (`data_url`) -> parsed segmentation object
   - XML file stream (`file_url`)
2. `storeXML(...)` stores XML artifact under segmentation storage.
3. `saveSegmentation(...)` stores structured segmentation payload in DB.

### Model schema

File: `app/api/services/pdfsegmentation/segmentationModel.ts`

- Collection: `segmentations`
- Uses `strict: false`
- Declares:
  - `fileID`
  - `status` (`processing|failed|ready`)
  - `autoexpire` TTL field
- Additional fields (including `segmentation`, `xmlname`, `filename`) are persisted due to `strict: false`.

### Shared type shape

File: `app/shared/types/segmentationType.d.ts`

- `SegmentationType.segmentation`:
  - `page_width`
  - `page_height`
  - `paragraphs[]`

## Why duplicates were handled in current code

There is no unique DB constraint on one segmentation per file.

Existing tests explicitly cover duplicate segmentation records for the same file, including mixed statuses.

Because of that, current endpoint logic selects a deterministic record when more than one exists.

## Files currently implementing endpoint behavior

- `app/api/segmentation.v2/infrastructure/http/routes.ts`
- `app/api/segmentation.v2/infrastructure/http/DownloadFileSegmentationController.ts`
- `app/api/segmentation.v2/application/DownloadFileSegmentation.ts`
- `app/api/segmentation.v2/infrastructure/http/specs/routes.spec.ts`
- `app/api/files/specs/fixtures.ts`

## Notes for next agent

- Endpoint now returns DB-backed segmentation payload (post-service result), not XML artifact.
- Settings gate is still enforced (`settings.features.segmentation`).
- Auth remains admin-only.
- If product needs XML later, add a separate dedicated XML artifact route.
