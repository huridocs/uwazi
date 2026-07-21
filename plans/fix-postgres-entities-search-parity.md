# Fix Postgres/Mongo parity issues in entity search methods (PR #9385)

## Goal

PR #9385 adds `PostgresEntitiesDAO` and wires `entitiesIndex.js`/`search.js` to read
entities from Postgres instead of Mongo when a tenant has `postgresEntities: true`.
Final review before merge found two real bugs and one design smell in that wiring, plus
missing regression coverage proving the two backends actually behave the same for every
real caller of `search.indexEntities`. This plan fixes all of it.

Out of scope (confirmed acceptable for this PR): there is still no write-path that syncs
entity data into the Postgres `entities` table — that's a deliberate, separate follow-up.
This plan only touches the read side that already exists.

### Execution order

Tests-first: implement **Step 4 before Steps 1–3**. Written against today's code, the new
parity suite is expected to **fail** on the `$and`/`$or` shape (finding #1) and the `icon`
assertion (finding #3) — that failure is the proof the suite actually catches the bugs
this plan fixes, not just that it runs. Then implement Steps 1, 2, 3 (order among those
three doesn't matter, they touch disjoint files) and re-run the full verification list
from Step 4 to confirm everything goes green.

### Recap of the findings this plan addresses

1. **(High + Medium, fixed together) Unsupported query shapes are silently mistranslated.**
   `app/api/search/entitiesIndex.js:24` (`entityFiltersFromQuery`) only understands
   `language`, `template`, `sharedId`/`sharedId.$in`, `_id`/`_id.$in`. Every real caller of
   `search.indexEntities` uses one of those shapes **except one**:
   `app/api/entities/denormalize.ts:166` (`reindexUpdates`) calls it with
   `{ $and: [{ language }, { $or: updates.map(u => ({ [u.filterPath]: value })) }] }`, where
   `filterPath` is a dynamic `metadata.<prop>.value` path used to find entities whose
   relationship metadata references a changed entity. `entityFiltersFromQuery` silently
   returns `{}` for this shape (none of its keys match `$and`), so with the flag on,
   `getSteps`/`indexEntities` (`entitiesIndex.js:146`, `:189`) select/count/reindex **every
   entity in the tenant** instead of just the affected ones. This is a real behavioral
   divergence from the Mongo path, with no error or log.
   The **Medium** finding is a direct consequence of the same root cause: the Postgres
   branch of `getEntitiesToIndex` (`entitiesIndex.js:122-134`) calls
   `getByIdsWithDocuments(stepBach, …)` using only the already-filtered ids and silently
   drops `query` — which is safe *only* as long as `stepBach` was itself correctly filtered
   by `getSteps`. Fixing filter translation at the source (`getSteps`) removes the fragile
   implicit dependency instead of patching it in two places.

   **Design constraint: no Mongo fallback.** Once `postgresEntities` is on for a tenant,
   Mongo must not be read at all — there is no write-path keeping the two backends in sync
   (see "Out of scope" above), so a Mongo read under the flag can return stale or missing
   data, not just "the same answer via a different route". This rules out falling back to
   the Mongo path for query shapes Postgres can't translate. Instead, Postgres must gain
   real support for every query shape real callers actually use (enumerated in Step 4's
   table), and `entityFiltersFromQuery` must **throw** on any shape outside that enumerated
   set — failing loudly instead of silently sweeping the whole tenant, which is what
   happens today.

2. **(Minor, design) Duplicated feature-flag check.** `entitiesIndex.js:22`
   (`postgresEntitiesEnabled`) and `app/api/search/search.js:307`
   (`tenants.current().featureFlags?.postgresEntities`) independently read the same flag
   from two different tenant accessors. They must not be allowed to drift.

3. **(Minor, data parity) `icon` default shape differs between backends.** Mongo's
   "no icon" representation is `{ _id: null, type: 'Empty' }`
   (`app/api/core/infrastructure/mongodb/entity/MongoEntityMapper.ts:63`). The new
   migration's column default is `DEFAULT '{}'`
   (`app/api/core/infrastructure/postgresql/schema_migrations/005-add-entities-table.sql:487`),
   so any entity inserted without an explicit `icon` reads back as `{}` from Postgres —
   `icon._id` is `undefined`, not `null`. Since this migration hasn't shipped yet (PR is
   still open), fix the default itself rather than normalizing at read time.

4. **(Test gap) No regression suite proves backend parity.** The existing
   `PostgresEntitiesDAO.spec.ts` and `entitiesIndex.spec.ts` test the DAO and a handful of
   query shapes in isolation, but nothing proves every real call site of
   `search.indexEntities` produces the same indexed result under Mongo and Postgres, and
   nothing exercises the `postgresEntities`-without-`postgresFiles` error path
   (`PostgresEntitiesDAOFactory.ts:11`).

---

## Steps

### Step 1 — Teach Postgres to natively represent every real `indexEntities` query shape, including the dynamic metadata-path one

**Files:** `app/api/search/entitiesIndex.js`,
`app/api/core/infrastructure/postgresql/common/PostgresTable.ts`,
`app/api/core/infrastructure/postgresql/entity/PostgresEntitiesDAO.ts`

**Problem being fixed:** finding #1 (High + Medium).

**Design:** no Mongo fallback (see design constraint above). Instead, extend the Postgres
path end to end so it can express the `denormalize.ts` shape —
`{ $and: [{ language }, { $or: updates.map(u => ({ [u.filterPath]: value })) }] }` where
`filterPath` is `metadata.<prop>.value` — as a real Postgres query, and make translation
failures loud instead of silent.

**How the metadata-path filter maps to SQL:** `metadata` is stored as JSONB shaped like
Mongo's document, e.g. `{ "<prop>": [{ "value": "v", ... }, ...] }`. Mongo's implicit
array-elemMatch semantics for `{'metadata.<prop>.value': v}` are equivalent to a JSONB
containment check at the whole-column level: `metadata @> '{"<prop>":[{"value":"v"}]}'`.
Verified against a live Postgres 16 instance that this ignores sibling keys in the array
element and other properties in `metadata` (i.e. behaves like elemMatch, not deep-equal):
```sql
'{"prop":[{"value":"v","label":"x"},{"value":"other"}]}'::jsonb
  @> '{"prop":[{"value":"v"}]}'::jsonb  -- true
'{"prop":[{"value":"nope"}]}'::jsonb
  @> '{"prop":[{"value":"v"}]}'::jsonb  -- false
'{"other":[{"value":"v"}]}'::jsonb
  @> '{"prop":[{"value":"v"}]}'::jsonb  -- false (wrong property)
```
knex already exposes this as `whereJsonSupersetOf(column, value)` /
`orWhereJsonSupersetOf(...)`, which compiles to exactly `"metadata" @> ?` with the value
JSON-serialized and bound as a parameter — no hand-built SQL strings, no manual bindings,
no new raw-SQL escape hatch on `PostgresTable`. Confirmed via a dry `toSQL()` knex compile
(client `pg`, no DB needed) that OR-grouping multiple pairs produces
`("metadata" @> ? or "metadata" @> ?)` with each value correctly parameterized.

- **`PostgresTable.ts`**: add one narrow method, mirroring the existing `whereAny` pattern:
  ```ts
  whereJsonSupersetOfAny(column: string, values: Record<string, unknown>[]): PostgresTable<TRow> {
    const qb = this.qb.clone().where(builder => {
      values.forEach((value, i) =>
        i === 0 ? builder.whereJsonSupersetOf(column, value) : builder.orWhereJsonSupersetOf(column, value)
      );
    });
    return this.chain(qb);
  }
  ```
- **`PostgresEntitiesDAO.ts`**: extend `EntityFilters` with
  `metadataValueIn?: { property: string; value: string }[]`; in `applyFilters`, when
  present and non-empty:
  ```ts
  q = q.whereJsonSupersetOfAny(
    'metadata',
    filters.metadataValueIn.map(({ property, value }) => ({ [property]: [{ value }] }))
  );
  ```
  This ANDs with whatever other filters are set (e.g. `language`), matching `$and`'s
  semantics, while the multiple property/value pairs are OR'd together, matching `$or`'s.
- **`entitiesIndex.js`**: rewrite `entityFiltersFromQuery(query)` to recognize two shapes:
  1. The existing flat shape (`language`, `template`, `sharedId`/`sharedId.$in`,
     `_id`/`_id.$in`), unchanged.
  2. `{ $and: [...] }` where each clause is either a flat filter (shape 1) or
     `{ $or: [{ 'metadata.<prop>.value': v }, ...] }` — parsed via a regex on the dynamic
     key (`/^metadata\.([^.]+)\.value$/`) into `metadataValueIn` entries.
  Any query shape that doesn't match either form (unrecognized top-level key, an `$and`
  clause that isn't flat-filter-or-metadata-`$or`, an `$or` entry whose key doesn't match
  the metadata-path pattern) makes `entityFiltersFromQuery` **throw a new
  `UnsupportedQueryError`** (defined in `entitiesIndex.js`, alongside the existing
  `IndexError` and exported the same way), not return `{}` — turning a future unsupported
  shape into a hard, identifiable failure instead of a silent full-tenant sweep.
  `IndexError` is deliberately not reused for this: it specifically means "ES bulk index
  request came back with per-item errors" (see `handleErrors`), a different failure mode
  from "this query can't be translated to Postgres" — conflating them would make both
  harder to distinguish in logs/tests/future `catch` blocks. All three call sites
  (`getSteps`, `getEntitiesToIndex`'s implicit dependency on `getSteps`'s output, and
  `indexEntities`'s `totalRows` count) keep calling `entityFiltersFromQuery` exactly as
  they do today — the only change is what it returns and when it throws.
  `postgresEntitiesEnabled()` stays the single flag gate; there is no second
  `postgresFilters`-null gate to thread through, since there's no fallback branch left to
  gate. Confirmed no caller of `search.indexEntities` (including
  `denormalize.ts:166,255`) catches errors from it, so the throw surfaces rather than
  getting swallowed.

**Does the touched file have tests? Do they cover this?**
Yes — `app/api/search/specs/entitiesIndex.spec.ts` already has a
`describe('indexEntities by query (postgresEntities flag on)', ...)` block added by this
PR, but it only covers `{}`, `sharedId`, `sharedId.$in`, `_id.$in` — none of which exercise
the `$and`/`$or` shape. `PostgresEntitiesDAO.spec.ts` has no coverage of
`metadataValueIn`/JSONB containment at all. `PostgresTable` has no dedicated spec file for
`whereJsonSupersetOfAny` beyond what's exercised indirectly through the DAO spec.

**Test changes required:**
- `entitiesIndex.spec.ts`: add to the existing `describe` block a case calling
  `search.indexEntities({ $and: [{ language: 'en' }, { $or: [{ 'metadata.relatedProp.value': 'e1' }] }] })`
  with the flag on, fixtures containing an entity that matches and at least one that would
  only get swept in by the old buggy fallback-to-`{}` behavior — assert only the intended
  entity is indexed (regression test for finding #1). Add a second case with a genuinely
  unrecognized shape (e.g. `{ obsoleteField: 'x' }`) asserting `entityFiltersFromQuery`
  throws `UnsupportedQueryError` (locks in fail-loud instead of fail-silent).
- `PostgresEntitiesDAO.spec.ts`: new small `describe('metadataValueIn filter')` block —
  fixtures with varying `metadata.<prop>` arrays, asserting `getIds`/`count` with a
  `metadataValueIn` filter matches only entities whose metadata array contains an element
  with that `value`, including a sibling-keys case (element has `value` plus other keys)
  and a multi-pair OR case.

**Verification:**
```
yarn jest app/api/search/specs/entitiesIndex.spec.ts --runInBand
yarn jest app/api/core/infrastructure/postgresql/entity/specs/PostgresEntitiesDAO.spec.ts --runInBand
npx tsc --noEmit
npx eslint app/api/search/entitiesIndex.js app/api/core/infrastructure/postgresql/entity/PostgresEntitiesDAO.ts app/api/core/infrastructure/postgresql/common/PostgresTable.ts
```

---

### Step 2 — Fix the Postgres `icon` column default to match Mongo's "no icon" shape

**File:** `app/api/core/infrastructure/postgresql/schema_migrations/005-add-entities-table.sql`

**Problem being fixed:** finding #3.

**Change:** since this migration has not shipped yet (PR still open, no tenant has run
it), edit the default in place rather than adding a follow-up migration:

```sql
"icon" JSONB NOT NULL DEFAULT '{"_id": null, "type": "Empty"}',
```

This makes an entity row inserted without an explicit `icon` read back identically to
Mongo's default (`{ _id: null, type: 'Empty' }`), instead of `{}`.

**Does the touched file have tests?**
No — SQL migration files aren't unit tested directly; they're exercised indirectly by
whichever spec runs `testingEnvironment.setUp({}, { postgres: true })`, which applies all
schema migrations against a real Postgres test DB.

**Test changes required (new assertions in existing DAO spec):**
In `app/api/core/infrastructure/postgresql/entity/specs/PostgresEntitiesDAO.spec.ts`,
add a fixture entity that omits `icon` entirely, and add an assertion (in the
`getByIdsWithDocuments()` or a new small `describe('icon defaults')` block) that the
returned row's `icon` equals `{ _id: null, type: 'Empty' }` — proving the column default,
not just the TypeScript type (`PostgresEntityRow.ts`), matches Mongo's shape.

**Verification:**
```
yarn jest app/api/core/infrastructure/postgresql/entity/specs/PostgresEntitiesDAO.spec.ts --runInBand
```
(This spec creates a fresh Postgres test DB and re-applies all schema migrations, so the
new default is exercised for real — no separate migration-runner test needed.)

---

### Step 3 — Deduplicate the `postgresEntities` flag check

**Files:** `app/api/core/infrastructure/factories/PostgresEntitiesDAOFactory.ts`,
`app/api/search/entitiesIndex.js`, `app/api/search/search.js`

**Problem being fixed:** finding #2.

**Change:** add one static method to the factory that already owns tenant/flag lookup:

```ts
// PostgresEntitiesDAOFactory.ts
static isEnabled(): boolean {
  return Boolean(ExecutionContext.currentTenant.featureFlags?.postgresEntities);
}
```

Replace `entitiesIndex.js`'s local `postgresEntitiesEnabled` (line 22) and `search.js`'s
inline `tenants.current().featureFlags?.postgresEntities` (line ~307) with calls to
`PostgresEntitiesDAOFactory.isEnabled()`. This also unifies the tenant accessor used
(`ExecutionContext.currentTenant` vs `tenants.current()` — same underlying tenant, two
different code paths reading it today).

**Does the touched file have tests? Do they cover this?**
Yes — `entitiesIndex.spec.ts`'s `(postgresEntities flag on)` block and `search.spec.ts`'s
relationship-aggregation tests already exercise both files with the flag on/off; this is
a pure refactor with no behavior change, so no new test cases are needed — just confirm
the existing suites still pass.

**Verification:**
```
yarn jest app/api/search/specs/entitiesIndex.spec.ts app/api/search/specs/search.spec.ts --runInBand
npx tsc --noEmit
```

---

### Step 4 — New parity test suite: every `indexEntities` call-site query shape, Mongo vs Postgres

**New file:** `app/api/search/specs/indexEntitiesParity.spec.ts`
(pattern: `app/api/core/application/specs/UpdateFile.spec.ts` — `describe.each` toggling
one feature flag, shared fixtures, run against both backends)

**Problem being fixed:** finding #4 — proves steps 1–3 actually achieve parity, and
guards against future regressions across every real caller shape, not just the ones
already unit-tested in isolation.

**All current call sites of `search.indexEntities`, grouped by the query shape they pass**
(confirmed via `grep -rn "indexEntities(" app/api`, excluding specs):

| Shape | Representative call sites |
|---|---|
| `{}` (full reindex) | `search.js:908` wrapper default, `elastic_testing.ts:15` |
| `{ sharedId }` | `entities.js:378,553`, `managerFunctions.ts:214`, `files.ts:53`, `sync/routes.ts:29,156` |
| `{ sharedId: { $in } }` | `TemplateUpdateDenormalizeEntitiesBatch.ts:58`, `MongoEntitiesDataSource.ts:47`, `MongoFilesDataSource.ts:55`, `PostgresFilesDataSource.ts:52`, `MongoEntityAccessPolicyDataSource.ts:36`, `entities.js:517`, `files.ts:97`, `service_factories.ts:47,246` |
| `{ _id }` / `{ _id: { $in } }` | `entities.js:582,611,674`, `sync/routes.ts:25` |
| `{ language }` | `CloneLanguageEntitiesJob.ts:52` |
| `{ $and: [...], $or: [...] }` (dynamic metadata path) | `denormalize.ts:166` — **the one shape needing the native `metadataValueIn`/JSONB support added in Step 1** |

**Test design:**
- Fixtures: multiple templates, multiple languages (`en`/`es`), several entities with
  relationship metadata pointing at each other (needed to exercise the `denormalize.ts`
  shape realistically), matching the `UpdateFile.spec.ts` structure (top-level fixtures
  object, `beforeEach` resets fixtures + sets `postgresFiles`/`postgresEntities` flags).
- `describe.each([{ name: 'Mongo', usePostgres: false }, { name: 'Postgres', usePostgres: true }])`,
  setting `testingTenants.changeCurrentTenant({ featureFlags: { postgresFiles: usePostgres, postgresEntities: usePostgres } })` per the existing dependency between the two flags.
- For each shape in the table above, call `search.indexEntities(<that query>)` directly
  (not through every intermediate caller — call the shapes, not the modules, per the
  earlier discussion) and assert, via `elasticTesting.getIndexedEntities()`, that Mongo
  and Postgres produce the **same set** of indexed entities and the **same document
  shape**.
- **Icon note (does *not* cover finding #3):** fixtures give every entity an explicit
  `icon`, so the two backends stay comparable on that field. This suite cannot exercise
  the icon-default bug either way: fixtures are inserted via raw `insertMany`
  (`testing_db.ts`) and legacy Mongo reads use `.lean()` (`odm/model.ts:217`), which skips
  schema defaults — an entity fixture that omits `icon` comes back from Mongo with **no
  `icon` key at all**, never `{}` or `{_id:null,type:'Empty'}`, while Postgres always
  returns a value for that NOT NULL column. That's a key-presence mismatch that exists
  regardless of Step 2's fix (which only changes the default's *value*), and since
  `testingEnvironment.setFixtures` derives the Postgres fixture from the same Mongo
  fixture object, the two backends can't be given diverging `icon` presence to reproduce
  the real scenario Step 2 targets. Finding #3's only real regression guard is Step 2's
  own DAO-level test, which asserts the column default directly.
- **Ordering/determinism note:** none of these calls pass a `limit` low enough to truncate
  results in the shared fixtures, so exact-array assertions (`toEqual([...])`, matching the
  existing `entitiesIndex.spec.ts` style) are safe. If a future case needs `limit`, assert
  set membership (`expect.arrayContaining`) instead, since `getByIdsWithDocuments` has no
  `ORDER BY` and truncation order is backend-dependent.
- **Flag-dependency test:** one dedicated test (not part of the `describe.each` matrix)
  asserting `PostgresEntitiesDAOFactory.default()` throws when
  `postgresEntities: true, postgresFiles: false` — covering the guard in
  `PostgresEntitiesDAOFactory.ts:11`.
- **Unsupported-shape test:** one dedicated test asserting `search.indexEntities` with an
  unrecognized query shape throws `UnsupportedQueryError` under Postgres (flag on) instead
  of silently sweeping the tenant — this replaces the earlier fallback-based design's
  "Mongo path still runs" case, since there is no Mongo path left to fall back to once the
  flag is on.

**Does a similar file already have tests? Do they cover this?**
`entitiesIndex.spec.ts` covers some shapes but only under Postgres-on, never compares
against the Mongo result for the same fixtures, and doesn't cover `denormalize.ts`'s shape
or the flag-dependency error. This new file closes both gaps; it doesn't replace
`entitiesIndex.spec.ts`, which stays focused on the Postgres path's own mechanics.

**Verification:**
```
yarn jest app/api/search/specs/indexEntitiesParity.spec.ts --runInBand
yarn jest app/api/search/specs/entitiesIndex.spec.ts app/api/search/specs/search.spec.ts --runInBand
npx tsc --noEmit
npx eslint app/api/search/specs/indexEntitiesParity.spec.ts
```

Expected outcome: written first, against today's code, this suite fails on the `$and`/`$or`
case and the `icon` shape assertion — confirming it actually catches the bugs this plan
fixes, not just that it runs. After Steps 1–3 are applied, every shape in the table
produces identical Mongo/Postgres results and the full suite goes green.
