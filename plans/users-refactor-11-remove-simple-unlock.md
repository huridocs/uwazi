# Plan: Remove `users.simpleUnlock` (the flag still stays)

The sixth sibling of [plan 06](./users-refactor-06-remove-users-save.md) through
[10](./users-refactor-10-remove-unlock-account.md). Delete the v1 admin unlock flow so
`POST /api/users/unlock` has one implementation: `UnlockBlockedUserController` →
`UnlockBlockedUser` use case.

Like plan 10 and unlike plan 09, **`v2UsersUtilityRoutes` does not go with it** — it still
gates `/api/recoverpassword` and `/api/resetpassword`. After this plan two routes are left on
it, and the flag comes out with them.

What makes this one different from plan 10: `simpleUnlock` has **two** callers. The second,
v1 `resetPassword`, outlives this plan — see gap 3, which is the only real decision here.

**Done when:** `users.js` exports no `simpleUnlock`, and `grep -rn "v2UsersUtilityRoutes" app/`
returns only the two remaining routes, their two controllers and the three declarations.

---

## Parity audit (done before writing this plan)

Compared `app/api/users/users.js:115-120` (v1) against
`app/api/core/application/UnlockBlockedUser.ts` (v2) and both data sources. This is the
narrowest v1 method in the series — five lines with no branching — and v2 covers all of it.

| v1 rule                                                  | v2 equivalent                                                                            | verdict                        |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| `$unset` the three lock fields for one `_id`             | `clearLockFields` — literally the same `$unset` on Mongo, `null`s on Postgres             | ✅ identical                   |
| `updateMany` with an `_id` filter                        | `updateOne`                                                                              | ✅ equivalent — an `_id` filter matches at most one document |
| no existence check; an unknown id still answers `'OK'`   | `UnlockBlockedUser.execute` doesn't check either                                          | ✅ identical                   |
| admin-only, password re-confirmed                        | `needsAuthorization()` + `validatePasswordMiddleWare` sit on the route **ahead of** the flag branch | ✅ untouched by this plan      |
| no soft-delete / system-user guard on the write          | `dao.updateOne` goes through `scoped()`                                                  | ⚠️ hardening — gap 2           |
| ajv body: `_id` string, `additionalProperties: false`    | `z.object({ _id: z.string() })` — strips unknown keys instead of rejecting                | ⚠️ contract loss — gap 1       |
| Mongo only                                               | backend chosen by `UsersDataSourceFactory`                                               | ✅ fixes the plan-10 bug again |

`UnlockBlockedUserController.spec.ts` drives the v2 path end to end (unlock + 422 on a
missing `_id`). What it does **not** cover is the route-level admin check and the strict
body, which today live only in `routes.spec.ts` — step 2 moves them rather than deleting
them.

### Gap 1 — the strict body contract (restore it with `.strict()`)

The ajv gate rejects `{ _id, extra }` and `{ _id: 0 }` with 400
(`routes.spec.ts:95-109` tests exactly that). `UnlockBlockedUserInputSchema` is a plain
`z.object`, and zod **strips** unknown keys rather than rejecting them.

Note what this is and isn't: tenants already running with the flag **on** accept extra keys
today, because the ajv gate only ever ran on the v1 branch. So the removal doesn't introduce
the laxity — it makes it uniform. But the strict body was deliberate, and it is one `.strict()`
away, with precedent in `TemplateDTOs.ts:72,86`.

**Do it:** add `.strict()`. A bad body then answers 422 instead of ajv's 400 — the same shift
plans 06, 07, 09 and 10 accepted, and the V2 client is status-agnostic here
(`UserFormSidepanel.tsx:198` funnels everything into `notifyMutationError`).

### Gap 2 — soft-deleted and system users stop being unlockable (accept)

v1's `updateMany` was unguarded. v2's write goes through `MongoUsersDAO.updateOne` →
`scoped()`, which excludes `deletedAt` documents and `PUBLIC_USER_ID` (D5).

Both versions answer `'OK'` without checking that anything was modified, so from the client's
side nothing changes: unlocking a soft-deleted user goes from silently succeeding to silently
no-opping. The admin UI can only select live users. Accept.

### Gap 3 — the second caller (the decision)

`resetPassword` calls `simpleUnlock` internally at `users.js:182`:

```js
.then(() => this.simpleUnlock({ _id: key.user }))   // an object
```

while the controller passes the id itself:

```js
await users.simpleUnlock(this.request.body._id);    // a string
```

Both work only because mongoose's `castObjectId` unwraps a `._id` property before casting
(`node_modules/mongoose/lib/cast/objectid.js:15-22`). Worth knowing, because it means the
object form was never intentional.

v1 `resetPassword` is gated by this same flag and is **not** in scope here, so its unlock
behaviour has to survive. `users.spec.js:170` ("should reset the unsuccessful logins count
and unlock the user") pins it.

**Decision: demote `simpleUnlock` to a module-local helper instead of deleting it.** The
public v1 surface loses its unlock method — which is what this plan is for — and the five
lines that `resetPassword` still needs stay next to it, to be deleted together in the next
plan.

**Rejected:** having v1 `resetPassword` call `UsersDataSourceFactory.default().clearLockFields()`.
It would make a v1 method write through the v2 stack, and on a `postgresUsers` tenant it would
clear the lock fields in Postgres while the `model.save` on the line above still writes the
password to Mongo. The five duplicated lines are cheaper than that split.

**Also considered:** folding plans 11 and 12 together — `simpleUnlock`, `recoverPassword` and
`resetPassword` all go at once and the flag comes out in the same PR. That avoids the helper
entirely. Rejected only because `recoverPassword`/`resetPassword` carry the
`passwordRecoveriesModel` and mailer surface, which is a much larger audit than this one; if
you'd rather do one bigger PR, this plan folds into that one cleanly.

---

## Full inventory

| file                                                    | what                                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `app/api/users/users.js:108-120`                        | `simpleUnlock` + its `@deprecated` block → becomes a module-local helper    |
| `app/api/users/users.js:182`                            | `this.simpleUnlock({ _id: key.user })` → the helper, called with the id     |
| `.../express/users/UnlockBlockedUserController.ts:13,43-46` | the flag branch and the `else` fallback                                |
| `.../express/users/UnlockBlockedUserController.ts:5`    | `import users` — unused afterwards                                         |
| `.../express/users/routes.ts:60-79`                     | the flag-conditional ajv middleware **only** — the two middlewares above it stay |
| `app/api/core/application/UnlockBlockedUser.ts:5-7`     | `.strict()` on the schema (gap 1)                                          |
| `app/api/users/specs/users.spec.js:27-43`               | `describe('simpleUnlock')`                                                 |
| `app/api/users/specs/routes.spec.ts:73-117`             | `describe('/users/unlock')` — two of its three cases move first, step 2    |
| `.../users/specs/UnlockBlockedUserController.spec.ts:48-50` | the flag in `beforeEach`                                               |

**Out of scope:** `config.ts:177`, `tenantsModel.ts:63`, `tenantContext.ts:48`, the
`/api/recoverpassword` and `/api/resetpassword` branches and their controllers,
`recoverPassword`, `resetPassword`, and the `needsAuthorization` / `validatePasswordMiddleWare`
middlewares.

---

## Step 1: Restore the strict body

**Files:** `app/api/core/application/UnlockBlockedUser.ts`

**Skeleton:**

```ts
const UnlockBlockedUserInputSchema = z
  .object({
    _id: z.string(),
  })
  .strict();
```

**Do:**

- Add `.strict()` and nothing else. Leave `UnlockAccountInputSchema` alone — plan 10 audited
  and accepted its non-strict body, and the two routes have different clients.

**Test:** covered by the case added in step 2.

---

## Step 2: Move the route-level coverage into the controller spec

**Files:** `.../express/users/specs/UnlockBlockedUserController.spec.ts`

`routes.spec.ts:86-93` (admin-only) and `:95-109` (strict body) are the **only** coverage of
those two rules. Move them before deleting the describe, same as plan 09 step 2.

**Do:**

- Make the injected user mutable, mirroring `routes.spec.ts:53-57` — the spec currently hard-codes
  an admin in `setUpApp`:

  ```ts
  let currentUser: object = { _id: f.idString('admin'), role: 'admin', username: 'admin' };
  const app = setUpApp(userRoutes, (req, _res, next) => {
    (req as any).user = currentUser;
    next();
  });
  ```

  Reset it to the admin in `beforeEach` so one case cannot leak into the next.
- Add: an editor gets 401 and the user stays locked (`needsAuthorization()` runs before the
  controller, so this proves the middleware is still wired after step 4).
- Add: `{ _id: <id>, extra: 'x' }` → 422, and `{ _id: 0 }` → 422 — the strict-body cases from
  step 1.
- Delete the `testingTenants.changeCurrentTenant({ featureFlags: { v2UsersUtilityRoutes: true } })`
  from `beforeEach`, and the `testingTenants` import if nothing else uses it. The suite then
  runs with the flag unset, which is this plan's regression guard.
- Note what stays uncovered on purpose: the spec mocks `validatePasswordMiddleWare` to a
  passthrough, so password re-confirmation has no test here and had none before.

**Test:** `yarn jest .../specs/UnlockBlockedUserController.spec.ts` — should fail on the two
strict cases until step 1 is in, then pass.

---

## Step 3: Collapse the controller

**Files:** `.../express/users/UnlockBlockedUserController.ts`

**Do:**

- Drop the `if (ExecutionContext.tenant.featureFlags?.v2UsersUtilityRoutes)` wrapper and the
  whole `else`, de-indenting the body one level. Keep the try/catch, both logger calls and the
  `'OK'` response byte for byte.
- Remove `import users from '#api/users/users.js'`; keep `ExecutionContext` (the logger).
- Identical shape to plan 10 step 2 — diff the two controllers afterwards, they should differ
  only in their log messages and schema names.

---

## Step 4: Collapse the route

**Files:** `.../express/users/routes.ts`

**Skeleton:**

```ts
app.post(
  '/api/users/unlock',
  needsAuthorization(),
  validatePasswordMiddleWare,
  UnlockBlockedUserController.createHandler()
);
```

**Do:**

- Delete only the flag-conditional middleware. **Keep `needsAuthorization()` and
  `validatePasswordMiddleWare`** — they are not v1 fallbacks, they guard both paths, and
  dropping them would make the route world-callable.
- `validation` and `tenants` stay imported; `/api/recoverpassword` and `/api/resetpassword`
  still use both.

---

## Step 5: Demote `simpleUnlock` to a helper

**Files:** `app/api/users/users.js`

**Skeleton:**

```js
// v1-only. `resetPassword` below is the sole caller; both go together when
// `v2UsersUtilityRoutes` loses its last two routes. The v2 path is
// `UsersDataSource.clearLockFields`.
const clearLockFieldsV1 = async _id =>
  model.updateMany(
    { _id },
    { $unset: { accountLocked: 1, accountUnlockCode: 1, failedLogins: 1 } }
  );
```

**Do:**

- Move the body to a module-level function next to `conformRecoverText`, and delete the
  `simpleUnlock` member and its `@deprecated` block from the exported object.
- Rewire `resetPassword`: `.then(() => clearLockFieldsV1(key.user))` — pass the id, not
  `{ _id: key.user }`. The old object form only worked through mongoose's casting quirk
  (gap 3); don't carry it forward.
- Nothing else in `app/` references `simpleUnlock` (verified), so there is no other call site
  to rewire.

**Test:** `users.spec.js:170` must still pass — it is what proves the rewire kept
`resetPassword`'s unlock.

---

## Step 6: Drop the v1 specs

**Files:** `app/api/users/specs/users.spec.js`, `app/api/users/specs/routes.spec.ts`

**Do:**

- `users.spec.js`: delete `describe('simpleUnlock')` (lines 27-43). Its "should keep fields
  intact in other users" case is the only test of the `_id` filter's precision — it is not
  worth reproducing against the v2 path, which uses `updateOne`.
- `routes.spec.ts`: delete `describe('/users/unlock')` (73-117) whole, including the
  `unlockMock` spy in its `beforeAll`/`afterAll`. Both surviving rules moved in step 2.
- Re-check imports afterwards, as in plan 10 — `users` is still used by other describes here,
  but confirm rather than assume.

**Test:** `yarn jest app/api/users app/api/core/infrastructure/express/users`

---

## Step 7: Verify

```
yarn jest app/api/users app/api/core/infrastructure/express/users app/api/core/infrastructure/postgresql/user app/api/core/infrastructure/mongodb/user app/api/auth
yarn check-app-types
npx eslint <touched files>
grep -rn "simpleUnlock" app/            # nothing
grep -rn "v2UsersUtilityRoutes" app/    # 2 routes + 2 controllers + 3 declarations
```

Manual check, since no e2e covers it: lock a user (6 failed logins), unlock them from
Settings → Users with an admin password confirmation, confirm the toast and that the lock
fields are gone; then confirm an editor session gets 401 from the same endpoint.
