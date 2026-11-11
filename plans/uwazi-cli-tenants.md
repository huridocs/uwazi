# Plan: Uwazi CLI — tenants archive/unarchive + list/get/delete `--archived`

PRs: **A** = `tenants list --archived` (keeps `archives list` as a deprecated alias) · **B** = `tenants get --archived` · **C** = `tenants archive` + `tenants unarchive` · **D** = `tenants delete --archived`.

## Locked decisions (do not re-open)

- **Temporary coexistence**: `archives list` stays as a deprecated alias of
  `tenants list --archived` so the manager can be switched over without a hard cutover. Once
  uwazi-manager calls the new command, the alias and the `archives` group are removed.

- **`--archived` is a boolean CLI flag**, not a `--status` value and not a `--request` field.
  `--schema` documents the `--request` only; it must not list `--archived`.
- `list` / `get` / `delete` are **active by default**; `--archived` switches them to the archived
  registry.
- **Archive/unarchive/delete follow the existing `tenants …` convention**: `tenancy: 'none'`,
  the tenant travels in the `--request` as `name`. No `--tenant`, no `--all-tenants`.
- **The archived registry stays Mongo-only for now**: rows are read and written in the
  `archives` collection of the Mongo shared database (`uwazi_shared_db`), whatever
  `TENANTS_BACKEND` selects. This is the archive playbook's existing contract and we keep it.
- **The archived record is a fixed snapshot**, not the whole tenant row. It holds exactly:
  `name, dbName, indexName, uploadedDocuments, attachments, customUploads, activityLogs`,
  full `featureFlags`, plus `status: "archived"`, `dumpLocation` (`{db, files}`) and `archivedAt`.
  `domain`, `globalMatomo`, `ciMatomoActive`, `maintenance` and operational data (`stats`,
  `healthChecks`, `metadata`) are **dropped** on archive.
- **Full `featureFlags` snapshot**: every declared flag survives the round trip, because
  `postgresCore` must come back on unarchive (the archive/unarchive guard reads it).
- `tenants archive` **does not fold `db clear`** — that stays an explicit Ansible step.
- The dump is **CLI-driven but Ansible-orchestrated**: Ansible runs `db export`, uploads to S3,
  computes the URLs, and passes them into `tenants archive` as `dumpLocation`.
- **On unarchive**, rebuild a clean active row (restore full `featureFlags`) and **drop**
  `status` / `dumpLocation` / `archivedAt` from it.
- **Archive/unarchive are PG-only**: they operate only on tenants whose
  `featureFlags.postgresCore` is `true`. Non-PG tenants are rejected (clear error, exit ≠ 0),
  because `db export` / `db clear` / `db import` are PG-only and a non-PG tenant must migrate
  first. `delete --archived` is **not** PG-gated: it only removes a registry row.

## Target surface

```sh
uwazi tenants list      [--archived]
uwazi tenants get       [--archived] --request '{"name":"<name>"}'
uwazi tenants archive   --request '{"name":"<name>","dumpLocation":{"db":"<url>","files":"<url>"}}'
uwazi tenants unarchive --request '{"name":"<name>"}'
uwazi tenants delete    [--archived] --request '{"name":"<name>"}'
```

(Original sketch used `--tenant <name>` for archive/unarchive; per the convention decision above,
`name` travels in `--request` like every other `tenants …` command.)

## Command semantics

### `tenants archive`

1. Read the active tenant (`TenantsDataSourceFactory.default().getByName(name)`) — missing → `tenant.not_found`.
2. Guard: `featureFlags.postgresCore !== true` → error (see below), nothing written.
3. Build the archived record from the snapshot fields listed above, add `status: "archived"`,
   `dumpLocation`, and `archivedAt` (server-side, epoch seconds).
4. Upsert into the Mongo `archives` collection (by `name`).
5. Delete from the active registry.

### `tenants unarchive`

1. Read the archived record (Mongo `archives`, by `name`) — missing → `tenant.not_found` (archived scope).
2. Rebuild a clean active row: snapshot fields + full `featureFlags`, no `status` / `dumpLocation` / `archivedAt`.
3. Register into the active registry (upsert by `name`).
4. Delete from the Mongo `archives` collection.

PG-only guard error: propose code `tenant.not_postgres` (category `rule_violation`, exit 5),
message naming the tenant and the missing flag.

## Background (Ansible orchestration)

- **Archive:** `backup (db export → S3)` → `LB archive flag` → `tenants archive` → `db clear` → `ES DELETE` → `remove live backups`.
- **Unarchive:** `restore (db import)` → `tenants unarchive` → `ES PUT + reindex` → `LB unarchive flag`.
- `dumpLocation` exists today on archived rows (`{db, files}`). On unarchive the DB restore is
  deterministic (recompute `<tenant>_db.zip`), so the CLI need not return it — but
  `tenants get --archived` still exposes it for audit.
- Verified on staging: the archived registry holds 12 records, identical whether read via
  `uwazi-cli archives list` or Mongo `uwazi_shared_db.archives` (names, `_id`, `archivedAt`,
  `status` all match).

---

## PR A — `tenants list --archived`, keep `archives list` as a deprecated alias

Adds the `--archived` switch on `tenants list`. The `archives` group stays for now as a
compatibility alias, sharing the same query service, and is removed once the manager switches.
No `app/api` changes.

### Scope

- **Add** `--archived` to `tenants list`.
  - No flag → active registry (`TenantsDataSourceFactory.default().all()`), sorted by name, as today.
  - `--archived` → Mongo `archives` collection, newest `archivedAt` first, ties by name (today's
    `ArchivedTenantsQueryService` behaviour).
- **Keep** `archives list`, marked deprecated, delegating to the same query service.

### Files

- `apps/cli/tenants/archived/ArchivedTenantsQueryService.ts` — moved from `apps/cli/archives/`, unchanged behaviour.
- `apps/cli/tenants/archived/ArchivedTenantsQueryServiceFactory.ts` — moved, unchanged.
- `apps/cli/tenants/archived/specs/ArchivedTenantsQueryService.spec.ts` — moved.
- `apps/cli/tenants/routes/ListTenantsRoute.ts` — add `--archived` (`options` + `requestFromFlags`).
- `apps/cli/tenants/controllers/ListTenantsController.ts` — take `archived` and pick the source.
- `apps/cli/tenants/controllers/specs/ListTenantsController.spec.ts` — cover both scopes.
- `apps/cli/tenants/routes/specs/TenantsRoutes.spec.ts` — cover the flag (active default, `--archived`).
- `apps/cli/archives/**` — keep as a deprecated alias; `ListArchivesController` imports the moved query service.
- `apps/cli/routing/RouteRegistry.ts` — keep `ArchivesRoutes` registered.
- `apps/cli/docs/tenants.md`, `apps/cli/docs/archives.md`, `apps/cli/README.md` — document
  `list --archived` and mark `archives list` deprecated.

### Framework note

`--archived` is the first route flag that is not a `--request` field. Implement it so the
`--request` schema stays strict (rejects `archived`) while the flag still reaches the controller.
If the existing `Route.options` + `requestFromFlags` split cannot express that cleanly
(`request` schema is also what `--schema` prints and what parses the merged input), make the
minimal backwards-compatible extension to `Route` / `CliApplication` (e.g. an optional input
schema for the combined flags+request), with a spec.

### Test / verify

- `yarn test apps/cli/tenants apps/cli/archives`.
- `yarn test apps/cli/specs/smoke.spec.ts`.
- `yarn check-types`, `yarn lint --type-aware apps/cli`, `yarn prettier` on touched files.

---

## PR B — `tenants get --archived`

- `--archived` on `tenants get`: archived registry lookup by `name` (Mongo `archives`), active
  lookup unchanged. Missing in the selected scope → `tenant.not_found` (exit 3).
- Reuse the `--archived` plumbing from PR A (extract the shared bits if PR A left them inline).
- Files: `apps/cli/tenants/routes/GetTenantRoute.ts`, `apps/cli/tenants/controllers/GetTenantController.ts`
  (+ specs), `apps/cli/docs/tenants.md`.
- Test / verify as PR A.

---

## PR C — `tenants archive` + `tenants unarchive`

The write path. New CLI routes and controllers that build/rebuild the snapshot row and move it
between the active registry and the Mongo `archives` collection. No new `app/api` domain
necessarily — the CLI already owns the archived registry (see PR A), so these controllers can
orchestrate `TenantsDataSourceFactory` + `ArchivedTenantsQueryService` (extended with
`getByName`, `upsert`, `delete`) directly.

### Scope

- **`tenants archive`** per the semantics above, including the `postgresCore` guard and
  `archivedAt` written server-side (epoch seconds).
- **`tenants unarchive`** per the semantics above, dropping archive-only fields.
- Extend the archived query service with `getByName` / `upsert` / `delete` (Mongo `archives`).
- Contracts: `tenants archive` request schema (`name`, `dumpLocation {db,files}`), outputs as the
  resulting row; `tenants unarchive` request schema (`name`).
- Docs: `apps/cli/docs/tenants.md`, `apps/cli/README.md`.

### Test / verify

- Controller specs for both commands: happy path, missing tenant, non-PG guard rejection,
  full `featureFlags` round-trip, archive-only fields dropped on unarchive, idempotency of the
  upserts.
- Route specs for validation (`dumpLocation` shape, unknown fields rejected).
- `yarn check-types`, `yarn lint --type-aware apps/cli`, `yarn prettier`.

---

## PR D — `tenants delete --archived`

- `--archived` on `tenants delete`: delete the row from Mongo `archives` instead of the active
  registry; missing → `tenant.not_found`. Active `tenants delete` unchanged.
- Not PG-gated: it only removes a registry row.
- Files: `apps/cli/tenants/routes/DeleteTenantRoute.ts`, `apps/cli/tenants/controllers/DeleteTenantController.ts`
  (+ specs), `apps/cli/docs/tenants.md`.
- Test / verify as PR A.

---

## Notes / follow-ups

- Keeping the archived registry Mongo-only means archive/unarchive work even while the active
  registry is on Postgres (`TENANTS_BACKEND=postgres`): the archived row always goes to Mongo
  `archives`. Revisit only if/when the archive playbook itself moves to Postgres.
- `apps/cli/README.md` currently names `archives …` in the tenancy section; PR A must update that
  along with the module table.
- The dangling `plans/uwazi-cli-tenants.md` reference in
  `app/api/tenants/application/DeregisterTenant.ts` now resolves to this file.
