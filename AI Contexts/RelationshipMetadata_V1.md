## V1 Relationship Metadata on Entities: Behavior, Data Shapes, and Sync

This document explains how legacy (V1) relationship metadata properties behave when creating a new entity and when editing an existing entity. It focuses on business rules, data shapes, denormalization, and cross-language synchronization.

### Scope
- Applies to V1 `relationship` template properties (not the newer `newRelationship`).
- Entry point for HTTP requests is the entities routes configuration.

### Key Modules
- Routes: `app/api/entities/routes.js`
- Entities service (create/edit/denormalize/sync): `app/api/entities/entities.js`
- Denormalization helpers: `app/api/entities/denormalize.ts`
- Relationship data sources and helpers (V1): `app/api/relationships/*`
- V1 relationship property class: `app/api/core/domain/template/V1RelationshipProperty.ts`
- Collection model for V1 relations: `app/api/relationships/RelationsV1Collection.ts`

---

## Data Shapes

### Template property definition (V1 `relationship`)
- Type: `relationship`
- Important attributes:
  - `relationType`: the connection template (relationship type) used in the `connections` collection.
  - `content` (optional): limits target entities to a specific template.
  - `inherit` (optional): inherit metadata from the related entity’s property.

Reference (class constructor signature excerpt):
```23:76:app/api/core/domain/template/V1RelationshipProperty.ts
class V1RelationshipProperty extends FilterableProperty {
  readonly relationType: string;
  readonly content?: string;
  readonly inheritedPropertyId?: string;
  inherit?: Inherit;
  constructor(
    id: string,
    name: string,
    label: string,
    relationType: string,
    template: string,
    content?: string,
    inheritedPropertyId?: string,
    inherit?: Inherit,
    noLabel?: boolean,
    required?: boolean,
    showInCard?: boolean,
    filter?: boolean,
    defaultfilter?: boolean,
    prioritySorting?: boolean,
    context?: Context
  ) { /* ... */ }
}
```

### Entity metadata value (client/server payload)
- Property value is an array of objects, each minimally: `{ value: <relatedEntitySharedId> }`
- After denormalization, each item is augmented as: `{ value, label, [icon], [type], [inheritedValue], [inheritedType] }`
- Items are deduplicated by `value`.

### Relationship collection (V1)
- Stored in `connections` collection; exposed through helpers and collections.
- Resolution helpers filter relations for a given property by matching `relationType` and optional `content`:
```44:51:app/api/relationships/RelationsV1Collection.ts
public getRelationsBelongingToProperty(property: V1RelationshipProperty) {
  return new RelationsV1Collection(
    this.filter(
      r =>
        r.template?.toString() === property.relationType?.toString() &&
        (!property.content || r.entityData.template.toString() === property.content)
    )
  );
}
```

---

## Create Flow (New Entity)

1) Route entry-point: `POST /api/entities`
```78:109:app/api/entities/routes.js
app.post(
  '/api/entities',
  needsAuthorization(['admin', 'editor', 'collaborator']),
  uploadMiddleware.multiple(),
  activitylogMiddleware,
  async (req, res, next) => {
    /* wraps save with transaction; calls saveEntity */
  }
);
```

2) Entities service handles create across all platform languages:
```172:221:app/api/entities/entities.js
async function createEntity(doc, [currentLanguage, languages], sharedId, docTemplate) {
  const v2RelationshipsUpdates = await ignoreNewRelationshipsMetadata(emptyEntity, doc, docTemplate);
  const result = await Promise.all(
    languages.map(async lang => {
      const langDoc = { ...doc };
      /* per-language denormalization */
      langDoc.metadata = await denormalizeMetadata(
        langDoc.metadata,
        langDoc.language,
        docTemplate,
        { thesauriByKey }
      );
      return model.save(langDoc);
    })
  );
  await updateNewRelationships(v2RelationshipsUpdates);
  await Promise.all(result.map(r => denormalizeAfterEntityCreation(r)));
  return result;
}
```

3) Denormalization for `relationship` properties (per language):
- Resolves each `value` to an entity in the same language.
- Adds `label` from related entity `title`, plus `icon`/`type` when available.
- Handles inheritance: adds `inheritedValue` and `inheritedType` when configured.

Reference (index, behavior summary excerpt):
```91:107:AI Contexts/EntityCreation_V1.md
- `relationship`:
  - Resolves target entities in the same `language`.
  - Adds `{ label: partner.title, icon: partner.icon, type: 'entity'|'document' }`.
  - If the property has `inherit` configured, also adds:
    - `inheritedValue`: the partner’s metadata for the referenced property.
    - `inheritedType`: the inherited property’s type.
```

4) Relationship references (V1) are not directly saved from metadata during create; metadata is denormalized and entity saved. Relationship-based metadata reconstruction and propagation run via `denormalizeAfterEntityCreation` and subsequent relationship utilities, keeping metadata consistent with the connections graph.

---

## Edit Flow (Existing Entity)

1) Update operation loads all translations of the entity and determines template change and sync set:
```57:78:app/api/entities/entities.js
async function updateEntity(entity, _template, unrestricted = false) {
  const docLanguages = await this.getAllLanguages(entity.sharedId);
  const templateHasChanged = /* compare templates */
  const toSyncProperties = template.properties
    .filter(p => p.type.match(FIELD_TYPES_TO_SYNC.join('|')))
    .map(p => p.name);
}
```

2) Current language document is merged, denormalized, then saved:
```85:112:app/api/entities/entities.js
if (d._id.toString() === entity._id.toString()) {
  const toSave = { ...entity };
  if (entity.metadata) {
    toSave.metadata = await denormalizeMetadata(entity.metadata, d.language, template, { thesauriByKey });
  }
  const fullEntity = { ...currentDoc, ...toSave };
  if (template._id) {
    await denormalizeRelated(fullEntity, template, currentDoc);
  }
  const saveResult = await saveFunc(toSave, undefined);
  await updateNewRelationships(v2RelationshipsUpdates);
  return saveResult;
}
```

3) Other language variants get selective sync for a subset of property types, including `relationship`, then are denormalized for their own language and saved:
```116:141:app/api/entities/entities.js
if (entity.metadata) {
  toSave.metadata = { ...entity.metadata, ...toSave.metadata };
  toSyncProperties
    .filter(p => entity.metadata[p])
    .forEach(p => { toSave.metadata[p] = entity.metadata[p]; });
  toSave.metadata = await denormalizeMetadata(toSave.metadata, toSave.language, template, { thesauriByKey });
}
```

4) Relationship metadata refresh from connections (when connections change externally or after hub updates):
```625:655:app/api/entities/entities.js
async updateMetdataFromRelationships(entities, language, reindex = true) {
  const relations = await relationships.getByDocument(entityId, language);
  const relationshipProperties = template.properties.filter(p => p.type === 'relationship');
  relationshipProperties.forEach(property => {
    const relationshipsGoingToThisProperty = relations.filter(r =>
      r.template && r.template.toString() === property.relationType.toString() &&
      (!property.content || r.entityData.template.toString() === property.content)
    );
    entity.metadata[property.name] = relationshipsGoingToThisProperty.map(r => ({
      value: r.entity,
      label: r.entityData.title,
    }));
  });
  if (relationshipProperties.length) {
    await this.updateEntity(this.sanitize(entity, template), template, true);
  }
}
```

---

## Business Rules

1) Validation and constraints
- Property must exist in template; type must be `relationship`.
- Required relationship property: value array must be non-empty.
- `select`/`multiselect`/`relationship` deduplicate values by `value`.
- `content` (if set) constrains targets to entities of that template; invalid targets rejected.
- Legacy co-constraints: when multiple V1 `relationship` properties share the same `relationType` and `content` within a template, their values should remain aligned (UI also mirrors this on save in V2 side panel).

2) Denormalization
- Adds display data per language: `label`, optional `icon`, `type`.
- Inheritance: populates `inheritedValue`/`inheritedType` if `inherit` is defined on the property.
  - **Important:** When inheriting from `select`/`multiselect`, the `inheritedValue` is copied as raw metadata (thesaurus IDs) without automatic label/parent denormalization. This requires special processing (see migrations 154/165) or manual thesaurus denormalization.
  - When inheriting from other types (e.g., `text`, `numeric`), the raw value is copied directly and no further processing is needed.
- Denormalization runs on create and update for each language version saved.

3) Propagation and consistency
- When a related entity’s title/icon/inherited source changes, `denormalizeRelated` updates referencing entities.
- Relationship graph updates (hubs) trigger metadata rebuild via `updateEntitiesMetadataByHub`.

---

## Cross-Language Sync Rules

On Update (`updateEntity`):
- Current language document gets the incoming changes.
- Other languages selectively sync only a subset of property types, including `relationship`, and then are denormalized in their own language.
- Synchronized types include: `select`, `multiselect`, `date`, `multidate`, `multidaterange`, `nested`, `relationship`, `geolocation`, `numeric`.
- Text-like fields (e.g., `text`, `markdown`) do not sync automatically and should be edited per language.

On Create (`createEntity`):
- All platform languages create a document with the same `sharedId` and `template`.
- Each language denormalizes its metadata in that language, yielding language-specific labels for relationships.

---

## Edge Cases and Notes
- Empty string numeric values are removed; non-empty numeric strings are parsed.
- Relationship and select-like arrays are de-duplicated by `value`.
- Template change on update removes properties present only on the old template for other language variants.
- Relationship metadata can be rebuilt from actual connections if any drift occurs.

---

## Related UI Behavior (FYI)
- When saving a `relationship` property from the side panel, the UI mirrors the same value across other `relationship` properties that share the same `type` and `content` (legacy alignment):
```75:86:app/react/V2/Routes/Settings/IX/helpers/sidepanelFunctions.ts
if (property?.type === 'relationship') {
  template?.properties
    ?.filter(prop => prop._id !== property._id && prop.content === property.content && prop.type === property.type)
    .forEach(prop => { data.properties?.push({ [prop.name]: metadata }); });
}
```

---

## API Entry Points and Utilities
- `POST /api/entities`: create or update entity payloads (multipart supported). See: `app/api/entities/routes.js`.
- `entities.updateMetdataFromRelationships`: rebuilds relationship metadata from live connections for one or more entities.
- Relationships save/update flow (V1): `app/api/relationships/relationships.js` with helpers calling `updateEntitiesMetadataByHub` to propagate metadata refresh.

---

## Quick Reference: What Happens on Create vs Edit

### Create
- Sanitize + validate metadata.
- For each platform language: denormalize relationship values to `{ value, label, ... }` in that language and save.
- Relationship graph consistency tasks run after saves to align metadata with connections.

### Edit
- Current language: merge payload, denormalize, save.
- Other languages: selectively sync `relationship` (and other listed types), then denormalize and save.
- Propagation updates re-denormalize referencing entities when titles/inherited sources change.

---

## Inheritance from Select vs Text Properties

**Can relationship properties inherit from select properties?** Yes, they can inherit from any property type, including `select` and `multiselect`.

**Key difference in processing:**

When a relationship property inherits from a property, the `inheritedValue` is copied from the related entity's metadata during denormalization. However, the handling differs based on the inherited property type:

### Text (and most other types)
- The `inheritedValue` is copied as-is: `inheritedValue: partner.metadata[inheritedProperty.name]`
- No further processing needed since text values don't require thesaurus lookups.
- Example: If inherited property is `text`, `inheritedValue` contains `[{ value: "some text" }]`

### Select/Multiselect (special case)
- The `inheritedValue` is also copied as-is during initial denormalization, BUT:
- **Select values are NOT automatically denormalized with thesauri labels and parent info** during relationship denormalization.
- The `inheritedValue` contains raw thesaurus IDs without labels: `[{ value: "thesaurusId" }]` instead of `[{ value: "thesaurusId", label: "Label", parent: {...} }]`
- Special migrations exist (`154-repair_select_parent_denormalization`, `165-repair_select_parent_denormalization`) to add missing parent denormalization to select inherited values.
- When thesauri labels change, a special update path (`twoJumpUpdates`) updates inherited values in relationship properties via `denormalizeThesauriLabelInMetadata`.

**Why the difference?**
- Text values are self-contained and don't need external lookups.
- Select values reference thesauri that require:
  1. Label resolution (needs thesaurus + translations)
  2. Parent relationship resolution (needs thesaurus hierarchy)
  3. Language-specific translations

The initial relationship denormalization (`denormalizeInheritedProperty`) doesn't perform thesaurus lookups - it just copies the raw metadata. This is why select inheritance requires additional processing.

**Code reference:**
- `denormalizeInheritedProperty` (line 305-324 in `denormalize.ts`): Copies raw metadata without thesaurus denormalization
- `twoJumpUpdates` (line 142-148 in `denormalize.ts`): Special update path for select thesaurus changes affecting inherited values
- `denormalizeThesauriLabelInMetadata` (line 229-261 in `denormalize.ts`): Updates labels when thesauri change

---

## Minimal Contract Snapshot
- Input (`metadata.relationshipProp`): `Array<{ value: string }>`
- Output (after denormalization): `Array<{ value: string, label: string, icon?: string, type?: string, inheritedValue?: any, inheritedType?: string }>`
- Invariants:
  - Values must reference existing entities; if `content` set, targets must be of that template.
  - Values are unique by `value`.
  - Required properties must have at least one item.
- **Inheritance note:** When inheriting from `select`/`multiselect`, `inheritedValue` may contain raw thesaurus IDs without labels until additional repair migrations run.



