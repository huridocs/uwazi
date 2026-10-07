# archives

Reads the tenants that have been archived. A read for operators and the tools that manage
instances; nothing in Uwazi depends on it. Shared options, output and exit codes are in the
[README](../README.md).

| Command         | Tenancy | Does                                                |
| --------------- | ------- | --------------------------------------------------- |
| `archives list` | none    | Lists the archived tenants, as stored, newest first |

Uwazi does not archive tenants and does not write these rows. The archive playbook in
uwazi-operations does: it copies the tenant's row from the registry into the `archives`
collection, adding `status`, `dumpLocation` and `archivedAt`, then removes the tenant from the
registry and drops its database. Unarchiving copies the row back and deletes it from `archives`.
So the list holds the tenants that are archived now, one row per name.

Rows are always read from the Mongo shared database (`uwazi_shared_db`), whatever
`TENANTS_BACKEND` is: the archive playbook writes nowhere else.

## archives list

```sh
yarn uwazi archives list
yarn uwazi archives list --pretty
```

No request, and neither `--tenant` nor `--all-tenants`: archived tenants are no longer in the
registry, so there is no tenant to run in. Any request field fails with `validation.failed`
(exit 2).

Prints every row exactly as stored, `_id` included, with no field added, removed or converted.

Order: newest `archivedAt` first. The playbook writes `archivedAt` as epoch **seconds**, usually as
a string; it is printed as stored, but sorted by its numeric value, whether a string or a number.
Rows with no `archivedAt`, or one that is not a number, come last. Rows with the same `archivedAt`
are sorted by name.

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
    "archivedAt": "1759700000"
  }
]
```

| Field                | Meaning                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `dumpLocation.db`    | The zipped database dump                                           |
| `dumpLocation.files` | Where the tenant's files are kept                                  |
| `archivedAt`         | When it was archived, epoch seconds, as written (string or number) |
| the other fields     | The tenant's registry row at the time it was archived              |
