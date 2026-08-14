# Plan: Remove `users.delete` and the `v2UsersDelete` flag

The third sibling of [plan 06](./users-refactor-06-remove-users-save.md) and
[plan 07](./users-refactor-07-remove-users-newuser.md). Delete the v1 deletion path
permanently so `DELETE /api/users` has one implementation: `DeleteUserController` →
`DeleteUsers` use case.

**Done when:** `grep -rn "v2UsersDelete" app/ docs/` returns nothing, and `users.js` has no
`delete` method.

---

## Parity audit (done before writing this plan)

Compared `app/api/users/users.js:212-229` (v1) against `app/api/core/application/DeleteUsers.ts`
(v2) plus its two data sources. **v2 covers every v1 rule.** Findings, in the order they matter:

| v1 rule                                    | v2 equivalent                                                         | verdict                                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| reject if `ids` contains `PUBLIC_USER_ID`  | `IsDeleteOfPublicUser`, same first check                              | ✅ identical                                                                                                                                                 |
| reject if `ids` contains the caller        | `IsDeletingSelf`, actor from `ExecutionContext` instead of `req.user` | ✅ same rule, **different position** — see gap 1                                                                                                             |
| reject if the delete would empty the table | `countActiveUsers() === 1`                                            | ⚠️ different arithmetic — see gap 2                                                                                                                          |
| `removeUsersFromAllGroups(ids)`            | `usergroupsDS.removeUsersFromGroups(ids)`                             | ✅ literally the same `$pull` on Mongo (`MongoUserGroupsDataSource.ts:42`), equivalent `jsonb_agg` on Postgres, and now inside a transaction with the delete |
| returns Mongo `DeleteResult`               | returns `modifiedCount` from `softDelete`                             | ✅ controller already normalises both into `{ acknowledged, deletedCount }`                                                                                  |

### Gap 1 — check order (fix in step 1)

v1 is public → **self** → last-user. v2 is public → **last-user** → self. Only observable
for a lone admin deleting their own account: v1 answers _"Can not delete yourself"_, v2
answers _"Cannot delete last remaining user"_. Both are 4xx and both refuse, but the v1
message is the more useful one and there is no reason to drift. Reorder v2.

### Gap 2 — last-user arithmetic (accept, but pin it)

v1: `count({_id: {$ne: PUBLIC_USER_ID}}) > ids.length`. That count has **no `deletedAt`
filter**, so it includes soft-deleted users; the comparison is against the raw request
length, so duplicate or non-existent ids inflate it.

v2: `countActiveUsers() === 1`, where both DAOs' default scope already excludes soft-deleted
_and_ system users.

The two diverge only on inputs the UI cannot produce:

- `[B, B]` or `[B, <ghost id>]` with two active users → v1 refuses ("last user(s)"), v2
  deletes B and leaves the actor. **v2 is right**: the actor is active and cannot be in
  `ids`, so at least one active user always survives.
- one active user (the actor) + several soft-deleted ones, deleting a ghost id → v1 allowed
  the no-op, v2 answers 400. Harmless, and the stricter reading.

Accept v2's version; step 2 pins both branches so nobody "fixes" it back.

### Behaviour that changes for flag-off tenants when v1 goes

Already true wherever the flag is on. Call these out in the PR; do not try to undo them.

- **403 → 400.** v1 used `createError(..., 403)`; `DomainError` maps to 400 in
  `handleError.js:128`. The Settings UI does not branch on status — it renders
  `error.detail ?? error.message` (`Users.tsx:60-64`) — so this is invisible to users.
  Messages change wording: _"Can not delete yourself"_ → _"Users cannot delete themselves"_,
  _"Can not delete last user(s)."_ → _"Cannot delete last remaining user"_.
- **Hard delete → soft delete.** v1 issued `model.delete`; v2 sets `deletedAt` (D5). The
  `username`/`email` unique indexes are partial on `deletedAt: null`
  (`usersModel.ts:10,17`), so reusing a deleted user's name still works.
- **Deletion becomes transactional.** Group cleanup and the delete now commit together;
  v1 pulled the memberships first and could leave them stripped if the delete then failed.

---

## Full inventory

| file                                                                         | what                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `app/api/core/infrastructure/express/users/DeleteUserController.ts:34,64-71` | the branch + the `users.delete` call                                                  |
| `app/api/core/application/DeleteUsers.ts:26-32`                              | check order (gap 1)                                                                   |
| `app/api/users/users.js:206-229`                                             | `delete` + its `@deprecated` block                                                    |
| `app/api/users/users.js:7,8`                                                 | `removeUsersFromAllGroups` and `PUBLIC_USER_ID` imports — `delete` is their only user |
| `app/api/config.ts:167`                                                      | default `false`                                                                       |
| `app/api/tenants/tenantsModel.ts:49`                                         | mongoose schema field                                                                 |
| `app/api/tenants/tenantContext.ts:38`                                        | `Tenant` type field                                                                   |
| `app/api/users/specs/users.spec.js:522-616`                                  | `describe('delete()')`                                                                |
| `app/api/users/specs/users.spec.js:672-711`                                  | `describe('protection of system users') > describe('delete')`                         |
| `app/api/users/specs/routes.spec.ts:230-258`                                 | the `DELETE` block (mocks `users.delete`, flag defaults off → v1 path)                |
| `.../users/specs/DeleteUserController.spec.ts:31,126`                        | `changeCurrentTenant` calls that exist **only** to set the flag                       |

Nothing else calls `users.delete` — the controller is its single production caller.

---

## Step 1: Match v1's check order in the use case

**Files:** `app/api/core/application/DeleteUsers.ts`

**Do:**

- Move the `ids.includes(this.actorId)` / `IsDeletingSelf` check above the
  `countActiveUsers()` check, so the order is public → self → last-user.
- Leave the last-user condition itself alone (gap 2 above).

**Test:** `DeleteUserController.spec.ts:100-135` currently asserts _"Cannot delete last
remaining user"_ for a lone admin deleting themselves — that fixture has exactly one active
user and passes its own id. After the reorder it must assert _"Users cannot delete
themselves"_. Update it, and add a second case in the same `describe` that keeps the
last-user error reachable: a second active user in the fixture, the admin deleting **that**
other user's id, is not a last-user case — so instead assert the error from a fixture with
one active user plus a ghost id in `ids`.

---

## Step 2: Port the v1 spec cases that v2 does not have

**Files:** `app/api/core/application/specs/DeleteUsers.spec.ts` (new),
`app/api/core/infrastructure/express/users/specs/DeleteUserController.spec.ts`

The use case has **no unit spec** — everything runs through the controller. Before deleting
`users.spec.js`'s coverage, check each case has a v2 home. Missing today:

- **bulk delete** — the controller spec only ever deletes one id
  (`users.spec.js:522-536` covers two).
- **public user inside a bulk list** (`users.spec.js:684-690`) — the controller spec only
  sends the public id alone.
- **group cleanup for multiple ids at once** (`users.spec.js:601-615`).
- **both last-user branches** from gap 2 — the soft-deleted-users-don't-count case (already
  in the controller spec's `last valid user` fixture) and the duplicate/ghost-id case that
  v1 refused and v2 allows.

**Do:**

- Add `DeleteUsers.spec.ts` next to `DeleteUserGroups.spec.ts`, using
  `DeleteUsersUseCaseFactory` under `testingEnvironment.runWithContext` the same way
  (`app/api/core/application/specs/DeleteUserGroups.spec.ts:12` is the pattern). Cover the
  three guards, the returned count, and the group cleanup.
- Add the bulk and bulk-with-public-user cases to `DeleteUserController.spec.ts`; that spec
  already has the group assertions to copy.

**Test:** `yarn jest app/api/core/application/specs/DeleteUsers.spec.ts app/api/core/infrastructure/express/users/specs/DeleteUserController.spec.ts`

---

## Step 3: Collapse `DeleteUserController` to the v2 path

**Files:** `app/api/core/infrastructure/express/users/DeleteUserController.ts`

**Skeleton:**

```ts
class DeleteUserController extends AbstractController<DeleteUserRequest> {
  protected async handle(): Promise<void>; // v2 body only, no branch
}
```

**Do:**

- Delete the `if (ExecutionContext.tenant.featureFlags?.v2UsersDelete)` wrapper and the
  `else` block (lines 64-71). Keep the try/catch and both logger calls, and keep the
  `ExecutionContext` import — the logger still uses it.
- Drop `import users from '#api/users/users.js'`.
- Keep the `IdsSchema` JSON pre-parse and `DeleteUserInputSchema.parse` — they ran for both
  branches and are what produce the 422s.
- The success response stops going through the bare `this.response.json(...)`; everything
  answers 200 with `{ acknowledged: true, deletedCount }` as before.

**Test:** `yarn jest app/api/core/infrastructure/express/users/specs/DeleteUserController.spec.ts`

---

## Step 4: Delete `users.delete`

**Files:** `app/api/users/users.js`

**Do:**

- Delete `delete` and its `@deprecated` block (206-229).
- Drop the two imports it alone kept alive: `removeUsersFromAllGroups` (keep
  `getByMemberIdList`, used by `get`/`getById`) and `PUBLIC_USER_ID`.
- Keep `createError` — `login`, `unlockAccount` and `resetPassword` still use it.
- **Follow-up, not this PR:** `removeUsersFromAllGroups`
  (`app/api/usergroups/userGroupsMembers.ts:38`) is then referenced only by its own spec,
  exactly like `updateUserMemberships` after plan 07. Note it; deleting it is a user-groups
  concern.

**Test:** none of its own — step 5 plus `yarn tsc` / `yarn lint` catch stragglers.

---

## Step 5: Prune the specs

**Files:** `app/api/users/specs/users.spec.js`, `app/api/users/specs/routes.spec.ts`,
`app/api/core/infrastructure/express/users/specs/DeleteUserController.spec.ts`

**Do:**

- `users.spec.js`: delete `describe('delete()')` and the `describe('protection of system
users') > describe('delete')` block. The outer `protection of system users` describe has
  no other child — remove it whole.
- `users.spec.js`: `userToDelete`/`userToDelete2` stay imported (line 355 still uses
  `userToDelete`), but let lint confirm rather than assuming. The fixture users themselves
  stay; other describes count them (`get` expects 6 users).
- `routes.spec.ts`: delete the whole `describe('DELETE')` block and the now-unused
  `DeleteResult` import from `mongodb`. Keep the `users` import — the `GET` block still
  spies on `users.get` for the `v2UsersGet` fallback.
- `DeleteUserController.spec.ts`: line 31's `changeCurrentTenant` sets **only** the flag, so
  delete the call outright (unlike plan 07, where it also set `domain`). Line 126's does the
  same and goes with it — but check first whether the `setUp` on line 102 resets the tenant,
  in which case nothing replaces it.

**Test:** `yarn jest app/api/users app/api/core/infrastructure/express/users`

---

## Step 6: Remove the flag declaration

**Files:** `app/api/config.ts`, `app/api/tenants/tenantsModel.ts`, `app/api/tenants/tenantContext.ts`

**Do:**

- Delete `v2UsersDelete` from all three. As in plans 06 and 07, no migration: mongoose
  ignores the stale key on tenants that have it set.

**Test:** none, declaration-only. `yarn tsc` proves nothing else reads it.

---

## Step 7: Close out

**Do:**

- `grep -rn "v2UsersDelete" app/ docs/` → empty; `grep -rn "users.delete" app/api/` → empty.
- `yarn lint && yarn tsc`.
- `docs/migration-status.html` has no `v2UsersDelete` row today — run the `migration-status`
  skill rather than assuming it needs nothing.

**Test:** `yarn jest app/api/users app/api/usergroups app/api/tenants` plus the targeted core
specs (`core/application/specs/DeleteUsers.spec.ts`,
`core/infrastructure/express/users`) — `app/api/core` as a whole is too large to run here.
Then delete a user through the Settings UI on a flag-off tenant and confirm: the row
disappears, the user's group memberships are gone, and their username can be reused when
creating a new user — that last one is the soft-delete consequence no unit test exercises
end to end.

---

## Outcome

Executed 2026-08-14. Deviations and findings:

- **`routes.spec.ts` kept its `DELETE` block**, trimmed to the `should need authorization`
  case. Step 5 said to delete the block whole, but that 401 test is the only coverage of
  `needsAuthorization()` on this route — `DeleteUserController.spec.ts` injects an admin and
  never exercises a rejection. The other two cases went: the 422 is duplicated in the
  controller spec, and `should use users to delete it` only asserted the v1 call.
- **The `last valid user` describe became a `beforeEach` with two cases.** The reorder in
  step 1 turned its single assertion into the self-delete error, so the last-user error
  needed a fixture where the actor is _not_ in `ids` — one active user plus a ghost id.
- **Gap 2 is now pinned in both directions.** `DeleteUsers.spec.ts` asserts that duplicate
  and unknown ids do _not_ trip the last-user guard (v1 refused that request) and that the
  guard ignores soft-deleted and system users (v1 counted the soft-deleted ones).
- `users.spec.js` lost the `PUBLIC_USER_ID`, `blockedUserId` and `userToDelete2` imports
  along with the two describes; `userToDelete` stayed (a `recoverPassword` test uses it).
  The fixture users themselves were left alone — other describes count them.
- **`docs/migration-status.html` did need edits after all**, though not for the flag: the
  script reported no drift, but two prose claims were false. The users row and the
  _Uneven parity_ watch-out both credited users with a cross-backend consistency suite;
  there is none — `UsersGettersConsistency.spec.ts` pins v1 `getById` across `v2UsersGet`,
  and the only `*Consistency.spec.ts` files under `core` are for user groups, files and
  captcha. The two Postgres/Mongo users data sources are specced separately. Also corrected
  the legacy user-groups consumer list (it missed `activitylog/helpers.js` and
  `ServerUserGroupsService.ts`), re-stamped to `f27be07ca7`, and republished the artifact.
- `app/api/tenants/specs/tenantsModel.spec.ts` fails when run in the same invocation as
  `app/api/usergroups` — a change-stream timing flake, **pre-existing**: it reproduces with
  the three tenant/config files stashed, and the suite passes on its own.
- Not done: the manual UI pass from step 7 (delete a user through Settings, confirm the
  username can be reused). It needs a running instance.
