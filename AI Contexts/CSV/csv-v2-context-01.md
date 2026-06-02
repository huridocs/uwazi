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
- **Routing (current baseline, Apr 2026)**: `POST /api/import` is V1-only. CSV V2 register/import entrypoint is `POST /api/csvImportEntities`. `v2CSVImport` is now client-facing only (menu visibility), not a backend routing switch.
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
- **Path (current baseline, Apr 2026)**: `/api/csvImportEntities` (V2-only register endpoint). `/api/import` remains the legacy V1 route.
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

Note on domain mapping: In code, we map Mongo `_id` to domain `id` for responses and use-case outputs.

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
- Enqueue next-step jobs as the final step inside the same `transactionManager.run` that persists the DB change. Dispatching (e.g., extraction) happens only after the insert succeeds and before exiting the transaction block. Define job payload to include tenant and `importId`.

### Implementation progress (current status)

- Route ownership moved to `app/api/csv.v2/routes/routes.ts` and wired in `app/api/api.js`.
- Backend routing no longer switches on `v2CSVImport`. Route split is explicit: `/api/import` (V1) and `/api/csvImportEntities` (V2).
- V2 controller uses Zod and the common v2 `AbstractController`:
  - Controller: `app/api/csv.v2/routes/RegisterCsvImportController.ts`.
  - Validates `{ template: string }`, reads `req.file`, returns 200 JSON.
- Use Case implemented following entities.v2 style:
  - `RegisterCsvImportUseCase` extends `AbstractUseCase`.
  - Factory: `RegisterCsvImportUseCaseFactory()` in `app/api/csv.v2/services/service_factories.ts`.
  - Types: `app/api/csv.v2/types/RegisterCsvImport.ts`.
  - Contracts/Adapters: `contracts/*`, `database/*` for Mongo and storage adapters.
  - Default DS factory: `app/api/csv.v2/database/data_source_defaults.ts` exports `DefaultCsvImportsDataSource()`, instantiated in the service factory as `csvImportsDS`.
  - Storage now uses files.v2 strategy: `FileStorageStrategyFactory.createDefault()`; removed legacy `FileStoragePort` and `FileStorageAdapter` under csv.v2.
  - Data source `create` returns a mapped object `{ id, ... }`, not just an id; the use case uses `const { id: importId } = ...`.
  - Endpoint requires `userId`; controller ensures presence from `req.user._id` and fails with 401 if missing; no role re-check (authorization middleware handles that).
  - Stored file uses the multer-generated filename; DB storage path is `csv-imports/{importId}/{filename}`.
  - Legacy v1 logic extracted as `v1Import(req, res)` within `routes.ts` for easy future removal; minimal validation ensures `body.template` is a string.
  - Feature flag `v2CSVImport` remains in tenant context/config as a client-facing toggle (menu visibility), not as backend import-flow routing.
- Upload middleware mirrors v2 document upload:
  - If `v2UploadFile` is enabled: use `multer.diskStorage` with `generateFileName` and `single('file')`.
  - Else: `uploadMiddleware()`.
- Uploaded file typing:
  - Controllers must wrap `req.file` using `new InputFile(req.file)` (from files.v2) and pass that to use cases.
  - Do not manually type or destructure multer fields in controller; avoid ad-hoc shapes.
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
  - Keep route split explicit: `/api/import` (V1 only), `/api/csvImportEntities` (V2 only).
  - `v2CSVImport` can be used by client UI feature visibility, not import backend flow selection.
  - For uploads: mirror `files/upload/document` v2 pattern (conditional `multer` vs `uploadMiddleware`).
- Files handling:
  - Always use `InputFile` in controllers to pass uploaded files to use cases.
  - Use the files.v2 `FileStorage` (via `FileStorageStrategyFactory.createDefault()`) and store under `customPath` with desired `destination`.

### Domain usage paradigm (apply consistently)

- Domain objects own defaults and validation.
  - Create domain instances via static factories, e.g., `CsvImportDomain.create({ templateId, file, createdBy })`.
  - Domain sets defaults (e.g., `status = 'queued'`) and timestamps (`createdAt/updatedAt = Date.now()`), and validates input (template present, file metadata valid).
- Transport vs domain types.
  - Controllers receive uploads as `InputFile` and pass it to use cases.
  - Use cases map `InputFile.metadata` → domain `file` metadata `{ originalName, mimeType, size }` when calling domain `.create`.
- Data sources and mapping.
  - DS methods use domain types: `insert(domain: Omit<CsvImport,'id'>): Promise<CsvImport>`; map via `CsvImportMapper`.
  - Persist `_id` in DB; map `_id ↔ id` on reads/writes; keep domain free of DB specifics.
  - Name DS instances `xxxDS` (e.g., `csvImportsDS`) and expose a `DefaultXxxDataSource()` factory.
- Transactions.
  - Wrap DB writes in `transactionManager.run(async () => { ... })`.
  - Preferred flow now that IDs are generated up front:
    - Use case generates `id` and builds domain (`CsvImportDomain.create`) outside the transaction.
    - Perform `fileStorage.storeFile` outside the transaction.
    - Then run a transaction: `csvImportsDS.insert(domain)` → domain mutation (e.g., `withStorage`) → `csvImportsDS.update(...)`.
  - Rationale:
    - If storage fails, we never start the transaction; no DB writes occur.
    - If DB transaction fails, we may orphan a stored file, but we never have DB pointing to a missing asset (priority: DB integrity).
  - Returning values from `run` is expected; on failure it throws, on success it resolves to the callback’s return.
- Transactions and Data Sources (critical):
  - All DSs MUST be transaction-aware. Extend `MongoDataSource` and use `this.getCollection()` for all Mongo calls so the active session from `transactionManager.run` is used.
  - DS factories MUST receive a `MongoTransactionManager` and construct DSs with it. E.g., `DefaultCsvImportsDataSource(transactionManager)`.
  - Do NOT call `db.collection(...).insertOne/updateOne/findOne` directly in DSs (bypasses the session) — this will cause writes to occur outside the transaction.
  - Mapper pattern: keep mapping `_id ↔ id` within DS (or a dedicated mapper) to keep the domain free from DB types.

### IDs and Domain ownership

- ID generation happens in the use case via `idGenerator.generate()` (injected by the factory). The domain receives the id and owns it thereafter.
- The domain factory includes the id: `CsvImportDomain.create({ id, templateId, file, createdBy })` and sets defaults/timestamps.
- The DS writes the provided id as Mongo `_id` and maps `_id ↔ id` on reads/writes. No reliance on `insertedId`.
- Update pattern: mutate/clone at the domain (e.g., `CsvImportDomain.withStorage(csvImport, path)`) and persist with `csvImportsDS.update(csvImport)` (coarse-grained), not DS-specific setters.

### Storage and factory usage

- Controllers pass `InputFile` to use cases; use cases call `fileStorage.storeFile({ file: InputFile.contents, type: 'customPath', destination })`.
- For now we instantiate `FileSystemStorage` directly with `new PathManager({ tenant: tenants.current() })` inside the per-request factory; when a shared storage factory exists, we can swap it without touching use cases.

### Project structure

- Keep domain logic co-located in `model/CsvImport.ts` (factory/mutations). Removed unused scaffolding folders (`adapters`, `application`, `domain`, `dtos`, `factories`, `infrastructure`, `ports`) to align with entities.v2 simplicity.
- Storage and paths.
  - Store using files.v2 `FileStorage` under `customPath` with `destination: csv-imports/{id}` and filename from `InputFile.contents.filename`.
  - Save the storage path in DB as `csv-imports/{id}/{filename}`.
- Validation:
  - V2 path: Zod in controller via `AbstractController`.
  - V1 path: keep minimal equivalent validation to prior AJV requirements (no schema drift).
- Data sources and mapping:
  - DS `create` should return a mapped domain object with `id` (not raw `insertedId`).
  - Map Mongo `_id` → domain `id` consistently in `getById` and any reads.
  - Name variables `xxxDS` (e.g., `csvImportsDS`) and provide a `DefaultXxxDataSource()` factory.
- Responses/permissions:
  - Maintain 200 OK with JSON response for compatibility.
  - Admin-only access (for now).
- Style and typing:
  - Avoid using `as any` unless absolutely indispensable; prefer proper typings, narrowing, or adapter types.
  - Extract legacy blocks into helpers to reduce lint noise and ease future removal.
  - Use explicit, descriptive names (e.g., `RegisterCsvImport*`).
  - Keep one class per file; extract helper functions (or new modules) instead of nesting additional classes so lint stays happy and files read top-down.
  - Within a module, define depended-upon helpers before their callers so the file reads naturally from top to bottom.

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
- **Feature flag (current baseline, Apr 2026)**: `v2CSVImport` is client-facing (menu visibility); backend routes no longer use it to choose V1 vs V2 import flow.

### Non-goals (for now)

- Full CSV parsing and import logic (beyond registering and enqueuing).
- UI flows and progress UI.
- Backfill/migration of legacy CSV imports.

### Compatibility considerations

- Coexist with current CSV Import V1 without breaking existing flows.
- Consider feature-flagging V2 route until stable.

### References

- `app/api/files/routes.ts` — mirrors desired upload/route behavior and feature-flag pattern (`v2UploadFile`).
- Current routes:
  - `POST /api/import` (legacy V1 flow, now in `app/api/csv.v2/infrastructure/http/routes.ts`).
  - `POST /api/csvImportEntities` (V2 register/import endpoint).
- Feature-flag helper: `app/api/common.v2/utils/featureFlaggedHandler.ts`.
- V2 examples: templates v2, paragraph extraction — follow hexagonal structure and patterns.

---

Please review the above and we will refine details before implementing the first small batch.
