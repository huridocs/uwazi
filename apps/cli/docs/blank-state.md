# blank-state

Dump and restore the PostgreSQL blank state: the tenant data a freshly provisioned tenant starts
from. A golden tenant is configured through the app, dumped to a single committed dump file, and
that file is restored into each new tenant. The dump is the same portable stream `tenants export`
produces (a manifest line followed by one `COPY` section per tenant data table), so `blank-state`
shares the tenant backup engine. Shared options, output and exit codes are in the
[README](../README.md).

| Command               | Does                                                  |
| --------------------- | ----------------------------------------------------- |
| `blank-state dump`    | Writes the tenant's PostgreSQL data to the dump file  |
| `blank-state restore` | Restores the dump file into a tenant                  |

These commands run against PostgreSQL only: no Mongo blank state is read or written. They need
the admin/migrator credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`) in addition to the usual
environment, because they write through the pool that bypasses row-level security.

## blank-state dump

```sh
yarn uwazi blank-state dump --tenant default
```

Exports every tenant data table of the tenant — the same tables `tenants export` moves — and
overwrites the committed dump file in the blank-state data directory. Tables with no rows still
appear in the dump (as empty sections), because the dump is a full backup stream, not a filtered
set of fixture files.

Prints the tables that were exported, sorted:

```json
{ "tables": ["activitylogs", "settings", "templates", "users", "..."] }
```

This is how the shipped dump is regenerated after configuring the golden tenant or after a schema
migration changes the tenant schema.

## blank-state restore

```sh
yarn uwazi blank-state restore --tenant acme
# overwrite an existing tenant:
yarn uwazi blank-state restore --tenant acme --force
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

| Code                                     | Exit | When                                                              |
| ---------------------------------------- | ---- | ----------------------------------------------------------------- |
| `tenant.not_found`                       | 3    | The tenant is not registered                                      |
| `blank_state.empty`                      | 3    | There is no dump file to restore                                  |
| `tenant_backup.not_postgres`             | 4    | The tenant is not running on Postgres                             |
| `tenant_backup.unknown_table`            | 2    | A table in the dump does not exist in the schema                  |
| `tenant_backup.malformed_manifest`       | 2    | The dump's manifest cannot be parsed, or a table's columns don't match the schema |
| `tenant_backup.schema_version_mismatch`  | 2    | The dump's schema version differs from this database's            |
| `tenant_backup.premature_end`            | 2    | The dump ended before a table's COPY section was complete         |
| `tenant_backup.tenant_has_data`         | 4    | The tenant already has data and `force` was not set               |

Every command can also return the shared codes: `validation.failed` and `usage.invalid` (exit 2),
`config.missing` and `unexpected` (exit 1).
