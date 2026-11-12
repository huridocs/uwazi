# tenants

Administer tenants: the registry that says which tenants an installation serves and where each
one's data lives. Backup, restore and blank-state commands live under [`db`](db.md). Shared
options, output and exit codes are in the [README](../README.md).

| Command                 | Does                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `tenants list`          | Prints every tenant, active by default, archived with `--archived` |
| `tenants get`           | Prints one tenant, as stored                                       |
| `tenants archive`       | Moves a tenant to the archived registry                            |
| `tenants unarchive`     | Moves a tenant back to the active registry                         |
| `tenants register`      | Registers a tenant, or updates the one already registered          |
| `tenants update`        | Changes a tenant's fields                                          |
| `tenants delete`        | Removes a tenant from the registry                                 |
| `tenants feature-flags` | Sets or removes feature flags                                      |
| `tenants maintenance`   | Puts a tenant under maintenance, or takes it out                   |
| `tenants stats`         | Stores the usage figures another tool computed                     |
| `tenants health-check`  | Stores the latest health check another tool ran                    |

The commands above administer the registry and take no `--tenant` or `--all-tenants` — the
tenant they act on is the request's `name`.

## The registry

The registry sits above every tenant, so these commands take no `--tenant` or `--all-tenants`:
the tenant they act on is the request's `name`. It lives in the shared database, in MongoDB or
PostgreSQL as `TENANTS_BACKEND` chooses; both behave as described here.

These commands write the registry row and nothing else. Creating a tenant's database, running its
migrations, building its search index and creating or removing its files stay with the tools that
provision instances.

A tenant row holds:

| Field                                                               | Meaning                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `name`                                                              | The tenant's identifier. Cannot be changed.                  |
| `dbName`, `indexName`                                               | Its MongoDB database and Elasticsearch index. Required.      |
| `uploadedDocuments`, `attachments`, `customUploads`, `activityLogs` | Its storage folders, absolute or relative. Required.         |
| `domain`                                                            | The host the tenant is served on; used to build email links. |
| `featureFlags`                                                      | See [tenants feature-flags](#tenants-feature-flags).         |
| `globalMatomo` (`{id, url}`), `ciMatomoActive`                      | Analytics.                                                   |
| `maintenance`                                                       | See [tenants maintenance](#tenants-maintenance).             |
| `stats`, `healthChecks`, `metadata`                                 | Data other tools keep here. Uwazi stores it, never reads it. |

Rows may hold other fields that other tools wrote. They are kept as they are and printed by
`list` and `get`.

### How running servers see changes

Running servers and workers reload the registry when it changes: within about a second on MongoDB,
and within `TENANTS_POLL_INTERVAL_SECONDS` (default 10) plus a second on PostgreSQL. New tenants
and changed fields take effect without a restart. A deleted tenant does not: processes started
before the delete keep serving it until they restart.

### Shared rules

- **Storage belongs to one tenant.** A `dbName` or `indexName` another tenant already uses fails
  with `tenant.storage_taken` (exit 4): two tenants on one database or index would read and
  write each other's data.
- **Names of new tenants** are up to 63 lowercase letters, digits, `-` or `_`, starting with a
  letter or digit, since a name becomes database, index and folder names. Commands that act on an
  existing tenant accept any registered name, so tenants registered before the rule stay
  reachable.
- **`dbName`** is up to 63 characters, none of `/\. "$*<>:|?`.
- **`indexName`** is lowercase, has none of `\/*?"<>| ,#:`, does not start with `-`, `_` or `+`,
  and is not `.` or `..`.
- **Folders** are not empty and have no `..` segment.
- **A tenant that is not registered** fails with `tenant.not_found` (exit 3), except in
  `register`.

## tenants list

```sh
yarn uwazi tenants list
yarn uwazi tenants list --archived
```

No request, and neither `--tenant` nor `--all-tenants`.

**Active (default).** Prints every registered tenant, sorted by name, each row as stored. On a
single instance with no registry it prints `[]`: the tenant configured from the environment is
not in the registry.

**`--archived`.** Prints the archived tenants, read from the archived registry, which follows
`TENANTS_BACKEND` like the active one: the Mongo `archives` collection of the shared database, or
the Postgres `archived_tenants` table. Rows are printed exactly as stored — `_id` included on
Mongo, absent on Postgres — with no field added, removed or converted.

Order: newest `archivedAt` first. `archivedAt` is epoch **seconds**, written by the CLI as a
number; on Mongo a row written by an older playbook may store it as a numeric string, which still
sorts by its numeric value. Rows with no `archivedAt`, or one that is not a number, come last.
Rows with the same `archivedAt` are sorted by name.

Output for `--archived`, one item per archived tenant, `[]` when there are none:

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

## tenants get

```sh
yarn uwazi tenants get --request '{"name":"acme"}'
```

Prints one tenant's row, as stored.

## tenants archive

```sh
yarn uwazi tenants archive --request '{"name":"acme","dumpLocation":{"db":"<url>","files":"<url>"}}'
```

Moves a tenant from the active registry into the archived registry — the Mongo `archives`
collection or the Postgres `archived_tenants` table, whichever `TENANTS_BACKEND` selects. Its
database, search index and files are left alone: the archive playbook runs the data dump first
and passes its locations here.

- `name` — the tenant to archive.
- `dumpLocation.db` — where the zipped database dump was uploaded.
- `dumpLocation.files` — where the tenant's files are kept.

The archived row is a fixed snapshot: `name`, `dbName`, `indexName`, `uploadedDocuments`,
`attachments`, `customUploads`, `activityLogs` and the full `featureFlags`, plus
`status: "archived"`, `dumpLocation` and `archivedAt` (epoch seconds, written by the CLI).
`domain`, `globalMatomo`, `ciMatomoActive`, `maintenance` and the operational data (`stats`,
`healthChecks`, `metadata`) are dropped.

It works the same on both registry backends and for a Mongo and a Postgres tenant: the move never
touches tenant data, and the tenant's `postgresCore` flag travels through the snapshot unchanged.

Prints the archived row as stored (`_id` included on MongoDB).

| Code               | Exit | When                             |
| ------------------ | ---- | -------------------------------- |
| `tenant.not_found` | 3    | The active tenant does not exist |

## tenants unarchive

```sh
yarn uwazi tenants unarchive --request '{"name":"acme"}'
```

Moves a tenant back from the archived registry into the active registry, rebuilding a clean row
from the snapshot: the snapshot fields and the full `featureFlags`, without `status`,
`dumpLocation` or `archivedAt`. The archived row is then removed.

Fails with `tenant.conflict` (exit 4) if a tenant with that name is already active, so a live
tenant is never overwritten. Fails with `tenant.storage_taken` (exit 4) if another tenant has
taken the snapshot's `dbName` or `indexName` since archive, so two tenants are never put on the
same database or index.

Prints the active row as stored (what `tenants get` prints).

| Code                 | Exit | When                                             |
| -------------------- | ---- | ------------------------------------------------ |
| `tenant.not_found`   | 3    | The archived tenant does not exist               |
| `tenant.conflict`    | 4    | A tenant with that name is already active        |
| `tenant.storage_taken` | 4  | Another tenant now uses the archived `dbName` or `indexName` |

## tenants register

```sh
yarn uwazi tenants register --request '{"name":"acme","domain":"acme.uwazi.io"}'
```

| Field                                      | Default                      |
| ------------------------------------------ | ---------------------------- |
| `name`                                     | required                     |
| `dbName`                                   | the name                     |
| `indexName`                                | the name                     |
| `uploadedDocuments`, `attachments`         | `<name>/documents`           |
| `customUploads`                            | `<name>/custom_uploads`      |
| `activityLogs`                             | `<name>/log`                 |
| `domain`, `globalMatomo`, `ciMatomoActive` | not set                      |
| `featureFlags`                             | not set; merged flag by flag |

Idempotent: registering a tenant that already exists updates it, so the automation that
provisions instances can run it again without checking first.

- **A new tenant** gets every default it was not given.
- **An existing tenant** keeps its stored values. Defaults only fill the required fields it does
  not have yet, so registering again never moves a tenant to another database, index or folder
  unless the request says so. Values in the request replace the stored ones.
- `featureFlags` is merged as in [tenants feature-flags](#tenants-feature-flags), without `null`.

`null` is rejected: there is nothing to remove from a tenant being registered. Use `update`.

Prints the tenant's row after saving.

| Code                   | Exit | When                                                              |
| ---------------------- | ---- | ----------------------------------------------------------------- |
| `tenant.storage_taken` | 4    | Another tenant uses the `dbName` or `indexName`, given or default |

## tenants update

```sh
yarn uwazi tenants update --request '{"name":"acme","domain":"archive.acme.org","metadata":{"notes":null}}'
```

`name` plus the fields to change. A partial request:

- **A field left out stays as it is.**
- **A field sent with a value replaces it.**
- **A field sent as `null` is removed.** Only optional fields can be removed: `domain`,
  `globalMatomo`, `ciMatomoActive` and `metadata`. `dbName`, `indexName` and the folders can be
  changed but not removed, since a tenant cannot run without them.
- **`metadata` merges key by key**, with the same rules one level down: `{"metadata":{"notes":null}}`
  removes `notes` and keeps the rest; `{"metadata":null}` removes it all.

`featureFlags`, `maintenance`, `stats` and `healthChecks` are rejected here: each has its own
command. So the output of `get` is not a valid `update` request; send only what you change.

Changing `dbName`, `indexName` or a folder points the tenant at other storage; nothing is moved.

Prints the tenant's row after saving.

| Code                   | Exit | When                                                |
| ---------------------- | ---- | --------------------------------------------------- |
| `tenant.storage_taken` | 4    | Another tenant uses the new `dbName` or `indexName` |

## tenants delete

```sh
yarn uwazi tenants delete --request '{"name":"acme"}'
```

Removes the registry row only. The tenant's database, search index and files are left as they
are. Processes already running keep serving the tenant until they restart (see
[How running servers see changes](#how-running-servers-see-changes)).

Prints `{"name":"acme"}`.

## tenants feature-flags

```sh
yarn uwazi tenants feature-flags --request '{"name":"acme","featureFlags":{"postgresCore":true,"telemetry":{"sampleRate":0.1}}}'
```

Merges the flags sent into the stored ones, flag by flag, so a caller never drops a flag it does
not know about:

- a flag left out stays as it is;
- a flag sent with a value is set;
- a flag sent as `null` is removed;
- the grouped flags `telemetry` and `prometheus` merge one level deeper:
  `{"telemetry":{"sampleRate":0.1}}` keeps `telemetry.enabled`; `{"telemetry":null}` removes the
  group.

Only declared flags are accepted, with their declared types; `--schema` lists them. A flag stored
in an older shape, such as a group saved as `true`, is replaced by the merged group.

Prints the tenant's row after saving.

## tenants maintenance

```sh
yarn uwazi tenants maintenance --request '{"name":"acme","maintenance":true}'
```

With `maintenance: true`, running servers answer the tenant's pages and API requests with `503`
(`{"error":"Service Unavailable","maintenance":true}`) once they have reloaded the registry;
static assets are still served.
`false` serves it again. Prints the tenant's row after saving.

## tenants stats

```sh
yarn uwazi tenants stats --request - < stats.json
```

`name` and `stats`, the usage figures another tool computed: `lastUpdated`, `dbStorage`,
`elasticStorage`, `filesStorage`, `entitiesCount`, `filesCount`, `totalStorage`,
`userCount` (`admin`, `editor`, `collaborator`, `total`), `lastSession`, and optional
`filesByBucket` (`{"<bucket>":{"count","size"}}`). Every field but `filesByBucket` is required:
`stats` replaces the stored one whole. Uwazi stores it and never reads it.

## tenants health-check

```sh
yarn uwazi tenants health-check --request - < health.json
```

`name` and `healthCheck`: `name`, `lastUpdated`, `warnings` and `problems` (string lists), and a
free-form `summary`. Only the latest is kept: it replaces the stored `healthChecks` with a list
of one. Uwazi stores it and never reads it.
