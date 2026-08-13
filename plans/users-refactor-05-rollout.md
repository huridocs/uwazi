# Plan 05: Call-site rollout

Move the twelve consumers onto `UsersDirectory` behind the `usersDirectory` flag, in
ascending order of blast radius. The flag flip is the final commit.

Decisions in play: [D1](./users-refactor-00-decisions.md#d1--three-consumers-three-roles),
[D8](./users-refactor-00-decisions.md#d8--one-flag-per-contract),
[D9](./users-refactor-00-decisions.md#d9--deleted-users-stay-invisible-except-to-getactor),
[D10](./users-refactor-00-decisions.md#d10--scope-boundaries),
[D12](./users-refactor-00-decisions.md#d12--password-is-split-out-of-the-shared-contract-not-deleted).

**Depends on:** plan 04 green on both backends (D11). Do not start otherwise.

**Must not touch:** `users.js` getter signatures or behaviour;
`permissionsContext.setUserInContext`'s type; `app/api/users.v2/model/User.ts`.

**Done when:** all four flag combinations (`usersDirectory` × `postgresUsers`) pass the
suite, and no `tenants.current().featureFlags?.postgresUsers` ternary remains in
`app/api/**` outside the factories.

---

## The pattern

Every call site takes the same shape. The Directory factory resolves the backend
internally (plan 03 step 6), so the *backend* ternary disappears and is replaced by a
*rollout* ternary that is deleted in a later PR.

```ts
if (tenants.current().featureFlags?.usersDirectory) {
  const users = await UsersDirectoryFactory.default().getManyByIds(ids);
  // ...
}
// legacy path unchanged
```

Each step below removes one `eslint-disable-next-line` left by plan 03 step 7.

---

## Step 1: Display-only reads (lowest risk)

**Files:** `app/api/search/search.js` (~459), `app/api/permissions/collaborators.ts` (~13)

Both currently call `UsersQueryServiceFactory`, whose `listBasicInfo` and
`findByEmailOrUsername` moved to the Directory in plan 03.

**Do:**
- `search.js`: `listBasicInfo()` → `list()`. It reads `u._id` and `u.username`; the two
  extra fields on `UserView` are unused and harmless.
- `collaborators.ts`: `findByEmailOrUsername(term)` → `searchByUsernameOrEmail(term)`.
  Note it also builds `partialFilterTerm` for the **groups** query — that stays; only the
  users lookup moves. The users match has always been exact-and-case-insensitive while
  groups are prefix-matched; do not "fix" that asymmetry here.

**Test:** existing search and collaborators specs, run under both flag values.

---

## Step 2: Batch label resolution — kills three duplicated ternaries

**Files:** `app/api/activitylog/helpers.js` (~109), `app/api/permissions/entitiesPermissions.ts` (~33),
`app/api/usergroups/userGroups.ts` (~24)

All three carry the same `postgresUsers ? UsersDAOFactory.default().findByIds(ids) :
users.get({_id:{$in:ids}}, ...)` shape, each getting a differently-shaped result (DBO vs
row vs mongoose doc) and spreading it.

**Do:**
- All three → `getManyByIds(ids)` returning `UserView[]`.
- `activitylog/helpers.js` reads `username` via `getNameOfAllowedPeople`, comparing
  `u._id.toString() === p.refId`. `UserView._id` is already a string on both backends — the
  `.toString()` becomes redundant but is harmless; leave or simplify consistently.
- `userGroups.ts` maps to `{refId, username, role, email}` — exactly `UserView`'s fields,
  so the mapping simplifies to a rename of `_id`. Its `WithId<UserSchema>[]` annotation
  becomes `UserView[]`.
- `entitiesPermissions.ts` uses `(p: any) => ({ label: p.username })`; the `any` can go.
- Deleted users stay excluded (D9) — activitylog keeps falling back to printing the raw
  refId for a deleted permission-holder. Do not switch these to `getActor`.

**Test:** activitylog, permissions and usergroups specs under both flag values. Watch for
snapshot specs that captured the mongoose document shape.

---

## Step 3: Actor attribution

**Files:** `app/api/files/files.ts` (~48), `app/api/toc_generation/tocService.ts` (~38),
`app/api/suggestions/updateEntities.ts` (~50)

All three call `users.getById(actorId, '-password', false, true)` — `includeDeleted: true`.

**Do:**
- → `getActor(actorId)`. This is the deliberate deleted-user path (D3); the other read
  methods would silently return nothing for a deleted actor and change behaviour.
- All three unwrap a `ResultType`; they currently branch on a falsy user. Use
  `result.isError() ? undefined : result.getData()` to preserve the existing fallback,
  not `getDataOrThrow()` — none of these paths should start throwing.
- `getActor` returns `UserProfile`, so `groups` arrives too. These sites ignore it.

**Test:** files, toc and suggestions specs under both flag values. Verify a soft-deleted
actor still resolves — add the case if none exists, since this is the behaviour most
likely to regress silently.

---

## Step 4: Narrow behavioural reads

**Files:** `app/api/socketio/setupSockets.ts` (~146), `app/api/services/preserve/preserveSync.ts` (~103)

**Do:**
- `setupSockets.ts` calls `users.getById(userId, '', false)` — an empty select, pulling the
  **whole document including `password`**, to read `.role`. → `getById(userId)`, unwrap,
  return early on error. This is the clearest single leak the contract closes.
- `preserveSync.ts` calls `users.getById(config.user)` with defaults. → `getById`. Check
  what it feeds downstream; if it needs groups, use `getProfile` instead and say why in a
  comment.

**Test:** sockets and preserve specs under both flag values.

---

## Step 5: Queue worker actor

**Files:** `app/setupQueueWorker.ts` (~93)

`users.getById(userId, '-password', true, true)` — groups **and** deleted — feeding
`User.createFrom`, whose `groups` field drives permission checks inside jobs.

**Do:**
- → `getActor(userId)`. This is the site that dictated `getActor` returning `UserProfile`
  rather than `UserView` (D3): an actor resolved without groups silently *loses* access
  inside jobs, with no error.
- `User.createFrom`'s zod schema accepts `groups` as either strings or `{_id}` objects and
  defaults to `[]` — so a missing groups array would parse cleanly and fail silently.
  Assert the group ids reach `User.groups` rather than trusting the parse.
- Use `getDataOrThrow()` here: the surrounding code already throws on a missing `userId`,
  and running a job as an unresolved actor is worse than failing it.

**Test:** queue worker specs plus a job spec exercising a group-scoped permission, under
both flag values.

---

## Step 6: Session deserialization (last)

**Files:** `app/api/auth/passport_conf.js` (~40)

The session root. A defect here logs everyone out or silently widens permissions.

**Do:**
- `users.getById(id, '-password', true)` → `getProfile(id)`, unwrap to `false` on error to
  preserve `done(null, false)` semantics for a vanished user.
- `appContext.set('user', user)` now receives a `UserProfile`. It is structurally
  assignable to `UserSchema`, so `permissionsContext` needs no change (D10) — verify by
  compiling, not by assuming.
- `permissionsContext.permissionsRefIds()` reads `user.groups[].._id.toString()`.
  `GroupSummary._id` is a string; `.toString()` is a no-op. Confirm rather than assume.
- `ServerUsersService.mapCurrentUser` reads `using2fa` and `accountLocked` off the context
  user — both present on `UserProfile`, which is why `getProfile` and not `getById`.
- Update the stale comment at `passport_conf.js:31` referencing `UsersDAOFactory` and
  `users.js:252-273`.

**Test:** auth, session and `GetCurrentUserController` specs under both flag values. Run
the e2e/login suite if one exists — this is the step that justifies the ordering.

---

## Step 7: `users.js` repoint

**Files:** `app/api/users/users.js` (~271)

The one edit inside `users.js` (D10). Its `v2UsersGet` branch calls
`UsersDAOFactory.default().getById(...)` directly, which the plan 03 fence forbids.

**Do:**
- Repoint to `UsersDirectoryFactory.default()`. Signature and behaviour of
  `users.getById(id, select, includeGroups, includeDeleted)` stay **identical**.
- Map the four legacy parameters onto the contract:
  - `includeDeleted: true` → `getActor`; otherwise `includeGroups ? getProfile : getById`.
  - `includePassword` (from `select.includes('+password')`) has **no equivalent** — no
    read model carries a password. Grep for callers passing `+password` through
    `users.getById`; if any exist they must go to `UsersDataSource`, not here. If none do,
    delete the `includePassword` computation and note it in the commit.
  - `includeGroups` is satisfied by `getProfile`/`getActor` returning `groups`, so the
    `getByMemberIdList` + `populateGroupsOfUsers` call in that branch is dropped.
- Update the `@deprecated` JSDoc block above `get()` — it documents the current
  `UsersDAOFactory` routing in detail and will be wrong.

**Test:** `UsersGettersConsistency.spec.ts` — unmodified, green, both flag values. It exists
for exactly this change; if it needs edits to pass, the repoint changed behaviour.

---

## Step 8: Shared contract split

**Files:** `app/shared/contracts/Users.ts`, `app/react/V2/services/server/ServerUsersService.ts`,
`app/api/core/infrastructure/express/users/GetUsersController.ts`

**Do:**
- `User` (response shape) loses `password?`. `CreateUserRequest` and `UpdateUserRequest`
  declare `password?: string` explicitly (D12) — `UpdateUserRequest = User` today, so it
  becomes `User & { password?: string }`. The settings form genuinely posts a password
  (`UserFormSidepanel.tsx:301`); a blanket removal breaks password changes.
- `ServerUsersService.mapUsers` is typed as
  `ReturnType<typeof UsersQueryServiceFactory.default>['listWithGroups']` — a React-side
  service deriving its type from a Mongo DAO. Replace with `UserProfile[]`.
- `GetUsersController` maps `UserProfile[]` → `GetUsersResponse`. The mapping is now
  field-for-field, but keep it explicit: the wire contract must stay free to version
  independently of the server read model (D2).

**Test:** React users-settings specs, `GetUsersController.spec.ts`, and a typecheck of
`app/react`.

---

## Step 9: Close out

**Do:**
- Remove every `eslint-disable-next-line` left by plan 03 step 7; `yarn lint` clean.
- Grep for stragglers: `UsersDAOFactory` outside `core/infrastructure/factories`,
  `postgresUsers` ternaries in `app/api/**`, `listWithGroups`, `listBasicInfo`,
  `findByEmailOrUsername`.
- Update `docs/migration-status.html` (there is a `migration-status` skill for this).
- Final commit: default `usersDirectory` to `true` in `app/api/config.ts`, or leave it
  `false` and flip per tenant — decide at review time. Keeping it the **last** commit is
  the point; everything before it is inert.

**Follow-up PR, explicitly not here (D10):** retype
`permissionsContext.setUserInContext` to `UserProfile`, and remove the `usersDirectory`
ternaries once the flag is on everywhere.
