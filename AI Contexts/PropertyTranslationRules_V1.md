## Property Translation Rules (V1)

This note explains which metadata property types automatically produce localized/translatable output in Uwazi’s V1 entity pipeline, and which remain raw per-language values. It focuses on the backend behaviors executed during entity creation/update (`denormalizeMetadata`, language sync, etc.).

---

### High-Level Summary

| Property type | Automatic localization? | How it’s produced |
| ------------- | ------------------------ | ----------------- |
| `select`, `multiselect` | **Yes** | Thesaurus labels resolved per language via translations |
| `relationship` | **Yes** | Related entity titles/icons taken from the same language |
| `relationship` with inheritance | **Partial** | Inherited values copied raw; if the inherited property is `select`/`multiselect`, later processing/migrations add translated labels |
| `newRelationship` | **Depends** | Uses V2 traversal queries; still yields localized labels like relationships when denormalized |
| `text`, `markdown`, `media`, `image`, `numeric`, `date`, `multidate`, `daterange`, `multidaterange`, `geolocation`, `link`, `nested` | **No (raw)** | Stored exactly as provided; translations must be supplied per language by the user |

---

### Automatically Localized Types

#### Select & Multiselect

- During denormalization, each value’s `label` (and optional `parent`) is populated using translated thesaurus entries for the current language.
- Source: `denormalizeSelectProperty` fetches thesauri and applies translations.

```269:303:app/api/entities/denormalize.ts
const denormalizeSelectProperty = async (
  property: PropertySchema,
  values: MetadataObjectSchema[],
  thesauriByKey?: Record<string, ThesaurusSchema>,
  translation?: unknown
) => {
  const thesaurus = thesauriByKey
    ? thesauriByKey[property.content!]
    : await dictionariesModel.getById(property.content);
  // ...
  return values.map(value => {
    const denormalizedValue = { ...value };
    const thesaurusValue = flattenValues.find(v => v.id === denormalizedValue.value);

    if (thesaurusValue && thesaurusValue.label) {
      denormalizedValue.label = translate(context, thesaurusValue.label, thesaurusValue.label);
    }
    if (thesaurusValue && thesaurusValue.parent && thesaurusValue.parent.id) {
      denormalizedValue.parent = {
        value: thesaurusValue.parent.id,
        label: translate(context, thesaurusValue.parent.label, thesaurusValue.parent.label),
      };
    }
    return denormalizedValue;
  });
};
```

**Business rule:** If the thesaurus has translations, those will be surfaced automatically per language; otherwise, fallback labels remain.

#### Relationship (legacy)

- Denormalization looks up related entities in the current language and populates `label`, `icon`, `type`.
- For inherited relationships, `inheritedValue` and `inheritedType` are copied from the related entity’s metadata.

```326:360:app/api/entities/denormalize.ts
const denormalizeRelationshipProperty = async (
  property: PropertySchema,
  values: MetadataObjectSchema[],
  language: string,
  allTemplates: TemplateSchema[]
) => {
  const partners = await model.getUnrestricted({
    sharedId: { $in: values.map(value => value.value as string) },
    language,
  });
  // ...
  return values.map(value => {
    let denormalizedValue = { ...value };
    const partner = partnersBySharedId[denormalizedValue.value as string];

    if (partner && partner.title) {
      denormalizedValue.label = partner.title;
      denormalizedValue.icon = partner.icon;
      denormalizedValue.type = partner.file ? 'document' : 'entity';
    }

    if (property.inherit && property.inherit.property && partner) {
      denormalizedValue = denormalizeInheritedProperty(
        property,
        denormalizedValue,
        partner,
        allTemplates
      );
    }
    return denormalizedValue;
  });
};
```

**Business rule:** Relationship labels follow the related entity’s title in the target language. Updating an entity’s title triggers `denormalizeRelated`, pushing the new label/icon into referencing entities.

#### Relationship with Inheritance

- The inherited metadata is copied raw; if that metadata is itself localized (e.g., a select), labels may require additional denormalization steps or migrations (e.g., 154/165) to ensure parent labels are present.
- Select inheritance is not fully localized at copy time; see `AI Contexts/RelationshipMetadata_V1.md` for details.

#### New Relationship (V2 traversal)

- Uses V2 traversal queries but ultimately produces metadata assignments with localized labels similar to legacy relationships.
- Denormalization occurs via the V2 services, but the rule remains: labels come from related entities in the current language.

---

### Raw / Non-localized Types

The following property types are stored exactly as provided by the user for each language variant. No automatic translation or label enrichment is applied by the backend.

- `text`, `markdown`
- `media`, `image`
- `numeric`
- `date`, `multidate`
- `daterange`, `multidaterange`
- `geolocation`
- `link`
- `nested`

**Implications:**
- Users must supply translated values manually per language variant when required.
- These fields are copied across languages only when explicitly listed in the V1 sync rules (see below). Even then, the content remains identical (no translation).

---

### Language Sync Rules (Update Only)

- On update, V1 copies specific property types from the edited language into other translations before saving them in their own language: `select`, `multiselect`, `date`, `multidate`, `multidaterange`, `nested`, `relationship`, `geolocation`, `numeric`.
- Text-like properties (`text`, `markdown`, etc.) are **not** auto-synced; each translation must be edited separately.

```57:138:app/api/entities/entities.js
const FIELD_TYPES_TO_SYNC = [
  propertyTypes.select,
  propertyTypes.multiselect,
  propertyTypes.date,
  propertyTypes.multidate,
  propertyTypes.multidaterange,
  propertyTypes.nested,
  propertyTypes.relationship,
  propertyTypes.relationship,
  propertyTypes.geolocation,
  propertyTypes.numeric,
];
// ... other language variants copy only these types before denormalization
```

**Important:** Even though numeric/date/etc. are synced, they are not translated—just duplicated.

---

### Manual Translation Responsibilities

- **Entity titles:** Stored per language; users must provide translations manually.
- **Textual metadata:** (`text`, `markdown`, etc.) require manual translation per language variant.
- **Links/URLs:** No translation; same value shared or edited per language as needed.

---

### Related Business Rules & References

- `AI Contexts/RelationshipMetadata_V1.md` – deep dive on relationships and inheritance.
- `AI Contexts/MediaImageMetadata_V1.md` – treatment of media/image strings (no translation).
- Thesaurus translations live in `translationsV2` collection and are consumed via `translate(context, ...)` helper.
- Relationship labels update via `denormalizeRelated` and `relationships.updateEntitiesMetadataByHub` when source entities change.

---

### Takeaways

1. Only thesaurus-driven and entity-reference fields (`select`, `multiselect`, `relationship`) have automatic localization.
2. All other property types remain user-provided per language—no backend translation or label enrichment.
3. Update synchronization duplicates certain property values across languages, but translation is still manual unless driven by thesaurus/entity data.


