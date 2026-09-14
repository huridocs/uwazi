# Migrations

**Read this when:** you are adding or changing a migration.

## Two kinds

**Data migrations** change MongoDB documents. They are numbered by an incrementing `delta` and run
in delta order, once per tenant.

**Schema migrations** change the PostgreSQL schema, and are plain SQL.

**Always scaffold with `yarn add-migration schema|data <name> <description>`.** The generator picks
the next delta by reading the directory, so hand-written numbers collide, and it puts every file
where the runner expects it.

**The generated migration fails on purpose.** `up()` rejects and the spec asserts something false.
That is the red you start from — replace it with a real assertion about the data before you write
`up()`.

Two fields on the generated migration are decisions, not boilerplate:

- **`reindex`** — set `true` when the migration changes data that Elasticsearch indexes. Getting
  this wrong leaves search serving stale results with no error anywhere.
- **`requiresSchema`** — the Postgres schema delta this migration needs in place. **This is a hard
  gate:** the runner stops at the first migration whose `requiresSchema` exceeds the deployed schema
  version, and everything behind it in the queue stops too. Set it to the lowest schema version the
  migration actually needs, not reflexively to the newest the generator offers.

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

A migration works with **raw collections and its own types**, declared alongside it.

> Never import a domain model, DataSource, DAO, service or shared schema into a migration.

The reason is that a migration is pinned to a moment in time and production code is not. A migration
must keep doing the same thing years from now, against the data as it was when the migration was
written. If it borrows a production type, a later change to that type silently changes what the
migration means — or breaks a migration that ran correctly two years ago for every tenant that has
not migrated yet. Declare the shapes you touch yourself, however duplicative that feels.

The same reasoning as `testing.md`'s rule against building assertions from production code: the
migration and the model must be able to drift apart.

## Testing

Migrations are tested, and the generated spec already has the shape — fill it in rather than
inventing one.

Set fixtures up in the _old_ shape, run `up`, assert on the raw collection in the new shape. Cover
the cases the migration must survive: documents already in the new shape, documents missing the
field entirely, and empty collections. A migration that throws part-way through leaves a tenant
half-migrated.

Keep the two generated checks honest: that `delta` is what you expect, and that `reindex` was set
deliberately rather than left at its default.

## Running

- `yarn migrate` — run pending migrations.
- `yarn migrate-and-reindex` — use when any pending migration sets `reindex: true`.
- `yarn reindex` — Elasticsearch only.
