# blank-state

Dump and restore the PostgreSQL blank state: the set of tenant tables a freshly provisioned
tenant starts from. A golden tenant is configured through the app, dumped to fixture files, and
those fixtures are restored into each new tenant. Shared options, output and exit codes are in
the [README](../README.md).

| Command               | Does                                                        |
| --------------------- | ----------------------------------------------------------- |
| `blank-state dump`    | Writes the tenant's blank-state tables to the fixture files |
| `blank-state restore` | Restores the fixture files into a tenant                    |

These commands run against PostgreSQL only: no Mongo blank state is read or written. They need
the admin/migrator credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`) in addition to the usual
environment, because they write through the pool that bypasses row-level security.

## blank-state dump

```sh
yarn uwazi blank-state dump --tenant default
```

Reads every blank-state table of the tenant and overwrites the committed fixture files (one JSON
file per non-empty table) in the blank-state data directory. Empty tables are skipped, so a table
with no rows produces no file.

Prints the tables that were written, sorted:

```json
{ "tables": ["settings", "templates", "translations", "users"] }
```

This is how the shipped fixtures are regenerated after configuring the golden tenant or after a
schema migration changes a blank-state table. `dump` uses Prettier to format the fixtures, and
Prettier is a development dependency: run it from the source tree (or an environment with dev
dependencies installed). `restore` does not need it and is the production path.

## blank-state restore

```sh
yarn uwazi blank-state restore --tenant acme
# overwrite an existing tenant:
yarn uwazi blank-state restore --tenant acme --force
```

Restores the fixture files into the tenant. This is the PostgreSQL side of provisioning — the
Mongo blank state is handled separately by `database/blank_state_base.sh`, which is Mongo-only:

- **An empty tenant** gets the fixtures as-is.
- **A tenant that already has data** fails with `blank_state.tenant_data_exists` (exit 4), so a
  live tenant is never silently overwritten.
- **No fixtures to restore** fails with `blank_state.empty` (exit 3), so an empty blank state is
  never reported as `restored`.
- **A fixture table missing from the schema** fails with `blank_state.tables_missing` (exit 3),
  telling you to run the schema migrations.
- **With `--force`** (equivalent to `--request '{"force":true}'`) the tenant's blank-state tables
  are deleted first and the fixtures are restored, atomically. This is destructive: use it only on
  a tenant you mean to reset.

`restore` does not create tables: it assumes the schema already exists. On a fresh database, run
the schema migrations first (e.g. `yarn migrate --new`), which creates the tenant tables before
`restore` inserts into them.

Prints:

```json
{ "restored": true }
```

| Code                             | Exit | When                                                |
| -------------------------------- | ---- | --------------------------------------------------- |
| `tenant.not_found`               | 3    | The tenant is not registered                        |
| `blank_state.empty`              | 3    | There are no fixtures to restore                    |
| `blank_state.tables_missing`     | 3    | A fixture table does not exist in the schema        |
| `blank_state.tenant_data_exists` | 4    | The tenant already has data and `force` was not set |

Every command can also return the shared codes: `validation.failed` and `usage.invalid` (exit 2),
`config.missing` and `unexpected` (exit 1).
