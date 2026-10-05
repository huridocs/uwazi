# tenants

Administer the tenant registry: the list of tenants an installation serves, and for each one
where its data lives and which feature flags it runs with. Shared options, output and exit codes
are in the [README](../README.md).

| Command                 | Does                                                      |
| ----------------------- | --------------------------------------------------------- |
| `tenants list`          | Prints every registered tenant, as stored                 |
| `tenants get`           | Prints one tenant, as stored                              |
| `tenants register`      | Registers a tenant, or updates the one already registered |
| `tenants update`        | Changes a tenant's fields                                 |
| `tenants delete`        | Removes a tenant from the registry                        |
| `tenants feature-flags` | Sets or removes feature flags                             |
| `tenants maintenance`   | Puts a tenant under maintenance, or takes it out          |
| `tenants stats`         | Stores the usage figures another tool computed            |
| `tenants health-check`  | Stores the latest health check another tool ran           |

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

No request. Prints every registered tenant, sorted by name, each row as stored. On a single
instance with no registry it prints `[]`: the tenant configured from the environment is not in the
registry.

## tenants get

```sh
yarn uwazi tenants get --request '{"name":"acme"}'
```

Prints one tenant's row, as stored.

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
