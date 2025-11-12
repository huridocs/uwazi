# Uwazi V1 `nested` Property: Deep Technical Guide

Updated: 2025-11-07

## Overview

The `nested` metadata property type is a structural container used to group related subfields inside an entity’s metadata entry. In Uwazi V1 it is treated as an opaque array-of-wrapped values. Unlike `select`, `relationship`, or `multiselect`, it has **no dedicated type validator** or denormalization branch. It is, however, part of the language synchronization set for updates.

## Position in the V1 Entity Flow

Referenced in: `app/api/entities/entities.js`

- Creation: Included in the initial sanitized metadata and copied to all language variants.
- Update: If present in the incoming payload, it is synchronized across all translations (see Language Sync below).
- Sanitization: Presence guaranteed (missing ⇒ `[]`). No additional filtering.
- Denormalization: Passed through unchanged.

## Metadata Shape

```jsonc
"metadata": {
  "my_nested_property": [
    { "value": { /* arbitrary object representing grouped child fields */ } },
    { "value": { /* second grouped entry */ } }
  ]
}
```

Conventions (client-side, not enforced server-side):

```json
{
  "value": {
    "child_text": [{ "value": "Some text" }],
    "child_number": [{ "value": 7 }],
    "child_select": [{ "value": "thesaurus-entry-id" }]
  }
}
```

Server treats the inner object as opaque; it does **not** recursively validate or denormalize its children.

## Input Contract (Create / Update)

- Value: Array (zero or more entries).
- Each entry: Object with a `value` key (any non-null structure). Absence of `value` risks generic denormalization errors later.
- Missing property: Added as empty array during `sanitize`.
- Required flag: Must contain at least one element with a truthy `value` (non-empty and not all nulls).

## Validation

File: `app/api/entities/validation/validateMetadataField.ts`

Applied validators sequence:

1. Required check (`validators.validateRequiredProperty`).
2. Type validator (`validators[property.type]`).
3. Same relationships match (irrelevant to `nested`).
4. Foreign key checks (select/multiselect/relationship only).
5. New relationship validation (irrelevant).

`nested` has **no entry** in `validators` (`metadataValidators.js`). Therefore:

- No structural or type-specific check beyond required.
- Foreign key and relationship constraints are not applied to its internal data.

Required logic summary: If marked `required`, the array must not be empty and must contain at least one wrapper object with a non-null/non-empty `.value`.

## Sanitization

Function: `sanitize(doc, template)` in `entities.js`.
Behavior for `nested`:

- If missing, set to `[]`.
- No de-duplication, no empty filtering, no coercion.
- Other property-specific rules do not apply.

## Denormalization

File: `app/api/entities/denormalize.ts`.
`denormalizeProperty` handles select/multiselect (thesauri) and relationship; all other types are returned unchanged. `nested` falls in the generic passthrough branch.

Result: Values under `nested` remain exactly as sent.

## Language Synchronization

Constant: `FIELD_TYPES_TO_SYNC` in `entities.js` includes `propertyTypes.nested`.
On UPDATE (`updateEntity`):

- For other language variants, properties whose names appear in the sync list and are present in the incoming payload are overwritten with the current language’s value.
  On CREATE (`createEntity`):
- Same base sanitized/denormalized metadata is copied to each language variant; `nested` sees no language-specific transformation.

Implication: Editing a nested property in one language update propagates the entire property to all translations. To preserve per-language differences, **omit** the nested property from the payload of updates where you do not want propagation.

## Editing / Update Semantics

- Full replacement: Sending `my_nested_property` replaces its value for the current language and propagates copies to others.
- Partial merging: Not performed server-side; client must send complete desired value.
- Bulk update (`multipleUpdate`): Merges provided metadata + `diffMetadata`; if template changes, a secondary sanitize ensures presence. Nested still untouched structurally.

## Template Configuration

Supported meaningful options:

- `name`: string
- `type`: `'nested'`
- `label`: UI/display
- `required`: boolean

Irrelevant / ignored for nested:

- `content`, `inherit`, `relationType`, `targetTemplates`.
  No schema for children is enforced.

## Returned Payload Example

```json
{
  "sharedId": "abc123",
  "language": "en",
  "metadata": {
    "my_nested_property": [
      {
        "value": {
          "child_text": [{ "value": "Initial narrative" }],
          "child_number": [{ "value": 3 }]
        }
      }
    ]
  }
}
```

No added `label`, `icon`, `parent`, or `inheritedValue` fields (reserved for select/relationship). Any internal enrichment must be done client-side pre-submit.

## Events & Side Effects

Changing a nested property triggers only generic entity events and indexing:

- `EntityCreatedEvent` / `EntityUpdatedEvent`
- Search reindex (`search.indexEntities`)
  No relationship propagation or thesauri label updates involve nested.

## Edge Cases & Gotchas

| Scenario                                  | Behavior                                                          |
| ----------------------------------------- | ----------------------------------------------------------------- |
| Missing nested property on create         | Auto-filled as `[]`.                                              |
| Required but empty array                  | Validation fails.                                                 |
| Entries without `value` key               | Can cause generic errors (invalid shape). Always include `value`. |
| Duplicates                                | Preserved (no de-duplication).                                    |
| Attempt per-language differences          | Overwritten by sync unless omitted in source update payload.      |
| Foreign IDs inside internal child objects | Not validated by server.                                          |
| Numeric/string coercion inside children   | Not applied. Client responsibility.                               |
| Large nested payload                      | Can contribute to Lucene byte-size limit errors indirectly.       |

## Practical Usage Guidelines

Do:

- Always wrap grouped child data under `[{ "value": { ... } }]`.
- Omit the property on updates when you don’t want cross-language synchronization.
- Validate child structure on the client (server is opaque).

Don't:

- Rely on server to denormalize or validate inner child select/relationship IDs.
- Send partial fragments expecting merges; send full final state.

## Examples

### Create

```json
{
  "title": "Case File A",
  "template": "654e7c...",
  "language": "en",
  "metadata": {
    "my_nested_property": [
      {
        "value": {
          "child_text": [{ "value": "Initial narrative" }],
          "child_number": [{ "value": 3 }]
        }
      }
    ]
  }
}
```

All other languages receive identical `my_nested_property` arrays.

### Update Without Syncing Nested

```json
{
  "sharedId": "abc123",
  "language": "en",
  "title": "Updated English Title"
}
```

Nested unchanged across languages.

## When Not to Use `nested`

Avoid if you require:

- Automatic foreign key validation for internal child values.
- Thesaurus label denormalization of embedded selects.
- Relationship inheritance logic within grouped items.
  Use top-level properties instead.

## Improvement Opportunities (Future)

- Add dedicated validator for structural schema.
- Recursive denormalization for child select/relationship fields.
- Opt-out flag from automatic language sync.
- Declarative child schema in template for server-side validation.

## Summary

`nested` is a lightweight grouping container with minimal server-side semantics: sanitized for presence, validated only for required non-emptiness, passed through unchanged in denormalization, and synchronized across languages on update. Treat its contents as client-managed.

---

Let me know if you’d like a companion proposal or tests covering malformed nested structures.
