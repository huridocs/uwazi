# Metadata value tokens

Design for [huridocs/uwazi#9902](https://github.com/huridocs/uwazi/issues/9902). The issue is the problem statement. Where this file disagrees with the issue, this file wins.

Status: design. Working name is `attributes`. `extra_data` is the alternative still open with the team.

## The problem

Machine-written metadata has nowhere to record a fact about a stored value. IX inferred that fact from suggestion rows and from selection rectangles. Automatic translation prepends `"(AI translated)"` to the text. The fact is not the value, it lives somewhere else, and it disappears while the value stays.

We add one optional property on the value object. A caller puts strings there. We store them and return them.

## Settled

The property sits on each element of a metadata property array, beside `value`.

```json
{
  "metadata": {
    "summary": [
      { "value": "Some text", "attributes": ["ai_generated", "pending_review"] }
    ],
    "author": [
      { "value": "Ada Lovelace" }
    ]
  }
}
```

Most elements will not have the property. That is the normal document.

The value is `string[]`. Validation stops there.

- Any strings, any count, duplicates included, order kept.
- No pattern, no prefix, no length limit, no deduplication, no vocabulary.
- An empty array is stored as an empty array.
- If the caller omits the property, the stored element does not have it.
- A later update sends a new array of elements. We store that array. Strings that were there before and are absent from what was sent are gone. Strings that were not there before and are in what was sent are stored.

The caller is responsible for the contents. If two callers use the same string for different meanings, that is theirs to deal with.

`provenance` stays as it is. This change does not read it, write it, or remove it.

Mongo and Postgres already store `metadata` as a document (`jsonb` on Postgres). No new column and no new database index. `EntitiesMigrationConfig` copies `metadata` through (`metadata: doc.metadata || {}`). The migration spec still gets two assertions: an element that has the array arrives intact, and an element that does not have the property arrives without it. No new migration file unless those assertions fail.

## Name

Working name: `attributes`. It sits beside `value`, so it names facts about the property's value, not fields of the payload. `pending_review` and `sync_off` are both in that position. A link's `url` or a point's `lat` would be inside `value`.

`extra_data` is the other candidate. It claims less about what the strings mean. The team still picks which name to keep. Examples below use `attributes`.

The JSON type stays `string[]`. Any string is allowed. An object in this slot is a different Elasticsearch path, described below.

## What we accept and what we store

The property is optional on the value object. When it is present, it is a `string[]` and we store that array, including `[]`.

Create and update already replace a metadata property with the array of elements the client sent. This property follows that rule. There is no merge with the previous array, and no comparison against the previous `value`.

| Client sends | Stored element |
| --- | --- |
| property omitted | no property |
| `"attributes": []` | `"attributes": []` |
| `"attributes": ["a", "a", "b"]` | `"attributes": ["a", "a", "b"]` |
| a new array of three strings in place of a previous array of three other strings | the new array |

Wrong JSON type (a string, a number, an object) is a validation error.

## Blank values

A blank value could be one use of this property. A string such as `"blank"` could mean the empty value is intentional. Nothing here defines those strings. Callers choose them.

The storage rule is separate from that. Today text entries with an empty trimmed value are dropped before save (`TextProperty` filters them out). The exception: if `attributes` is present (`!== undefined`), keep the element, whatever the strings are.

```json
{ "value": "", "attributes": ["blank"] }
```

`[]` counts as present, so `{ "value": "", "attributes": [] }` is kept. An element with a blank value and no `attributes` is still dropped.

The same exception applies wherever we currently discard an empty value.

## The object gains a property

This is a new property on the metadata value object:

`metadata → <property name> → element → attributes`

Every layer that defines that object, or builds it field by field, learns the property. Layers that pass the value object through keep doing that.

Define it as an optional `string[]` on:

- The HTTP schema for create and update (`MetadataValueSchema` and the shared metadata value schema / type).
- Each domain entry schema. Zod object schemas drop keys they do not declare, so a schema that only lists `value` and `label` will discard this property even after the HTTP layer has accepted it.
- The value object used by every property type, including the CEJIL-only "Violated articles" type (`nested`). That type is not a separate design.
- Builders that assemble a value object from named fields: the entity editor's `toMetadataObjectSchema`, and `denormalizeRelationshipValue`, which writes a new relationship element from `value`, `label`, `type`, `icon`, `inheritedValue`, and `inheritedType`.

Mongo and Postgres mappers persist `propertyValue.value` as the element array. Once the domain object still has the property at save time, both databases store it and both read it back. Search returns `hit._source`, so the indexed document has to carry it too.

## Elasticsearch

This follows the research on [#9902](https://github.com/huridocs/uwazi/issues/9902). That note was written for one string. An array of strings takes the same path. Elasticsearch maps `["ai_generated", "sync_off"]` as one string field with several values, the same type it would use for `"ai_generated"`. It does not create a field per string.

The index already has one metadata object per property name. `elasticMapFactory` writes `metadata.properties[property.name]`. Two templates that both have `summary` share that object. Saving a template rejects the same name with an incompatible type. The mapping is not one entry per template.

Search reads `hit._source`, and `_source` is the entity document. `attributes` is on that document, so it comes back with the entity.

The fields we search are declared one by one: `metadata.<name>.value`, and for some types `label` and `inheritedValue.value`. Filters, aggregations, and sorts in `app/api/search/search.js` use those paths. `attributes` is not one of them.

`attributes` is not added to that object. A name that never carries it does not gain a field. That is the issue's cost, and it is the one we use.

The field appears the first time a document contains values Elasticsearch can type: a non-empty string array on that property name. `unmapped_fields` then maps it with `index: false`. One entry for that name, shared by every template that uses the name. It counts toward the 4500 limit. It is not one entry per template, not one per entity, and not one per string. Ten strings are still one field. The strings are not searchable. They stay in `_source`.

`[]` is not that moment. An empty array is stored in `_source` and creates no field. It does not lock a type, and it does not need the field to exist beforehand. The next document that contains strings on that same name is what creates the entry. Existing tenants need no `putMapping` and no reindex for this.

An object in this slot does not take that path. `object_fields` matches `metadata.*` objects and maps them as enabled objects, and their children are then mapped one by one. That is the 2021 table-of-contents failure (`selectionRectangles.height` inferred as `long`, then as `float`), which is why unknown objects outside that path use `unmapped_objects` with `enabled: false`. A string array never enters it. The schema rejects anything that is not `string[]` so this slot cannot become that object.

`dynamic: false` is not the tool. Nothing in the mapping uses it. The explicit fields are what we search, and the dynamic templates are how every other key on a metadata value is absorbed: strings land on `index: false`, unknown objects are disabled. Setting `dynamic: false` on the metadata property objects would stop those templates for every sibling, on every property, on every template. `provenance`, `suggestion_model`, `attachment`, and `timeLinks` are siblings of that kind today. A later searchable subfield that was not added to `propertyMappings` would silently never be indexed. `attributes` does not need that switch. The template that already keeps a plain string out of search keeps this array out of search.
