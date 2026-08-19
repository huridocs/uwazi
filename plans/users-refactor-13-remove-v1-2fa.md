# Plan: Remove `auth2fa/usersUtils.ts` and retire `v2Auth2fa`

The 2FA sibling of [10](./users-refactor-10-remove-unlock-account.md) through
[12](./users-refactor-12-remove-password-recovery.md). One flag gates three routes, so all
three v1 helpers go in one pass and the flag goes with them.

**Done when:** `grep -rn "v2Auth2fa" app/` returns nothing, `app/api/auth2fa/` holds only
`routes.ts` and `specs/`, and `routes.ts` is three route registrations with no middleware
between the authorization guards and the controllers.

---

## Finding 1 — v1 2FA writes Mongo; everything that *reads* 2FA state is factory-routed

This is the sharpest reason to remove v1 now, and it is not hypothetical — it is live for any
tenant on `postgresUsers`.

`usersUtils` reaches Mongo directly through the mongoose `usersModel` (`usersUtils.ts:4`).
Every reader of `using2fa` / `secret` has already moved to `UsersDataSourceFactory` /
`UsersDirectoryFactory`, which return the **Postgres** implementation when `postgresUsers` is
on:

| reader | path | backend |
| --- | --- | --- |
| login's 2FA challenge | `Login.checkTwoFactor` → `usersDS.getByUsername` (`Login.ts:41,84`) | factory |
| the session user (`using2fa` on the Account page) | `passport_conf.js:26` → `UsersDirectoryFactory.getProfile` | factory |
| v1 `setSecret` / `enable2fa` / `reset2fa` | `usersModel` | **Mongo, always** |

| flag combination | enable 2FA writes | login / profile read | result |
| --- | --- | --- | --- |
| `postgresUsers: false`, `v2Auth2fa: false` | Mongo | Mongo | ✅ |
| `postgresUsers: false/true`, `v2Auth2fa: true` | factory | factory | ✅ |
| **`postgresUsers: true`, `v2Auth2fa: false`** | **Mongo** | **Postgres** | ❌ |

In that last row the user completes the whole enrolment flow — QR code, token accepted, "2FA
Enabled" toast — and 2FA is never enforced: `using2fa` stays false in Postgres, so login never
asks for a token and the Account page still offers "Enable". The admin reset has the mirror
failure: if a tenant flipped `v2Auth2fa` on and later off, `reset2fa` clears Mongo while
Postgres keeps `using2fa: true`, leaving a user locked behind a secret no admin can clear.

Removing v1 removes the flag, so no combination can diverge. Same shape as plan 12's finding 1.

---

## Parity audit: `setSecret` → `GenerateTwoFactorSecret`

`usersUtils.ts:29-41` vs `app/api/core/application/GenerateTwoFactorSecret.ts`.

| v1 rule | v2 equivalent | verdict |
| --- | --- | --- |
| load the current user, excluding soft-deleted | `usersDS.getTwoFactorStatus(actorId)`, DAO scope excludes deleted (and the public user) | ✅ same, plus the system-user guard |
| user missing ⇒ `createError('User not found', 403)` | `UserNotFound` | ⚠️ 403 → 400 — gap 3 |
| `site_name` truncated to 30 chars + `...` | `conformSiteName`, same expression | ✅ identical |
| `otplib.authenticator.generateSecret()` | same call | ✅ identical |
| `keyuri(username, siteName, secret)` | same call, `status.username` | ✅ identical |
| already `using2fa` ⇒ `createError('Unauthorized', 401)`, secret untouched | `TwoFactorAlreadyEnabled`, thrown before the write | ⚠️ 401 → 400 — gap 1 |
| responds `{ otpauth, secret }` | same shape (`GenerateTwoFactorSecretResponse`) | ✅ identical |

## Parity audit: `enable2fa` → `EnableTwoFactorAuth`

`usersUtils.ts:50-75` (`verifyToken` + `enable2fa`) vs `app/api/core/application/EnableTwoFactorAuth.ts`.

| v1 rule | v2 equivalent | verdict |
| --- | --- | --- |
| read the current user's `secret` | `usersDS.getTwoFactorSecret(actorId)` | ✅ identical |
| `otplib.authenticator.verify({ token, secret })` | same call, same `secret \|\| undefined` fallback | ✅ identical, including whatever otplib does when no secret was ever set |
| valid ⇒ set `using2fa: true` | `usersDS.enableTwoFactor` | ✅ identical |
| invalid ⇒ `createError('The token does not validate against the secret key!', 409)` | `TwoFactorTokenInvalid` → 400 | ⚠️ 409 → 400 — gap 2 |
| user missing ⇒ 403 | `UserNotFound` → 400 | ⚠️ 403 → 400 — gap 3 |
| `token` required, string (ajv) | `z.object({ token: z.string() })` | ✅ same rule, 400 → 422 on violation, already pinned |
| responds `{ success: true }` | same literal, from the controller | ✅ identical |

`EnableTwoFactorAuth.spec.ts:64-83` already pins the invalid-token 400 and the missing-token 422.

## Parity audit: `reset2fa` → `ResetTwoFactorAuth`

`usersUtils.ts:82-85` vs `app/api/core/application/ResetTwoFactorAuth.ts`.

| v1 rule | v2 equivalent | verdict |
| --- | --- | --- |
| admin-only, password re-auth | route-level `needsAuthorization(['admin'])` + `validatePasswordMiddleWare`, both outside the flag branch | ✅ untouched |
| target is `body._id`, not the actor | `input._id` | ✅ identical |
| set `using2fa: false`, `secret: null` | `usersDS.disableTwoFactor` | ✅ identical write |
| target missing or soft-deleted ⇒ 403, nothing written | scoped `updateOne` matches nothing, responds 200 | ⚠️ silent success — gap 4 |
| `_id` must match `^[0-9a-fA-F]{24}$` (ajv `ObjectIdAsString`) | `z.string()` — anything passes | ❌ **gap 5, the one real regression** |
| responds `{ success: true }` | same literal | ✅ identical |

---

### Gap 1 — already-enabled goes 401 → 400 (accept, it is a fix)

401 is the status both API clients read as "your session is gone": `policies.ts:81` redirects
the SPA to the login screen. Asking for a second secret while 2FA is already on currently
bounces the user out of the app; on v2 it raises a notification and stays put.

### Gap 2 — invalid token goes 409 → 400 (accept, already handled)

`handleError.js:150-156` documents this deliberately: `TwoFactorTokenRequired` keeps 409 because
the login form branches on it, while `TwoFactorTokenInvalid` is 400 because `EnableTwoFactorAuth`
throws it too. `TwoFactorSetup.tsx:67` already accepts both and shows the same inline error.
Step 7 drops the 409 half once v1 is gone.

### Gap 3 — user-not-found goes 403 → 400 (accept)

Reachable only by a session whose user was soft-deleted mid-session. Both render the same
danger toast — same reasoning as plan 10 and plan 12 gap 3.

### Gap 4 — resetting 2FA for a missing or soft-deleted user answers 200 (accept, pin it)

v1 threw 403; v2's `updateOne` is scoped, matches nothing and reports success. The admin sees a
success toast for a no-op on a user they cannot see anyway. Not worth a domain error, but it is
undertested — step 2 pins it so the behaviour is deliberate rather than incidental.

### Gap 5 — a malformed `_id` loses its only guard (fix in step 1)

`ObjectIdAsString` on the v1 route is the only thing rejecting `_id: 'nonsense'` today.
`ResetTwoFactorAuthInputSchema` accepts any string, and the id then reaches
`ObjectId.createFromHexString` (`MongoUsersDataSource.ts:203`) — a `BSONError` that
`handleError.js` matches on nothing, so it surfaces as a 500 rather than a validation error.
On Postgres the row simply misses, so the two backends do not even agree.

`UpdateUser` and `UnlockBlockedUser` declare `_id: z.string()` the same way and have the same
hole; that is pre-existing and out of scope here. This route is different because **this plan
removes the guard that covers it**, so it gets fixed in the same change.

---

## Full inventory

| file | what |
| --- | --- |
| `app/api/auth2fa/usersUtils.ts` | **delete** — `checkUserExists`, `getUser`, `conformSiteName`, `setSecret`, `verifyToken`, `enable2fa`, `reset2fa` |
| `app/api/auth2fa/specs/usersUtils.spec.ts` | **delete** |
| `app/api/auth2fa/specs/__snapshots__/usersUtils.spec.ts.snap` | **delete** — both snapshots belong to that spec |
| `app/api/auth2fa/routes.ts:15-23,30-48,56-74` | the three flag-conditional ajv middlewares |
| `app/api/auth2fa/routes.ts:3,4,6` | `validation`, `ObjectIdAsString`, `tenants` — all orphaned by the above |
| `.../express/users/GenerateTwoFactorSecretController.ts:2,9,37-40` | flag branch + fallback; `usersUtils` import |
| `.../express/users/EnableTwoFactorAuthController.ts:5,13,43-46` | flag branch + fallback; `usersUtils` import |
| `.../express/users/ResetTwoFactorAuthController.ts:5,13,43-46` | flag branch + fallback; `usersUtils` import |
| `app/api/core/application/ResetTwoFactorAuth.ts:6` | `_id: z.string()` — gap 5 |
| `app/api/config.ts:177` | flag default |
| `app/api/tenants/tenantsModel.ts:63` | mongoose schema field |
| `app/api/tenants/tenantContext.ts:48` | `Tenant` type field |
| `app/api/auth2fa/specs/GenerateTwoFactorSecret.spec.ts:27-40,42-45` | legacy describe + the flag in `beforeEach` |
| `app/api/auth2fa/specs/EnableTwoFactorAuth.spec.ts:31-44,46-49` | same |
| `app/api/auth2fa/specs/ResetTwoFactorAuth.spec.ts:34-48,50-53` | same |
| `app/react/.../Account/Components/TwoFactorSetup.tsx:65-70` | the 409 branch and its "until v1 is removed" comment |

`verifyToken` has no caller outside `usersUtils` — the login-time one went with `v2Login`
(plan 09), which its own `@deprecated` block already records.

---

## Step 1: Close gap 5 before removing the ajv guard

**Files:** `app/api/core/application/ResetTwoFactorAuth.ts`, `.../specs/ResetTwoFactorAuth.spec.ts`

**Do:**

- Tighten the schema to the shape the ajv guard enforced:
  `_id: z.string().regex(/^[0-9a-fA-F]{24}$/)`. Postgres stores `_id` as `TEXT` holding the same
  hex string (`009-create-users-table.sql:7`), so one rule fits both backends.
- Keep the message default; the controller's `catch` and 422 mapping already handle it.

**Test:** `_id: 'not-an-objectid'` ⇒ 422, and no user row changes.

**This step must land before step 4 removes the ajv middleware.**

---

## Step 2: Pin what the v1 specs are the only cover for

**Files:** `app/api/auth2fa/specs/ResetTwoFactorAuth.spec.ts`, `.../GenerateTwoFactorSecret.spec.ts`

`usersUtils.spec.ts` owns "throws if user not found" for all four helpers. The v2 equivalents
are not all covered, and two of them differ (gaps 3 and 4) — pin the v2 behaviour before the v1
tests go, same reasoning as plan 10 step 1 and plan 12 step 2.

**Do:**

- `ResetTwoFactorAuth.spec.ts`: a reset targeting a soft-deleted user ⇒ 200, and that user's
  `using2fa` / `secret` are unchanged in the database. This is gap 4 written down.
- `GenerateTwoFactorSecret.spec.ts`: a request from a session whose user is soft-deleted ⇒ 400,
  no secret written. This is gap 3.

**Test:** `yarn jest app/api/auth2fa`

---

## Step 3: Collapse the three controllers

**Files:** `GenerateTwoFactorSecretController.ts`, `EnableTwoFactorAuthController.ts`,
`ResetTwoFactorAuthController.ts`

**Do:**

- Same shape as plans 10–12: drop the `if`, drop the `else`, de-indent, keep the try/catch and
  both logger calls verbatim, remove the `usersUtils` import.
- Afterwards these three plus the four utility controllers should all be structurally
  identical; diff them.

---

## Step 4: Collapse the routes

**Files:** `app/api/auth2fa/routes.ts`

**Skeleton:**

```ts
app.post(
  '/api/auth2fa-secret',
  needsAuthorization(['admin', 'editor', 'collaborator']),
  GenerateTwoFactorSecretController.createHandler()
);

app.post(
  '/api/auth2fa-enable',
  needsAuthorization(['admin', 'editor', 'collaborator']),
  EnableTwoFactorAuthController.createHandler()
);

app.post(
  '/api/auth2fa-reset',
  needsAuthorization(['admin']),
  validatePasswordMiddleWare,
  ResetTwoFactorAuthController.createHandler()
);
```

**Do:**

- **Keep** `needsAuthorization` and `validatePasswordMiddleWare` — neither was flag-conditional.
- Drop `validation`, `ObjectIdAsString` and `tenants`; these were their only uses in the file.
- Re-run the import check rather than trusting the list; plans 10–12 each turned up one the
  plan had not predicted.

---

## Step 5: Delete the v1 module and its spec

**Files:** `app/api/auth2fa/usersUtils.ts`, `specs/usersUtils.spec.ts`,
`specs/__snapshots__/usersUtils.spec.ts.snap`

**Do:**

- Delete all three. The snapshot file exists only for `setSecret`'s otpauth urls and
  `reset2fa`'s return value; nothing else reads it.
- `specs/fixtures.ts` stays — the three v2 specs use `userId` and `secretedUserId`.

---

## Step 6: Retire the flag

**Files:** `config.ts`, `tenantsModel.ts`, `tenantContext.ts`, the three auth2fa specs

**Do:**

- Delete the three declarations.
- In each spec, delete the `describe('when the v2Auth2fa flag is off (legacy path)')` block and
  unwrap the `describe('when the v2Auth2fa flag is on')` block, dropping its
  `testingTenants.changeCurrentTenant({ featureFlags: { v2Auth2fa: true } })` and the
  `testingTenants` import where it becomes unused.
- The legacy blocks duplicate the v2 happy path exactly, so nothing is lost by deleting rather
  than merging them.
- Leave the flag on existing tenant documents; it becomes inert, as plans 09 and 12 left theirs.

---

## Step 7: Drop the frontend's 409 branch

**Files:** `app/react/V2/Routes/Settings/Account/Components/TwoFactorSetup.tsx`

**Do:**

- Reduce `error.status === 409 || error.status === 400` to `error.status === 400` and delete the
  two-line comment above it.
- **Do not touch `app/react/Users/Login.jsx`** — its 409 is `TwoFactorTokenRequired`, which
  `handleError.js:144-148` keeps at 409 on purpose and which this plan does not touch.

---

## Step 8: Verify

```
yarn jest app/api/auth2fa app/api/auth app/api/core app/api/users app/react/V2/Routes/Settings/Account
yarn check-app-types
npx eslint <touched files> && npx prettier --check <touched files>
grep -rn "v2Auth2fa" app/          # nothing
grep -rn "usersUtils" app/         # nothing
```

Manual, end to end, on a `postgresUsers` tenant — the combination finding 1 says is broken
today: enrol from Settings › Account, confirm the QR code renders, submit a wrong token and see
the inline error, submit the right one, log out, confirm login now demands a token, then reset
that user's 2FA as an admin and confirm they can log in without one. With the flag retired,
`postgresUsers` is the only axis left.
