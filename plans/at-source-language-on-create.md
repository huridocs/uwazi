# Plan: Send the UI language when creating entities (#9757)

Context: create resolves `targetLanguage` as body `language` → `req.language` (Content-Language → locale cookie → Accept-Language → default). Clients that create entities send no `Content-Language`, so Automatic Translations gets the wrong `language_from`. Out of scope: deprecation logging, requiring the header, the update path (the domain already throws a 400 via `getTranslation`).

## Step 1: Reject an unknown body `language` on create (use case)

**Files:** app/api/core/application/errors.ts, app/api/core/application/EntitiesService.ts, app/api/core/application/CreateEntity.ts

**Skeleton:**
```ts
// errors.ts
export class UnknownTargetLanguageError extends ValidationError {
  constructor(readonly language: string)
  asAJV(): AJVObject   // keyword: 'unknownTargetLanguage'
}

// EntitiesService.ts
async validateTargetLanguage(targetLanguage: LanguageISO6391): Promise<void>
```

**Do:**

- `validateTargetLanguage` reads `settingsDS.readLanguages()` and throws `UnknownTargetLanguageError` when `targetLanguage` is not installed.
- Call it first in `CreateEntityUseCase.execute`, before `validateTranslationLanguages`, so both `create` and `createWithTranslations` are covered.
- Leave `UpdateEntityUseCase` untouched.

**Test:** app/api/core/application/specs/CreateEntity.spec.ts: a create with `targetLanguage: 'xx'` throws `UnknownTargetLanguageError` and inserts nothing (with and without `translations`). Run `yarn test app/api/core/application/specs/CreateEntity.spec.ts`.

---

## Step 2: Map the error to 422 at `/language` (controller)

**Files:** app/api/core/infrastructure/express/entity/MutateEntityController.ts

**Skeleton:**
```ts
private static translationErrorPath(error: unknown): string | undefined  // + UnknownTargetLanguageError → '/language'
private async create(body: ParsedBody)  // wrap useCase.execute in withTranslationErrorPaths
```

**Do:**

- Add the `UnknownTargetLanguageError` → `/language` branch in `translationErrorPath`.
- Wrap the `create` use case call with `withTranslationErrorPaths`, as `createWithTranslations` already does.

**Test:** app/api/entities/specs/routes.spec.ts: `POST /api/entities` with body `language: 'xx'` returns 422 with an error at `/language` (JSON and multipart, with and without `translations`). A body `language` that is installed but differs from `Content-Language` still wins. Run `yarn test app/api/entities/specs/routes.spec.ts`.

---

## Step 3: Create-from-PDF uses the request language

**Files:** app/api/core/infrastructure/express/entity/CreateEntityFromPDFController.ts

**Skeleton:**
```ts
CreateEntityFromPDFUseCaseFactory.default({ targetLanguage: this.language, ...(sessionId ? { sessionId } : {}) })
```

**Do:**

- Pass `this.language` as `targetLanguage` instead of relying on the factory default `'en'`.

**Test:** app/api/core/infrastructure/express/entity/specs/CreateEntityFromPDFController.spec.ts: with `Content-Language: es`, the `EntityCreatedEvent` / use case context has `targetLanguage: 'es'`. Update the snapshot if it changes. Run `yarn test app/api/core/infrastructure/express/entity/specs/CreateEntityFromPDFController.spec.ts`.

---

## Step 4: `saveEntityWithFiles` sends Content-Language

**Files:** app/react/Library/actions/saveEntityWithFiles.ts

**Skeleton:**
```ts
import { getStore } from '#shared/atomStore/index.js';
import { localeAtom } from '#V2/atoms/index.js';
// request.set('Content-Language', getStore().get(localeAtom))
```

**Do:**

- Set the header from `localeAtom` on every request (create and edit). Do not use `api.js`'s module `language`, which `EntitiesAPI` overwrites.
- Skip the header when the locale is empty.

**Test:** app/react/Library/actions/specs/saveEntityWithFiles.spec.ts: with `localeAtom = 'es'`, the request calls `set('Content-Language', 'es')`. Run `yarn test app/react/Library/actions/specs/saveEntityWithFiles.spec.ts`.

---

## Step 5: Create-from-PDF upload sends Content-Language

**Files:** app/react/V2/api/files/UploadService.ts

**Skeleton:**
```ts
// in uploadQueue, when this.route is the create-from-pdf route:
request.set('Content-Language', getStore().get(localeAtom))
```

**Do:**

- Add the header for the `createFromPDF` endpoint only (the other uploads attach files to existing entities).

**Test:** app/react/V2/api/files/specs/UploadService.spec.ts: `createFromPDF` sends `Content-Language` equal to `localeAtom`, and `document`/`attachment` do not. Run `yarn test app/react/V2/api/files/specs/UploadService.spec.ts`.

---

## Step 6: Public form submission sends Content-Language

**Files:** app/react/Uploads/actions/uploadsActions.js

**Skeleton:**
```js
export function publicSubmit(data, remote = false)  // + .set('Content-Language', getStore().get(localeAtom))
```

**Do:**

- Add the header for both `/api/public` and `/api/remotepublic`. The remote proxy forwards it (it only strips `cookie`/`tenant`); no server change.

**Test:** app/react/Uploads/actions/specs/uploadsActions.spec.js: `publicSubmit` sets `Content-Language` from `localeAtom` (local and remote). Run `yarn test app/react/Uploads/actions/specs/uploadsActions.spec.js`.

---

## Step 7: Verify the whole change

**Files:** all of the above

**Do:**

- `yarn check-types`
- `yarn lint --type-aware <changed files>`, and fix any new warnings
- `yarn prettier --write <changed files>`
- Manual check: AT enabled (es + en), browser in English, no `locale` cookie, `/es/library` → create "Hola mundo" → stored `es: Hola mundo`, `en: (AI translation pending) …`, task `language_from: "es"`. Repeat for create-from-PDF and a public form.

**Test:** the steps' specs, run together: `yarn test <the six spec paths above>`.
