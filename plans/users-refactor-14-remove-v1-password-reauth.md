# Plan: Remove the v1 password re-auth fallback and retire `v2PasswordReauth`

The last of the auth-flag removals, after [13](./users-refactor-13-remove-v1-2fa.md). The
smallest one by far: **one flag, one branch, one function**. `v2PasswordReauth` is read in
exactly one place — `validatePasswordMiddleWare.ts:59` — and nothing else in the repo is gated
by it.

**Done when:** `grep -rn "v2PasswordReauth" app/` returns nothing, `validatePasswordMiddleWare.ts`
has a single `validatePassword` that goes through `ValidateCurrentPasswordUseCaseFactory`, and
`comparePasswords` no longer exists.

---

## Finding 1 — the v1 fallback reads Mongo while every password *write* is factory-routed

Same shape as plan 12's and plan 13's finding 1, and this one is the sharpest of the three
because it is an **authentication** check, not a settings write.

`validatePassword` (v1) loads the hash through `users.js` → the mongoose `usersModel`
(`validatePasswordMiddleWare.ts:14`). Every path that *changes* a password already goes through
`UsersDataSourceFactory`, which returns the **Postgres** data source when `postgresUsers` is on:

| operation | path | backend |
| --- | --- | --- |
| change password (`ResetPassword`) | `usersDS.updatePassword` (`ResetPassword.ts:32`) | factory |
| admin sets a password (`UpdateUser`) | `usersDS.update` persisting the whole `Credentials` VO | factory |
| login | `usersDS.getByUsername` (`Login.ts:41`) | factory |
| **v1 re-auth** | `users.getById(id, '+password')` → mongoose | **Mongo, always** |

There is no dual-write; `UsersDataSourceFactory.default()` picks one backend exclusively.

| flag combination | password writes | re-auth reads | result |
| --- | --- | --- | --- |
| `postgresUsers: false`, `v2PasswordReauth: false` | Mongo | Mongo | ✅ |
| `postgresUsers: false/true`, `v2PasswordReauth: true` | factory | factory | ✅ |
| **`postgresUsers: true`, `v2PasswordReauth: false`** | **Postgres** | **Mongo** | ❌ |

In that last row a user changes their password, then tries to create a user, delete a user,
edit their profile or reset someone's 2FA — the Basic header carries the *new* password, the
middleware compares it against the *stale* Mongo hash, and every one of those routes answers
403 with no way out from the UI. The mirror is worse: the **old** password still passes
re-authentication, which is a revoked credential remaining valid on exactly the endpoints
re-auth exists to protect.

Removing v1 removes the flag, so no combination can diverge.

---

## Parity audit: `validatePassword` (v1) → `ValidateCurrentPassword` (v2)

`validatePasswordMiddleWare.ts:13-17` vs `app/api/core/application/ValidateCurrentPassword.ts`.

| v1 rule | v2 equivalent | verdict |
| --- | --- | --- |
| identify the caller from the session user | same `req.user`, populated by `deserializeUser` | ✅ |
| look the user up by `_id` | look up by `username` | ⚠️ see delta 1 — safe |
| exclude soft-deleted (`users.js:52-54` adds `deletedAt: { $exists: false }`) | DAO `DEFAULT_SCOPE.deleted = 'exclude'` | ✅ same |
| system/public user readable | DAO `DEFAULT_SCOPE.systemUser = 'exclude'` | ⚠️ see delta 2 — unreachable |
| compare with `bcrypt.compare(plain, hash)` | `EncryptedPassword.compare` → `bcrypt.compare`, same 10 salt rounds | ✅ identical |
| empty / missing `Authorization: Basic` ⇒ 403 | untouched, lives in the middleware above both | ✅ identical |
| wrong password ⇒ `{ error: 'Password error', message: 'Forbidden' }`, 403 | same, same object | ✅ identical |
| user vanished ⇒ `user.password` on `null` throws a `TypeError` | `Result.isError()` ⇒ `false` ⇒ 403 | ✅ strictly better |
| no logging | `ExecutionContext.logger.info` under `Auth_PasswordReauth` | ✅ additive |

Both backends are at parity for the v2 path: `getByUsername` asks for `ACCOUNT_FIELDS`, which
includes the `credentials` group (the `password` column/field) in
`mongodb/user/UserReadOptions.ts:44` and `postgresql/user/UserReadOptions.ts:47`, and both
mappers build `EncryptedPassword.fromHash(row.password)`.

`ExecutionContext` is guaranteed to be populated here: `dependenciesContextMiddleware` is
registered at `server.js:124`, before `apiRoutes` at :130, and after `populateAuthenticatedUser`
at :123 — so `req.user` and the context are both live by the time any route running this
middleware is reached.

### Delta 1 — the lookup key changes from `_id` to `username` (safe)

v2 returns `false` outright when `req.user.username` is absent. It never is:

- `username` is `required: true` and `unique` in the mongoose schema (`usersModel.ts:6-10`),
  and `NOT NULL` in the users table.
- The session user comes from `deserializeUser` (`passport_conf.js:26-28`), which returns
  either a full mongoose document or a `UserProfile` — and `UserProfile extends UserView`,
  where `username: string` is required (`UserReadModels.ts:23-28`).
- Every route carrying this middleware sits behind `needsAuthorization`, which already
  requires `req.user`.

The one thing to keep in mind: `getByUsername` is the same lookup `Login` uses, so re-auth and
login now agree on which record a session refers to. That is the point.

### Delta 2 — the public user is excluded from re-auth (unreachable, accept)

v1 could have re-authenticated `PUBLIC_USER_ID`; v2's DAO scope excludes it. Not reachable:
the public user is injected only inside the `/api/public` handler (`files/jsRoutes.js:69-73`),
which carries no `validatePasswordMiddleWare`, has no session, and never sends a Basic header.
Its password is 32 random bytes written by migration 181 and never shown to anyone.

### Gap — a thrown error still hangs the request (pre-existing, out of scope)

`validatePasswordV2` re-throws after logging (`validatePasswordMiddleWare.ts:49`). The
middleware is `async` and Express is 4.22, so a rejection is not routed to
`errorHandlingMiddleware` — it becomes an unhandled rejection and the request hangs. v1 has the
same hole by a different route (`TypeError` on a vanished user), so this is **not a regression**
and this plan does not change it. Worth its own fix later; do not fold it in here, it would
make the diff about something else.

---

## Full inventory

| file | what |
| --- | --- |
| `app/api/auth/validatePasswordMiddleWare.ts:9-17` | the `@deprecated` v1 `validatePassword` |
| `app/api/auth/validatePasswordMiddleWare.ts:3,4,5` | `usersModel`, `comparePasswords`, `tenants` imports — all orphaned by the above |
| `app/api/auth/validatePasswordMiddleWare.ts:59-61` | the flag branch |
| `app/api/auth/encryptPassword.ts:16-17` | **delete `comparePasswords`** — this is its last caller |
| `app/api/auth/encryptPassword.ts:5-13` | `encryptPassword`'s `@deprecated` block, which names this file |
| `app/api/auth/index.js:6` | the `comparePasswords` re-export |
| `app/api/config.ts:177` | flag default |
| `app/api/tenants/tenantContext.ts:48` | `Tenant` type field |
| `app/api/tenants/tenantsModel.ts:63` | mongoose schema field |
| `app/api/auth/specs/validatePasswordMiddleWare.spec.ts:74-124` | the three v1 tests |
| `app/api/auth/specs/validatePasswordMiddleWare.spec.ts:126-180` | the `when v2PasswordReauth is on` wrapper |
| `app/api/users/users.js:45-46` | the `getById(id, '+password')` row in the migration table |

`encryptPassword` itself **stays** — migration 181 pins it (a historical migration must keep the
hashing logic that was live when it ran) and a dozen specs build fixtures with it.

---

## Step 1: Collapse the middleware

**File:** `app/api/auth/validatePasswordMiddleWare.ts`

**Skeleton — the whole file afterwards:**

```ts
import type { Request, Response, NextFunction } from 'express';
import { User } from '#api/users/usersModel.js';
import { ValidateCurrentPasswordUseCaseFactory } from '#api/core/infrastructure/factories/ValidateCurrentPasswordUseCaseFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

const validatePassword = async (submittedPassword: string, requestUser: User) => {
  // ... body of today's validatePasswordV2, verbatim
};

const validatePasswordMiddleWare = async (req: Request, res: Response, next: NextFunction) => {
  const { user, headers } = req;
  const submittedPassword = headers?.authorization?.split('Basic ')[1];

  if (submittedPassword) {
    const decodedPassword = Buffer.from(submittedPassword, 'base64').toString('utf8');

    if (await validatePassword(decodedPassword, user)) {
      return next();
    }
  }

  res.status(403);
  return res.json({ error: 'Password error', message: 'Forbidden' });
};

export { validatePasswordMiddleWare };
```

**Do:**

- Delete the v1 `validatePassword` and its `@deprecated` block, then rename `validatePasswordV2`
  to `validatePassword`. Keep its body **verbatim** — both logger calls, the `startTime`, the
  re-throw. This step must not change v2 behaviour at all.
- Keep the `User` type import; it is the parameter type and survives.
- Drop `usersModel`, `comparePasswords` and `tenants`.

---

## Step 2: Delete `comparePasswords`

**Files:** `app/api/auth/encryptPassword.ts`, `app/api/auth/index.js`

**Do:**

- Delete the `comparePasswords` export and its one-line `@deprecated` comment. Step 1 removed
  its last caller — `EncryptedPassword.comparePasswords` is a private static of its own and is
  unrelated.
- Drop it from the `index.js` re-export line, keeping `encryptPassword`.
- Rewrite `encryptPassword`'s `@deprecated` block: it currently lists "the v1 fallback in
  `validatePasswordMiddleWare.ts`, the whole legacy CRUD/login flow in `api/users/users.js`, and
  the one-time migration". Only the migration is left — and the note that historical migrations
  stay pinned to the hashing logic that was live when they ran is the reason it survives, so
  keep that sentence and drop the rest.
- Fix the `getById(id, '+password')` row in `users.js:45-46`: with this plan there is no caller
  left outside `UsersGettersConsistency.spec.ts:111`, so say so rather than leaving a row that
  reads as if a production caller might return.

**Test:** `grep -rn "comparePasswords" app/` returns only `EncryptedPassword.ts`.

---

## Step 3: Retire the flag

**Files:** `app/api/config.ts`, `app/api/tenants/tenantContext.ts`, `app/api/tenants/tenantsModel.ts`

**Do:**

- Delete the three declarations, exactly as plans 09–13 did for their flags.
- **No migration.** Tenant documents that still carry `v2PasswordReauth` keep it in the
  database; once the field leaves the mongoose schema it is simply never read. Every earlier
  flag removal in this series left its flag inert the same way, and a migration to strip them
  would be one migration per flag for no behavioural gain. If they are ever worth cleaning up,
  it is one migration for all of them, after the series ends.

---

## Step 4: Collapse the spec

**File:** `app/api/auth/specs/validatePasswordMiddleWare.spec.ts`

The current file has three unwrapped v1 tests and a `describe('when v2PasswordReauth is on')`
holding three more. The v2 block is missing the "empty password string" case the v1 block
covers, so this is a merge, not a delete-one-side — unlike plans 10–13, where the two sides
were exact duplicates.

**Do:**

- Delete the flag `describe` wrapper along with its `beforeEach`/`afterEach` and the
  `testingTenants` import.
- Keep four cases at the top level, each wrapped in `testingEnvironment.runWithContext`:
  correct password ⇒ `next()`; wrong password ⇒ 403; empty Basic value ⇒ 403; no
  `authorization` header ⇒ 403.
- **Every case now needs `runWithContext`** — the three old top-level tests do not have it
  today because the v1 path never touched `ExecutionContext`. Missing it is the one way this
  step fails, and it fails loudly.
- Fixtures stay as they are; `encryptPassword` is still the right way to seed a hash.

**Test:** `yarn test app/api/auth/specs/validatePasswordMiddleWare.spec.ts`

---

## Step 5: Verify

```
yarn test app/api/auth app/api/core/application/specs/ValidateCurrentPassword.spec.ts app/api/users
yarn check-app-types
npx eslint <touched files> && npx prettier --check <touched files>
grep -rn "v2PasswordReauth" app/    # nothing
grep -rn "comparePasswords" app/    # only EncryptedPassword.ts
```

The controller specs under `core/infrastructure/express/users/` all mock this middleware out
(`jest.mock('.../validatePasswordMiddleWare.ts')`), so they are unaffected — which also means
they are not cover for this change. The spec in step 4 is.

Manual, end to end, on a `postgresUsers` tenant — the combination finding 1 says is broken
today: log in, change your own password from Settings › Account, then without logging out
create a user (Settings › Users) and enter the **new** password in the re-auth prompt. It must
succeed. Repeat with the **old** password and confirm it is rejected. Before this change, on
that tenant, both outcomes are inverted.
