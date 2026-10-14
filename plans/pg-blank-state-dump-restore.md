# Plan: PostgreSQL blank state as a dump/restore artifact

## Goal

Replace the hand-authored PG blank-state fixtures with a **dump/restore** workflow: maintain a
golden tenant in Postgres, configure it through the running app, dump it to JSON fixtures, and
restore those fixtures when provisioning a new tenant. This removes the need to orchestrate
domain creation flows from a seed program.

## Status

The seed-program approach (`SeedTenantBlankState` + `uwazi provision blank-state`) has been
**stashed** (`git stash` entry `seed-program approach: SeedTenantBlankState + provision blank-state CLI`).
This plan implements the dump/restore strategy instead. The restore half already exists and stays
unchanged; the dump half is new.

## Locked decisions (do not re-open)

- **Restore is already done and unchanged**: `PgBlankState.run()` (`app/api/infrastructure/blank_state/PgBlankState.ts`),
  `runPgBlankState.ts`, and `database/blank_state_base.sh` keep working as-is. They are tenant-aware
  (`DELETE ... WHERE tenant_id = $1` + `INSERT` with target `tenant_id`, admin pool bypassing RLS).
- **Dump is a new method on the same class**, not a separate subsystem: `PgBlankState.dump()`.
  A new script `dumpPgBlankState.ts` sits next to `runPgBlankState.ts`.
- **Dump format is exactly what restore consumes**: one `<table>.json` per tenant-scoped table,
  a JSON array of full row objects. `tenant_id` is **stripped** from dumped rows (restore re-adds
  it), keeping fixtures tenant-agnostic and diffable.
- **`tenant_id` is never written into a fixture**. The restore already does
  `{ ...row, tenant_id: target }`, so stripping is safe.
- **Use `row_to_json(t)` for extraction**, not `SELECT *`: it renders column names exactly as the
  table defines them (quoted camelCase like `commonProperties`, `entityViewPage`), renders JSONB as
  nested JSON, and BIGINT as JSON numbers — no `pg.types` int8-parser drift, no double encoding.
- **Skip empty tables**: no file is written for a table with zero rows (restore already skips
  missing files and empty arrays).
- **Whitelist, not full-dump**: `dump()` only writes the tables that constitute a blank state —
  `settings`, `templates`, `thesauri`, `relationship_types`, `users`, `usergroups`, `translations`,
  `pages`, `page_locales`, `page_releases` (`BLANK_STATE_TABLES` in `PgBlankState.ts`). History and
  user-data tables (`updatelogs`, `syncs`, `entities`, `files`, …) are excluded so a fresh tenant is
  never seeded with change-log or document data.
- **Deterministic output for reviewable diffs**: rows sorted by `_id` (all tenant tables have one),
  falling back to a full-row JSON stringify. `JSON.stringify(rows, null, 2)` for the file, then the
  dump script post-formats each file with Prettier (JSON parser) so committed fixtures stay
  Prettier-clean under `yarn prettier --check`.
- **Admin pool for dump too** (`PostgresDB.adminPool()`), same RLS-bypass rationale as restore.
- **Table discovery is shared** between dump and restore: the existing `getTenantTables()` query
  (public tables with a `tenant_id` column, excluding `pg_migrations`) is reused verbatim.
- **Global tables are never touched**: `jobs`, `http_sessions`, `tenants`, `tenants_version`,
  `pg_migrations` have no `tenant_id` and are excluded by discovery.
- **The golden tenant is produced by the app**, not by a seed program: register/configure a tenant
  through the UI or existing CLI (`tenants register`, `settings update`, `users create`), then dump.
- **The seed program stays stashed** for now; a later decision drops or re-purposes it (see open
  questions).

## Known trade-off

The dump is schema-coupled: a migration that adds/renames a column on a dumped table requires
regenerating the fixtures. The dump script exists precisely to make that a one-liner. The committed
fixtures are the artifact; the golden tenant is the source.

## Step 1 — Add `PgBlankState.dump()`

**Files:** `app/api/infrastructure/blank_state/PgBlankState.ts`, `app/api/infrastructure/blank_state/specs/PgBlankState.spec.ts`

**Skeleton:**
```ts
// PgBlankState.ts — new public method, alongside run()
async dump(): Promise<string[]> {
  const tables = (await this.getTenantTables()).filter(t => BLANK_STATE_TABLES.has(t));
  await Promise.all(tables.map(async table => {
    const result = await this.pool.query<{ row: Record<string, unknown> }>(
      `SELECT row_to_json(t) AS row FROM "${escapeIdentifier(table)}" t WHERE tenant_id = $1`,
      [this.tenantId]
    );
    if (result.rows.length === 0) return;
    const rows = result.rows
      .map(({ row }) => row)
      .map(({ tenant_id: _tenantId, ...rest }) => rest)
      .sort((a, b) => String(a._id ?? '').localeCompare(String(b._id ?? '')) || JSON.stringify(a).localeCompare(JSON.stringify(b)));
    writeFileSync(path.join(this.dataDir, `${table}.json`), `${JSON.stringify(rows, null, 2)}\n`);
    written.push(table);
  }));
  return written.sort();
}
```

**Do:**
- Keep `run()`, `tenantDataExists()`, `getTenantTables()`, `restoreFixtures()` untouched.
- `dump()` writes fixtures to the same `dataDir` the restore reads (constructor param).
- `tenant_id` is destructured out; everything else is written as-is.
- Empty tables: skip (no file). Return the list of written tables for the script's log line.
- No `eslint-disable`; keep `no-await-in-loop` satisfied with `ArrayUtils.sequentialFor` or keep
  the loop but confirm the rule allows it in this file (it already has `/* eslint-disable no-await-in-loop */`
  scoped to methods — mirror that scoping only if genuinely needed).

**Test:** dump specs in `app/api/infrastructure/blank_state/specs/PgBlankStateDump.spec.ts`
(split out so the original `PgBlankState.spec.ts` stays focused on restore):
- Insert known rows into `templates` (with JSONB `properties`/`commonProperties`), `settings`
  (JSONB `languages`), `users`, and `translations` for `TENANT_A`.
- `dump()` → assert `templates.json`/`settings.json`/`users.json`/`translations.json` exist,
  contain no `tenant_id`, JSONB values are nested objects, rows ordered by `_id`.
- History table (`updatelogs`) → assert **no** `updatelogs.json` written (whitelist).
- Restore the dump into `fresh-tenant` via a new `PgBlankState(pool, 'fresh-tenant', dataDir).run()`
  → assert `fresh-tenant` rows match the dumped content.
- Run `yarn test app/api/infrastructure/blank_state/specs`.

## Step 2 — `dumpPgBlankState.ts` script

**Files:** `app/api/infrastructure/blank_state/dumpPgBlankState.ts`

**Skeleton:** mirror of `runPgBlankState.ts`
```ts
const DATA_DIR = path.join(__dirname, 'data');
// args: <tenant_id>  (no --force needed)
await new PgBlankState(PostgresDB.adminPool(), tenantId, DATA_DIR).dump();
process.stdout.write(`Dumped ${tables.length} tables for tenant '${tenantId}'.\n`);
```

**Do:**
- Same arg handling and exit codes as `runPgBlankState` (`1` usage/error, no conflict path).
- `PostgresDB.disconnect()` in `finally`.

**Test:** none beyond the class spec; smoke-run via `yarn` against a local tenant is manual (Step 5).

## Step 3 — Regenerate committed fixtures from a golden tenant

**Files:** `app/api/infrastructure/blank_state/data/*.json` (replace `templates.json` + `thesauri.json`, add others)

**Do:**
- Document the golden-tenant recipe in a data-dir README: configure a tenant through the UI/API
  (Document template, settings, admin user), then `database/dump_pg_blank_state.sh <tenant>`.
- **Done**: fixtures regenerated from the local `default` tenant (`uwazi_development`). Result:
  `settings.json` (1), `templates.json` (1), `translations.json` (1642), `users.json` (2); the
  hand-authored `templates.json`/`thesauri.json` are gone (empty tables are skipped).

**Test:** `yarn check-types`, `yarn lint --type-aware app/api/infrastructure/blank_state`, and
Step 1's round-trip spec still passes against the regenerated fixtures.

## Step 4 — Wire into `database/` scripts and docs

**Files:** `database/dump_pg_blank_state.sh` (new), `database/blank_state_base.sh` (unchanged),
`apps/cli/README.md` note (only if a CLI entry is desired — see open questions)

**Do:**
- **Done**: `database/dump_pg_blank_state.sh <tenant>` invokes the dump via `scripts/runner.js`.
- Keep `blank_state_base.sh` unchanged (it already runs `runPgBlankState` after `mongorestore`).

**Test:** shell syntax check (`bash -n`), and manual dump+restore smoke (Step 5).

## Step 5 — End-to-end verification

- Round-trip spec green (Step 1).
- Manual smoke: dump a golden tenant → restore into a fresh tenant → compare row counts per table.
- `yarn check-types`, `yarn lint --type-aware <scope>`, `yarn prettier --write <scope>` on touched files.

## Workflow (after this lands)

```
# 1. One-time / occasional: build or edit the golden tenant through the app
yarn uwazi tenants register --request '{"name":"default","featureFlags":{"postgresCore":true}}'
# ... configure template/settings/users via UI or CLI ...

# 2. Dump it to fixtures
database/dump_pg_blank_state.sh default

# 3. Provision a new tenant (existing flow)
database/blank_state_base.sh <new-db>
```

## Open questions

1. **`tenant_id` in dump**: strip (locked) vs keep as `__TENANT_ID__` sentinel. Locked: strip.
2. **Golden tenant bootstrap**: manual app/UI config (locked per request) — confirm no bootstrap
   script is wanted for reproducibility.
3. **Fate of the stashed seed program**: keep stashed, drop it, or recover `provision blank-state`
   later as a convenience. Default: keep stashed, revisit after this lands.
