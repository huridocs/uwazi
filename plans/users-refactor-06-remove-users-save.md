# Plan: Remove `users.save` and the `v2UsersUpdate` flag

Delete the v1 update path permanently. After this plan `POST /api/users` has exactly one
implementation: `UpdateUserController` → `UpdateUser` use case.

**Depends on:** the v2 path reaching parity — steps 1 and 2 are pre-conditions, not cleanup.
Do not start at step 3.

**Done when:** `grep -rn "v2UsersUpdate\|users.save" app/ docs/` returns nothing outside
`app/react/Users/UsersAPI.js` (unrelated frontend client method).

**Full inventory of `v2UsersUpdate` / `users.save`:**

| file | what |
|---|---|
| `app/api/core/infrastructure/express/users/UpdateUserController.ts:11,53` | the branch + the only `users.save` caller |
| `app/api/core/infrastructure/express/users/routes.ts:43` | ajv validation branch on `POST /api/users` |
| `app/api/config.ts:168` | default `false` |
| `app/api/tenants/tenantsModel.ts:56` | mongoose schema field |
| `app/api/tenants/tenantContext.ts:41` | `Tenant` type field |
| `app/api/users/users.js:169-214` | `save` + its only helper `unauthorizedAction` (160-167) |
| `.../users/specs/UpdateUserController.spec.ts:38` | `changeCurrentTenant` |
| `app/api/users/specs/users.spec.js:40-167, 983-996` | `describe('save')` |
| `app/api/users/specs/routes.spec.ts:93-120` | v1 route test + ajv validation cases |

---

## Step 1: Restore the admin-only guard on group assignment

**Files:** `app/api/core/application/UpdateUser.ts`,
`app/api/core/application/specs/UpdateUser.spec.ts` (or the controller spec if no use-case spec exists)

v1 gated membership writes: `if (currentUser.role === 'admin' && user.groups)`
(`users.js:209`). v2 calls `assignGroupsToUser` unconditionally with
`assignedGroupIds` (default `[]`) taken straight from the request body. Two regressions
that become permanent once the fallback is gone:

- a collaborator/editor self-editing can POST arbitrary group ids and join any group —
  privilege escalation;
- a self-edit that omits `groups` silently **wipes** the user's memberships.

**Skeleton:**

```ts
// UpdateUser.execute, after the existing actor checks
const actorIsAdmin = actor.role === 'admin';   // authorization → application layer, next to
                                               // the existing `actor.role !== 'admin'` check
```

**Do:**

- Only run `usergroupsDS.assignGroupsToUser` when the actor is an admin. Leave memberships
  untouched otherwise — do not throw; v1 silently ignored the field and the settings form
  round-trips it.
- Keep the check in `UpdateUser` (application layer), not in `User` — it reads the actor's
  role, so it is authorization, not a business invariant.
- Decide explicitly whether `assignedGroupIds` staying `.default([])` is still right once
  it is admin-only; it is, but note it in the commit.

**Test:** add to the use-case spec — (a) editor self-edit sending `groups: [Journalists]`
leaves memberships unchanged, (b) editor self-edit omitting `groups` does not clear
`Researchers` (`fixtures.ts:43` already puts `existinguser` in it), (c) admin edit still
assigns. Run `yarn jest app/api/core/application app/api/core/infrastructure/express/users`.

---

## Step 2: Port the remaining v1 validations to the v2 schema

**Files:** `app/api/core/application/UpdateUser.ts`,
`app/api/core/infrastructure/express/users/specs/UpdateUserController.spec.ts`

Removing `routes.ts:43` deletes the `userSchema` ajv validation from this route (v2 already
skips it). `UpdateUserInputSchema` must be the sole gate.

**Do:**

- Add the space rule to `UpdateUserInputSchema.username`: v1 rejected any interior space
  with 400 `'Usernames can not contain spaces.'` (`users.js:198`); `z.string().trim()` only
  trims the ends. `CreateUser`'s schema is the reference — match its message and rule
  rather than inventing a new one.
- Diff `userSchema` (`app/shared/types/userSchema.ts`) field by field against
  `UpdateUserInputSchema` and note any other rule ajv enforced that zod does not
  (min lengths, role enum, `additionalProperties`). Zod strips unknown keys, so `using2fa`
  / `secret` smuggling is already closed — confirm, don't assume.
- Error shape changes: `AbstractController` maps `ZodError` → ajv `ValidationError` with
  `instancePath: issue.path.join('.')` (e.g. `username`), where ajv produced `/body/username`.
  Check `app/react/V2` error rendering for anything keying off `instancePath`.

**Test:** move the invalid-property cases from `routes.spec.ts:108-120` into
`UpdateUserController.spec.ts` as v2 cases, asserting the zod-shaped 400 body. Add a
`'user name'` username case. Run `yarn jest app/api/core/infrastructure/express/users`.

---

## Step 3: Collapse `UpdateUserController` to the v2 path

**Files:** `app/api/core/infrastructure/express/users/UpdateUserController.ts`

**Skeleton:**

```ts
class UpdateUserController extends AbstractController<UpdateUserRequest> {
  protected async handle(): Promise<void>   // v2 body only, no branch
}
```

**Do:**

- Delete the `if (ExecutionContext.tenant.featureFlags?.v2UsersUpdate)` wrapper and the
  whole `else` block (lines 52-63). Keep the try/catch and both logger calls.
- Delete `const currentUser = this.user;` (v1-only) and the `import users from '#api/users/users.js'`.
- Keep the `ExecutionContext` import — the logger still needs it.
- Response stays `201` + `{ user: {...} }`. This is already what flagged-on tenants get;
  it is not a new change, but call it out in the PR description since v1 returned `200`.

**Test:** `UpdateUserController.spec.ts` unchanged except for step 6's fixture edit —
it already covers the v2 path end to end. Run
`yarn jest app/api/core/infrastructure/express/users/specs/UpdateUserController.spec.ts`.

---

## Step 4: Drop the route's validation branch

**Files:** `app/api/core/infrastructure/express/users/routes.ts`

**Skeleton:**

```ts
app.post(
  '/api/users',
  needsAuthorization(['admin', 'editor', 'collaborator']),
  validatePasswordMiddleWare,
  UpdateUserController.createHandler()
);
```

**Do:**

- Delete the async middleware at lines 42-54 (the `v2UsersUpdate` ternary).
- Keep `userSchema` imported — `/api/users/new` at line 30 still uses it under
  `v2UsersCreate`.
- Keep `tenants` imported — `v2UsersCreate`, `v2UsersGet` and `v2UsersUtilityRoutes`
  branches remain in this file.

**Test:** `app/api/users/specs/routes.spec.ts` — see step 5. Run
`yarn jest app/api/users/specs/routes.spec.ts`.

---

## Step 5: Delete `users.save` and its dead helper

**Files:** `app/api/users/users.js`

**Do:**

- Delete `save` (169-214) with its `@deprecated` block, and `unauthorizedAction`
  (160-167) — `save` is its only caller.
- Verify each import is still used before touching it: `PUBLIC_USER_ID` (used by `delete`),
  `updateUserMemberships` (used by `newUser`), `encryptPassword` (used by `updateOldPassword`,
  `newUser`, `resetPassword`) all stay. `model.save` stays — other methods use it.
- Fix the cross-reference in `newUser`'s `@deprecated` block if it points at `save`.

**Test:** none of its own; covered by step 6's spec edits plus `yarn tsc` / `yarn lint`
catching a stale reference.

---

## Step 6: Prune the specs

**Files:** `app/api/users/specs/users.spec.js`, `app/api/users/specs/routes.spec.ts`,
`app/api/core/infrastructure/express/users/specs/UpdateUserController.spec.ts`

**Do:**

- `users.spec.js`: delete `describe('save')`'s own tests (43-167) and the nested
  `describe('save')` under `protection of system users` (983-996). **`describe('newUser')`
  is nested inside `describe('save')` at line 169** — un-nest it to a top-level `describe`,
  do not delete it. Drop `let currentUser` (41) and the `assertUserMembership` helper (68-78).
  Imports all survive (`comparePasswords`, `userGroups`, `group1Id/2Id`, `recoveryUserId`
  are each used by other blocks) — confirm with a lint run rather than by eye.
- `users.spec.js`: for each deleted assertion, confirm `UpdateUserController.spec.ts` has
  the equivalent before dropping it. Known gaps to port if missing: password left unchanged
  when the payload omits it, and `using2fa`/`secret` not settable through this route
  (`UpdateUserController.spec.ts:112` covers the second, partially).
- `routes.spec.ts`: delete the `describe('/users')` POST block (92-121) — both the
  `users.save` spy and the ajv validation cases, which moved in step 2. Leave the
  `/users/new`, `/users/unlock`, `/recoverpassword`, `/resetpassword`, `/unlockaccount`,
  GET and DELETE blocks alone. `invalidUserProperties` stays — `/users/new` uses it.
- `UpdateUserController.spec.ts`: delete the
  `testingTenants.changeCurrentTenant({ featureFlags: { v2UsersUpdate: true } })` line (38).
  Check whether `testingTenants` and `testingEnvironment.setUp` are both still needed.

**Test:** `yarn jest app/api/users app/api/core/infrastructure/express/users` — green with
no `v2UsersUpdate` in the tree.

---

## Step 7: Remove the flag declaration

**Files:** `app/api/config.ts`, `app/api/tenants/tenantsModel.ts`, `app/api/tenants/tenantContext.ts`

**Do:**

- `config.ts:168` — delete `v2UsersUpdate: false`.
- `tenantContext.ts:41` — delete `v2UsersUpdate?: boolean`.
- `tenantsModel.ts:56` — delete `v2UsersUpdate: Boolean`. Mongoose ignores unknown keys on
  read, so tenants with the field set keep working; no migration is required. Decide at
  review whether to add one anyway to strip the stale key — the repo has no precedent for
  flag-cleanup migrations, so the default is no.

**Test:** none, declaration-only. `yarn tsc` proves nothing else reads the field.

---

## Step 8: Close out

**Do:**

- `grep -rn "v2UsersUpdate" app/ docs/` → empty.
- `grep -rn "users\.save" app/` → only `app/react/Users/UsersAPI.js` and its spec (the
  frontend client's own `save`, unrelated).
- Update `docs/migration-status.html` — there is a `migration-status` skill for this.
- `yarn lint && yarn tsc`.

**Test:** full API suite, `yarn jest app/api`. Then exercise the real flows, since the ajv
layer is gone: edit another user as admin, edit yourself as an editor (password + email),
and confirm group memberships survive a self-edit — that last one is step 1's regression.

---

## Outcome

Executed 2026-08-14. Deviations from the plan as written:

- **Invalid input now answers 422, not 400.** `handleError.js:102` maps `Ajv.ValidationError`
  — which is what `AbstractController` converts a `ZodError` into — to 422, while the
  route-level `validation.validateRequest` middleware answered 400. This was already the
  behaviour for flagged-on tenants; deleting the fallback makes it universal. The offending
  field is in `body.validations[0].instancePath` (bare `username`, not ajv's `/body/username`).
- **`assignedGroupIds` became `.optional()`** rather than keeping `.default([])`. With the
  default, an update that omits `groups` cleared every membership; v1 distinguished absent
  from `[]`, and `UserFormSidepanel` relies on sending `[]` to clear.
- **`.min(1)` added to `username` and `password`** — ajv enforced `minLength: 1` on both and
  the zod schema did not, so an empty password silently became a no-op instead of a 400.
- `users.spec.js`'s `newUser` block passed a stale `currentUser` argument to
  `users.newUser(user, domain)` in three places, landing in the `domain` slot. Dropped while
  un-nesting; the tests throw before `domain` is read, which is why it never surfaced.
- `docs/migration-status.html` needed no edit — it tracks `postgresUsers`, and its users row
  ("CRUD all run as V2 use cases") is more true after this change, not less.
