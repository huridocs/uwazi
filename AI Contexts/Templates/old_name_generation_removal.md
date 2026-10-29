# Remove old property-name generation

## Decision

Old name generation goes away. From this change on, every new and existing property name is the new algorithm (`generateNewSafeName`). The settings flag, the UI toggle, and the Save Settings fan-out are removed. Nothing in templates or settings watches the flag, rewrites templates, or reindexes because of it.

The data repair moves to migrations. A tenant is classified from its own data, never from its name. How many tenants fall into each branch does not change the migration. The same rename rewrites IX extractors and suggestions that store the property name.

## What the running app does today

`SaveSettings`, after commit, calls `TemplateFacade.applyNewNameGeneration` only when the flag flips from off to on. That re-saves every template through `UpdateTemplate`. The update schema drops `name` on custom properties and rebuilds it:

- normal property: `generateNewSafeName(label)`
- geolocation and nested: `generateNewSafeName(`${label}_${type}`)` as one string
- common properties (`title`, `creationDate`, `editDate`) keep the stored name, because their schema requires `name`

When a name actually changes, `TemplatePostProcessEntitiesJob` then:

- renames `entities.metadata.<old>` to `entities.metadata.<new>`
- renames `files.propertySelections[].name`

It does not rewrite menus, landing pages, page markdown, or charts. It also reindexes through entity jobs, not through the migration runner.

Translation keys are labels. A change of `name` does not change them. The search mapping is rebuilt from the templates by the reindex. The migration writes the renames and does not replay `UpdateTemplate`.

## Constraints from the migration runner

- A migration does not import domain code, data sources, or `generateNewSafeName`. Each migration file carries its own copy of the function. Mongo and Postgres migrations do not share that copy.
- A retry runs the migration again for every tenant, including tenants that already committed. Every write is a no-op when the row is already in the new shape.
- Elasticsearch is not updated by the write. When this tenant's indexed data changed, set `reindex: true`. The migration job reindexes.
- Raw writes do not emit sync logs. That is a no-op here: the synced collection runs the same migration and ends in the same state a sync would have produced.
- Migrations 1 and 2 set the flag to true. Migrations 3 and 4 remove it, in the same release, after 1 and 2.

## Four migrations

| | What |
| --- | --- |
| 1. Mongo data | Branches below. End by setting `newNameGeneration: true`. |
| 2. Postgres data | Same branches. End by setting `new_name_generation` to true. |
| 3. Mongo data | `$unset` `newNameGeneration`. No template work, no reindex. |
| 4. Postgres schema | `ALTER TABLE settings DROP COLUMN new_name_generation`. |

All four ship in this release, in that order. Migrations 1 and 2 are the repair. Migrations 3 and 4 only delete the flag.

## Per-tenant branches

Same branches in migrations 1 and 2. Each looks at the store it is connected to. Do not branch on `postgresCore`. A tenant on Postgres still has a Mongo copy; both copies get the same treatment so they do not drift.

"Flag already new" means `newNameGeneration === true` in Mongo, or `new_name_generation` is true in Postgres. Missing, null, and false are old.

Set the flag true last, after renames and the text replace. A retry that sees the flag already true must mean this tenant finished.

1. **Flag already new.** Do not read templates. Leave the flag true. No reindex.
2. **Flag old, no custom property name would change.** Compare each `templates.properties[]` entry with the function above. Common properties are not compared. Set the flag true. No reindex.
3. **Flag old, at least one name would change, and no stored query or aggregation uses an old name.** Apply the rename map. Set the flag true. Set `reindex: true`.
4. **Flag old, names would change, and a stored query or aggregation uses an old name.** Apply the rename map, then the best-effort text replace. Set the flag true. Set `reindex: true`.

A property is in the rename map only when the stored `name` is a non-empty string and it differs from the generated name. Write `templates.properties[].name` last. Until that write, a retry still builds the same map and finishes the other stores. Once the template names match, the map is empty and a retry only sets the flag.

If two properties on the same template would generate the same new name, fail that tenant. Do not write a colliding rename.

### Rename map writes

For each old → new pair, scoped to the templates that owned that property:

- `entities.metadata` key (Mongo `$rename` on `metadata.<old>`; Postgres jsonb key rewrite, one pair at a time so a chain cannot clobber)
- `files.propertySelections[].name`
- `ixextractors.property` and `ixextractors.source.property` (`ix_extractors.property`, `ix_extractors.source.property`)
- `ixsuggestions.propertyName` (`ix_suggestions."propertyName"`), matched on `entityTemplate`
- `templates.properties[].name`, last

An extractor has one `property` string and a list of templates. Rewrite it when every template on that extractor maps the old name to the same new name. If they disagree, fail the tenant. `title` is not in the map, so an extractor or suggestion on title stays. Models do not store a property name. Suggestion `suggestedValue` and `currentValue` are values, not names.

Leaving `property` on the old name is not a stale pointer. On the next template save, `cleanupTemplateFromPropertyExtractors` treats a property name that is no longer on the template as deleted, drops that template from the extractor, and deletes its suggestions.

Batch entity, file, and suggestion updates. Call the heartbeat between batches. Do not hold one transaction across a large tenant.

### Best-effort text replace

Run only when the rename map is non-empty. Replace longer old names before shorter ones. Touch a name only at the delimiters below, so a short name does not match inside a longer token:

- search key: `(<old>:` or `,<old>:` or `sort:<old>` followed by a non-name character, in text that also contains `q=`, `filters:`, `{list}`, or `/library`
- aggregation attribute: `property="<old>"` or `filterProperty="<old>"` (single or double quotes)

Stores:

- `settings.links[]` and nested `sublinks[]` `url`
- `settings.home_page`
- `pages` draft content and script (`locales.*.draft`, plus legacy `draft` and `metadata` if still present)
- `page_releases` per-language `content` and `script`

Decode percent-encoding before matching, and write the decoded form back only where a delimiter matched. This is best effort. A name built in free script, or stored in a shape we did not match, stays old and has to be fixed by hand. Every tenant whose stored text matches is in scope.

## Code removal

After the data migration is what production runs, application code only generates new names.

- `propertyNameGeneration.ts`: one function, the new algorithm. Delete the `[^a-z0-9]` branch.
- Stop passing `newNameGeneration` through `Property`, `CreateTemplate`, `UpdateTemplate`, CSV import, and `EntityData`.
- Delete `SaveSettings` → `TemplateFacade.applyNewNameGeneration` and `readNewNameGeneration`.
- Delete the flag from the settings domain, the save schema, the public settings allow-list, and the Collection toggle. Migrations 3 and 4 remove the stored field in the same release.

Issue #9695 (turn the fan-out into a job) is withdrawn. The fan-out is deleted, not moved.

## Release

One release: the code and all four migrations. The code no longer reads the flag. Migrations 1 and 2 repair the data and set the flag true; 3 and 4 then remove it. A tenant that renamed is reindexed under maintenance.

## Out of scope unless a stored name shows up

Settings library filters, if a filter id is a property name rather than a template id. The template-updated listener only renames a filter when the template name changes.

## To do

- [x] Scaffold the four migrations with `yarn add-migration`. Copy `generateNewSafeName` into 1 and 2. Do not import it. Both end by setting the flag true.
- [x] Specs, old shape in, raw collection or table out: flag already true; flag missing and names already equal leaves the flag true; one rename then the flag is true; a retry; two tenants on Postgres; empty database is a no-op; collision fails the tenant.
- [x] Spec the text replace on a page query and on `property="..."`, including a name that is a prefix of another name.
- [x] Spec an extractor `property`, a `source.property`, and a suggestion `propertyName` rewritten from the same map. Two templates on one extractor that disagree fail the tenant. `title` is left as stored.
- [x] Set `reindex: true` only for a tenant that renamed.
- [ ] Remove the flag from application code and the UI in this release.
- [ ] Ship the code and all four migrations in one release.
- [ ] Close #9695 as withdrawn once this is the plan of record.
