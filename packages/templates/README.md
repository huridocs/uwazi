# Template rules (`#templates`)

The rules the API applies to property names when a template is saved, for the template editor to
run in the browser. Every answer comes from the back-end's template domain, so the editor and the
API cannot disagree.

```ts
import { PropertyMatching } from '#templates';
```

Import only from `#templates`. Lint rejects imports of the package's internals, and runtime imports
of `#api/core/domain/template/**` from `app/react` (type-only imports are fine).

## Why

A property's `name` is its identity across the whole collection. Save derives it from the label,
and different labels can give the same name: `T!est` and `T?est` both become `t_est`. Matching by
`label.trim().toLowerCase()` misses those collisions, which then fail on save with an error about a
property the user never knowingly reused. It also flags combinations the API accepts, such as text
with markdown.

## API

Pass properties and templates as the editor holds them: `ClientProperty` and
`ClientTemplateSchema` fit the input types as they are. Ids can be strings or ObjectIds.

### `nameFor(property)`

The name the property will get on save.

```ts
PropertyMatching.nameFor({ label: 'T?est', type: 'text' }); // 't_est'
PropertyMatching.nameFor({ label: 'Location', type: 'geolocation' }); // 'location_geolocation'
```

### `findMatches(candidate, templates, { templateId? })`

Properties in **other** templates with the same name as the candidate. This replaces the
label-based lookup in `ConfigPropertyPanel` and `MatchingPropertiesTable`.

```ts
const { name, matches } = PropertyMatching.findMatches(propertyBeingEdited, templates, {
  templateId: template._id, // leave out for a template that is not saved yet
});
// matches: [{ templateId, templateName, propertyId, label, type, conflicts: ['type'] }]
```

- `conflicts` lists what makes saving fail. An empty list means the properties are compatible and
  will be combined (for example in library filters).
- Common properties (title, creation date…) are never matched across templates: save does not
  compare them.

### `findDuplicateInTemplate(candidate, template)`

A property or common property of the **same** template that would get the candidate's name.
Saving fails while one exists. This replaces the label check in `LabelField`.

```ts
const duplicate = PropertyMatching.findDuplicateInTemplate(propertyBeingEdited, formTemplate);
// { propertyId, label, name, isCommonProperty } | undefined
```

## Rules to know

- **Names follow labels.** Save re-derives every property's name from its current label, so
  renaming a label renames the property. `nameFor` ignores any `name` it is given.
- **Other templates keep their stored names.** They are not re-saved, so `findMatches` compares
  against the `name` they already have. Templates saved long ago may have names that differ from
  what their label would give today.
- **Pass the template as it is in the form.** `findDuplicateInTemplate` derives sibling names from
  their current labels, including unsaved edits.
- **The candidate is skipped by `_id`.** A new property with no `_id` must not be in
  `template.properties`, or it will be reported as its own duplicate.
- **Incomplete properties still match.** A select with no thesaurus yet matches by name and type;
  the `content` conflict appears once a thesaurus is chosen.
- **The API stays authoritative.** If the editor's templates are stale, save still validates and
  answers with its own error.

## Conflict codes

| Code           | Meaning                                                 | Suggested message                                         |
| -------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| `type`         | The types are not compatible (text and markdown are)    | `A property with this name has a different type`          |
| `content`      | Two selects use different thesauri                      | `A property with this name uses a different thesaurus`    |
| `inheritType`  | Two relationships inherit properties of different types | `A property with this name inherits a different type`     |
| `relationType` | Reserved, not reported yet (see below)                  | `A property with this name uses a different relationship` |

Treat the list as open: a new code is a new message to add.

## Not covered yet

- **Same relationship type and target template** for same-name relationship properties. The V1
  validator required them, and the V2 refactor lost the check. Restoring it is planned after this
  package; when it lands, `findMatches` starts reporting `relationType` and `content` for
  relationships with no change to the API above.
- **Swapping names** between two properties of a template in one save (A takes B's label while B
  takes A's) is rejected by save but not reported here.

## For back-end changes

The package is a facade over `app/api/core/domain/template`. Rules belong on the domain models;
`application/DomainPropertyMapper.ts` only translates shapes. Everything the entry loads must be
browser-safe: `specs/browserSafety.spec.ts` walks the runtime import graph and fails on anything
outside its allowlist (the template domain, `app/shared`, one array helper and `zod`).
