# Plan: Remove `users.unlockAccount` (and **keep** the `v2UsersUtilityRoutes` flag)

The fifth sibling of [plan 06](./users-refactor-06-remove-users-save.md),
[07](./users-refactor-07-remove-users-newuser.md),
[08](./users-refactor-08-remove-users-delete.md) and
[09](./users-refactor-09-remove-users-login.md). Delete the v1 self-service unlock flow so
`POST /api/unlockaccount` has one implementation: `UnlockAccountController` → `UnlockAccount`
use case.

Unlike plan 09, **the flag does not go with it.** `v2UsersUtilityRoutes` gates **four**
routes — `/api/unlockaccount`, `/api/users/unlock`, `/api/recoverpassword` and
`/api/resetpassword` — and only the first loses its fallback here. The flag, its tenant
documents and the other three branches stay untouched; they come out in a later plan when
`simpleUnlock`, `recoverPassword` and `resetPassword` go.

**Done when:** `grep -rn "unlockAccount" app/api/users/` returns nothing, and
`grep -rn "v2UsersUtilityRoutes" app/` returns exactly the three remaining routes, their
controllers and the three flag declarations.

---

## Parity audit (done before writing this plan)

Compared `app/api/users/users.js:114-130` (v1) against
`app/api/core/application/UnlockAccount.ts` (v2) and both data sources. **v2 covers every v1
rule**, and covers two of them better.

| v1 rule                                                      | v2 equivalent                                                                                    | verdict                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| look up by `username` + `accountUnlockCode`                  | `findByUsernameAndUnlockCode` on both data sources, same two-field filter                        | ✅ identical                                  |
| exclude soft-deleted (`deletedAt: { $exists: false }`)       | the DAO's default scope, `deleted: 'exclude'` (D5) — same policy in both `UserReadOptions` copies | ✅ identical — but see the Postgres test gap   |
| —                                                            | the default scope **also** excludes `PUBLIC_USER_ID`                                             | ✅ hardening; the public user has no unlock code |
| reject with `Invalid username or unlock code`                | `InvalidUnlockCode`, same message string (`errors.ts:52`)                                        | ⚠️ 403 → 400 — see gap 1                      |
| clear `accountLocked`, `accountUnlockCode`, `failedLogins`   | `clearLockFields`                                                                                | ⚠️ `false` → unset/`null` — see gap 2         |
| respond `'OK'`                                               | unchanged — the controller already answers `'OK'` on both paths                                  | ✅ identical                                  |
| Mongo only                                                   | backend chosen by `UsersDataSourceFactory`                                                       | ✅ fixes a live bug — see note 1              |

`UnlockAccountController.spec.ts` already drives the v2 path end to end through the HTTP
route (success, wrong code, unknown username, empty body). Like plan 09 and unlike plan 08,
**almost no coverage has to be built before deleting v1** — one Postgres data-source case,
step 1.

### Gap 1 — 403 becomes 400 (accept, no fix)

v1 threw `createError('Invalid username or unlock code', 403)`. v2 throws
`InvalidUnlockCode`, a `DomainError`, and `handleError.js:132` maps every `DomainError` to
**400** (`UnlockAccountController.spec.ts:77` pins the 400 today).

This is **not** plan 09's situation, where the same shift changed client behaviour and had to
be undone. Here both statuses land on the same rendering in the legacy client:

- **403** → `isNonUsualApiError` is true (403 is not in `[401, 404, 409, 500]`,
  `api.js:19,101`) → danger toast carrying `error.json.error`.
- **400** → `extractMessageFromValidation` (`api.js:74`), which with no `validations` key on
  the body returns the translated `error.json.error` (`api.js:58-60`) → the same danger
  toast, same text.

And the only caller, `UnlockAccount.jsx:18`, navigates to `/login` in both the `then` and the
`catch`, so the route outcome is identical either way. Accept the change.

### Gap 2 — `false` becomes unset / `null` (accept)

v1 wrote `accountLocked: false, accountUnlockCode: false, failedLogins: false` through
`model.save`. `clearLockFields` `$unset`s the three on Mongo and nulls them on Postgres.

Every reader treats the fields as booleans/counters through the mappers
(`Boolean(accountLocked)`, `failedLogins ?? 0`), so absent and `false` are the same value.
Two things already prove it: v1's own `simpleUnlock` has always used `$unset` for the same
three fields, and `clearLockFields` is the shared implementation behind `UnlockBlockedUser`
and `ResetPassword`, both already live behind this flag.

### Gap 3 — invalid request body: 400 becomes 422

Removing the route's ajv gate leaves `UnlockAccountInputSchema` as the only validation. Ajv
errors become `createError(e, 400)` (`validateRequest.js:24`); `ZodError` maps to 422
(`handleError.js:107`). Same required-fields guarantee (`username`, `code`, both strings),
same shift as plans 06, 07 and 09 — accept it. `UnlockAccountController.spec.ts:90` already
pins the 422.

### Note 1 — v1 was Mongo-only

With `postgresUsers` **on** and `v2UsersUtilityRoutes` **off**, v1 cleared the lock fields in
Mongo while `Login` — v2-only since plan 09 — read them from Postgres: the unlock link
silently did nothing and the account stayed locked. No tenant should be in that combination,
but removing v1 makes the combination impossible. Worth a line in the PR.

---

## Full inventory

| file                                                       | what                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `app/api/users/users.js:108-131`                           | `unlockAccount` and its `@deprecated` block                                     |
| `.../express/users/UnlockAccountController.ts:10,40-43`    | the flag branch and the `else` fallback                                         |
| `.../express/users/UnlockAccountController.ts:2`           | `import users` — unused afterwards                                              |
| `.../express/users/routes.ts:83-106`                       | the `/api/unlockaccount` flag-conditional ajv middleware                        |
| `app/api/users/specs/users.spec.js:27-94`                  | `describe('unlockAccount')`                                                     |
| `app/api/users/specs/routes.spec.ts:178-197`               | `describe('/unlockaccount')`                                                    |
| `app/api/users/specs/routes.spec.ts:4,12`                  | `WithId` and `User` imports — line 190 is their only use                        |
| `.../users/specs/UnlockAccountController.spec.ts:49-51`    | `changeCurrentTenant({ v2UsersUtilityRoutes: true })` — meaningless for this route |
| `.../postgresql/user/specs/PostgresUsersDataSource.spec.ts:416-434` | missing the soft-deleted case Mongo has — step 1                       |

`UnlockAccountController` is the only production caller of `users.unlockAccount`.

**Explicitly out of scope:** `app/api/config.ts:177`, `app/api/tenants/tenantsModel.ts:63`,
`app/api/tenants/tenantContext.ts:48`, the three other route branches in `routes.ts` and
their controllers, and the flag on tenant documents. All still needed.

---

## Step 1: Close the Postgres soft-delete gap

**Files:** `app/api/core/infrastructure/postgresql/user/specs/PostgresUsersDataSource.spec.ts`

Excluding soft-deleted users is the one v1 rule that survives only as a DAO default rather
than as an explicit filter at the call site. Mongo pins it
(`MongoUsersDataSource.spec.ts:349`); Postgres does not. Pin it before deleting the v1 rule
that stated it out loud.

**Do:**

- Add a third case to `describe('findByUsernameAndUnlockCode')`: insert a user with
  `accountUnlockCode: 'the-code'` and a `deletedAt`, then assert the lookup fails with
  `InvalidUnlockCode`. Follow the file's `insertUser(TENANT_ID, {...})` helper.

**Test:** `yarn jest app/api/core/infrastructure/postgresql/user/specs/PostgresUsersDataSource.spec.ts`

---

## Step 2: Collapse the controller

**Files:** `app/api/core/infrastructure/express/users/UnlockAccountController.ts`

**Skeleton:**

```ts
class UnlockAccountController extends AbstractController<UnlockAccountRequest> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const input = UnlockAccountInputSchema.parse(this.request.body);
      await UnlockAccountUseCaseFactory.default().execute(input);
      // ...unchanged logging + response
    } catch (error: unknown) {
      // ...unchanged
    }
  }
}
```

**Do:**

- Drop the `if (ExecutionContext.tenant.featureFlags?.v2UsersUtilityRoutes)` wrapper and the
  whole `else`, de-indenting the body one level. Keep the try/catch, both `ExecutionContext.logger`
  calls and the `'OK'` response exactly as they are.
- Remove `import users from '#api/users/users.js'`. Keep the `ExecutionContext` import —
  still used by the logger.
- **Do not** touch the other three controllers; they keep their flag branches.

---

## Step 3: Collapse the route

**Files:** `app/api/core/infrastructure/express/users/routes.ts`

**Skeleton:**

```ts
app.post('/api/unlockaccount', UnlockAccountController.createHandler());
```

**Do:**

- Delete the flag-conditional middleware in front of `UnlockAccountController.createHandler()`
  — its only job was feeding the v1 fallback an ajv-validated body.
- Leave the identical blocks on `/api/users/unlock`, `/api/recoverpassword` and
  `/api/resetpassword` alone, so `validation` and `tenants` stay imported.

---

## Step 4: Delete v1

**Files:** `app/api/users/users.js`

**Do:**

- Delete `unlockAccount` and the `@deprecated` block above it. `createError` and `model` stay
  — `resetPassword`, `simpleUnlock` and the getters still use both.
- Leave `simpleUnlock` in place: it is the *admin* unlock's v1 fallback and is still called
  by v1 `resetPassword`.

---

## Step 5: Drop the v1 specs

**Files:** `app/api/users/specs/users.spec.js`, `app/api/users/specs/routes.spec.ts`,
`.../express/users/specs/UnlockAccountController.spec.ts`

**Do:**

- `users.spec.js`: delete `describe('unlockAccount')` (lines 27-94) whole. Keep
  `describe('simpleUnlock')` below it.
- `routes.spec.ts`: delete `describe('/unlockaccount')` (lines 178-197), then the now-unused
  `WithId` and `User` imports.
- `UnlockAccountController.spec.ts`: delete the `testingTenants.changeCurrentTenant({
  featureFlags: { v2UsersUtilityRoutes: true } })` call from the `beforeEach` — the same move
  plan 09 made in `LoginController.spec.ts`. The four existing cases then prove the v2 path
  runs with the flag unset, which is the regression guard this plan needs. Drop the
  `testingTenants` import if nothing else in the file uses it.

**Test:** `yarn jest app/api/users app/api/core/infrastructure/express/users`

---

## Step 6: Verify

```
yarn jest app/api/users app/api/core/infrastructure/express/users app/api/core/infrastructure/postgresql/user
yarn check-app-types
grep -rn "unlockAccount" app/api/users/          # nothing
grep -rn "v2UsersUtilityRoutes" app/             # 3 routes + 3 controllers + 3 declarations
```

Manual check worth doing once, since no e2e covers it: lock an account (6 failed logins),
follow the `/unlockaccount/{username}/{code}` link from the email, confirm the redirect to
`/login` and that the account is usable again; then hit the link a second time and confirm
the danger toast reads `Invalid username or unlock code`.
