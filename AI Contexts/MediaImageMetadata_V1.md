# V1 Media and Image Metadata Properties: Backend Processing

This document explains how the backend processes and handles `media` and `image` metadata property types during V1 entity creation.

## Overview

Both `media` and `image` are single-value string properties that can store:

- **URLs** (HTTP/HTTPS links to external media)
- **File attachments** (uploaded files via multipart form data)

They are processed similarly, with `media` having additional support for time-linked video segments.

---

## Data Shape

### Property Definition

- **Type**: `'media'` or `'image'`
- **Value format**: `Array<{ value: string }>` - single-item array
- **Validation**: Must be a non-empty string

### Stored Metadata Shape

```typescript
{
  propertyName: [
    {
      value: string, // Either a URL or file path like "/api/files/filename.ext"
      // Media-specific: can also include timeLinks in format: "(/api/files/filename.ext, {timeLinks})"
    },
  ];
}
```

---

## Processing Flow

### 1. Entry Point: `POST /api/entities`

**File**: `app/api/entities/routes.js`

- Route accepts multipart form data (via `uploadMiddleware.multiple()`)
- Request body may contain:
  - `entity` (JSON string) or direct entity object
  - File attachments as form fields

---

### 2. URL Validation and Sanitization

**File**: `app/api/entities/entitySavingManager.ts` (lines 8-33)

Before saving, all metadata values are scanned for URLs:

```typescript
const validateAndSanitizeUrls = (entity: EntityWithFilesSchema): EntityWithFilesSchema => {
  // Scans all metadata values
  values.forEach(value => {
    if (value && typeof value.value === 'string' && value.value.startsWith('http')) {
      // Invalid URLs become empty strings
      if (!isValidUrl(value.value)) {
        value.value = '';
        return;
      }
      // Valid URLs are sanitized/normalized
      const sanitizedUrl = sanitizeUrl(value.value);
      if (sanitizedUrl !== value.value) {
        value.value = sanitizedUrl;
      }
    }
  });
};
```

**Behavior:**

- URLs starting with `http` are validated
- Invalid URLs → converted to empty string `''`
- Valid URLs → sanitized/normalized for security

---

### 3. File Attachment Binding

**File**: `app/api/entities/managerFunctions.ts` (lines 144-174)

When files are uploaded, they need to be bound to metadata properties:

```typescript
const bindAttachmentToMetadataProperty = (_values, attachments) => {
  const values = _values;
  if (_values[0].attachment !== undefined) {
    // Convert attachment index to file path
    values[0].value = attachments[_values[0].attachment]
      ? `/api/files/${attachments[_values[0].attachment].filename}`
      : '';

    // Media-specific: preserve timeLinks if present
    if (_values[0].timeLinks !== undefined && _values[0].timeLinks.length > 0) {
      const timeLinks = _values[0].timeLinks.replace(/([()])/g, '');
      values[0].value = `(${values[0].value}, ${timeLinks})`;
    }
  }
  return values;
};

const handleAttachmentInMetadataProperties = (entity, attachments) => {
  Object.entries(entity.metadata || {}).forEach(([_property, _values]) => {
    if (_values && _values.length) {
      const values = bindAttachmentToMetadataProperty(_values, attachments);
      // Clean up temporary fields
      delete values[0].attachment;
      delete values[0].timeLinks;
    }
  });
  return entity;
};
```

**Behavior:**

- Attachment index (`attachment: 0`) → converted to file path (`/api/files/filename.ext`)
- Missing attachment → value becomes empty string
- **Media-specific**: TimeLinks are preserved in format: `(path, {timeLinks})`
- Temporary `attachment` and `timeLinks` fields are removed after processing

---

### 4. Validation

**File**: `app/api/entities/validation/metadataValidators.js`

```typescript
export const validators = {
  [propertyTypes.media]: validateSingleWrappedValue(isString),
  [propertyTypes.image]: validateSingleWrappedValue(isString),
};

// Validates: array with single object containing string value
const validateSingleWrappedValue = validationFn => value => {
  if (value.length !== 1) {
    return !value.length; // Empty array allowed if not required
  }
  if (value[0].value === null) {
    return true; // Null allowed
  }
  const [{ value: pureValue }] = value;
  return validationFn(pureValue); // Must be string
};
```

**Validation Rules:**

- Must be array with exactly 1 item (if provided)
- `value.value` must be a string
- Empty array allowed only if property is not required
- Null value in item is allowed (treated as empty)

**Error Messages:**

- `propertyTypes.media`: `'should be a string'`
- `propertyTypes.image`: `'should be a string'`

---

### 5. Sanitization

**File**: `app/api/entities/entities.js` (lines 240-296)

The `sanitize` function processes metadata before save. For `media` and `image`:

```typescript
function sanitize(doc, template) {
  // ... processes all metadata properties
  // Media and image don't have special sanitization rules
  // They pass through as-is after validation
}
```

**Behavior:**

- No special sanitization rules for `media`/`image` (unlike date, numeric, etc.)
- Values are passed through as-is after validation
- Missing properties are initialized as empty arrays: `{ [name]: [] }`

---

### 6. Denormalization

**File**: `app/api/entities/denormalize.ts`

**No denormalization occurs** for `media` and `image` properties. Unlike `select` (thesauri labels) or `relationship` (entity labels), these values are stored and retrieved as-is.

**Behavior:**

- Values are saved exactly as provided
- No label resolution or external lookups needed
- URLs and file paths are stored directly

---

### 7. File Processing and Saving

**File**: `app/api/entities/managerFunctions.ts`

After entity is saved, files are processed separately:

```typescript
const { proccessedAttachments, proccessedDocuments } = await processFiles(
  entity,
  updatedEntity,
  attachments,
  documents
);

const fileSaveErrors = await saveFiles(proccessedAttachments, proccessedDocuments, updatedEntity);
```

**Behavior:**

- Files referenced in metadata are saved to storage
- File paths in metadata point to saved files
- Errors during file save are collected separately

---

## Attached File Lifecycle (deep dive)

This section details how uploaded files (those referenced by `attachment` indexes in metadata) move from the HTTP request to persistent storage and become accessible under `/api/files/*`.

### A. Upload acceptance and temp storage

**Files:**

- `app/api/entities/routes.js` (route: `POST /api/entities`)
- `app/api/files/uploadMiddleware.ts`

- The route uses `uploadMiddleware.multiple()` to accept multipart form data with any number of files.
- Multer is configured with `diskStorage` and a generated filename via `generateFileName`.
  - The file is written to a temporary directory determined by Multer (accessible via `req.file.destination` and `req.file.path`).
  - Original filename is not trusted; the backend generates a safe, unique name.
- For multi-file uploads, you can provide the original names in the body alongside each field:
  - Field names follow `attachments[0]`, `documents[0]`, etc.
  - Provide `attachments_originalname[0]`/`documents_originalname[0]` to set `file.originalname` without relying on multipart headers (header-based names are deprecated and will log a warning).

Key helpers:

- `generateFileName(file)` in `app/api/files/filesystem.ts`
  - Uses `${Date.now()}${ID()}` plus an extension deduced from the original name (preferred) or the MIME type.
  - Normalizes `jpeg` to `jpg`.

### B. Binding uploads to metadata

**Files:**

- `app/api/entities/entitySavingManager.ts`
- `app/api/entities/managerFunctions.ts`

1. The request’s `req.files` array is grouped into two arrays with Lodash `set` based on the multipart field name:

   - `attachments[0]`, `attachments[1]`, ... => `attachments: File[]`
   - `documents[0]`, `documents[1]`, ... => `documents: File[]`

2. `handleAttachmentInMetadataProperties` replaces a metadata entry like:

   - `{ value: "", attachment: 0 }`
     with
   - `{ value: "/api/files/<generatedName.ext>" }`

   For `media` properties, if `timeLinks` are present, they are preserved as:

   - `{ value: "(/api/files/<generatedName.ext>, {timeLinks})" }`

3. Temporary fields `attachment` and `timeLinks` are removed from the metadata after binding.

Notes:

- The indexing (`attachment: 0`) refers to `attachments[0]` in the multipart request, not `documents`.
- If the index is out of bounds, the bound value becomes an empty string (`""`).

### C. Persisting files to storage

**Files:**

- `app/api/entities/managerFunctions.ts` (prepareNewFiles, processFiles, saveFiles)
- `app/api/files/storage.ts`
- `app/api/files/files.ts`
- `app/api/files/filesystem.ts`
- `app/api/files/S3Storage.ts`

1. Staging to persistent storage

   - For each uploaded file, `storage.storeFile(filename, fs.createReadStream(file.path), type)` is called.
   - `type` is one of `attachment` or `document` and determines the storage path:
     - Local FS (default):
       - Attachments: `tenants.current().attachments` (alias of `attachmentsPath`)
       - Documents: `tenants.current().uploadedDocuments` (alias of `uploadsPath`)
     - S3 (optional): when `tenants.current().featureFlags.s3Storage` is enabled, files are uploaded to S3 using a per-tenant key prefix.

2. Creating file records

   - After the binary is stored, a `FileType` record is saved with `files.save(file)`:
     - Required fields include: `entity` (sharedId), `originalname`, `filename`, `mimetype`, `type`.
     - Schema: `app/shared/types/fileSchema.ts`.
     - If the file was provided as a URL (not applicable to `image`/`media` metadata binding, but used for entity attachments), it must be HTTPS (`url` pattern `^https://`).

3. Documents vs Attachments

   - Attachments: no further processing occurs.
   - Documents: new documents (without `_id`) are sent to `processDocument`:
     - If “Convert to PDF” feature is active and the mimetype is not PDF, a conversion service is invoked; otherwise, the PDF is processed locally.
     - Thumbnails are generated for documents and stored as `type: 'thumbnail'` (JPEG) with filename `${file._id}.jpg`.
     - This pipeline does not run for attachments used by `media`/`image` properties.

4. Indexing

   - When any files (attachments or documents) are added/renamed/deleted, the related entity is reindexed for search (`search.indexEntities`).

5. Temporary files
   - Multer writes uploads to a temporary path (`req.file.destination`/`req.file.path`). The code streams these into persistent storage but does not explicitly delete the temp files; rely on your environment’s temp cleanup policies.

### D. Accessing files via `/api/files/*`

**Files:** `app/api/files/routes.ts`

- Route: `GET /api/files/:filename`
  - Looks up the file record and verifies it exists in storage.
  - Enforces permissions based on the related entity; non-admin users must have read permission to the entity. `custom` files have a special-case behavior (readable by anyone, not writable by non-admins).
  - Sets `Content-Disposition: filename*=UTF-8''<originalname>` by default, and adds `attachment;` when `?download=true`.
  - Streams the binary directly from persistent storage (FS or S3).
- Legacy redirects exist: `/assets/:fileName` and `/uploaded_documents/:fileName` redirect to `/api/files/:fileName`.

### E. Error reporting and transactions

**Files:**

- `app/api/entities/managerFunctions.ts` (saveFiles)
- `app/api/entities/routes.js` (withTransaction abort)

- `saveFiles` collects errors when persisting file records (e.g., DB save failures) and returns an array of messages: `['Could not save file/s: <originalname>']`.
- The `POST /api/entities` route wraps the whole save in a DB transaction. If any file-save errors are returned, it calls `abort()` so the entity write is rolled back.
- Document processing failures (e.g., PDF conversion) are handled separately: the initial file is saved with `status: 'processing'`, failures are logged, and the status may become `failed`. These do not populate the `errors` array returned by `saveFiles`.

### F. Validation, limits, and security notes

- URL normalization: any metadata value starting with `http` is validated and sanitized before saving (invalid => `''`).
- File schema validation: `files.save` validates with JSON schema; remote `url` must be HTTPS.
- Size limits: no explicit upload size limit is enforced at this layer; configure limits at the reverse proxy (e.g., NGINX) or extend Multer config if needed.
- MIME/extension: the stored filename extension is derived from the original name first, then MIME type. There’s no server-side content sniffing here beyond this inference.
- Antivirus: no antivirus scanning is performed by default in this flow.
- Filenames: persisted filenames are generated (not user-controlled), preventing path traversal and sanitizing unsafe names.
- Permissions: all downloads go through `/api/files/:filename` which checks entity permissions.

### G. Request field contract (multipart)

To upload and bind a file to a `media`/`image` metadata property:

Multipart fields:

- `attachments[0]`: binary file for the property.
- `attachments_originalname[0]`: the display name to store as `originalname`.
- `entity`: JSON or fields for the entity; if sending `entity` as a JSON string, include the metadata piece below in that JSON.

Metadata snippet inside the entity payload:

```json
{
  "metadata": {
    "image": [{ "value": "", "attachment": 0 }],
    "media": [{ "value": "", "attachment": 0, "timeLinks": "{...}" }]
  }
}
```

After save:

- `image[0].value` becomes `"/api/files/<generatedName.ext>"`.
- `media[0].value` becomes `"(/api/files/<generatedName.ext>, {timeLinks})"` when `timeLinks` are provided.

Tip: You can mix metadata-bound attachments with entity-level attachments/documents in the same request. Only `attachments` are considered for `media`/`image` metadata binding (not `documents`).

---

## Client-to-Server Payload Format

### With File Upload (multipart)

```json
{
  "metadata": {
    "image": [
      {
        "value": "",
        "attachment": 0 // Index into req.files array
      }
    ],
    "media": [
      {
        "value": "",
        "attachment": 1,
        "timeLinks": "{...}" // Optional: video time segments
      }
    ]
  }
}
```

### With URL

```json
{
  "metadata": {
    "image": [
      {
        "value": "https://example.com/image.jpg"
      }
    ],
    "media": [
      {
        "value": "https://example.com/video.mp4"
      }
    ]
  }
}
```

### After Processing (stored)

```json
{
  "metadata": {
    "image": [
      {
        "value": "/api/files/abc123.jpg"
      }
    ],
    "media": [
      {
        "value": "(/api/files/xyz789.mp4, {start: 10, end: 20})"
      }
    ]
  }
}
```

---

## Key Differences: Media vs Image

### Media (`propertyTypes.media`)

- Supports **timeLinks** for video segments
- TimeLinks format: `(filepath, {timeLinks})`
- Used for video/audio files with temporal markers

### Image (`propertyTypes.image`)

- No timeLinks support
- Simple string value (URL or file path)
- Used for static images

---

## Domain Model (V2/Core)

**Files:**

- `app/api/core/domain/template/MediaProperty.ts`
- `app/api/core/domain/template/ImageProperty.ts`
- `app/api/core/domain/template/AbstractImageProperty.ts`

**Schema Validation:**

- Both use Zod schemas: `z.array(EntrySchema).min(1 if required else 0).max(1)`
- Entry must be: `{ value: string }` where value is non-empty string
- Single value enforced (max 1 item in array)

**Property Options:**

- `style`: `'cover'` or `'contain'` (from `AbstractImageProperty`)
- `fullWidth`: boolean
- `required`: boolean

---

## Business Rules

1. **Single Value**: Only one value allowed per property (array max length: 1)
2. **String Required**: Value must be a string (URL or file path)
3. **URL Validation**: URLs starting with `http` are validated and sanitized
4. **File Binding**: Attachment indices are converted to file paths during save
5. **TimeLinks (Media Only)**: Preserved in stored value format
6. **Required Check**: If property is `required`, array must have 1 item with non-empty string
7. **Empty Handling**: Empty/null values allowed if property is not required

---

## Edge Cases

### Invalid URL

- Invalid URLs → converted to empty string
- Example: `"http://invalid url"` → `""`

### Missing Attachment

- If `attachment` index points to non-existent file → value becomes empty string
- Example: `{ attachment: 5 }` but only 3 files uploaded → `{ value: "" }`

### Empty Value

- Empty array `[]` → allowed if not required
- `[{ value: null }]` → allowed
- `[{ value: "" }]` → allowed if not required, otherwise validation error

### TimeLinks Format

- Media properties can include timeLinks: `(path, {timeLinks})`
- TimeLinks are parsed and preserved during file binding
- Parentheses are stripped when parsing, re-added when storing

---

## Code References

**Entry Point:**

- `app/api/entities/routes.js` - POST `/api/entities` route

**Processing:**

- `app/api/entities/entitySavingManager.ts` - URL validation, file binding coordination
- `app/api/entities/managerFunctions.ts` - Attachment binding (`bindAttachmentToMetadataProperty`, `handleAttachmentInMetadataProperties`)

**Validation:**

- `app/api/entities/validation/metadataValidators.js` - Type validators
- `app/api/entities/validation/validateEntityData.ts` - Entity-level validation

**Sanitization:**

- `app/api/entities/entities.js` - `sanitize` function

**Domain Model:**

- `app/api/core/domain/template/MediaProperty.ts`
- `app/api/core/domain/template/ImageProperty.ts`

---

## Summary

1. **Input**: URL string OR file attachment (multipart)
2. **URL Validation**: Invalid URLs → empty string; valid URLs → sanitized
3. **File Binding**: Attachment index → file path (`/api/files/filename.ext`)
4. **Media TimeLinks**: Preserved in format `(path, {timeLinks})`
5. **Validation**: Single-item array with non-empty string (if required)
6. **Storage**: Direct string value (URL or file path)
7. **No Denormalization**: Values stored as-is, no label resolution needed

---

## Minimal Contract

- **Input**: `Array<{ value: string }>` OR `Array<{ value: "", attachment: number }>`
- **Output (stored)**: `Array<{ value: "/api/files/filename.ext" }>` OR `Array<{ value: "https://..." }>`
- **Media-specific**: `Array<{ value: "(/api/files/file.ext, {timeLinks})" }>`
- **Validation**: Must be string, single value enforced
- **Required**: If `required=true`, must have 1 non-empty string value

