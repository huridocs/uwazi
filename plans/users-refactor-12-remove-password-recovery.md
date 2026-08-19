# Plan: Remove `users.recoverPassword` + `users.resetPassword`, and retire `v2UsersUtilityRoutes`

The last of the removal siblings — [06](./users-refactor-06-remove-users-save.md) through
[11](./users-refactor-11-remove-simple-unlock.md). When this lands, `app/api/users/users.js`
holds nothing but `get` and `getById`, and the flag is gone.

**Both methods go in one pass. That is not a convenience — see finding 1.**

**Done when:** `grep -rn "v2UsersUtilityRoutes" app/` returns nothing, `users.js` has no
mailer, no `passwordRecoveriesModel` and no `clearLockFieldsV1`, and
`generateUnlockCode.ts` / `passwordRecoveriesModel.js` are deleted.

---

## Finding 1 — why `recoverPassword` cannot go alone

Removing only `recoverPassword` splits password recovery across two stores for one live flag
combination:

| flag state | key written by `/api/recoverpassword` | key read by `/api/resetpassword` |
| ------------ | --------------------------------------- | ---------------------------------- |
| `postgresPasswordRecoveries: false` | Mongo (v2 DS) | Mongo (v1) | ✅ |
| **`postgresPasswordRecoveries: true`, `v2UsersUtilityRoutes: false`** | **Postgres** (v2 DS via the factory) | **Mongo** (v1 reads `passwordRecoveriesModel` directly) | ❌ every recovery link dies with `key not found` 403 |

Today that pair is safe precisely because both v1 methods pin to Mongo *together* — which is
what the note at `users.js:127` is describing when it says enabling `postgresPasswordRecoveries`
alone does not stop v1 from hitting Mongo. Removing one half breaks that invariant.

Removing both at once removes the flag, so no combination can break.

---

## Parity audit: `recoverPassword`

`users.js:134-158` + `conformRecoverText` vs `app/api/core/application/RecoverPassword.ts`.

| v1 rule                                                     | v2 equivalent                                                             | verdict                             |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| find by email, excluding soft-deleted                       | `getByEmail`, DAO scope excludes deleted (and the public user)            | ✅ identical                        |
| `generateUnlockCode()` for the key                          | `crypto.randomBytes(32).toString('hex')` inline                           | ✅ byte-identical generator         |
| unknown email ⇒ no record, no email, still 200              | `if (userResult.isError()) return;`                                       | ✅ identical — no user enumeration  |
| store `{ key, user }` in `passwordrecoveries`               | `passwordRecoveriesDS.create({ userId, key })`                            | ✅ same document, plus `expiresAt`  |
| subject `Password recovery`, body with username + link      | `passwordRecoveryEmail.ts`                                                | ✅ byte-identical, checked line by line |
| `mailer.send` inline, `from` via `createSenderDetails`      | `SendPasswordRecoveryEmailHandler` job → `NodemailerEmailSender`          | ⚠️ delivery changes — gap 1         |
| ajv `email: { minLength: 3 }`                               | `z.string().email()`                                                      | ⚠️ stricter — gap 2                 |
| `options.newUser` welcome-email branch                      | `SendWelcomeEmailHandler`, dispatched by v2 `CreateUser` since plan 07    | ✅ already dead — spec-only caller  |

`RecoverPasswordController.spec.ts` covers all five behaviours end to end, including the
queued job's params and the silent-200 path. Nothing to build first.

### Gap 1 — the email becomes a queued job (accept, with the same caveat as plans 07 and 09)

v1 sent inline inside the request; v2 dispatches a job. Rendered message is identical. Only
delivery changes: a tenant with no queue worker recovers no passwords and gets no error. This
is the third flow to move this way — call it out in the PR alongside the other two.

**Related, out of scope by decision:** v1's `mailer.send` does `JSON.parse(config.mailerConfig)`
(`mailer.js:28`); `NodemailerEmailSender.ts:40` passes the raw string to `createTransport` as a
connection URL, which `NodemailerEmailSender.spec.ts:51` pins deliberately. The two disagree on
the stored format, so a tenant holding a JSON object string loses custom SMTP when v1 goes.
This already affects the welcome and account-locked emails (v2-only since plans 07 and 09), so
it is a pre-existing divergence rather than one this plan introduces. Noted, not fixed here.

### Gap 2 — `email` validation gets stricter (accept)

`minLength: 3` accepted `abc`; `z.string().email()` rejects it with 422. v1 would have
answered 200 after finding no user. The stricter check leaks nothing about existence — it is
purely a format check — and the login form's recovery field is a real email in practice.
`RecoverPasswordController.spec.ts:105` already pins the 422.

---

## Parity audit: `resetPassword`

`users.js:169-183` vs `app/api/core/application/ResetPassword.ts`.

| v1 rule                                                   | v2 equivalent                                                       | verdict                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------- |
| look the key up in `passwordrecoveries`                   | `passwordRecoveriesDS.findByKey`                                    | ✅ identical                   |
| unknown key ⇒ error, nothing mutated                      | `RecoveryKeyNotFound`                                               | ⚠️ 403 → 400 — gap 3           |
| user must exist and not be soft-deleted                   | `usersDS.getById`, DAO scope excludes deleted                       | ⚠️ 404 → 400 — gap 3           |
| bcrypt hash the new password                              | `EncryptedPassword.create`                                          | ✅ identical, 10 rounds both   |
| clear the three lock fields                               | `clearLockFields`                                                   | ✅ — same as plan 11 gap 2     |
| delete the recovery record                                | `passwordRecoveriesDS.deleteById`                                   | ✅ identical                   |
| the three writes run as `Promise.all`, no atomicity       | all three inside `transactionManager.run`                           | ✅ strictly better             |
| responds with the raw `[DeleteResult, UpdateWriteOpResult]` | responds `'OK'`                                                     | ✅ harmless — gap 4            |

### Gap 3 — 403 and 404 both become 400 (accept)

Both errors are `DomainError`s, and `handleError.js:132` maps them to 400.

- **403 → 400** is the plan-10 case exactly: 403 goes through `isNonUsualApiError`
  (`api.js:19,101`), 400 through `extractMessageFromValidation`, and with no `validations` key
  both render the same danger toast with the same text.
- **404 → 400** is the one real change. Today a reset for a soft-deleted user answers 404,
  and `api.js:85` turns that into `redirect('/404')` — the whole SPA navigates to a not-found
  page. On v2 it becomes a toast over the form. That is better behaviour, not worse: a stale
  recovery key should not 404 the application. Accept it, and mention it in the PR.

### Gap 4 — the response body changes

The v1 controller returned whatever `users.resetPassword` resolved to — a `Promise.all` of two
raw MongoDB driver results, serialized into the response. v2 answers `'OK'`. The only caller
(`app/react/Auth/actions.js:29`) ignores the body. Strictly an improvement; nobody reads it.

---

## Finding 2 — the Mongo TTL index outlives its declaring model

`passwordRecoveriesModel.js` declares `expiresAt: { type: Date, expires: 86400, default: Date.now }`.
That mongoose declaration is what creates the **TTL index** on `passwordrecoveries.expiresAt`,
and `MongoPasswordRecoveriesDataSource` — which writes through the raw driver — depends on it
for expiry. There is no other mechanism: `CleanupExpiredPasswordRecoveriesJob` only issues
`DELETE FROM password_recoveries`, which is Postgres.

Once v1 goes, **nothing imports that model**, so it is never compiled, so the index is never
ensured — existing tenants keep the index they have, new tenants get none and their recovery
keys never expire. Deleting the file without replacing the index is a security regression.

While confirming this, a second discrepancy surfaced: the index deletes `expiresAt + 86400s`,
and v2 writes `expiresAt = now + 24h`, so **v2 keys live 48 hours on Mongo** — against 24 on
Postgres (`WHERE expiresAt < now()`), 24 in v1 (`expiresAt` defaulted to *now*), and the
"valid for 24 hours" the email itself promises. Nothing checks expiry at use time, so the key
stays usable that whole window.

**Step 1 fixes both:** a migration creating `{ expiresAt: 1 }` with `expireAfterSeconds: 0`,
so Mongo deletes exactly at the stored timestamp. Note it must **drop the old index first** —
Mongo rejects a same-key index with different options.

---

## Full inventory

| file                                                       | what                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `app/api/users/users.js:12-45`                             | `conformRecoverText` — recoverPassword's only caller                                    |
| `app/api/users/users.js:47-57`                             | `clearLockFieldsV1` — the helper plan 11 parked here                                    |
| `app/api/users/users.js:120-158`                           | `recoverPassword` + its `@deprecated` block                                             |
| `app/api/users/users.js:160-183`                           | `resetPassword` + its `@deprecated` block                                                |
| `app/api/users/users.js:2,3,6,8,9,10`                      | `createError`, `encryptPassword`, `mailer`, `passwordRecoveriesModel`, `settings`, `generateUnlockCode` — all orphaned |
| `app/api/users/generateUnlockCode.ts`                      | **delete** — v2 inlines the same one-liner                                              |
| `app/api/users/passwordRecoveriesModel.js`                 | **delete**, but only after step 1                                                       |
| `.../express/users/RecoverPasswordController.ts:12,42-45`  | flag branch + fallback; `users` import                                                  |
| `.../express/users/ResetPasswordController.ts:10,40-43`    | flag branch + fallback; `users` import                                                  |
| `.../express/users/routes.ts:65-110`                       | both flag-conditional ajv middlewares                                                   |
| `.../express/users/routes.ts:3`                            | `validation` import — these were its last two uses (`tenants` stays, `v2UsersGet`)      |
| `app/api/config.ts:177`                                    | flag default                                                                            |
| `app/api/tenants/tenantsModel.ts:63`                       | mongoose schema field                                                                   |
| `app/api/tenants/tenantContext.ts:48`                      | `Tenant` type field                                                                     |
| `.../specs/RecoverPasswordController.spec.ts:35-38`        | the flag in `beforeAll`                                                                 |
| `.../specs/ResetPasswordController.spec.ts:58-60`          | the flag in `beforeEach`                                                                |
| `app/api/users/specs/users.spec.js:27-135,137-185`         | `describe('recoverPassword')` and `describe('resetPassword')`                           |
| `app/api/users/specs/routes.spec.ts:72-129`                | the whole `describe('POST')`                                                            |
| `app/api/users/specs/fixtures.js:66`                       | the `passwordrecoveries` fixture, once nothing reads it                                 |

After this, `users.js` is `get`, `getById` and `populateGroupsOfUsers` — still needed by the
`v2UsersGet` fallback, `activitylog/helpers.js` and the `usersDirectory`-off branches.

---

## Step 1: Give the Mongo TTL index its own migration

**Files:** `app/api/migrations/migrations/203-password-recoveries-ttl-index/index.ts` (+ spec)

Model it on `201-captchas-ttl-index/index.ts`, which is the same shape.

**Do:**

- `delta: 203`, `reindex: false`.
- Drop the existing `expiresAt_1` index if present, then
  `createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })`. The drop is required: Mongo
  errors on a same-key index with different options, and the mongoose-created one is
  `expireAfterSeconds: 86400`.
- Guard the drop — a fresh tenant has no such index; `listIndexes` first or swallow the
  `IndexNotFound` (code 27).
- Describe *why* in `description`: the collection is written through the raw driver, so the
  index has to be declared where the collection is owned, not by a mongoose model nobody
  imports.

**Test:** a spec asserting the index exists with `expireAfterSeconds: 0` afterwards, both from
a state with the old index and from a state with none.

**This step must land before step 6 deletes the model.**

---

## Step 2: Move the soft-deleted reset case to the controller spec

**Files:** `.../express/users/specs/ResetPasswordController.spec.ts`

`users.spec.js:170` is the only coverage of "a reset for a soft-deleted user fails **and does
not consume the recovery key**". The v2 path gets this from the DAO scope rather than an
explicit filter, so pin it before deleting the v1 test — same reasoning as plan 10 step 1.

**Do:**

- Add a soft-deleted user with a valid recovery key to the fixtures, then assert: 400, and the
  `passwordrecoveries` record still present afterwards.

**Test:** `yarn jest .../specs/ResetPasswordController.spec.ts`

---

## Step 3: Collapse both controllers

**Files:** `RecoverPasswordController.ts`, `ResetPasswordController.ts`

**Do:**

- Same shape as plans 10 and 11: drop the `if`, drop the `else`, de-indent, keep the
  try/catch and both logger calls verbatim, remove the `users` import.
- In `RecoverPasswordController`, **keep** the `const domain = ...` line above — it feeds the
  v2 input and is not part of the fallback.
- Afterwards all four utility controllers should be structurally identical; diff them.

---

## Step 4: Collapse both routes

**Files:** `.../express/users/routes.ts`

**Skeleton:**

```ts
app.post('/api/recoverpassword', RecoverPasswordController.createHandler());
app.post('/api/resetpassword', ResetPasswordController.createHandler());
```

**Do:**

- Remove the `validation` import — these were its last two uses in the file.
- **Keep** `tenants` (line 39, `v2UsersGet`) and `users` (the same fallback).

---

## Step 5: Delete both v1 methods

**Files:** `app/api/users/users.js`

**Do:**

- Delete `recoverPassword`, `resetPassword`, `conformRecoverText` and `clearLockFieldsV1`
  (plan 11 parked the last one here for exactly this moment).
- Drop the six orphaned imports listed in the inventory. `model` and `getByMemberIdList` stay
  — `get`/`getById` still use them.
- Re-run the import check rather than trusting the list; plan 10 and 11 both turned up one
  import the plan had not predicted.

---

## Step 6: Delete the two dead modules

**Files:** `app/api/users/generateUnlockCode.ts`, `app/api/users/passwordRecoveriesModel.js`

**Do:**

- Delete both. `generateUnlockCode` has no importers left once step 5 lands (v2 inlines
  `crypto.randomBytes(32).toString('hex')` in `RecoverPassword.ts:27`).
- `passwordRecoveriesModel.js` only goes if step 1 landed — that is the whole point of
  finding 2. Also drop the `jest.mock('api/users/generateUnlockCode.ts', ...)` at
  `users.spec.js:14`.

---

## Step 7: Retire the flag

**Files:** `config.ts`, `tenantsModel.ts`, `tenantContext.ts`, the two controller specs

**Do:**

- Delete the three declarations and the `featureFlags: { v2UsersUtilityRoutes: true }` from
  `RecoverPasswordController.spec.ts` (keep its `domain: 'uwazi'`, the job-params assertion
  needs it) and `ResetPasswordController.spec.ts`.
- Leave the flag on existing tenant documents; it becomes inert, exactly as plan 09 left
  `v2Login`.

---

## Step 8: Drop the v1 specs

**Files:** `app/api/users/specs/users.spec.js`, `routes.spec.ts`, `fixtures.js`

**Do:**

- `users.spec.js`: delete both describes. What remains is `getById` and `get` — check the
  imports again afterwards; `mailer`, `settingsModel`, `passwordRecoveriesModel`,
  `comparePasswords`, `encryptPassword`, `unlockCode`, `createError` and `expectedKey` /
  `recoveryUserId` are all likely orphaned.
- `routes.spec.ts`: delete the whole `describe('POST')` — after plans 10 and 11 it holds only
  these two blocks. `DomainError` and `ErrorSample` go with it.
- `fixtures.js:66`: drop the `passwordrecoveries` fixture once nothing reads it.

---

## Step 9: Verify

```
yarn jest app/api/users app/api/core/infrastructure/express/users app/api/core/infrastructure/postgresql app/api/core/infrastructure/mongodb app/api/auth app/api/migrations
yarn check-app-types
npx eslint <touched files> && npx prettier --check <touched files>
grep -rn "v2UsersUtilityRoutes" app/     # nothing
grep -rn "recoverPassword\|resetPassword" app/api/users/   # nothing
```

Manual, end to end, since no e2e covers recovery: request a reset from the login form, confirm
the `SendPasswordRecoveryEmailHandler` job is queued and the email arrives with a working
`/setpassword/{key}` link, complete the reset, then confirm the key is gone and the same link
fails with a toast. Re-check on a `postgresPasswordRecoveries` tenant — with the flag retired,
that is now the only axis left.
