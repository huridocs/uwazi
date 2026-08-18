# Plan: remove the dead `getById`/`findByIds` DAO shims, and a stray review comment

Follow-up to [05](./users-refactor-05-rollout.md), which routed `users.getById` and every other
matching's call sites onto `UsersDirectory`/`UsersDataSource`. Four `// cc:` review comments were
left on the branch asking whether specific pieces of code were dead and should have been removed
already. This plan is the answer, with the call-site audit behind it, so the removal itself can
happen as a small follow-up PR.

**Done when:** `MongoUsersDAO.getById`, `MongoUsersDAO.findByIds`, `PostgresUsersDAO.getById`,
`PostgresUsersDAO.findByIds`, and their "Legacy surface" comment blocks are gone, any imports
that were shim-only are trimmed, the stray `// cc:` on `encryptPassword.ts` is deleted, and
`MongoUsersDAO.spec.ts` / `PostgresUsersDAO.spec.ts` still pass unchanged.

---

## Finding 1 — the DAO-level `getById`/`findByIds` shims are unreachable

`MongoUsersDAO.ts:138-170` and `PostgresUsersDAO.ts:238-263` each carry a "Legacy surface —
removed in plan 05" block housing `getById` and `findByIds`. Their own comments say they exist
only for call sites that plan 05 was to migrate onto `UsersDirectory`: `activitylog/helpers.js`,
`entitiesPermissions.ts`, `userGroups.ts`, `users.js`, and the two email job handlers
(`SendPasswordRecoveryEmailHandler.ts`, `SendAccountLockedEmailHandler.ts`).

Plan 05 already happened. Checking each named call site today:

| call site | what it calls now |
| --- | --- |
| `activitylog/helpers.js:170` | `UsersDirectoryFactory.default().getById(...)` |
| `SendPasswordRecoveryEmailHandler.ts:28` | `UsersDirectoryFactory.default().getById(...)` |
| `SendAccountLockedEmailHandler.ts:31` | `UsersDirectoryFactory.default().getById(...)` |
| `users.js` | routes through `UsersDataSource`/`UsersDirectory` per its own header comment (`users.js:18-23`) |

None of them reach the DAO's `getById`/`findByIds` directly anymore.

I also checked every construction site of `MongoUsersDAO`/`PostgresUsersDAO` in the app
(`UsersDAOFactory`, `UsersDirectoryFactory`, `UsersQueryServiceFactory`, `UserGroupsDAOFactory`,
`PostgresUsersDataSource`) and everything downstream of them:

- `MongoUsersDirectory`/`PostgresUsersDirectory` call `dao.findOne`/`dao.findMany`, never
  `dao.getById`/`dao.findByIds`.
- `UsersDataSource` calls `dao.findOne`.
- `UserGroupsDAOFactory` wires `usersDAO.findManyByIds()` (a different, still-used method), not
  `findByIds`.

No production code calls the four shim methods. The two `readMethods` guard-uniformity tables in
`MongoUsersDAO.spec.ts` and `PostgresUsersDAO.spec.ts` don't include `getById`/`findByIds`
either — grepping both spec files for either name returns nothing. There is no test coverage
exercising them, which is consistent with them being unreachable rather than just untested.

**Action:** delete both "Legacy surface" blocks in full — the two methods, their JSDoc, and the
section-header comment above them, in both `MongoUsersDAO.ts` and `PostgresUsersDAO.ts`. After
deletion, check whether `Result`, `ResultType`, and `UserNotFound` are still used elsewhere in
each file — they were only needed for the shims' `Result.fail`/`Result.ok` returns, so they may
become unused imports.

## Finding 2 — `encryptPassword` is not dead, its own docstring already says why

`app/api/auth/encryptPassword.ts:13` carries `// cc: should have been removed ?` under a
docstring that already states the answer: it backs the historical hash logic for migration
`181-add-public-user` and for test fixtures, and must stay pinned there forever rather than being
replaced by the current `EncryptedPassword` domain VO.

Verified both claims still hold:

- `app/api/migrations/migrations/181-add-public-user/index.ts` imports and calls it directly.
- `app/api/auth/index.js` re-exports it, which is how test fixtures reach it.

**Action:** delete only the `// cc:` comment. No code change — the surrounding `@deprecated`
docstring already answers the question it was asking.

---

## Finding 3 — `usergroups` has no Postgres data-migration config (documented gap, not this PR's scope)

While auditing the Postgres-backed tables (`password_recoveries`, `users`, `captchas`,
`usergroups`) for provisioning/migration-config/test coverage, `usergroups` is the odd one out:
it has a schema migration (`014-create-usergroups-table.sql`), a full `PostgresUserGroupsDAO`/
`PostgresUserGroupsDataSource`, and passing specs (24/24), but no `UserGroupsMigrationConfig` in
`app/api/core/infrastructure/postgresql/migrations/configs/` — unlike `PasswordRecoveryMigrationConfig`
and `UsersMigrationConfig`, which exist alongside their tables.

This is a documented decision, not an oversight: `users-refactor-00-decisions.md`'s "Out,
deliberately" list (line 239) names "Postgres migration of anything beyond the
`usergroups.members` index" as explicitly out of scope for this refactor — the real Mongo→Postgres
data cutover for `usergroups` is deferred to a later, separate plan (the GIN index itself was also
dropped, per A6, so migration 015 never landed either).

**Action:** none for this plan. Flagging it here so the gap is traceable from the DAO-shim cleanup
context rather than only living in the decisions doc; a `UserGroupsMigrationConfig` (mirroring
`UsersMigrationConfig`'s shape) is needed before `postgresUsergroups` can be flipped on for real
tenant cutovers.

---

## Net diff for the follow-up PR

- Remove 4 dead legacy shim methods (2 per DAO) + their comment blocks in `MongoUsersDAO.ts` and
  `PostgresUsersDAO.ts`, trimming now-unused imports.
- Remove the stray `// cc:` comment on `encryptPassword.ts` (no functional change).
- Run `MongoUsersDAO.spec.ts` and `PostgresUsersDAO.spec.ts` afterward to confirm nothing broke —
  they don't reference the removed methods, so this should be a no-op check.
