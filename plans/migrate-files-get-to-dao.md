# Migrate `files.get` to `MongoFilesDAO`

## Goal

Replace all legacy `files.get({ ... })` calls (outside test files) with declarative methods on `MongoFilesDAO` that return typed DBO objects via `ResultType`.

Call sites obtain the DAO through `FilesDAOFactory.default()`, which requires an active `ExecutionContext` (tenant + transactionManager).

The existing `MongoFilesDataSource` (returns domain models) is **unrelated** to this refactor. The DAO works with raw `fileDBO` objects.

---

## Steps

### Step 1 — Widen generic type and remove unused methods

**File:** `app/api/core/infrastructure/mongodb/files/MongoFilesDAO.ts`

**Changes:**
- Change `extends MongoDataSource<ProcessedPDFDBO>` → `extends MongoDataSource<fileDBO>`
- Import `fileDBO` from `./schemas/filesTypes.js`
- Remove `HAS_INDEXABLE_FULLTEXT` static
- Remove `streamProcessedDocs()`, `streamProcessedDocsByIds()`, `countProcessedDocs()`

**Tests:** (`app/api/core/infrastructure/mongodb/files/specs/MongoFilesDAO.spec.ts`)
- Remove `describe('streamProcessedDocs()')`, `describe('countProcessedDocs()')`, `describe('streamProcessedDocsByIds()')` and their test data
- Keep the file structure (`createSut`, `fixtures` base) — they'll be reused by new tests

---

### Step 2 — Add `FileNotFound` error import and `Result` import

**File:** `app/api/core/infrastructure/mongodb/files/MongoFilesDAO.ts`

Add imports:
```ts
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
```

---

### Step 3 — Create `FilesDAOFactory`

**New file:** `app/api/core/infrastructure/factories/FilesDAOFactory.ts`

Following the same pattern as `ThesauriDAOFactory.ts`:

```ts
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';

class FilesDAOFactory {
  static default(): MongoFilesDAO {
    return new MongoFilesDAO({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager as MongoTransactionManager,
    });
  }
}

export { FilesDAOFactory };
```

> **How it works:** `ExecutionContext` holds the current tenant, actor, and shared dependencies (transactionManager, idGenerator, etc.). It uses `AsyncLocalStorage` under the hood and is populated at request/job boundaries. This means `FilesDAOFactory.default()` can only be called when `ExecutionContext` is active. Tests use `testingEnvironment.runWithContext()` to set this up.

**Tests — add to DAO spec:**
- Test that `FilesDAOFactory.default()` returns an instance of `MongoFilesDAO` when called inside `testingEnvironment.runWithContext()`
- Test that `FilesDAOFactory.default()` throws when called outside a context

---

### Step 4 — Add `getById(id, options?)`

**Method signature:**
```ts
getById(
  id: string,
  options?: { withFullText?: boolean }
): Promise<ResultType<fileDBO, FileNotFound>>
```

**Query:** `{ _id: new ObjectId(id) }`
- When `options.withFullText === true`: no projection (include `fullText`)
- When `options.withFullText === false` (default): project out `fullText` via `{ fullText: 0 }`

**Returns:**
- `Result.ok(file)` if found
- `Result.fail(new FileNotFound(...))` if not found

**Replaces these `files.get` call sites:**
- `app/api/files/routes.ts:25` — `files.get({ _id: file._id })`
- `app/api/activitylog/helpers.js:63` — `files.get({ _id: data._id })`
- `app/api/documents/documents.js:12` — `files.get({ _id }, '+fullText')` (uses `withFullText: true`)

**Tests — add to `describe('MongoFilesDAO')`:**

Fixtures:
```ts
const fixtures: DBFixture = {
  files: [
    factory.document('doc_with_fulltext', {
      entity: 'entity_1',
      type: 'document',
      status: 'ready',
      fullText: { '1': 'page one content' },
    }),
    factory.attachment('att_1', { entity: 'entity_1' }),
    factory.custom_upload('custom_1'),
    factory.document('doc_no_fulltext', {
      entity: 'entity_2',
      type: 'document',
      status: 'ready',
    }),
  ],
};
```

The DAO tests construct the SUT directly (no ExecutionContext needed):
```ts
const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  return new MongoFilesDAO({ db: getConnection(), transactionManager });
};
```

Test cases:
1. Returns `Result.ok` with the file DBO when found
2. Returns full `fullText` when `{ withFullText: true }`
3. Excludes `fullText` field by default (when `withFullText` is not set)
4. Returns `Result.fail` with `FileNotFound` when id does not exist
5. Returns `Result.fail` with `FileNotFound` when id is a valid ObjectId format but no document matches
6. Works for any file type (document, attachment, custom) — not just documents

---

### Step 5 — Add `getByFilename(filename)`

**Method signature:**
```ts
getByFilename(filename: string): Promise<ResultType<fileDBO, FileNotFound>>
```

**Query:** `{ filename }` — no projection (return all fields)

**Replaces:**
- `app/api/files/ocrRoutes.ts:28` — `files.get({ filename: request.params.filename })`
- `app/api/services/ocr/OcrManager.ts:184` — `files.get({ filename: message.params!.filename })`

**Tests:**

Test cases:
1. Returns `Result.ok` with the file DBO when filename matches
2. Returns `Result.fail` with `FileNotFound` when filename does not exist
3. Returns correct file type (document, attachment, etc.) — matches the fixture

---

### Step 6 — Add `getByEntity(sharedId, options?)`

**Method signature:**
```ts
getByEntity(
  sharedId: string,
  options?: { types?: fileDBO['type'][]; projection?: Document }
): Promise<fileDBO[]>
```

**Query:**
```ts
const filter: Record<string, unknown> = { entity: sharedId };
if (options?.types) filter.type = { $in: options.types };
```
No projection if not specified; uses `options.projection` if provided.

**Returns:** Always returns an array (empty if none match).

**Replaces:**
- `app/api/files/files.ts:111` — `files.get({ entity: updatedFile.entity }, { generatedToc: 1 })` (uses projection)
- `app/api/entities/managerFunctions.ts:127` — `files.get({ entity: entity.sharedId, type: { $in: [...] } }, '_id, originalname, type')` (uses types filter + projection)

**Tests:**

Fixture data — multiple files (different types) for the same entity:
```ts
factory.document('doc_1', { entity: 'entity_a', status: 'ready' }),
factory.document('doc_2', { entity: 'entity_a', status: 'ready' }),
factory.attachment('att_1', { entity: 'entity_a' }),
factory.custom_upload('custom_1', { entity: 'entity_a' }),
factory.document('other_doc', { entity: 'entity_b' }),
```

Test cases:
1. Returns all files for the entity when no `types` filter
2. Returns only files matching given `types` (e.g. `['document']`)
3. Returns only files matching multiple types (e.g. `['document', 'attachment']`)
4. Returns empty array when entity has no files
5. Applies projection when `options.projection` is provided (returns only selected fields)
6. Includes thumbnails (no type exclusion — mirrors `files.get` behavior)

---

### Step 7 — Add `getByEntitySharedIds(sharedIds, options?)`

**Method signature:**
```ts
getByEntitySharedIds(
  sharedIds: string[],
  options?: { includeFullText?: boolean; languages?: string[]; type?: fileDBO['type'] }
): Promise<fileDBO[]>
```

**Query building:**
```ts
const filter: Record<string, unknown> = { entity: { $in: sharedIds } };
if (options?.languages) filter.language = { $in: options.languages };
if (options?.type) filter.type = options.type;
if (!options?.includeFullText) projection = { fullText: 0 };
```

**Replaces:**
- `app/api/entities/entities.js:286` — `files.get({ entity: { $in: sharedIds } }, documentsFullText ? '+fullText ' : ' ')` (uses includeFullText)
- `app/api/suggestions/useCases/createBlankSuggestionsForPdf.ts:14` — `files.get({ entity: { $in: [...] }, language: { $in: [...] }, type: 'document' }, { _id: 1, entity: 1, language: 1, propertySelections: 1 })` (uses languages + type + custom projection)

**Tests:**

Fixture data:
```ts
factory.document('doc_en', { entity: 'entity_a', language: 'en', status: 'ready' }),
factory.document('doc_es', { entity: 'entity_a', language: 'es', status: 'ready' }),
factory.attachment('att_en', { entity: 'entity_a', language: 'en' }),
factory.document('doc_b_en', { entity: 'entity_b', language: 'en', status: 'ready' }),
factory.document('doc_c_es', { entity: 'entity_c', language: 'es', status: 'ready' }),
```

Test cases:
1. Returns all files for given sharedIds (no options)
2. Returns files for a subset of sharedIds
3. Returns files filtered by language(s)
4. Returns files filtered by type (e.g. `'document'`)
5. Combines languages + type filters
6. Excludes `fullText` by default (`includeFullText: false`)
7. Includes `fullText` when `includeFullText: true`
8. Returns empty array when no sharedIds match

---

### Step 8 — Add `getNextDocumentWithoutToc()`

**Method signature:**
```ts
getNextDocumentWithoutToc(): Promise<ResultType<fileDBO, FileNotFound>>
```

**Query:**
```ts
{ type: 'document', filename: { $exists: true }, 'toc.0': { $exists: false } }
```
With `sort: { _id: 1 }` and `limit: 1`.

**Replaces:**
- `app/api/toc_generation/tocService.ts:79` — `files.get({ type: 'document', filename: { $exists: true }, 'toc.0': { $exists: false } }, '', { sort: { _id: 1 }, limit: 1 })`

**Tests:**

Fixture data:
```ts
// docs without toc:
factory.document('doc_no_toc_1', { entity: 'e1', status: 'ready' }),
factory.document('doc_no_toc_2', { entity: 'e2', status: 'ready' }),
// doc with toc (should be excluded):
factory.document('doc_with_toc', { entity: 'e3', status: 'ready', toc: [{ heading: 'Intro' }] }),
// attachment (should be excluded):
factory.attachment('att_1', { entity: 'e1' }),
```

Test cases:
1. Returns the first document (by `_id` ascending) without a `toc` field
2. Returns `Result.fail` with `FileNotFound` when all documents have a `toc`
3. Returns `Result.fail` with `FileNotFound` when no documents exist
4. Excludes attachments (only `type: 'document'`)
5. Excludes documents without a `filename` field

---

### Step 9 — Add `getByQuery(query, options?)`

**Method signature:**
```ts
getByQuery(
  query: Filter<fileDBO>,
  options?: { projection?: Document; sort?: Sort; limit?: number }
): Promise<fileDBO[]>
```

**Implementation:**
```ts
return this.getCollection()
  .find(query, { projection: options?.projection })
  .sort(options?.sort || {})
  .limit(options?.limit || 0)
  .toArray();
```

**Replaces:**
- `app/api/files/routes.ts:174` — `files.get(req.query)` then `filterByEntityPermissions(...)`

**Tests:**

Fixture: use existing fixtures from earlier steps.

Test cases:
1. Returns matching files for a simple equality query (e.g. `{ type: 'document' }`)
2. Returns matching files for a `$in` query (e.g. `{ entity: { $in: [...] } }`)
3. Returns empty array when query matches nothing
4. Applies projection when provided
5. Applies sort when provided
6. Applies limit when provided

---

### Step 10 — Migrate each call site

For each file below, replace the `files.get(...)` call with the equivalent DAO method obtained via `FilesDAOFactory.default()`.

**IMPORTANT — how call sites obtain the DAO:**

All call sites should use `FilesDAOFactory.default()` to obtain the DAO instance. This requires `ExecutionContext` to be active (tenant + transactionManager available). In practice, these call sites run within HTTP requests or job handlers where `ExecutionContext` is already set up.

```ts
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';

// Inside a request handler or use case:
const dao = FilesDAOFactory.default();
const result = await dao.getById(someId);
```

When the call site file is a **class/module that already receives dependencies** (like a use case), inject the DAO via constructor. The factory is for ad-hoc use in route handlers and legacy modules.

**Order of migration:**

1. **`app/api/activitylog/helpers.js`**
   - Replace `files.get({ _id: data._id })` → `FilesDAOFactory.default().getById(data._id.toString())`
   - Handle `ResultType`: if `.isError()`, return the data without the file enrichment

2. **`app/api/documents/documents.js`**
   - Replace `files.get({ _id }, '+fullText')` → `FilesDAOFactory.default().getById(_id.toString(), { withFullText: true })`
   - Throw `createError('document does not exists', 404)` when `Result.isError()`

3. **`app/api/files/ocrRoutes.ts`**
   - Replace `files.get({ filename: request.params.filename })` → `FilesDAOFactory.default().getByFilename(request.params.filename)`
   - Keep the existing `if (!file?.filename ...)` check after unwrapping the Result

4. **`app/api/files/routes.ts`** — replace both usages:
   - Line 25: `files.get({ _id: file._id })` → `FilesDAOFactory.default().getById(file._id.toString())`
   - Line 174: `files.get(req.query)` → `FilesDAOFactory.default().getByQuery(req.query)` then `filterByEntityPermissions(...)`

5. **`app/api/files/files.ts`**
   - Replace `files.get({ entity: updatedFile.entity }, { generatedToc: 1 })` → `FilesDAOFactory.default().getByEntity(updatedFile.entity, { projection: { generatedToc: 1 } })`

6. **`app/api/services/ocr/OcrManager.ts`**
   - Replace `files.get({ filename: message.params!.filename })` → `FilesDAOFactory.default().getByFilename(message.params!.filename)`

7. **`app/api/toc_generation/tocService.ts`**
   - Replace `files.get({ type: 'document', ... }, '', { sort: ..., limit: 1 })` → `FilesDAOFactory.default().getNextDocumentWithoutToc()`

8. **`app/api/suggestions/useCases/createBlankSuggestionsForPdf.ts`**
   - Replace `files.get(...)` → `FilesDAOFactory.default().getByEntitySharedIds(sharedIds, { languages, type: 'document' })`
   - Note: custom projection `{ _id: 1, entity: 1, language: 1, propertySelections: 1 }` is not directly supported by the options. Either extend `getByEntitySharedIds` options to accept `projection`, or filter fields after the fact.

9. **`app/api/entities/entities.js`**
   - Replace `files.get({ entity: { $in: sharedIds } }, documentsFullText ? '+fullText ' : ' ')` → `FilesDAOFactory.default().getByEntitySharedIds(sharedIds, { includeFullText: documentsFullText })`

10. **`app/api/entities/managerFunctions.ts`**
    - Replace `files.get({ entity: entity.sharedId, type: { $in: [...] } }, '_id, originalname, type')` → `FilesDAOFactory.default().getByEntity(entity.sharedId, { types: [TypeOfFile.attachment, TypeOfFile.document], projection: { _id: 1, originalname: 1, type: 1 } })`

Each migration should:
- Import `FilesDAOFactory` from the factories path
- Handle the `ResultType` returned by the DAO (call `.getDataOrThrow()` or check `.isOk()`/`.isError()`)
- If the legacy code uses tuple destructuring like `const [file] = await files.get(...)`, update to handle `ResultType` properly

---

### Step 11 — Update existing tests for migrated call sites

After each call site migration, update the corresponding `.spec.ts` file.

**Important:** When tests for migrated call sites need a DAO instance (e.g., for assertions), they should construct it directly:
```ts
const dao = new MongoFilesDAO({ db: getConnection(), transactionManager });
```

They should **not** call `FilesDAOFactory.default()` directly unless the test is explicitly designed to validate the factory + ExecutionContext integration. For those specific tests, wrap in `testingEnvironment.runWithContext()`:
```ts
await testingEnvironment.runWithContext(async () => {
  const dao = FilesDAOFactory.default();
  // use dao...
});
```

Files to update (non-exhaustive list of spec files connected to the call sites):
- `app/api/files/specs/routes.spec.ts` — for routes.ts changes
- `app/api/activitylog/specs/...` — for helpers.js changes
- `app/api/documents/specs/...` — for documents.js changes
- `app/api/files/specs/ocrRoutes.spec.ts` — for ocrRoutes.ts changes
- `app/api/services/ocr/specs/OcrManager.spec.ts` — for OcrManager.ts changes
- `app/api/toc_generation/specs/tocService.spec.ts` — for tocService.ts changes
- `app/api/suggestions/specs/...` — for createBlankSuggestionsForPdf.ts changes
- `app/api/entities/specs/...` — for entities.js changes

---

## ExecutionContext contract for DAO consumers

```
ExecutionContext (AsyncLocalStorage)
 ├── tenant           → tenant name, feature flags, db name
 ├── actor            → current user (optional)
 ├── transactionManager  → db session + transaction boundary
 ├── idGenerator      → unique ID generation
 ├── eventEmitter     → event bus
 ├── jobsDispatcher   → async job queue
 └── logger           → structured logging
```

- `FilesDAOFactory.default()` only works **inside** an active `ExecutionContext`
- In **HTTP request handlers**: `ExecutionContext` is populated by middleware before routes execute
- In **jobs/workers**: `ExecutionContext` is populated by the job runner
- In **unit/DAO tests**: construct `MongoFilesDAO` directly with `{ db, transactionManager }` — no `ExecutionContext` needed
- In **integration tests for use cases**: use `testingEnvironment.runWithContext()`

---

## Future considerations

- The `_id` field in `fileDBO` is `ObjectId`, but most callers work with string IDs. The DAO methods accept strings and convert internally.
- The DAO currently lives in `MongoFilesDAO.ts` — with ~6 query methods it stays cohesive. If it grows significantly, consider splitting into a query-only DAO and a command-only DAO.
- `getByQuery` on `routes.ts` is a generic passthrough — consider replacing it with explicit query methods as the route logic is refactored.
