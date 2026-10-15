# PostgreSQL blank state

The blank state is a dump/restore artifact: a golden tenant is configured through the running app,
dumped to JSON fixtures in `data/`, and those fixtures are restored when provisioning a new tenant.

The only entry point is the `uwazi` CLI (see `apps/cli/docs/blank-state.md`):

- **Restore** — `uwazi blank-state restore --tenant <name>` (add `--force` to overwrite an
  existing tenant). `PgBlankState.run()` deletes existing tenant data when forced and inserts the
  fixtures with the target `tenant_id`. It refuses to run on a non-empty tenant without `force`,
  errors when a fixture table is missing from the schema, and errors when there are no fixtures to
  restore.
- **Dump** — `uwazi blank-state dump --tenant <name>`. `PgBlankState.dump()` reads every
  blank-state table for the golden tenant and writes one `<table>.json` per non-empty table, with
  `tenant_id` stripped and Prettier-formatted.

## What gets dumped

Only the tables that constitute a blank state (`BLANK_STATE_TABLES` in `PgBlankState.ts`):

`settings`, `templates`, `thesauri`, `relationship_types`, `users`, `usergroups`, `translations`,
`pages`, `page_locales`, `page_releases`.

History and user-data tables (`updatelogs`, `syncs`, `entities`, `files`, …) are deliberately
excluded. Global tables (`tenants`, `tenants_version`, `jobs`, `pg_migrations`, `http_sessions`)
are excluded too — they have no `tenant_id`.

## Workflow

```sh
# 1. Build or edit the golden tenant through the app (UI/API/CLI).
#    In dev, this is usually the "default" tenant of uwazi_development.

# 2. Dump it to fixtures (overwrites data/*.json).
yarn uwazi blank-state dump --tenant default

# 3. Commit the regenerated fixtures. A migration that changes a dumped table's
#    columns requires re-running step 2.

# 4. Provision a new tenant: restore the Mongo blank state (Mongo-only script),
#    then restore the PostgreSQL blank state through the CLI.
database/blank_state_base.sh <new-db>
yarn uwazi blank-state restore --tenant <name>
```

## Regenerating after a schema change

The dump is schema-coupled: when a migration adds or renames a column on one of the blank-state
tables, run the dump again so the fixtures match the new schema.
