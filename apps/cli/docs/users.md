# users

Manage the user accounts of a tenant. Every command runs in one tenant (`--tenant`); `list` and
`stats` can also run in every tenant (`--all-tenants`). Shared options, output and exit codes are
in the [README](../README.md).

| Command                  | Tenancy                       | Does                                                  |
| ------------------------ | ----------------------------- | ----------------------------------------------------- |
| `users create`           | `--tenant`                    | Creates a user and, by default, emails them a welcome |
| `users update`           | `--tenant`                    | Changes a user's username, email, role or groups      |
| `users delete`           | `--tenant`                    | Soft deletes a user                                   |
| `users list`             | `--tenant` or `--all-tenants` | Lists the active users with their groups              |
| `users stats`            | `--tenant` or `--all-tenants` | Counts the active users by role                       |
| `users recover-password` | `--tenant`                    | Emails a user a link to set a new password            |

The commands run as the system actor, which acts as an admin. They run the same use cases as the
admin screens, so the same rules apply, with the differences noted below.

## Rules every user follows

- **Username**: trimmed, at least one character, no spaces.
- **Email**: a valid email address.
- **Role**: one of `admin`, `editor`, `collaborator`.
- **Uniqueness**: no two active users share a username or an email. The comparison is exact, so
  `bob` and `Bob` are different usernames.
- **Soft-deleted users** do not count: their username and email are free to use again.
- **Groups** are stored on the group, not on the user. A user's groups are the groups that list
  them as a member.
- **The public user** (the system user anonymous visitors act as) is never listed, counted,
  found by username, changed or deleted.
- **A tenant always keeps an admin.** Nothing in this module can delete the last active admin or
  take the admin role away from it.

Breaking a format rule fails with `validation.failed` (exit 2). The other rules have their own
codes, listed with each command.

## Naming a user

`update` and `delete` act on an existing user, named by exactly one of:

- `username`: looked up among active users.
- `id`: the user's 24-character hex id.

Sending both, or neither, fails with `validation.failed` on the field `user`. A username that
matches no active user fails with `user.not_found` (exit 3).

## users create

```sh
yarn uwazi users create --tenant acme --request '{"username":"bob","email":"bob@acme.org","role":"editor"}'
```

| Field          | Required | Meaning                                     |
| -------------- | -------- | ------------------------------------------- |
| `username`     | yes      |                                             |
| `email`        | yes      |                                             |
| `role`         | yes      |                                             |
| `groups`       | no       | Group ids to add the user to. Default `[]`. |
| `welcomeEmail` | no       | Queue the welcome email. Default `true`.    |

What it does:

1. Checks the profile rules, then that the username and the email are not taken.
2. Creates the user with a random password. Nobody knows it: the user sets their own through the
   welcome email, or through "forgot password".
3. Adds the user to each group in `groups`. A group id that matches no group, malformed ids
   included, is left out and listed in `ignoredGroups`; the user is still created.
4. With `welcomeEmail`, queues the welcome email. It is sent later by the queue worker, and links
   to the tenant's domain so the user can set a password.

The user, their groups and the queued email are written together: if one fails, none is kept.

The tenant must have a `domain` in the registry, even with `welcomeEmail: false`, because the
link is built before the user is saved. Without one the command fails with
`tenant.domain_missing` and creates nothing. Links always use `https://`.

Output:

```json
{
  "user": { "id": "…", "username": "bob", "email": "bob@acme.org", "role": "editor" },
  "welcomeEmailQueued": true,
  "ignoredGroups": []
}
```

| Code                    | Exit | When                                    |
| ----------------------- | ---- | --------------------------------------- |
| `user.duplicated_user`  | 4    | An active user already has the username |
| `user.duplicated_email` | 4    | An active user already has the email    |
| `tenant.domain_missing` | 5    | The tenant has no `domain`              |

## users update

```sh
yarn uwazi users update --tenant acme --request '{"username":"bob","role":"admin"}'
```

| Field             | Meaning                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `username` / `id` | The user to change. See [Naming a user](#naming-a-user).                                           |
| `newUsername`     | The new username.                                                                                  |
| `email`           | The new email.                                                                                     |
| `role`            | The new role.                                                                                      |
| `groups`          | The user's whole list of groups. Replaces the current one; `[]` removes the user from every group. |

A partial update: a field left out stays as it is. `groups` is the exception to "merge": when sent,
it is the complete list, so a group missing from it is left. Passwords and two-factor settings
cannot be changed here.

What it does:

1. Finds the user. The public user cannot be changed.
2. Applies the changes and checks the profile rules.
3. If the user was an admin and loses the role, checks another active admin remains.
4. Checks a changed username or email is not taken by another active user.
5. With `groups`, makes the user a member of exactly those groups. Ids that match no group are
   left out and listed in `ignoredGroups`, so `"groups":["unknown"]` removes the user from every
   group.

The profile and the group memberships are written together.

Output:

```json
{
  "user": { "id": "…", "username": "bob", "email": "bob@acme.org", "role": "admin" },
  "ignoredGroups": []
}
```

| Code                    | Exit | When                                                      |
| ----------------------- | ---- | --------------------------------------------------------- |
| `user.not_found`        | 3    | No active user has the username or id                     |
| `user.duplicated_user`  | 4    | Another active user has the new username                  |
| `user.duplicated_email` | 4    | Another active user has the new email                     |
| `user.last_admin`       | 5    | The user is the only active admin and would lose the role |
| `user.update`           | 5    | The `id` is the public user's                             |

## users delete

```sh
yarn uwazi users delete --tenant acme --request '{"username":"bob"}'
```

Takes `username` or `id`, nothing else.

A soft delete: the user is marked deleted and kept in the database, and is removed from every
group. A deleted user cannot log in, is not listed or counted, cannot be found by any command, and
their username and email can be given to a new user. It cannot be undone from the CLI.

Refused when:

- the user is the public user;
- the tenant has a single active user;
- they are the only active admin.

Output: `{"id":"…"}`, the deleted user's id.

| Code                      | Exit | When                                  |
| ------------------------- | ---- | ------------------------------------- |
| `user.not_found`          | 3    | No active user has the username or id |
| `user.delete_system_user` | 5    | The `id` is the public user's         |
| `user.last_user`          | 5    | The tenant has a single active user   |
| `user.last_admin`         | 5    | The user is the only active admin     |

## users recover-password

```sh
yarn uwazi users recover-password --tenant acme --request '{"email":"bob@acme.org"}'
```

Takes `email`, nothing else. The same as "forgot password" on the login screen.

What it does:

1. Looks up the active user with that email. Soft-deleted users and the public user are not found.
2. Stores a new recovery key for them, valid for 24 hours.
3. Queues the recovery email. It is sent later by the queue worker, and links to the tenant's
   domain so the user can set a new password. Links always use `https://`.

The key and the email are written together: if one fails, neither is kept.

An email that matches no active user is not an error: nothing is stored or queued, the output says
`"recoveryEmailQueued": false` and the command exits 0. Check the field, not only the exit code.

Each call creates a new key. Earlier keys are not revoked: they stay valid until they expire. The
key and the link are never printed.

The tenant must have a `domain` in the registry. Without one the command fails with
`tenant.domain_missing` and stores nothing.

Output:

```json
{ "recoveryEmailQueued": true }
```

| Code                    | Exit | When                       |
| ----------------------- | ---- | -------------------------- |
| `tenant.domain_missing` | 5    | The tenant has no `domain` |

## users list

```sh
yarn uwazi users list --tenant acme --request '{"role":"admin"}'
yarn uwazi users list --all-tenants --pretty
```

Optional `role` keeps only the users with that role. Lists active users only: not soft-deleted
users, not the public user.

Output, one item per user:

```json
[
  {
    "id": "…",
    "username": "bob",
    "email": "bob@acme.org",
    "role": "editor",
    "groups": [{ "id": "…", "name": "Researchers" }],
    "using2fa": false,
    "accountLocked": false
  }
]
```

`accountLocked` is set after too many failed logins. Passwords, two-factor secrets and unlock codes
are never printed.

## users stats

```sh
yarn uwazi users stats --all-tenants
```

No request. Counts the active users by role, with the same exclusions as `list`. Every role is
present, at `0` when the tenant has none:

```json
{ "admin": 1, "editor": 4, "collaborator": 0, "total": 5 }
```
