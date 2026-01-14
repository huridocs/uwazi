# Uwazi V1 Entity Creation: Deep Dive

This document explains the end-to-end flow for creating entities via the V1 API, focusing strictly on entity data (metadata, validation/business rules, language sync, denormalization). Files/attachments and V2 flows are intentionally out of scope except where V1 code interfaces with them.

Updated: 2025-10-30

## Entry point: POST /api/entities

- Route: `app/api/entities/routes.js`
- Endpoint: `POST /api/entities`
- Guards/middleware:
  - `needsAuthorization(['admin', 'editor', 'collaborator'])`
  - `uploadMiddleware.multiple()` (files ignored in this document)
  - `activitylogMiddleware`
  - Wrapped in a DB transaction via `withTransaction`
- Handler flow:
  1. Parse `req.body` (or `req.body.entity` if multipart).
  2. Call `saveEntity` from `app/api/entities/entitySavingManager.ts`.
  3. Emit a `thesauriChange` event to clients for the affected template.
  4. Respond with the created entity, and emit `documentProcessed` to the session socket.

Notes

- The response is either the entity object or `{ entity, errors }` when the request was multipart (due to file fields). We only care about the entity itself.

## Core save: entitySavingManager.saveEntity

File: `app/api/entities/entitySavingManager.ts`

- Preprocessing (entity-only relevant aspects):
  - Validates and sanitizes any metadata values that look like URLs using `isValidUrl` and `sanitizeUrl`.
    - Invalid URLs become empty strings.
    - Potentially dangerous but valid URLs are normalized.
- Calls `entities.save(entity, { user, language }, { includeDocuments: false })`.
  - This delegates to the V1 entity model/services and returns the saved entity.
- Retrieves the stored entity again (unrestricted, with documents and permissions) to shape the response.

Out of scope here: `handleAttachmentInMetadataProperties`, `processFiles`, `saveFiles`.

## V1 saving flow: entities.save

File: `app/api/entities/entities.js`

- Feature flag bypass: This section applies when `tenants.current().featureFlags.v2CreateEntity === false`.
- Steps:
  1. `validateEntity(_doc)`
     - Schema validation and business rules (see “Business rules” below).
     - `saveSelections(_doc)` (IX metadata extraction bookkeeping; not relevant to creation semantics).
  2. New vs. update:
     - New entity (no `sharedId`): set `user`, `creationDate`, `published=false` and `editDate`.
     - Existing translation/update (`sharedId` present): set `editDate`.
  3. Determine template:
     - If `doc.template` exists, load it.
     - Else, if `doc.sharedId` exists, resolve from current stored entity.
     - Else (new): use the default template from settings.
  4. Sanitize entity against template via `sanitize(doc, template)` (see “Metadata sanitize rules”).
  5. Create vs. update:
     - Create: `createEntity(sanitizedDoc, [currentLanguage, languages], sharedId, template)`.
     - Update: `updateEntity(sanitizedDoc, template)`.
  6. Load back the just-saved entity (optionally with documents) and:
     - Update relationship-based references: `relationships.saveEntityBasedReferences(entity, language, template)`.
     - Index the entity in search: `search.indexEntities({ sharedId }, '+fullText')`.
  7. Return the stored entity.

### Metadata sanitize rules (V1)

Function: `sanitize(doc, template)` in `entities.js`

- Applies only when both `doc.metadata` and `template` exist.
- Produces a metadata object that:
  - Ensures every template property is present in metadata (missing ⇒ `[]`).
  - Enforces uniqueness by value for:
    - `multiselect`
    - `relationship`
  - Filters out “empty” values for date-like types:
    - `date`, `multidate`: remove entries with falsy `value`.
    - `daterange`, `multidaterange`: keep entries where either `from` or `to` exists (also ensures valid object shape).
  - `select`: if empty/missing or the first entry lacks a `value`, set to `[]`.
  - `numeric`:
    - If metadata exists and its first `value` is a string:
      - If the string is `''`, delete the entire property from metadata.
      - Else coerce to a single `{ value: parseFloat(value) }`.

Notes

- Text fields are not coerced here.
- This sanitize runs for both create and update flows.

### Metadata denormalization (V1)

Module: `app/api/entities/denormalize.ts`

- `denormalizeMetadata(metadata, language, template, preloaded)` is applied:
  - On create (for each language variant).
  - On update (for current language and for other translations; see “Language sync”).
- Behaviors by property type:
  - `select` / `multiselect` (with `content` pointing to a thesaurus):
    - Augments each `{ value }` with a localized `label` and, if applicable, a `parent` `{ value, label }`.
    - Uses translations for the current `language`.
  - `relationship`:
    - Resolves target entities in the same `language`.
    - Adds `{ label: partner.title, icon: partner.icon, type: 'entity'|'document' }`.
    - If the property has `inherit` configured, also adds:
      - `inheritedValue`: the partner’s metadata for the referenced property.
      - `inheritedType`: the inherited property’s type.
  - Other types: returned as-is.

### Denormalize related entities (propagation)

- When an entity changes title, icon, or inherited-source fields, `denormalizeRelated` updates referencing entities to keep their relationship-based metadata consistent (labels, icons, inherited values) using MongoDB updates with array filters.
- After these updates, referencing entities are re-indexed in search.

## Language synchronization rules

File: `app/api/entities/entities.js`

- Creation across languages:
  - `createEntity` writes one entity per language in settings: same `sharedId`, per-language `language` code, same template.
  - Each language variant’s metadata is denormalized for its language.
- Updates across languages:
  - `updateEntity` loads all translations with the same `sharedId`.
  - The current language doc is merged with the incoming payload and saved (after denormalization).
  - For other languages, V1 syncs only a specific subset of field types from the current language:
    - `select`, `multiselect`, `date`, `multidate`, `multidaterange`, `nested`, `relationship`, `geolocation`, `numeric`.
    - Text-like fields (e.g., `text`, `markdown`) are not auto-synced across languages.
  - After syncing, all affected translations are denormalized for their own languages and saved.
- Template changes on update:
  - All existing relationships for the current doc are deleted and rebuilt as needed.
  - For other language variants, metadata keys that exist only on the previous template (not present on the new template) are removed.

## Business rules and validation

Modules: `validateEntity.ts`, `validation/validateEntitySchema.ts`, `validation/validateEntityData.ts`, `validation/validateMetadataField.ts`, `validation/metadataValidators.js`.

- Two layers of validation are applied before any save:
  1. Schema validation (`entitySchema`) via Ajv.
  2. Data validation against the resolved template.

Key checks (non-exhaustive but covers creation semantics):

- Template existence: if `entity.template` is set, it must exist.
- Allowed properties: metadata keys must be defined in the template; extraneous keys are rejected.
- Required fields: if a property is marked `required`, its value must not be empty. For `numeric`, the value `0` is accepted.
- Type validators by `propertyTypes`:
  - `date`: wrapped single number.
  - `multidate`: array of numbers or nulls.
  - `daterange`: wrapped single object `{ from: number, to: number }` with `to >= from`.
  - `multidaterange`: array of `{ from, to }`, each respecting the rule above.
  - `text`, `markdown`, `media`, `image`: wrapped single string.
  - `select`: wrapped single non-empty string value.
  - `multiselect`, `relationship`, `newRelationship`: arrays of non-empty string values.
  - `link`: wrapped single `{ label: string, url: string }`, either both defined or label empty; url must be string.
  - `geolocation`: array of `{ lat: number, lon: number, label?: string }`, lat/lon required.
- Foreign key checks:
  - `select` / `multiselect`: `value` must exist in the target thesaurus.
  - `relationship`: `value` must be an existing entity `sharedId`; if `content` is set on the property, the target entity must belong to that template.
- Relationship constraints:
  - For legacy `relationship` properties with the same `relationType` and `content` within a template, their values must match across those properties.
  - For `newRelationship` properties: if `targetTemplates` is not set, the field is considered read-only (any change vs current value is rejected). If `targetTemplates` is set, values must belong to one of those templates.
- Title size: enforced by a Lucene byte-size limit validator.

## Side effects and events

- `relationships.saveEntityBasedReferences(entity, language, template)`: builds/synchronizes legacy relationship references from metadata.
- `search.indexEntities({ sharedId }, '+fullText')`: entity is indexed after creation/update.
- Application events:
  - `EntityCreatedEvent` (on create)
  - `EntityUpdatedEvent` (on update)
  - `EntityDeletedEvent` (on delete; included for completeness)
- Thesauri change broadcast: after saving, the server emits `thesauriChange` with a thesaurus view of the entity template (used by clients to refresh dependent UI).

## Notes on “new relationships” in V1 route

Even in the V1 route, the code integrates with the new relationships engine when it is enabled in settings:

- On create/update:
  - `ignoreNewRelationshipsMetadata` records intended relationship changes from metadata and prevents direct metadata mutation for these fields.
  - `updateNewRelationships` applies additions/removals using the new relationships services.
  - `denormalizeAfterEntityCreation` / `denormalizeAfterEntityUpdate` trigger the relationships-v2 denormalization pass.
    This runs automatically and does not change V1’s metadata validation rules described above.

## Returned payload shape (V1 route)

- The final entity is loaded with permissions and, if not suppressed, with `attachments` and `documents`. Those arrays are out of scope here but are present in the response.

## Key files and functions

- Route: `app/api/entities/routes.js` (POST handler)
- Save manager: `app/api/entities/entitySavingManager.ts` (`saveEntity`)
- V1 service: `app/api/entities/entities.js` (`save`, `createEntity`, `updateEntity`, `sanitize`)
- Metadata denormalization: `app/api/entities/denormalize.ts` (`denormalizeMetadata`, `denormalizeRelated`)
- Validation:
  - `app/api/entities/validateEntity.ts`
  - `app/api/entities/validation/validateEntitySchema.ts`
  - `app/api/entities/validation/validateEntityData.ts`
  - `app/api/entities/validation/validateMetadataField.ts`
  - `app/api/entities/validation/metadataValidators.js`
- Model: `app/api/entities/entitiesModel.ts`
- Relationships: `api/relationships` (legacy), `app/api/entities/v2_support.ts` (interfacing to new engine)

## Practical contract (V1)

- Inputs (essential for creation):
  - `title: string`
  - `template?: ObjectId` (if omitted, default template is used)
  - `language: LanguageISO6391` (the current request language)
  - `metadata?: { [propName: string]: Array<{ value: any, ...extras }> }`
- Behavior:
  - Writes an entity per platform language with a shared `sharedId` and language-specific denormalization.
  - Sanitizes and validates `metadata` against the template.
  - Synchronizes specific field types across languages on update.
  - Denormalizes labels and relationship-linked values for each language.
  - Indexes in search and emits domain/UI events.
- Output:
  - The created entity for the current language (including permissions and file arrays in the route’s response, though files are out of scope).

## Edge cases and gotchas

- `numeric` values sent as empty string are removed; other strings are parsed to float.
- `select` and `relationship` values are de-duplicated by `value`.
- Template changes on update remove metadata keys no longer present in the new template for other translations.
- Only a subset of field types are auto-synced across languages; text fields must be translated/updated per language.
- URL-like strings in metadata are validated/sanitized before save.
