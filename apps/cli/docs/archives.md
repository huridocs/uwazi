# archives

> **Deprecated.** `archives list` is an alias of `tenants list --archived` and will be removed
> once the manager has switched over. Prefer `tenants list --archived`; see
> [tenants](tenants.md).

Reads the tenants that have been archived. A read for operators and the tools that manage
instances; nothing in Uwazi depends on it. Shared options, output and exit codes are in the
[README](../README.md).

| Command         | Tenancy | Does                                                |
| --------------- | ------- | --------------------------------------------------- |
| `archives list` | none    | Lists the archived tenants, as stored, newest first |

`tenants archive` writes these rows: it copies the tenant's row from the registry into the
archived registry (Mongo `archives` or Postgres `archived_tenants`, as `TENANTS_BACKEND`
chooses), adding `status`, `dumpLocation` and `archivedAt`, then removes the tenant from the
active registry. Unarchiving copies the row back and deletes it from the archived registry. So
the list holds the tenants that are archived now, one row per name.

Rows are read from the same backend the active registry uses, whatever `TENANTS_BACKEND` is.

## archives list

```sh
yarn uwazi archives list
yarn uwazi archives list --pretty
```

No request, and neither `--tenant` nor `--all-tenants`: archived tenants are no longer in the
registry, so there is no tenant to run in. Any request field fails with `validation.failed`
(exit 2).

Prints every row exactly as stored — `_id` included on MongoDB, absent on Postgres — with no field
added, removed or converted.

Order: newest `archivedAt` first. `archivedAt` is epoch **seconds**, written by the CLI as a
number; on Mongo a row written by an older playbook may store it as a numeric string, which still
sorts by its numeric value. Rows with no `archivedAt`, or one that is not a number, come last.
Rows with the same `archivedAt` are sorted by name.

Output, one item per archived tenant, `[]` when there are none:

```json
[
  {
    "_id": "6ac6807566a491edb123448f",
    "name": "acme",
    "dbName": "acme",
    "indexName": "acme",
    "uploadedDocuments": "/data/acme/uploaded_documents",
    "attachments": "/data/acme/attachments",
    "customUploads": "/data/acme/custom_uploads",
    "activityLogs": "/data/acme/log",
    "status": "archived",
    "dumpLocation": {
      "db": "https://s3.example.org/uwazi-production-archive/acme_db.zip",
      "files": "https://store.greenhost.net/uwazi-production/acme"
    },
    "featureFlags": { "s3Storage": true },
    "archivedAt": 1759700000
  }
]
```

| Field                | Meaning                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `dumpLocation.db`    | The zipped database dump                                           |
| `dumpLocation.files` | Where the tenant's files are kept                                  |
| `archivedAt`         | When it was archived, epoch seconds (a number; a numeric string in older Mongo rows) |
| the other fields     | The tenant's registry row at the time it was archived              |
