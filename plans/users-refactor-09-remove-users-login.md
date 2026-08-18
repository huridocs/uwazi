# Plan: Remove `users.login` and the `v2Login` flag

The fourth sibling of [plan 06](./users-refactor-06-remove-users-save.md),
[07](./users-refactor-07-remove-users-newuser.md) and
[08](./users-refactor-08-remove-users-delete.md). Delete the v1 login flow permanently so
`POST /api/login` has one implementation: `LoginController` → `Login` use case.

`v2Login` gates **three** routes, not one — `/api/login`, `/api/user` and `/logout` — so all
three v1 fallbacks go together with the flag.

**Done when:** `grep -rn "v2Login" app/` returns nothing, `users.js` has no `login`, and
`passport_conf.js` has no `LocalStrategy`.

---

## Parity audit (done before writing this plan)

Compared `app/api/users/users.js:213-238` plus its module-level helpers (v1) against
`app/api/core/application/Login.ts` (v2). **v2 covers every v1 rule**, and covers two of them
better. Findings:

| v1 rule                                                            | v2 equivalent                                                                             | verdict                                                |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| look up by username, excluding soft-deleted                        | `getByUsername`, whose DAO scope already excludes deleted                                 | ✅ identical                                           |
| bcrypt compare                                                     | `credentials.password.compare`                                                            | ✅ identical                                           |
| legacy SHA256 hash accepted, then re-hashed with bcrypt            | `matchesLegacySha256Hash` → `setPassword` → `update`                                      | ✅ identical, and unit-tested in `Login.spec.ts:140`   |
| dummy hash for unknown users (login timing)                        | `checkDummyPassword` in the not-found branch                                              | ✅ same intent — see note 5                            |
| `$inc failedLogins`, lock at 6, skip counting while already locked | `incrementFailedLogins` / `shouldLock` / `isLocked`, same threshold in `Credentials.ts:3` | ✅ identical                                           |
| lock ⇒ unlock code + "Account locked" email                        | `lock()` + `sendAccountLockedEmail` job                                                   | ⚠️ same code and body, different delivery — see note 3 |
| locked account rejected even with the right password               | `wasLocked` captured before the password check                                            | ✅ identical                                           |
| 2FA required ⇒ token demanded, verified, failures counted          | `checkTwoFactor`, same `otplib.authenticator.verify`                                      | ✅ identical                                           |
| `$unset failedLogins` on success                                   | `clearLockout()` (also clears the lock fields, unreachable while locked)                  | ✅ equivalent                                          |
| return the sanitized user                                          | `sanitize()` → `User`                                                                     | ✅ — see note 6                                        |

`Login.spec.ts` already covers all eleven behaviours end to end, including the SHA256 upgrade
and the lockout email. Unlike plan 08, **no coverage has to be built before deleting v1.**

### Gap 1 — 401 becomes 400 (fix in step 1)

v1 threw `createError('Invalid username or password', 401)`. v2 throws `InvalidCredentials` /
`AccountLocked`, which are `DomainError`s, and `handleError.js:128` maps every `DomainError`
to **400** (`LoginController.spec.ts:88` pins the 400 today).

This one is not cosmetic, unlike the same shift in plans 06-08. The legacy API client
branches on the status:

- **401** → `redirect('/login')`, no toast (`app/react/utils/api.js:81`).
- **400** → `extractMessageFromValidation` → a **danger toast** (`api.js:74`).

So on the flag flip every mistyped password starts raising a notification popup on top of
the login form's own inline error, and the V2 client's auth policy
(`policies.ts:81`, redirect-on-401) stops recognising the response.

**Fix: map `InvalidCredentials` and `AccountLocked` to 401 in `handleError.js`.** Both are
thrown only by `Login`, so the mapping cannot leak into another use case, and 401 is the
correct status for a failed authentication. This is the one place where restoring v1's
status is cheaper than absorbing the change.

**Do not map `TwoFactorTokenInvalid`** — `EnableTwoFactorAuth.ts:27` throws it too, where v1
answered 409, not 401. It stays 400, so a wrong 2FA token at login moves 401 → 400: the
login form still shows its inline `error2fa` message (`Login.jsx:66-72` only special-cases 409) and now also gets a toast naming the reason. Accept that one.

### Gap 2 — invalid request body: 400 becomes 422

Removing the route's ajv gate leaves `LoginInputSchema`. Ajv errors become
`createError(e, 400)` (`validateRequest.js:24`); `ZodError` maps to 422
(`handleError.js:107`). Same shift as plans 06 and 07 — accept it.

### Notes on the rest

3. **The lockout email becomes a queued job.** v1 called `mailer.send` inline inside the
   request; v2 dispatches `SendAccountLockedEmailHandler`. The rendered message is
   byte-identical (`accountLockedEmail.ts` reproduces v1's subject, body and
   `/unlockaccount/{username}/{code}` link) and the code is generated the same way
   (`crypto.randomBytes(32).toString('hex')` in both). Only delivery changes: a tenant with
   no queue worker locks accounts without telling anyone. Same caveat as plan 07's welcome
   email — call it out in the PR.
4. **`validateURL(domain)` disappears.** v1 threw on a malformed domain before touching the
   DB. v2 takes `domain` from `ExecutionContext.tenant.domain`, which is configuration, not
   user input. Accept.
5. **Dummy-hash timing.** v1 hashed the dummy password on _every_ login, including
   successful ones; v2 hashes and compares only when the username is unknown. Both close
   the user-enumeration timing channel; v2 does one less bcrypt per successful login.
6. **`sanitize()` drops `using2fa`** from the returned user, which v1's `sanitizeUser` kept.
   Harmless: the value is only fed to `req.logIn`, and every later request rebuilds the
   session user through `passport.deserializeUser`, which reads `getProfile`/`getById`.

---

## Full inventory

| file                                                     | what                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/api/auth/routes.js:57-97`                           | `/api/login` flag branch, ajv gate, passport fallback                                                                                                                                |
| `app/api/auth/routes.js:100-110`                         | `/api/user` flag branch + fallback                                                                                                                                                   |
| `app/api/auth/routes.js:111-121`                         | `/logout` flag branch + fallback                                                                                                                                                     |
| `app/api/auth/passport_conf.js:11-25`                    | the `LocalStrategy` — reached only by the v1 fallback                                                                                                                                |
| `app/api/auth/passport_conf.js:31-34`                    | the comment explaining the two session-establishing paths                                                                                                                            |
| `app/api/users/users.js:213-238`                         | `login`                                                                                                                                                                              |
| `app/api/users/users.js:16,55-137,139-142`               | `MAX_FAILED_LOGIN_ATTEMPTS`, `sendAccountLockedEmail`, `updateOldPassword`, `blockAccount`, `newFailedLogin`, `validateUserPassword`, `validate2fa`, `sanitizeUser` — all login-only |
| `app/api/users/users.js:17-19`                           | `validateURL`, login-only                                                                                                                                                            |
| `app/api/users/users.js:345`                             | `export { validateUserPassword }` — no importer anywhere in `app/`                                                                                                                   |
| `app/api/config.ts:179`                                  | default `false`                                                                                                                                                                      |
| `app/api/tenants/tenantsModel.ts:65`                     | mongoose schema field                                                                                                                                                                |
| `app/api/tenants/tenantContext.ts:50`                    | `Tenant` type field                                                                                                                                                                  |
| `app/api/users/specs/users.spec.js:28-265`               | `describe('login')`                                                                                                                                                                  |
| `app/api/auth/specs/routes.spec.js:28-101`               | `describe('/login')` + its validation-schema snapshot                                                                                                                                |
| `.../users/specs/LoginController.spec.ts:56-69`          | `when v2Login is off`                                                                                                                                                                |
| `.../users/specs/GetCurrentUserController.spec.ts:46-58` | `when v2Login is off`                                                                                                                                                                |
| `.../users/specs/LogoutController.spec.ts:46-58`         | `when v2Login is off`                                                                                                                                                                |

`passport_conf.js` is the only production caller of `users.login`.

---

## Step 1: Give failed authentication back its 401

**Files:** `app/api/utils/handleError.js`, `app/api/utils/specs/handleError.spec.js`

**Skeleton:**

```js
if (error instanceof InvalidCredentials || error instanceof AccountLocked) {
  result = { code: 401, message: error.message, logLevel: 'debug' };
}
```

**Do:**

- Add the mapping next to the existing `TwoFactorTokenRequired` 409 case, which is the
  precedent for a login-specific status override, and carry a comment in the same spirit:
  both clients treat 401 as "authentication failed", and `api.js` shows a toast for 400.
- Import the two errors from `#api/core/domain/user/errors.js`. Keep the generic
  `DomainError` → 400 rule above them — order matters, the specific case must come after.
- Leave `TwoFactorTokenInvalid` alone (shared with `EnableTwoFactorAuth`, see gap 1).

**Test:** add two cases to `handleError.spec.js`, then update
`LoginController.spec.ts:81-90` — `should return 400 on a wrong password` becomes 401. The
wrong-2FA-token case stays 400.

---

## Step 2: Move the route-level login coverage to the v2 spec

**Files:** `app/api/core/infrastructure/express/users/specs/LoginController.spec.ts`

`auth/specs/routes.spec.js` is the only place that exercises login **through the HTTP route**
with a legacy SHA256 password, and the only place asserting the 401. `Login.spec.ts` covers
the upgrade at use-case level; the route-level case is what proves the controller does not
swallow it.

**Do:**

- Add a `sha256user` to `buildFixtures` whose password is
  `createHash('sha256').update('oldPassword').digest('hex')`.
- Add two cases: logging in with that password returns 200, and the stored hash afterwards
  bcrypt-compares to `oldPassword` (mirror `routes.spec.js:89-100`).
- Delete the `when v2Login is off` describe in the same pass — with the flag gone there is
  no second path to compare against.

**Test:** `yarn jest app/api/core/infrastructure/express/users/specs/LoginController.spec.ts`

---

## Step 3: Collapse the three routes

**Files:** `app/api/auth/routes.js`

**Skeleton:**

```js
app.post('/api/login', async (req, res) => {
  await randomSleep(500, 1_000);
  await LoginController.createHandler()(req, res);
});

app.get('/api/user', GetCurrentUserController.createHandler());
app.get('/logout', LogoutController.createHandler());
```

**Do:**

- `/api/login`: keep `randomSleep` — it is the login-timing defence and predates both paths.
  Drop the `next()`, the `validation.validateRequest({...})` block and the passport
  fallback.
- `/api/user` and `/logout`: call the controller directly; delete both fallbacks and their
  `@deprecated` comments.
- Remove the `validation` import — `/api/login` was its only use in this file. Keep
  `tenants` (still used by the two `v2Captcha` branches) and `passport` (still needed for
  `passport.initialize()` / `passport.session()`).

**Test:** `yarn jest app/api/auth app/api/core/infrastructure/express/users` after step 6.

---

## Step 4: Delete the LocalStrategy

**Files:** `app/api/auth/passport_conf.js`

**Do:**

- Delete the `passport.use('local', new LocalStrategy(...))` block and the `getDomain`
  helper it alone uses, plus the `passport-local` import.
- **Keep** `import users from '#api/users/users.js'` — `deserializeUser` still calls
  `users.getById` on the `usersDirectory`-off branch.
- Rewrite the comment above `deserializeUser`: it explains a two-path world that no longer
  exists. What stays true is that deserialization is not part of the login use case and that
  the backend choice is `UsersDirectory`'s business under the separate `usersDirectory` flag
  (D8).

**Test:** `yarn jest app/api/auth/specs/deserializeUser.spec.ts`

---

## Step 5: Delete `users.login` and its helpers

**Files:** `app/api/users/users.js`

**Do:**

- Delete `login` and the eight module-level helpers that exist only for it:
  `MAX_FAILED_LOGIN_ATTEMPTS`, `validateURL`, `sendAccountLockedEmail`, `updateOldPassword`,
  `blockAccount`, `newFailedLogin`, `validateUserPassword`, `validate2fa`, `sanitizeUser`.
- Delete `export { validateUserPassword }`. Confirm first with
  `grep -rn "validateUserPassword" app/` — today it has no importer outside this file, and
  in particular `auth/validatePasswordMiddleWare.ts` does its own check.
- Drop the imports they alone keep alive: `SHA256` from `crypto-js/sha256.js`,
  `comparePasswords` from `#api/auth/encryptPassword.js`, and `usersUtils`.
- **Keep** `encryptPassword` (`resetPassword`), `mailer` and `settings`
  (`recoverPassword`), `generateUnlockCode` (`recoverPassword`), `createError` (three
  remaining methods) and `getByMemberIdList` (`get`/`getById`).
- What is left in the module afterwards: `get`, `getById`, `unlockAccount`, `simpleUnlock`,
  `recoverPassword`, `resetPassword` — reads plus the `v2UsersUtilityRoutes` fallbacks.
- **Follow-up, not this PR:** `usersUtils.verifyToken`'s `@deprecated` block names this
  login check as one of its callers. Once `v2Auth2fa` is retired the whole module goes;
  update the comment now, delete it there.

**Test:** none of its own — step 6 plus `yarn tsc` / `yarn eslint-diff-branch`.

---

## Step 6: Prune the specs

**Files:** `app/api/users/specs/users.spec.js`, `app/api/auth/specs/routes.spec.js`,
`app/api/auth/specs/__snapshots__/routes.spec.js.snap`,
`.../users/specs/{GetCurrentUser,Logout}Controller.spec.ts`

**Do:**

- `users.spec.js`: delete `describe('login')` (28-265). Check what the file's remaining
  describes still need from its imports before deleting any — `mailer`, `encryptPassword`
  and `usersUtils` are all used by other blocks; let lint name the ones that go.
- `routes.spec.js`: delete `describe('/login')` including `expectNextOnError` and the
  validation-schema snapshot test. `/captcha` and `/remotecaptcha` stay, so keep the file.
  Then drop the obsolete snapshot — run `yarn jest app/api/auth/specs/routes.spec.js -u`
  rather than hand-editing the `.snap`.
- `routes.spec.js` will likely lose the `users`, `comparePasswords` and `passport` imports.
- `GetCurrentUserController.spec.ts` / `LogoutController.spec.ts`: delete the
  `when v2Login is off` describes and unwrap `when v2Login is on` into the parent — but keep
  the `changeCurrentTenant` call itself, it also sets `domain: 'uwazi'`.

**Test:** `yarn jest app/api/users app/api/auth app/api/core/infrastructure/express/users`

---

## Step 7: Remove the flag declaration

**Files:** `app/api/config.ts`, `app/api/tenants/tenantsModel.ts`, `app/api/tenants/tenantContext.ts`

**Do:**

- Delete `v2Login` from all three. No migration: mongoose ignores the stale key on tenants
  that have it set.

**Test:** none, declaration-only. `yarn tsc` proves nothing else reads it.

---

## Step 8: Close out

**Do:**

- `grep -rn "v2Login" app/` → empty; `grep -rn "users.login\|LocalStrategy" app/api/` → empty.
- `yarn tsc && yarn eslint-diff-branch`.

**Test:** `yarn jest app/api/auth app/api/users app/api/sync` plus the targeted core specs
(`core/application/specs/Login.spec.ts`, `core/infrastructure/express/users`). Then log in
through the UI: a correct password, a wrong one (inline error, **no** redirect loop, and
after step 1 no toast), and six wrong ones in a row against a test account to confirm the
lockout email is queued _and_ drained by a running worker — that last one is the delivery
change no unit test can prove.

---

## Outcome

Executed 2026-08-14. Deviations and findings:

- **The 401 mapping landed as planned** and `LoginController.spec.ts` now pins it: wrong
  password → 401, wrong 2FA token → 400 (`EnableTwoFactorAuth` shares that error), missing
  token → 409, invalid body → 422. `handleError.spec.js` covers all three statuses at unit
  level, including an explicit case asserting `TwoFactorTokenInvalid` stays on 400 so nobody
  "completes" the mapping later.
- **`auth/specs/routes.spec.js` shrank to the two captcha describes.** Its `/login` block
  went whole, and with it the `users`, `passport`, `comparePasswords`, `express`,
  `bodyParser`, `supertest` and `populateAuthenticatedUser` imports plus the `app` local —
  the captcha tests drive routes through `instrumentRoutes`, not a real express app. The
  validation-schema snapshot file was deleted by `jest -u`, not by hand.
- **`users.spec.js` lost three obsolete snapshots** along with `describe('login')` (the 2FA
  login, the lockout email and the returned-user shape). `jest -u` removed the whole
  snapshot file — nothing else in that spec snapshots anything.
- **The re-encryption assertion uses the domain class.** `comparePasswords` is deprecated in
  favour of `EncryptedPassword`, so the new SHA256 test asserts through
  `EncryptedPassword.fromHash(...).compare(...)` rather than adding a fresh deprecated call
  site to a v2 spec.
- The 2FA cases moved into a `describe('two-factor authentication')` block — with the SHA256
  describe added, the top-level `describe` tripped `max-statements`. Grouping them is the
  fix eslint was asking for.
- `usersUtils.ts`'s `@deprecated` block named `users.login`/`validate2fa` as a caller;
  updated in place, since the block otherwise still applies to the `v2Auth2fa` fallbacks.
- Remaining lint output on the touched files is all pre-existing (verified by stashing):
  `passport_conf.js`'s `consistent-return`, `routes.spec.js`'s import order, and
  `handleError.js`'s `max-lines` — that file was already 260 lines at HEAD, over the 250
  limit, before this change added the mapping.
- Not done: the manual UI pass from step 8 (correct login, wrong password, and six failures
  to see the lockout email drained by a worker). It needs a running instance.
