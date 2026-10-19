# Migrations

**Read this when:** you are adding or changing a migration.

## Three kinds

**Postgres schema migrations** change the structure of the PostgreSQL database — tables, columns,
indexes, constraints. They are plain SQL.

**Postgres data migrations** change rows. They are TypeScript, live in the same numbered sequence as
the schema migrations, and **run once for the whole database** — every tenant's rows at once, not
once per tenant.

**Mongo data migrations** change MongoDB documents and run once per tenant. They are being phased out
with MongoDB. Write one only when the fix must also reach tenants that have not moved to Postgres
yet. Each declares `requiresSchema`, the lowest Postgres schema version it needs: the runner stops at
the first Mongo migration whose requirement is not deployed, and everything behind it waits — set it
to what the migration actually needs, not to the newest version on offer.

A fix that has to land in both databases is **two migrations**, one of each kind. They do not share
code.

**Always scaffold with `yarn add-migration`.** The generator picks the next number by reading the
directory, so hand-written numbers collide, and it puts every file where the runner expects it.

**The generated spec fails on purpose** — it asserts something false. That is the red you start
from: replace it with a real assertion about the data before you write the migration. A generated
Mongo migration also rejects; a generated Postgres data migration does nothing instead, because every
test database runs the whole Postgres sequence and a rejecting one would break every Postgres spec.

**`reindex`** is a decision, not boilerplate: set it when the migration changes data that
Elasticsearch indexes. Getting it wrong leaves search serving stale results with no error anywhere.

## A Postgres data migration owns its execution

The runner hands the migration a database connection and little else. **It opens no transaction and
applies no tenant scoping.** How the work is cut up is the author's decision:

- A small fix can be one statement or one transaction.
- A large backfill commits in batches — per tenant, or by key range — so no single transaction holds
  locks for long.

The runner records the migration as applied **only after it returns**. A migration that fails part
way leaves the batches it committed in place and runs again from the start next time. So **every
Postgres data migration must be safe to run twice**: select only the rows still in the old shape,
and make each write a no-op on rows already converted.

Long migrations report progress through the heartbeat the runner provides, or the job running them is
taken for dead and started again elsewhere. A migration that changes indexed data reports which
tenants it touched, derived from the rows it changed, so only those are reindexed.

## Writing for a database every tenant shares

All tenants live in the same tables, separated by `tenant_id`. Migrations run as the table owner, so
**row-level security does not apply** — nothing in the database stops one tenant's rows from mixing
with another's.

- **Every join and subquery matches on `tenant_id` as well as on the key.** Keys are unique per
  tenant, not globally; a join on `_id` alone pairs rows from different tenants.
- **Never change the schema and backfill in the same transaction.** DDL holds an exclusive lock on
  the table until commit, so a backfill inside it locks the table for its whole duration. Add the
  new shape in a schema migration, backfill in a data migration, remove the old shape in a later
  release.
- **Keep transactions short on large tables.** A long transaction holds row locks against live
  traffic, stops vacuum across the whole database, and loses all its work on one failure. Set a lock
  timeout and a statement timeout, so a migration that collides with traffic fails fast instead of
  stalling the application.
- **Changing one key of a JSONB value rewrites the whole value.** Large JSONB backfills are expensive
  in time and in dead rows; batch them.
- **It must be a fast no-op on an empty database.** Fresh installs and every test database run the
  whole sequence.

## Raw writes skip the application

A migration writes straight to tables. Nothing the application does around a write happens:
Elasticsearch is not updated, sync update logs are not written so remote instances never see the
change, denormalized copies of the value elsewhere are not refreshed, and nothing reaches the
activity log. Decide which of these matter for the change, and either handle them in the migration
or request a reindex. This applies to Mongo migrations too.

## Backward compatibility

Migrations and deployments are decoupled. A migration may run while the previous version of the
application is still serving traffic, and the new version may start before the migration finishes.
**Both versions of the code must work against the data throughout that window.**

In practice:

- Add before you remove. A field is added and populated in one migration; the old field is dropped
  in a later one, after the code that read it is gone.
- Never rename in place — that is a drop and an add at the same instant, and there is no instant
  when both versions of the code are happy.
- Write code that tolerates both shapes while the window is open, including a table that is half
  backfilled.
- Splitting one logical change across two or three migrations, shipped in different releases, is
  normal and correct here.

Migrations only go forward. Rolling the code back does not roll the data back, so the previous
version of the code must cope with what the migration produced.

Once a migration has shipped, **it has run in production and its result is a fact.** Do not edit it
to fix a mistake — the environments that already ran it will never run it again. Write another
migration.

## Do not import production code

A migration works with **raw tables and collections and its own types**, declared alongside it.

> Never import a domain model, DataSource, DAO, service, table helper or shared schema into a
> migration.

The reason is that a migration is pinned to a moment in time and production code is not. A migration
must keep doing the same thing years from now, against the data as it was when the migration was
written. If it borrows a production type, a later change to that type silently changes what the
migration means — or breaks a migration that ran correctly two years ago for every environment that
has not run it yet. Declare the tables, columns and shapes you touch yourself, however duplicative
that feels.

The same reasoning as `testing.md`'s rule against building assertions from production code: the
migration and the model must be able to drift apart.

## Testing

Migrations are tested, and the generated spec already has the shape — fill it in rather than
inventing one.

Set fixtures up in the _old_ shape, run the migration, assert on the raw table or collection in the
new shape. Cover the cases the migration must survive:

- rows already in the new shape, rows missing the field entirely, and an empty table;
- **at least two tenants** for a Postgres migration, asserting each ends up right and neither
  receives the other's data;
- **running it twice** gives the same result as running it once.

Keep the generated checks honest: that the number is what you expect, and that `reindex` was set
deliberately rather than left at its default.

A Postgres data migration over a large table is run against a production-sized copy of the data
before it ships, and its duration noted. Timing is what decides whether it needs batching — not a
guess.

## Running

- `yarn migrate --new` — run pending migrations of all three kinds, through the migration job, which
  reindexes the tenants that need it. Add `--async` to queue the job instead of running it inline.
- `yarn migrate` — the legacy runner: Mongo data migrations only, never Postgres ones.
- `yarn migrate --status` — list what is pending in both databases; applies nothing.
- `yarn migrate-and-reindex` — the legacy runner, then a full reindex.
- `yarn reindex` — Elasticsearch only.

Long migrations run through the asynchronous migration job, not inline in a deploy.
