# Hand-off: `uwazi usage report` (#9782)

Uwazi now has `usage report --tenant <name> | --all-tenants`, a read-only CLI command that returns
the figures uwazi-manager computes today by reading MongoDB and Elasticsearch directly. It reads
through whichever backend each tenant uses, so the numbers stay right for tenants on PostgreSQL
(`postgresCore`) and for installations with `SESSIONS_BACKEND=postgres`.

Full contract: `apps/cli/docs/usage.md` in the uwazi repo. Output per tenant (bytes, epoch ms):

```json
{
  "entitiesCount": 120,
  "filesCount": { "document": 80, "attachment": 30, "custom": 2, "thumbnail": 80 },
  "filesByBucket": { "pdf": { "count": 80, "size": 51200000 }, "image": {...}, "video": {...},
                     "audio": {...}, "office": {...}, "text": {...}, "other": {...}, "unknown": {...} },
  "filesStorage": 53904000,
  "dbStorage": 1630784,
  "dbStorageByEngine": { "mongo": 1500000, "postgres": 130784 },
  "elasticStorage": 712489,
  "lastSession": 1759700000000
}
```

With `--all-tenants` it uses the usual `{"results":[{"tenant","data"}],"errors":[{"tenant","error"}]}`
envelope. Fields will only ever be added.

Checked locally against the manager's own MongoDB aggregations on a MongoDB tenant: the two match
on every figure (files storage, database storage, entities, files by type and by kind, index size).

---

## uwazi-operations

The command needs two settings the CLI environment does not have yet. Without them it fails fast
with `config.missing` (exit 1) in production, rather than reading the wrong store.

1. `roles/uwazi_service/templates/uwazi-cli.env.j2` (the SSH wrapper's `/etc/uwazi/cli.env`), add:
   - `ELASTICSEARCH_URL` — same value the backend service uses.
   - `ELASTICSEARCH_API_KEY` — same value the backend service uses (production/staging key).
   - `SESSIONS_BACKEND` — same value the backend service uses (`mongo` or `postgres`).
   - `TENANTS_BACKEND` — missing today too; every CLI command reads the tenant registry from it.
2. `playbooks/uwazi_cli.yml`, `_cli_environment`: the same four.
3. Re-run `playbooks/uwazi_cli_wrapper.yml` on the backends once the release that ships the
   command is deployed.

Unrelated, but found while reading: `group_vars/all` on `master` holds `S3_ACCESS_KEY_ID` and
`S3_SECRET_ACCESS_KEY` in plain text, outside the vault. Worth rotating and vaulting.

## uwazi-manager-new

Replace the direct MongoDB/Elasticsearch reads in the stats cron with one CLI call.

1. `core/infrastructure/commands/ansible/AnsibleUwaziCli.ts`: add `"usage"` to `UwaziCliGroup`.
2. `core/infrastructure/gateways/UwaziCliClient.ts`, `isUwaziCliReadCommand`: `usage report` is
   a read, so it goes over SSH like `users stats`.
3. New gateway (e.g. `AnsibleUwaziUsageGateway`): `runAllTenants("usage", "report")`, parse with
   `parseUwaziCliStdout` + `readUwaziCliTenantResults`, return usage keyed by tenant name.
4. `TenantsStatsService` / `UpdateTenantsStats`: build `Stats` from that map instead of
   `MongoUwaziGateway`, `ElasticSearchGateway` and `MongoUwaziSessionsGateway`. The manager keeps:
   - `filesCount = filesCount.document + filesCount.attachment` (the CLI returns every type).
   - `totalStorage = filesStorage`, `lastUpdated = Date.now()`.
   - `lastSession = max(stored lastSession, usage.lastSession ?? 0)` — sessions are removed after
     14 idle days, so the CLI returns `null` for long-idle tenants.
   - Tenants listed under `errors` keep their previous stats; log the error.
5. `core/ApplicationFactory.ts` `UpdateTenantsStats`: drop `MongoUwaziGateway`,
   `ElasticSearchGateway` and `MongoUwaziSessionsGateway` from its wiring.
6. `core/domain/constants/FileBuckets.ts`: `classifyMimetype` is no longer needed for stats (Uwazi
   owns the rule now); keep `FILE_BUCKETS` and `getFileBucketLabel` for the UI.
7. Optional, to keep the detail: store `dbStorageByEngine` next to `dbStorage`.

Still reading tenant data directly after this, same problem for PostgreSQL tenants:
`GetTenantDetails` → `MongoUwaziGateway.getLatestActivityLogs`, and `MongoTenantsGateway.updateStats`
writes the registry in MongoDB (the `tenants stats` CLI command does the same through
`TENANTS_BACKEND`).

### Semantics to be aware of

- `dbStorage` now adds a PostgreSQL estimate for `postgresCore` tenants (their rows' size; indexes
  not attributed), so those tenants' numbers move up after the switch. MongoDB tenants are unchanged.
- `lastSession` is accurate to a day (sessions are touched at most daily) — same as today.
- The command reads every session of the installation once per tenant; fine for the nightly cron.
