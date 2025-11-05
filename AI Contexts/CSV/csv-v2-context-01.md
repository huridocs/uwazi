## CSV Import V2 — Context Doc 01

Date: 2025-11-05
Owner: CSV Import V2 initiative

### Purpose

This document tracks decisions, scope, ToDos, open questions, and references for migrating CSV Import to V2 using the hexagonal architecture and a job-based processing model. It will evolve incrementally as we align on details and implement in very small batches.

### Decisions agreed so far

- **Architecture**: Use V2 hexagonal architecture patterns (as in templates v2, paragraph extraction, etc.).
- **Processing model**: The upload endpoint returns quickly and enqueues background jobs for processing stages (but we will NOT enqueue in the first milestone).
- **Collection**: Create a new MongoDB collection `csv_imports` to track each import (file metadata, status, errors, timestamps, counters, etc.).
- **Storage**: Use the existing `fileStorage` interface to store the original uploaded ZIP/CSV in a dedicated location (tenant namespacing handled by infra; no tenant field or path segment needed).
- **Routing**: Keep the existing endpoint name and fork behavior via tenant feature flag `v2CSVImport` (v1 vs v2), similar to file upload.
- **Reference**: Route flow closely follows `app/api/files/routes.ts` for upload handling.
- **Permissions**: Admin-only for MVP (same as current `/api/import`).
- **Response format**: 200 OK with JSON body to preserve client footprint (mimic current behavior).
- **MVP fields**: Do NOT introduce `stages` in the MVP. Use a single `status` field plus timestamps; add counters and row-based errors later.
- **Allowed file types and size**: Same constraints/validation as current file upload.
- **Retention**: Keep files indefinitely for now; cleanup policies later.
- **Rate limiting**: None for now.
- **Logs**: Only persist logs/state inside the DB import document; no external logs for MVP.

### First milestone (MVP entry point)

- **Create** `csv.v2` folder under `app/api/`.
- **Add entry route** that accepts a ZIP or CSV file and a template ID.
- **Persist** a new record in `csv_imports` upon receipt.
- **Store** the uploaded file via `fileStorage` to a custom path tied to the import id.
- **Respond quickly** with the created `importId` and initial status (e.g., `queued`), then a background job will proceed.

### Proposed API (initial)

- **Method**: POST
- **Path**: `/api/import` (same as current, toggle v1/v2 via `v2CSVImport` feature flag)
- **Auth**: Admin-only (confirmed).
- **Request**: `multipart/form-data`
  - `file`: required (CSV or ZIP)
  - `template`: required (string, template ID; name kept to match current client contract)
- **Response**: Prefer 200 OK to avoid changing client expectations; body contains:
  - `importId`: string
  - `status`: `queued`
  - `message`: short confirmation

Example response:

```json
{
  "importId": "66fa2d6b8e...",
  "status": "queued",
  "message": "Import registered and queued for processing."
}
```

### `csv_imports` document draft (MVP)

- `_id`: ObjectId
- `templateId`: string (store the `template` request value here)
- `originalFilename`: string
- `mimeType`: string
- `size`: number
- `storage`: {
  - `path`: string (e.g., `csv-imports/{importId}/original.zip|csv`)
  - `provider`: string (as per fileStorage config)
  - `etag`/`checksum`: string (optional)
    }
- `status`: string (open set; e.g., `queued`, `validating`, `extracting files`, `processing`, `completed`, `failed`, `cancelled`)
- `counters` (optional, future): { `rowsProcessed`, `rowsSucceeded`, `rowsFailed` }
- `rowErrors` (future): store row-based errors here (simple in-doc structure for now; dedicated collection optional later)
- `createdBy`: user id
- `createdAt`: number (timestamp, ms since epoch)
- `updatedAt`: number (timestamp, ms since epoch)

Note: Keep MVP minimal; we can extend as we introduce more stages.

### Storage layout proposal

- **Base prefix**: `csv-imports/`
- **Per import**: `csv-imports/{importId}/original.{ext}`
- **Future artifacts (optional)**:
  - `csv-imports/{importId}/extracted/` (unzipped files)
  - Reports likely persisted in DB; file-based reports TBD

### Job pipeline (initial, simplified)

1. Register import (MVP route) → status `queued`.
2. Validate upload exactly as current file upload does → `validating`.
3. Return response quickly; do NOT extract or process on the request thread.
4. First background job (future step): if ZIP, set `extracting files` and extract; CSV passes through.
   - Further steps (header inspection, row validation/import) intentionally deferred.

### ToDos (near-term, for upcoming small batches)

- Define `csv_imports` model/schema in V2 style.
- Create `app/api/csv.v2/` folder structure (routes, controllers/handlers, ports/adapters).
- Implement POST route to accept file + `templateId` (mirror `app/api/files/routes.ts`).
- Persist initial `csv_imports` document and return `importId`.
- Store original file with `fileStorage` to `csv-imports/{importId}/original.{ext}`.
- Add request validation (file present, `templateId` valid, size/type constraints).
- Basic error handling and consistent API responses.
- Unit/integration tests for route + persistence + storage handoff.

### Implementation progress (current status)

- Route ownership moved to `app/api/csv.v2/routes/routes.ts` and wired in `app/api/api.js`.
- Feature flag `v2CSVImport` switches between v1 and v2 flow on `POST /api/import`.
- V2 controller uses Zod and the common v2 `AbstractController`:
  - Controller: `app/api/csv.v2/routes/RegisterCsvImportController.ts`.
  - Validates `{ template: string }`, reads `req.file`, returns 200 JSON.
- Use Case implemented following entities.v2 style:
  - `RegisterCsvImportUseCase` extends `AbstractUseCase`.
  - Factory: `RegisterCsvImportUseCaseFactory()` in `app/api/csv.v2/services/service_factories.ts`.
  - Types: `app/api/csv.v2/types/RegisterCsvImport.ts`.
  - Contracts/Adapters: `contracts/*`, `database/*` for Mongo and storage adapters.
- Upload middleware mirrors v2 document upload:
  - If `v2UploadFile` is enabled: use `multer.diskStorage` with `generateFileName` and `single('file')`.
  - Else: `uploadMiddleware()`.
- Legacy v1 path preserved:
  - Extracted to a helper function `v1Import(req, res)` inside `routes.ts` to reduce statements and allow quick removal later.
  - Minimal validation performed (ensures `body.template` is a string), then runs existing `CSVLoader` with socket events.
- Naming aligned to RegisterCsvImport (not CreateImport) across controller, use case, factory, and types.

### How to code (conventions for this module)

- Prefer entities.v2 structure/patterns over paragraph extraction when in doubt.
- Hexagonal boundaries:
  - Controllers are thin; validation with Zod lives in the controller.
  - Business logic in Use Cases (extend `api/core/libs/UseCase` AbstractUseCase).
  - Persistence/storage via contracts (`contracts/*`) with adapters (`database/*`).
  - Models in `model/*`; public types/DTOs in `types/*`.
- Routing:
  - Co-locate routes under `csv.v2` and register from `api.js`.
  - Use feature flag `v2CSVImport` to switch v1/v2; keep v1 fallback until fully migrated.
  - For uploads: mirror `files/upload/document` v2 pattern (conditional `multer` vs `uploadMiddleware`).
- Validation:
  - V2 path: Zod in controller via `AbstractController`.
  - V1 path: keep minimal equivalent validation to prior AJV requirements (no schema drift).
- Responses/permissions:
  - Maintain 200 OK with JSON response for compatibility.
  - Admin-only access (for now).
- Style and typing:
  - Avoid using `as any` unless absolutely indispensable; prefer proper typings, narrowing, or adapter types.
  - Extract legacy blocks into helpers to reduce lint noise and ease future removal.
  - Use explicit, descriptive names (e.g., `RegisterCsvImport*`).

### Open questions / pending decisions

- CSV of problematic rows: generate on-demand or persist artifact?
- Background job breakdown and naming conventions.

### Observability (what and why)

- **Definition**: Ability to understand system behavior using signals like logs, metrics, and traces.
- **MVP approach**: Only DB-stored state and notes within the `csv_imports` document (no external logs/metrics/traces). Extend later if needed.

### Hexagonal architecture and module structure (MVP)

- **Principles**:
  - No DB logic outside Mongo adapters. Use repository/data source interfaces (ports) and map to DBOs in adapters.
  - Route delegates to a controller; controller calls an application service; service uses ports to persist and store files.
  - Use DTOs for input/output across layers; avoid leaking transport or DB details into domain/application layers.
- **Proposed structure** (no code yet):
  - `app/api/csv.v2/`
    - `routes.ts` (feature-flag fork from existing `/api/import`, admin-only)
    - `controllers/CreateImportController.ts` (validates request; orchestrates service)
    - `application/CreateImportService.ts` (creates DB record, returns `importId`)
    - `ports/CsvImportsRepository.ts` (save/read import docs)
    - `ports/FileStoragePort.ts` (store original file at `csv-imports/{importId}/original.{ext}`)
    - `infrastructure/mongodb/MongoCsvImportsRepository.ts` (maps domain ↔ DBO)
    - `infrastructure/storage/FileStorageAdapter.ts` (wraps existing `fileStorage`)
    - `dtos/CreateImportDTO.ts` (request/response DTOs)
- **Feature flag**: Use `v2CSVImport` (v2-style flag pattern, similar to `v2UploadFile`).

### Non-goals (for now)

- Full CSV parsing and import logic (beyond registering and enqueuing).
- UI flows and progress UI.
- Backfill/migration of legacy CSV imports.

### Compatibility considerations

- Coexist with current CSV Import V1 without breaking existing flows.
- Consider feature-flagging V2 route until stable.

### References

- `app/api/files/routes.ts` — mirrors desired upload/route behavior and feature-flag pattern (`v2UploadFile`).
- Current CSV import route: `POST /api/import` in `app/api/files/routes.ts` (returns 200 today).
- Feature-flag helper: `app/api/common.v2/utils/featureFlaggedHandler.ts`.
- V2 examples: templates v2, paragraph extraction — follow hexagonal structure and patterns.

---

Please review the above and we will refine details before implementing the first small batch.
