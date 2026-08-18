# Plan: Remove `users.newUser` and the `v2UsersCreate` flag

The sibling of [plan 06](./users-refactor-06-remove-users-save.md). Delete the v1 creation
path permanently so `POST /api/users/new` has one implementation: `CreateUserController` →
`CreateUser` use case.

**Done when:** `grep -rn "v2UsersCreate\|newUser" app/api/` returns nothing but
`SendWelcomeEmail`-related strings and unrelated local variables.

**Full inventory:**

| file | what |
|---|---|
| `app/api/core/infrastructure/express/users/CreateUserController.ts:11,52` | the branch + the route's `users.newUser` caller |
| `app/api/core/infrastructure/express/users/routes.ts:18-36` | ajv validation branch on `POST /api/users/new` |
| `app/api/config.ts:167` | default `false` |
| `app/api/tenants/tenantsModel.ts:49` | mongoose schema field |
| `app/api/tenants/tenantContext.ts:38` | `Tenant` type field |
| `app/api/users/users.js:~160-190` | `newUser` |
| `app/api/sync/specs/syncWorker.spec.ts:85,95` | **the only non-spec-subject caller** — step 1 |
| `app/api/users/specs/users.spec.js:40-179` | `describe('newUser')` |
| `app/api/users/specs/users.spec.js:~541` | a `recoverPassword` test that builds its user with `newUser` |
| `app/api/users/specs/routes.spec.ts` | `/users/new` route test + ajv validation cases |
| `.../users/specs/CreateUserController.spec.ts:36` | `changeCurrentTenant` |

**Two behaviour changes that ship with the flag removal** (already true for flagged-on
tenants — call them out in the PR, do not try to undo them here):

- **Invalid input answers 422, not 400**, and a duplicate username/email answers **400, not
  409** — `DomainError` maps to 400 in `handleError.js:128`, `Ajv.ValidationError` to 422.
- **The welcome email becomes a queued job.** v1 sent it inline through
  `users.recoverPassword`, writing a `passwordrecoveries` row in the request. v2 dispatches
  `SendWelcomeEmailHandler` (`CreateUser.ts:44`), so a tenant with no queue worker running
  creates users that never receive their invitation.

---

## Step 1: Give the syncWorker spec its own target users

**Files:** `app/api/sync/specs/syncWorker.spec.ts`

`applyFixtures` creates the admin that `syncWorker.login` (`syncWorker.ts:114`) authenticates
with against each target — `user`/`password` and `user2`/`password2`, matching the sync
config in `app/api/sync/specs/fixtures.ts:838,858`. It calls `users.newUser({...})` with **no
domain argument**, which only works because `mailer.send` is mocked. Nothing here needs the
v1 creation flow; it needs a row in `users` whose password bcrypt-matches.

**Skeleton:**

```ts
import { encryptPassword } from '#api/auth/encryptPassword.js';

const targetFixtures = async (username: string, password: string): Promise<DBFixture> => ({
  settings: [{}],
  users: [{ _id: db.id(), username, password: await encryptPassword(password), role: 'admin', email: `${username}@testing` }],
});
```

**Do:**

- Build the target DBs with `await targetFixtures('user', 'password')` /
  `await targetFixtures('user2', 'password2')` instead of `{ settings: [{}] }`, and delete
  both `users.newUser` calls. `email` must stay `user@testing` / `user2@testing`.
- Keep the two `tenants.run(..., 'targetN')` blocks — `elasticTesting.reindex()` still
  belongs there. They lose their only other statement.
- Drop the now-unused `import users from '#api/users/users.js'`.
- Note what goes away: v1 also wrote a `passwordrecoveries` doc per target via
  `recoverPassword`. Nothing asserts it; losing it is a cleanup, not a regression.

**Test:** `yarn jest app/api/sync/specs/syncWorker.spec.ts`. The login round-trip is the
assertion — if the hash or username is wrong, every sync test fails at
`syncWorker.login`, not in a fixture helper.

---

## Step 2: Port the remaining v1 validations to the v2 schema

**Files:** `app/api/core/application/CreateUser.ts`,
`app/api/core/infrastructure/express/users/specs/CreateUserController.spec.ts`

Removing the route branch deletes the `userSchema` ajv gate, leaving
`CreateUserInputSchema` as the only one. It is missing three rules ajv enforced, exactly as
`UpdateUserInputSchema` was in plan 06 — copy that shape verbatim so the two schemas do not
drift.

**Skeleton:**

```ts
username: z.string().trim().min(1).refine(u => !u.includes(' '), 'Usernames can not contain spaces.'),
password: z.string().min(1).optional(),
```

**Do:**

- Add `.min(1)` to `username` and `password`, and the no-spaces refinement.
- **This breaks an existing test on purpose:** `CreateUserController.spec.ts` creates
  `'guy in group'` and expects 201. Rename it (`'guy-in-group'`). Allowing spaces at
  creation while plan 06 forbids them at update produces users that cannot be edited —
  every save would 422 on a username the server itself issued.
- `assignedGroupIds` keeps `.default([])` here; unlike update, creation has no memberships
  to preserve, and `CreateUser` has no admin-only guard to add — the route is already
  `needsAuthorization()` (admin-only).
- Leave uniqueness alone: `checkUniqueUsername`/`checkUniqueEmail` go through
  `dao.exists`, whose default scope is `deleted: 'exclude'`
  (`UserReadOptions.ts:38`), so v1's "reuse a soft-deleted user's name" behaviour already
  holds — `CreateUserController.spec.ts` covers it.

**Test:** add a `describe('validation')` to `CreateUserController.spec.ts` mirroring plan
06's — missing/empty/spaced username, missing/empty email, missing/unknown role, empty
password — asserting **422** and `body.validations[0].instancePath`. Add the two duplicate
cases (existing username, existing email) asserting **400**. Run
`yarn jest app/api/core/infrastructure/express/users`.

---

## Step 3: Collapse `CreateUserController` to the v2 path

**Files:** `app/api/core/infrastructure/express/users/CreateUserController.ts`

**Skeleton:**

```ts
class CreateUserController extends AbstractController<CreateUserRequest> {
  protected async handle(): Promise<void>   // v2 body only, no branch
}
```

**Do:**

- Delete the `if (ExecutionContext.tenant.featureFlags?.v2UsersCreate)` wrapper and the
  `else` block (lines 51-62). Keep the try/catch and both logger calls.
- Keep `const domain = ...` — the v2 path feeds it to `CreateUserInputSchema`.
- Drop `import users from '#api/users/users.js'`.
- Response stays 201 (v1 answered 200).

**Test:** `CreateUserController.spec.ts`, minus step 6's fixture edit, already covers this
path end to end. Run `yarn jest app/api/core/infrastructure/express/users/specs/CreateUserController.spec.ts`.

---

## Step 4: Drop the route's validation branch

**Files:** `app/api/core/infrastructure/express/users/routes.ts`

**Skeleton:**

```ts
app.post(
  '/api/users/new',
  needsAuthorization(),
  validatePasswordMiddleWare,
  CreateUserController.createHandler()
);
```

**Do:**

- Delete the async middleware at lines 21-35, including the stale
  `// for legacy reasons, should be removed one the flag is gone` comment.
- Remove the `userSchema` import — plan 06 removed the only other use.
- Keep `validation` (still used by the four `v2UsersUtilityRoutes` branches) and `tenants`
  (still used by `v2UsersGet` and `v2UsersUtilityRoutes`).

**Test:** `yarn jest app/api/users/specs/routes.spec.ts` after step 6.

---

## Step 5: Delete `users.newUser`

**Files:** `app/api/users/users.js`

**Do:**

- Delete `newUser` and its `@deprecated` block.
- Drop the imports it alone kept alive: `random` from `#shared/uniqueID.js` and
  `updateUserMemberships`. Keep `getByMemberIdList` (used by `get`/`getById`) and
  `removeUsersFromAllGroups` (used by `delete`).
- `this.recoverPassword` loses its only internal caller; `recoverPassword` itself stays for
  the `v2UsersUtilityRoutes` fallback. Update its `@deprecated` block, which says "Also
  called internally by `newUser`".
- **Follow-up, not this PR:** `updateUserMemberships`
  (`app/api/usergroups/userGroupsMembers.ts:9`) is then referenced only by its own spec.
  Note it; deleting it is a user-groups concern.

**Test:** none of its own — step 6's spec edits plus `yarn tsc` / `yarn lint` catch stragglers.

---

## Step 6: Prune the specs

**Files:** `app/api/users/specs/users.spec.js`, `app/api/users/specs/routes.spec.ts`,
`app/api/core/infrastructure/express/users/specs/CreateUserController.spec.ts`

**Do:**

- `users.spec.js`: delete `describe('newUser')` (40-179) and its `assertUserMembership`
  helper. Before dropping each case, confirm `CreateUserController.spec.ts` has the
  equivalent; the ones to port if missing are the random-password path and
  `using2fa`/`secret` not being settable at creation.
- `users.spec.js` (~541): `'should personalize the mail if recover password process is part
  of a newly created user'` lives in `describe('recoverPassword')` — a test of code that
  **stays** — and only uses `newUser` to get a user with that email. Replace the call with a
  direct `usersModel.save({ username: 'spidey', email: 'peter@parker.com', role: 'editor' })`
  and keep the assertions. Do not delete this test.
- `users.spec.js`: `group1Id`/`group2Id`/`userGroups` imports and `random` may go unused once
  `newUser` is gone — let lint say so rather than guessing.
- `routes.spec.ts`: delete the `/users/new` block; then `invalidUserProperties` and
  `userToUpdate` have no remaining users and go too.
- `CreateUserController.spec.ts`: drop `featureFlags: { v2UsersCreate: true }` from the
  `changeCurrentTenant` call — but **keep the call**, it also sets `domain: 'uwazi'`, which
  the welcome-email job assertion depends on.

**Test:** `yarn jest app/api/users app/api/core/infrastructure/express/users`.

---

## Step 7: Remove the flag declaration

**Files:** `app/api/config.ts`, `app/api/tenants/tenantsModel.ts`, `app/api/tenants/tenantContext.ts`

**Do:**

- Delete `v2UsersCreate` from all three. As in plan 06, no migration: mongoose ignores the
  stale key on tenants that have it set.

**Test:** none, declaration-only. `yarn tsc` proves nothing else reads it.

---

## Step 8: Close out

**Do:**

- `grep -rn "v2UsersCreate" app/ docs/` → empty; `grep -rn "newUser" app/api/` → only
  unrelated hits.
- `yarn lint && yarn tsc`.
- `docs/migration-status.html` needs no edit for the same reason as plan 06 — check with the
  `migration-status` skill rather than assuming.

**Test:** `yarn jest app/api/users app/api/sync app/api/auth app/api/tenants app/api/usergroups`
plus the targeted core specs (`core/infrastructure/express/users`,
`core/domain/user/specs/EncryptedPassword.spec.ts`) — `app/api/core` as a whole is too large
to run here. Then create a user through the settings UI and confirm the invitation email
actually arrives — that is the one path whose delivery mechanism changes with this PR, and
no unit test covers the worker actually draining the job.

---

## Outcome

Executed 2026-08-14. Deviations and findings:

- **Creating a user without a password still works** — checked because it looked dropped.
  `password` stays `.optional()`, and `EncryptedPassword.create(undefined)` falls back to
  `randomBytes(32).toString('hex')` before hashing, where v1 used `random()` from
  `#shared/uniqueID.js` (`Math.random().toString(36).substr(2)`). Same behaviour, stronger
  secret. Pinned with two new `EncryptedPassword.create()` tests and an assertion that
  `CreateUserController`'s no-password path actually stores a hash.
- **`password: ''` was a real hole**, which is why `.min(1)` matters here more than it did
  for update: an empty string is not nullish, so it skipped the random fallback and was
  hashed as a usable password. ajv's `minLength: 1` had been the only thing stopping it.
- `syncWorker.spec.ts` needed `UserRole.ADMIN` rather than the string `'admin'` that
  `users.newUser` accepted — `DBFixture` types the field as the enum. `tsc` caught it, the
  tests did not.
- `users.spec.js`'s `recoverPassword` `newUser: true` test kept its assertions; only its
  setup moved to `usersModel.save({ ..., password: await encryptPassword('mypass') })`.
- Removing `newUser` also emptied `routes.spec.ts` of `invalidUserProperties` and
  `userToUpdate`, and `users.spec.js` of the `random`, `userGroups`, `group1Id` and
  `group2Id` imports.
