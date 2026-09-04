# Migrations

**Read this when:** you are adding or changing a migration.

## Two kinds

**Data migrations** change MongoDB documents. They live in
`app/api/migrations/migrations/<delta>-<name>/`, are numbered by an incrementing `delta`, and run in
delta order, once per tenant, tracked in the `migrations` collection.

**Schema migrations** change the PostgreSQL schema. They are plain SQL in
`app/api/core/infrastructure/postgresql/schema_migrations/NNN-name.sql`, numbered with a
zero-padded 3-digit delta.

Scaffold either with `yarn add-migration schema|data <name> <description>`. Use the generator — it
picks the next delta by reading the directory, so hand-written numbers collide.

For a data migration it writes four files:

```
migrations/<delta>-<name>/
  index.ts              the migration
  types.ts              the data shapes it works with
  specs/<delta>-<name>.spec.ts
  specs/fixtures.ts
```

**The generated migration fails on purpose.** `up()` returns a rejected promise and the spec
contains `expect(true).toBe(false)`. That is the red you start from — replace it with a real
assertion about the data before you write `up()`.

## Anatomy

```ts
export default {
  delta: 42,
  name: 'my-migration',
  description: '...',
  reindex: false,
  requiresSchema: 17,

  async up(db: Db) { ... },
};
```

- **`reindex`** — set `true` when the migration changes data that Elasticsearch indexes. Getting
  this wrong leaves search serving stale results with no error anywhere.
- **`requiresSchema`** — the Postgres schema delta this migration needs in place. The generator fills
  in the latest existing one. **This is a hard gate:** the runner walks migrations in delta order
  and stops at the first one whose `requiresSchema` exceeds the deployed schema version. Everything
  behind it in the queue stops too. Set it to the lowest schema version the migration actually
  needs, not reflexively to the newest.

## Backward compatibility

Migrations and deployments are decoupled. A migration may run while the previous version of the
application is still serving traffic, and the new version may start before every tenant has
migrated. **Both versions of the code must work against the data throughout that window.**

In practice:

- Add before you remove. A field is added and populated in one migration; the old field is dropped
  in a later one, after the code that read it is gone.
- Never rename in place — that is a drop and an add at the same instant, and there is no instant
  when both versions of the code are happy.
- Write code that tolerates both shapes while the window is open.
- Splitting one logical change across two or three migrations, shipped in different releases, is
  normal and correct here.

Once a migration has shipped, **it has run in production and its result is a fact.** Do not edit it
to fix a mistake — the tenants that already ran it will never run it again. Write another migration.

## Do not import production code

A migration works with **raw collections and its own types**. That is what `types.ts` is for.

> Never import a domain model, DataSource, DAO, service or shared schema into a migration.

The reason is that a migration is pinned to a moment in time and production code is not. A migration
must keep doing the same thing years from now, against the data as it was when the migration was
written. If it borrows a production type, a later change to that type silently changes what the
migration means — or breaks a migration that ran correctly two years ago for every tenant that has
not migrated yet. Declare the shapes you touch in `types.ts`, however duplicative that feels.

The same reasoning as `testing.md`'s rule against building assertions from production code: the
migration and the model must be able to drift apart.

## Testing

Migrations are tested. The generated spec gives you the shape:

```ts
const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};
```

Set up documents in `specs/fixtures.ts` in the _old_ shape, run `up`, assert on the raw collection
in the new shape. Cover the cases the migration must survive: documents already in the new shape,
documents missing the field entirely, and empty collections. A migration that throws part-way
through leaves a tenant half-migrated.

The generator also stubs two checks worth keeping honest: that `delta` is what you expect, and that
`reindex` is set deliberately rather than left at the default.

## Running

- `yarn migrate` — run pending migrations.
- `yarn migrate-and-reindex` — use when any pending migration sets `reindex: true`.
- `yarn reindex` — Elasticsearch only.
