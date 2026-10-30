# db

Operate on one tenant's PostgreSQL data: clear it, export it to a portable backup stream, import
a backup stream into it, and dump or restore the blank state a freshly provisioned tenant starts
from. Shared options, output and exit codes are in the [README](../README.md).

| Command                  | Does                                                 |
| ------------------------ | ---------------------------------------------------- |
| `db clear`               | Deletes every row of a tenant's PostgreSQL data      |
| `db export`              | Streams a tenant's PostgreSQL data to stdout         |
| `db import`              | Loads a backup stream from stdin into a tenant       |
| `db blank-state dump`    | Writes the tenant's PostgreSQL data to the dump file |
| `db blank-state restore` | Restores the dump file into a tenant                 |

These commands run in one tenant, so they take `--tenant`. They write through the
admin/migrator pool (which bypasses row-level security), and therefore need `POSTGRES_USER` and
`POSTGRES_PASSWORD` in addition to the usual environment. They fail with
`tenant_backup.not_postgres` (exit 4) when the tenant is not running on Postgres. They never
touch the registry row, and they only move PostgreSQL rows — files stored on disk or S3 and the
Elasticsearch index are not part of the backup.

The dump and the backup stream share one portable format: a manifest line (source tenant, schema
version and tables) followed by one `COPY` text section per tenant data table.

## db clear

```sh
yarn uwazi db clear --tenant acme
```

Deletes every PostgreSQL row of the tenant, across every tenant-scoped table (in-flight
operation state and the jobs queue included), leaving the registry row untouched. Idempotent:
a second run deletes 0 rows.

Prints:

```json
{ "tables": ["activitylogs", "entities", "files"], "deletedRows": 123 }
```

`tables` is every tenant-scoped table touched, sorted; `deletedRows` is the total rows deleted.

`clear` deletes PostgreSQL rows, then reindexes the now-empty tenant so Elasticsearch drops the
deleted documents (the reindex deletes and recreates the tenant's index from PostgreSQL).

## db export

```sh
yarn uwazi db export --tenant acme > acme.uwazidump
```

Streams the tenant's PostgreSQL data to stdout as one portable backup: a manifest line (source
tenant, schema version and tables) followed by one `COPY` text section per table, snapshot-
consistent within a repeatable-read transaction. Nothing else is written to stdout, so
redirecting captures the stream exactly. Progress goes to stderr, and only when it is a
terminal: piping the output silences it, so `export | import` stays clean.

Every tenant-scoped table is exported — in-flight operation state (`csv_imports*`,
`px_entities_status`) and the jobs queue included — except the ephemeral `captchas` and
`password_recoveries`. Files stored on disk or S3 are not part of the stream.

Prints nothing: stdout carries the stream only, so there is no result JSON.

## db import

```sh
yarn uwazi db import --tenant acme < acme.uwazidump
# wipe the tenant first, to retry a failed import in place:
yarn uwazi db import --tenant acme --clear < acme.uwazidump
# clear the sync configuration (a cross-tenant restore must not inherit the source's):
yarn uwazi db import --tenant acme --null-sync < acme.uwazidump
```

Reads an export stream from stdin and loads it into the tenant, rewriting every row's
`tenant_id` to the destination, retargeting imported jobs to it, and reindexing it afterwards.
The import is all-or-nothing: a failing table rolls back the whole import.

- `--clear` deletes the tenant's rows before loading, so a failed import can be retried in
  place without a separate `db clear`.
- `--null-sync` clears `settings.sync`; by default it is preserved, which is what a same-tenant
  restore wants.

The stream is checked before any data is loaded: its schema version must match the database's,
and every table it names must be a known tenant data table whose columns match the schema.

Prints:

```json
{ "sourceTenant": "acme", "tables": ["activitylogs"], "rows": 123 }
```

`sourceTenant` is the tenant the stream was exported from; `tables` the tables loaded; `rows`
the total COPY row count.

| Code                                    | Exit | When                                                                                            |
| --------------------------------------- | ---- | ----------------------------------------------------------------------------------------------- |
| `tenant_backup.malformed_manifest`      | 2    | The stream is empty, its manifest cannot be parsed, or a table's columns don't match the schema |
| `tenant_backup.schema_version_mismatch` | 2    | The stream's schema version differs from this database's                                        |
| `tenant_backup.unknown_table`           | 2    | The manifest names a table that is not a known tenant data table                                |
| `tenant_backup.premature_end`           | 2    | The stream ended before a table's COPY section was complete                                     |

## db blank-state

Dump and restore the PostgreSQL blank state: the tenant data a freshly provisioned tenant starts
from. A golden tenant is configured through the app, dumped to a single committed dump file, and
that file is restored into each new tenant. The dump is the same portable stream `db export`
produces, so `db blank-state` shares the tenant backup engine.

These commands run against PostgreSQL only: no Mongo blank state is read or written.

### db blank-state dump

```sh
yarn uwazi db blank-state dump --tenant default
```

Exports every tenant data table of the tenant — the same tables `db export` moves — and
overwrites the committed dump file in the blank-state data directory. Tables with no rows still
appear in the dump (as empty sections), because the dump is a full backup stream, not a filtered
set of fixture files.

Prints the tables that were exported, sorted:

```json
{ "tables": ["activitylogs", "settings", "templates", "users", "..."] }
```

This is how the shipped dump is regenerated after configuring the golden tenant or after a schema
migration changes the tenant schema.

### db blank-state restore

```sh
yarn uwazi db blank-state restore --tenant acme
# overwrite an existing tenant:
yarn uwazi db blank-state restore --tenant acme --force
```

Reads the committed dump file and loads it into the tenant, rewriting every row's `tenant_id` to
it and reindexing it afterwards. This is the PostgreSQL side of provisioning — the Mongo blank
state is handled separately by `database/blank_state_base.sh`, which is Mongo-only:

- **An empty tenant** gets the dump as-is.
- **A tenant that already has data** fails with `tenant_backup.tenant_has_data` (exit 4), so a
  live tenant is never silently overwritten.
- **No dump file** fails with `blank_state.empty` (exit 3), so an empty blank state is never
  reported as `restored`.
- **A dump table missing from the schema** fails with `tenant_backup.unknown_table` (exit 2),
  telling you to run the schema migrations.
- **With `--force`** the tenant's PostgreSQL data is deleted first, then the dump is restored.
  The delete and the restore are separate transactions, so a failed restore leaves the tenant
  empty rather than half-restored — it can be retried. This is destructive: use it only on a
  tenant you mean to reset.

`restore` does not create tables: it assumes the schema already exists. On a fresh database, run
the schema migrations first (e.g. `yarn migrate --new`), which creates the tenant tables before
`restore` inserts into them. The dump's schema version must match the database's, so a dump is
only ever restored into a database at the schema it was exported from.

Prints:

```json
{ "restored": true }
```

| Code                                    | Exit | When                                                                              |
| --------------------------------------- | ---- | --------------------------------------------------------------------------------- |
| `tenant.not_found`                      | 3    | The tenant is not registered                                                      |
| `blank_state.empty`                     | 3    | There is no dump file to restore                                                  |
| `tenant_backup.not_postgres`            | 4    | The tenant is not running on Postgres                                             |
| `tenant_backup.unknown_table`           | 2    | A table in the dump does not exist in the schema                                  |
| `tenant_backup.malformed_manifest`      | 2    | The dump's manifest cannot be parsed, or a table's columns don't match the schema |
| `tenant_backup.schema_version_mismatch` | 2    | The dump's schema version differs from this database's                            |
| `tenant_backup.premature_end`           | 2    | The dump ended before a table's COPY section was complete                         |
| `tenant_backup.tenant_has_data`         | 4    | The tenant already has data and `force` was not set                               |

Every command can also return the shared codes: `validation.failed` and `usage.invalid` (exit 2),
`config.missing` and `unexpected` (exit 1).
