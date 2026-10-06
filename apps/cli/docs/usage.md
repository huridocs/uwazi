# usage

Reports what a tenant consumes: its content, the storage it takes and when it was last used. A read for operators and the tools that bill and monitor instances; nothing in
Uwazi depends on it. Shared options, output and exit codes are in the [README](../README.md).

| Command        | Tenancy                       | Does                                  |
| -------------- | ----------------------------- | ------------------------------------- |
| `usage report` | `--tenant` or `--all-tenants` | Reports the usage of a tenant or each |

## usage report

```sh
yarn uwazi usage report --all-tenants
```

No request. Prints, for each tenant (sizes in bytes, times in epoch milliseconds):

```json
{
  "entitiesCount": 120,
  "filesCount": { "document": 80, "attachment": 30, "custom": 2, "thumbnail": 80 },
  "filesByBucket": {
    "pdf": { "count": 80, "size": 51200000 },
    "image": { "count": 105, "size": 2400000 },
    "video": { "count": 0, "size": 0 },
    "audio": { "count": 0, "size": 0 },
    "office": { "count": 5, "size": 300000 },
    "text": { "count": 2, "size": 4000 },
    "other": { "count": 0, "size": 0 },
    "unknown": { "count": 0, "size": 0 }
  },
  "filesStorage": 53904000,
  "dbStorage": 1630784,
  "dbStorageByEngine": { "mongo": 1500000, "postgres": 130784 },
  "lastSession": 1759700000000
}
```

| Field               | Meaning                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `entitiesCount`     | Entities, one per `sharedId`: an entity in three languages counts once.                    |
| `filesCount`        | Files by type. Every type is present, at `0` when the tenant has none.                     |
| `filesByBucket`     | Files by kind of content, from their mimetype, with count and size. Every kind is present. |
| `filesStorage`      | The sum of every file's stored size.                                                       |
| `dbStorage`         | The sum of `dbStorageByEngine`.                                                            |
| `dbStorageByEngine` | The tenant's database storage in MongoDB and in PostgreSQL.                                |
| `lastSession`       | The latest activity of any of the tenant's sessions; `null` when it has none.              |

### Kinds of file

| Kind      | Mimetypes                                                                   |
| --------- | --------------------------------------------------------------------------- |
| `pdf`     | `application/pdf`                                                           |
| `image`   | `image/*`                                                                   |
| `video`   | `video/*`                                                                   |
| `audio`   | `audio/*`                                                                   |
| `text`    | `text/*`                                                                    |
| `office`  | Word, Excel and PowerPoint, both binary and OpenXML, and OpenDocument files |
| `other`   | Any other mimetype                                                          |
| `unknown` | No mimetype                                                                 |

Mimetypes are compared ignoring case and surrounding spaces.

### Where each figure comes from

- **Content** (`entitiesCount`, `filesCount`, `filesByBucket`, `filesStorage`) is read from the
  database the tenant's `postgresCore` feature flag selects, like everything else the tenant
  stores. Every entity and file counts, whatever its permissions or status.
- **File storage** is what the files' records say, not what the disk or S3 holds: a file missing
  from storage still counts, and a stray object with no record does not.
- **MongoDB storage** is the storage size of the tenant's database. It is always read: a tenant on
  PostgreSQL still has a MongoDB database, and anything left there after its migration counts.
- **PostgreSQL storage** is read only for tenants on `postgresCore`, `0` otherwise. Tenants share
  tables, so it is an estimate: the size of the tenant's rows in every table with a `tenant_id`.
  Indexes and dead rows are not attributed to a tenant, so it is lower than what the tenant
  really costs.
- **Last activity** is read from the session store `SESSIONS_BACKEND` selects for the whole
  installation, not from the tenant's flags. A session records activity at most once a day, so
  `lastSession` is accurate to a day. Sessions expire after 14 days of inactivity and are then
  removed, so a tenant idle for longer reports `null`: keep the last value you saw.

### Configuration

Besides the variables every command needs, in production this command requires
`SESSIONS_BACKEND`.

### Cost

Every figure is computed when asked. Counting files and entities reads every one of the tenant's
records, and the last activity reads every session of the installation, once per tenant. With
`--all-tenants` the tenants run one after the other. Fine for a nightly report; not for a page
that loads on every visit.

Errors: only those every command can return.
