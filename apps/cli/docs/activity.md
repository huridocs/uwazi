# activity

Reads what a tenant's users have done through the API. A read for operators and the tools that
monitor instances; nothing in Uwazi depends on it. Shared options, output and exit codes are in
the [README](../README.md).

| Command         | Tenancy    | Does                                         |
| --------------- | ---------- | -------------------------------------------- |
| `activity list` | `--tenant` | Lists a tenant's latest activity log entries |

## activity list

```sh
yarn uwazi activity list --tenant acme
yarn uwazi activity list --tenant acme --request '{"limit":5}' --pretty
```

| Field   | Required | Meaning                                                           |
| ------- | -------- | ----------------------------------------------------------------- |
| `limit` | no       | How many of the latest entries to return, 1 to 100. Default `20`. |

Any other field, or a `limit` that is not a whole number from 1 to 100, fails with
`validation.failed` (exit 2).

Output, newest first, times in epoch milliseconds:

```json
[
  { "method": "POST", "url": "/api/entities", "username": "bob", "time": 1759700000000 },
  { "method": "DELETE", "url": "/api/files", "username": null, "time": 1759699000000 }
]
```

| Field      | Meaning                                                    |
| ---------- | ---------------------------------------------------------- |
| `method`   | The HTTP method of the request.                            |
| `url`      | The API path, without its query string.                    |
| `username` | The user who made the request; `null` when it had no user. |
| `time`     | When the request finished, in epoch milliseconds.          |

An empty log prints `[]`. Entries made at the same millisecond come out in the opposite order to
the one they were stored in.

The request's own details (its body, query and parameters) are stored in the log but never
printed, because they can hold the content users edit. The entries say what was called and by
whom, not with what. They carry no description of the action: build one from `method` and `url`.

### What is in the log

- **Only requests that change something.** `GET`, `OPTIONS` and `HEAD` requests are not logged,
  nor are some endpoints (login, password recovery, downloads, sync and export among them). An
  empty or old log does not mean the tenant is idle: use [`sessions last`](sessions.md) for that.
- **Requests that ended in 404 are not logged.**
- **Entries are kept for one year.** Each carries an expiry one year after it was made, and
  MongoDB deletes it then, so the oldest entries disappear on their own.

### Where it comes from

The log is read from the tenant's MongoDB database. It has not moved to PostgreSQL, so the
command reads MongoDB whatever the tenant's `postgresCore` flag says.

Errors: only those every command can return.
