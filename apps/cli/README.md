# uwazi CLI

Command-line interface for administering Uwazi tenants, organised as `<group> <command>`, e.g.
`users create`. It is meant for scripts and other programs as much as for people, so the
input is JSON, the output is JSON, and failures have stable codes and exit codes.

It runs the same use cases as the HTTP API, in-process, as the system actor.

This page covers what every command shares. What each command does, its rules and its errors are
in the module's own page:

| Module                               | Commands                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| [users](docs/users.md)               | `create`, `update`, `delete`, `list`, `stats`                                                          |
| [settings](docs/settings.md)         | `get`, `update`                                                                                        |
| [tenants](docs/tenants.md)           | `list`, `get`, `register`, `update`, `delete`, `feature-flags`, `maintenance`, `stats`, `health-check` |
| [segmentation](docs/segmentation.md) | `queue-idle`                                                                                           |
| [usage](docs/usage.md)               | `report`                                                                                               |
| [sessions](docs/sessions.md)         | `last`                                                                                                 |
| [activity](docs/activity.md)         | `list`                                                                                                 |
| [archives](docs/archives.md)         | `list`                                                                                                 |

## Running it

| Where                     | Command                                       | Notes                                              |
| ------------------------- | --------------------------------------------- | -------------------------------------------------- |
| Development (repo root)   | `yarn uwazi <group> <command> …`              | Runs the TypeScript source through `tsx` (~1.5 s)  |
| Production (from `prod/`) | `./apps/cli/bin/uwazi.js <group> <command> …` | Compiled JS, no yarn: the fast path for automation |

The binary is executable and starts with `#!/usr/bin/env -S node --no-experimental-fetch`, so
it runs without typing `node`. That only works on the build: in the source tree it imports
TypeScript, which plain `node` cannot load — use `yarn uwazi` there.

Avoid `yarn uwazi` in production. It still works (it runs plain `node` when `tsx` is not
installed), but yarn's startup and the extra process add ~0.3 s to every call.

```sh
yarn uwazi users list --tenant acme --pretty
echo '{"username":"bob","role":"admin"}' | ./apps/cli/bin/uwazi.js users update --tenant acme --request -
```

### Configuration

The CLI reads the same environment as the server. With `NODE_ENV=production` it refuses to
start unless these are set, rather than falling back to localhost defaults and silently
talking to the wrong database:

`MONGO_URI`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_APP_USER`,
`POSTGRES_APP_PASSWORD`, `REDIS_HOST` for commands that need Redis, and `SESSIONS_BACKEND` for
commands that read the session store (`usage report`, `sessions last`).

Missing variables fail with `config.missing` (exit 1) before anything connects.

`TENANTS_BACKEND` (`mongo`, the default, or `postgres`) chooses where the tenant registry is read
and written, as it does for the server.

## Input

| Option                | Meaning                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `--request <json>`    | The command's input as a JSON object. Omitted means `{}`.                                           |
| `--request -`         | Read the JSON from stdin. Prefer it for automation: arguments show up in `ps` and history.          |
| `--schema`            | Print the JSON schema of the command's `--request` and exit, without connecting.                    |
| `--tenant <name>`     | The tenant to run in. Required by tenant-scoped commands; rejected by `tenants …` and `archives …`. |
| `--all-tenants`       | Run a query in every registered tenant (queries only; writes always target one tenant).             |
| `--pretty`            | Human-readable output (tables / `key: value`) instead of JSON.                                      |
| `--verbose`           | Add stack traces to errors.                                                                         |
| `--help`, `--version` |                                                                                                     |

Unknown request fields are rejected. `--schema` is the reference for each command's input:

```sh
yarn uwazi users update --schema
```

### Choosing the tenant

Tenant selection is a flag, not part of the request: it chooses where the command runs, the
request is what the command does. A request field named `tenant` is rejected like any other
unknown field.

- `--tenant <name>` runs in one tenant. The name is looked up in the tenant registry; on a single
  instance with no registry, `--tenant default` reaches the tenant configured from the
  environment. An unknown name fails with `tenant.not_found` (exit 3).
- `--all-tenants` runs a query in every tenant in the registry, one after the other. It does not
  include the environment-configured `default` tenant, so on a single instance it returns no
  results.
- `tenants …` takes neither. Those commands administer the registry that sits above every tenant,
  so there is no tenant to run _in_; the tenant they act _on_ travels in the request as `name`.
- `archives …` takes neither as well: an archived tenant is no longer in the registry.

## Output

- **Results** go to **stdout**, as one line of JSON. Nothing else is ever written to stdout —
  logs and stray `console.log` calls are redirected to stderr — so stdout can be parsed as is.
- **Errors** go to **stderr**, as one line of JSON (formatted here for reading):

  ```json
  {
    "error": {
      "code": "validation.failed",
      "category": "validation",
      "message": "Invalid arguments",
      "validation": [{ "field": "email", "code": "invalid_type", "message": "Required" }]
    }
  }
  ```

  Branch on `code` (stable, namespaced) and the exit code; `message` is for people and may
  change. `validation[].field` names the request field (or `--tenant` / `--all-tenants`).

- **`--all-tenants`** results are `{"results":[{"tenant","data"}],"errors":[{"tenant","error"}]}`.
  One failing tenant does not hide the others; the command exits with the code of the first
  failure.

The result shapes are the CLI's public contract: fields are only ever added.

### Exit codes

| Code | Category         | Meaning                                                            |
| ---- | ---------------- | ------------------------------------------------------------------ |
| 0    |                  | Success                                                            |
| 1    | `unexpected`     | Unexpected error, or missing configuration                         |
| 2    | `validation`     | Bad command line, bad JSON, invalid request, domain validation     |
| 3    | `not_found`      | Not found (tenant, user)                                           |
| 4    | `conflict`       | Conflict (e.g. the username already exists, the database is taken) |
| 5    | `rule_violation` | Rule violation (e.g. deleting the last user or the last admin)     |
| 130  |                  | Interrupted (Ctrl-C)                                               |

Codes every command can return: `validation.failed` and `usage.invalid` (exit 2),
`tenant.not_found` (exit 3), `config.missing` and `unexpected` (exit 1). Each module's page lists
the codes of its own commands.

## Build and release

- The production build (`yarn production-build`) compiles the CLI with babel alongside the
  API and marks the binary executable.
- Every release ships the whole production build, so the CLI ships with every release.
- The release workflows' build cache includes the CLI sources: a CLI-only change rebuilds.

## Tests

```sh
yarn test apps/cli
```

The smoke spec runs the real binary through `tsx`; the other specs run in-process.
Controller and tenancy specs need the local MongoDB and PostgreSQL.
