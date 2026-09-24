# uwazi CLI

Command-line interface for administering Uwazi tenants, organised as `<group> <command>`, e.g.
`users create`. It is meant for scripts and other programs as much as for people, so the
input is JSON, the output is JSON, and failures have stable codes and exit codes.

It runs the same use cases as the HTTP API, in-process, as the system actor.

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

### Configuration

The CLI reads the same environment as the server. With `NODE_ENV=production` it refuses to
start unless these are set, rather than falling back to localhost defaults and silently
talking to the wrong database:

`MONGO_URI`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_APP_USER`,
`POSTGRES_APP_PASSWORD`, and `REDIS_HOST` for commands that need Redis.

Missing variables fail with `config.missing` (exit 1) before anything connects.

## Usage

In development, from the repository root:

```sh
yarn uwazi users create --tenant acme --request '{"username":"bob","email":"bob@acme.org","role":"editor"}'
yarn uwazi users update --tenant acme --request '{"username":"bob","role":"admin"}'
yarn uwazi users delete --tenant acme --request '{"id":"64b7f0c2e4b0a1b2c3d4e5f6"}'
yarn uwazi users list --all-tenants
yarn uwazi users stats --tenant acme --pretty
yarn uwazi settings get --tenant acme
yarn uwazi settings update --tenant acme --request '{"site_name":"Acme archive"}'
```

In production, from `prod/`, the same commands with the binary in place of `yarn uwazi`:

```sh
./apps/cli/bin/uwazi.js users list --tenant acme
echo '{"username":"bob","role":"admin"}' | ./apps/cli/bin/uwazi.js users update --tenant acme --request -
./apps/cli/bin/uwazi.js settings get --tenant acme > settings.json   # edit, then:
./apps/cli/bin/uwazi.js settings update --tenant acme --request - < settings.json
```

### Options

| Option                | Meaning                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `--request <json>`    | The command's input as a JSON object. Omitted means `{}`.                                  |
| `--request -`         | Read the JSON from stdin. Prefer it for automation: arguments show up in `ps` and history. |
| `--schema`            | Print the JSON schema of the command's `--request` and exit, without connecting.           |
| `--tenant <name>`     | The tenant to run in. Required by tenant-scoped commands.                                  |
| `--all-tenants`       | Run a query in every tenant (queries only; writes always target one tenant).               |
| `--pretty`            | Human-readable output (tables / `key: value`) instead of JSON.                             |
| `--verbose`           | Add stack traces to errors.                                                                |
| `--help`, `--version` |                                                                                            |

Tenant selection is a flag, not part of the request: it chooses where the command runs, the
request is what the command does. Unknown request fields are rejected, `tenant` included.

`--schema` is the reference for each command's input:

```sh
yarn uwazi users update --schema
```

### Commands

| Command           | Tenancy                       | Request                                                                                                                                |
| ----------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `users create`    | `--tenant`                    | `username`, `email`, `role`; optional `groups` (ids, default `[]`), `welcomeEmail` (default `true`)                                    |
| `users update`    | `--tenant`                    | exactly one of `username` / `id` to name the user; optional `newUsername`, `email`, `role`, `groups` — omitted fields stay as they are |
| `users delete`    | `--tenant`                    | exactly one of `username` / `id` (soft delete)                                                                                         |
| `users list`      | `--tenant` or `--all-tenants` | optional `role` filter                                                                                                                 |
| `users stats`     | `--tenant` or `--all-tenants` | none                                                                                                                                   |
| `settings get`    | `--tenant`                    | none — prints the whole settings document as stored, `sync` credentials included                                                       |
| `settings update` | `--tenant`                    | any part of the settings document (`--schema` for its shape); prints the whole document after saving                                   |

`role` is one of `admin`, `editor`, `collaborator`.

`settings update` replaces each top-level field it is sent and leaves the others as they are.
Nested objects such as `features` are replaced whole, so a key left out of `features` is
removed; a top-level field cannot be removed. The output of `settings get` can be sent back as
is. A stored document with fields the settings schema does not know is rejected.

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

| Code | Meaning                                                                    |
| ---- | -------------------------------------------------------------------------- |
| 0    | Success                                                                    |
| 1    | Unexpected error, or missing configuration                                 |
| 2    | Validation: bad command line, bad JSON, invalid request, domain validation |
| 3    | Not found (tenant, user)                                                   |
| 4    | Conflict (e.g. the username already exists)                                |
| 5    | Rule violation (e.g. deleting the last user)                               |
| 130  | Interrupted (Ctrl-C)                                                       |

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
