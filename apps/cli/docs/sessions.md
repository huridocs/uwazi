# sessions

Reports when a tenant's sessions were last active. A read for operators and the tools that monitor
instances; nothing in Uwazi depends on it. Shared options, output and exit codes are in the
[README](../README.md).

| Command         | Tenancy                       | Does                                                  |
| --------------- | ----------------------------- | ----------------------------------------------------- |
| `sessions last` | `--tenant` or `--all-tenants` | Reports the last session activity of a tenant or each |

## sessions last

```sh
yarn uwazi sessions last --tenant acme
yarn uwazi sessions last --all-tenants
```

No request. Prints, for each tenant, in epoch milliseconds:

```json
{ "lastSession": 1759700000000 }
```

| Field         | Meaning                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| `lastSession` | The latest activity of any of the tenant's sessions; `0` when it has none. |

### What the value means

- **It is the last session activity, not strictly the last login.** The store pushes a session's
  expiry forward whenever the session is used, and the value is that expiry minus the session
  lifetime. A user who stays signed in keeps moving it.
- **It is read from the session store `SESSIONS_BACKEND` selects** for the whole installation
  (`mongo` or `postgres`), not from the tenant's feature flags. Tenants share the store; a
  session belongs to a tenant by the tenant name stored in it.
- **Precision is a day.** Both stores record a session's activity at most once every 24 hours.

### Expired and removed sessions

Sessions expire after 14 days without use, and expired sessions are removed from the store. The
command only sees what is still stored, so:

- a tenant idle for more than 14 days reports `0`;
- the value can go back to an earlier time, or to `0`, as old sessions are removed.

The command keeps no history. A consumer that wants the last time a tenant was ever active must
keep the highest value it has seen and ignore `0`.

### Configuration

Besides the variables every command needs, in production this command requires
`SESSIONS_BACKEND`.

### Cost

It reads every session of the installation once per tenant. With `--all-tenants` the tenants run
one after the other. Fine for a periodic check; not for a page that loads on every visit.

Errors: only those every command can return.
