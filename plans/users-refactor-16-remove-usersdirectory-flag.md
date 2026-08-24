# Plan: remove the `usersDirectory` flag and its v1 fallback path

`usersDirectory` has run in production for a couple of weeks (on top of `postgresUsers`,
which stays). This plan deletes the flag and everything that only existed to serve its
`false` branch. Follow-up to [05](./users-refactor-05-rollout.md) and
[15](./users-refactor-15-remove-legacy-dao-shims.md); D8 in
[00](./users-refactor-00-decisions.md) calls this out as "disappears with the flag in the
follow-up PR."

**Scope note:** `usersModel.ts`'s `User` interface stays (5 production files + 1 spec import
it as a type only). Only its mongoose schema/`instanceModel` binding goes. `files.ts`'s
unrelated `@deprecated save/get/delete` and `users.js`'s old `v2UsersGet` wiring are both
out of scope — the latter no longer exists in the codebase at all (confirmed by grep).

---

## Step 1: Collapse the 12 `usersDirectoryEnabled()` call sites onto the Directory path

**Files:** `app/setupQueueWorker.ts`, `app/api/core/infrastructure/jobs/getUserById.ts`,
`app/api/auth/passport_conf.js`, `app/api/files/files.ts`,
`app/api/suggestions/updateEntities.ts`, `app/api/toc_generation/tocService.ts`,
`app/api/services/ocr/OcrManager.ts`, `app/api/services/preserve/preserveSync.ts`,
`app/api/socketio/setupSockets.ts`, `app/api/permissions/entitiesPermissions.ts`,
`app/api/activitylog/helpers.js` (2 call sites)

**Do:**

- Replace each `usersDirectoryEnabled() ? <Directory call> : users.getById/get(...)`
  ternary with the Directory call, unconditional.
- Drop the now-unused `import { usersDirectoryEnabled } from '#api/core/infrastructure/factories/usersBackendFlags.js'`
  and `import users from '#api/users/users.js'` (or dynamic `import('#api/users/users.js')`)
  from each file.
- `getUserById.ts` keeps its dynamic `import('#api/core/infrastructure/factories/UsersDirectoryFactory.js')`
  — that's a separate circular-dependency workaround (see its docstring), not part of the
  flag. Only the `users.js` branch and the `if (usersDirectoryEnabled())` wrapper go; update
  the file docstring, which currently describes the now-deleted branch.
- `setupQueueWorker.ts`'s `UsersDirectoryFactory` import is already static; no change needed
  there beyond dropping the two imports above.

**Test:** existing suites per file — see Step 5 for the ones with `usersDirectory`
parametrization. Run `yarn tsc --noEmit` after this step; unused imports will surface as
lint/type errors if missed.

---

## Step 2: Delete the flag itself

**Files:** `app/api/core/infrastructure/factories/usersBackendFlags.ts`, `app/api/config.ts`,
`app/api/tenants/tenantContext.ts`, `app/api/tenants/tenantsModel.ts`

**Do:**

- `usersBackendFlags.ts`: delete the `usersDirectoryEnabled` function and its docstring, and
  its named export. Keep `resolveUsersBackend` and `UsersBackend` untouched — unrelated to
  this flag.
- `config.ts:167`: delete the `usersDirectory: false,` line from the default `featureFlags`
  object.
- `tenantContext.ts:38`: delete the `usersDirectory?: boolean;` field from the feature-flags
  type.
- `tenantsModel.ts:53`: delete the `usersDirectory: Boolean,` schema field.

**Test:** none directly (Step 1 already removed the only reader). `yarn tsc --noEmit` to
confirm no dangling references.

---

## Step 3: Delete `users.js` and the two Mongo-only helpers it was the sole caller of

**Files (delete):** `app/api/users/users.js`, `app/api/users/specs/users.spec.js`,
`app/api/users/specs/UsersGettersConsistency.spec.ts`,
`app/api/usergroups/userGroupsMembers.ts`,
`app/api/usergroups/specs/userGroupsMembers.spec.ts`,
`app/api/usergroups/userGroupsModel.ts`

**Do:**

- Delete all six files. Confirmed dead: after Step 1, nothing imports `users.js` (it had no
  other callers); `userGroupsMembers.ts`'s only caller was `users.js`; `userGroupsModel.ts`'s
  only caller was `userGroupsMembers.ts`.
- Keep `app/api/users/specs/fixtures.js` — `routes.spec.ts` (unrelated v2 route suite) still
  needs it.

**Test:** none to write — these are the tests being deleted. Confirm nothing else references
them: `grep -rn "users/users.js\|userGroupsMembers\|userGroupsModel" app/api --include="*.ts" --include="*.js"`
should return nothing outside `usersModel.ts`/`usersModel.js` false positives.

---

## Step 4: Trim `usersModel.ts` down to the `User` type

**Files:** `app/api/users/usersModel.ts`, `app/api/odm/specs/modelBulkWriteStream.spec.ts`

**Skeleton:**

```ts
// app/api/users/usersModel.ts — schema + instanceModel removed, interface stays
export interface User {
  _id?: any;
  username?: string;
  password?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'collaborator';
  failedLogins?: number;
  accountLocked?: boolean;
  accountUnlockCode?: string;
  using2fa?: boolean;
  secret?: string | null;
  deletedAt?: Date;
}
```

**Do:**

- Delete the `mongoose`/`instanceModel` imports, the `userSchema` definition, and the
  `export default instanceModel<User>('users', userSchema)` line. Keep only the `User`
  interface.
- `modelBulkWriteStream.spec.ts` imports the default export as a generic fixture model
  (unrelated to users semantics) — repoint it at a different existing mongoose model (e.g.
  whatever `instanceModel` binding the settings or templates module exports) so the ODM
  bulk-write test still has something to run against.

**Test:** `yarn jest app/api/odm/specs/modelBulkWriteStream.spec.ts` — confirm it still
passes against the replacement model.

---

## Step 5: Collapse the `usersDirectory` parametrization in the 4 remaining specs

**Files:** `app/api/permissions/specs/entitiesPermissions.spec.ts`,
`app/api/toc_generation/specs/tocService.spec.ts`, `app/api/auth/specs/deserializeUser.spec.ts`,
`app/api/activitylog/specs/activitylogParser.spec.js`

**Do:**

- Each has a `describe.each([{ path: 'legacy users.get(ById)', usersDirectory: false }, { path: 'UsersDirectory', usersDirectory: true }])`
  (or single-case equivalent for `deserializeUser.spec.ts`). Drop the `describe.each` /
  `it.each` parametrization entirely, keep only the body that was the `usersDirectory: true`
  case, and remove the `testingTenants.changeCurrentTenant({ featureFlags: { usersDirectory } })`
  setup/teardown that went with it.
- Update the comments above each block that currently explain the two-path behavior (D9
  fallback-to-raw-id reasoning stays true, just no longer flag-conditional).

**Test:** `yarn jest app/api/permissions/specs/entitiesPermissions.spec.ts app/api/toc_generation/specs/tocService.spec.ts app/api/auth/specs/deserializeUser.spec.ts app/api/activitylog/specs/activitylogParser.spec.js`

---

## Step 6: Full verification

**Do:**

- `yarn tsc --noEmit`
- `yarn eslint` on all touched/deleted files' directories
- Targeted jest run covering every file touched in Steps 1–5 (do not run the whole
  `app/api/core` or `app/api` tree — batch by directory instead):
  `yarn jest app/setupQueueWorker.ts app/api/core/infrastructure/jobs app/api/auth app/api/files app/api/suggestions app/api/toc_generation app/api/services/ocr app/api/services/preserve app/api/socketio app/api/permissions app/api/activitylog app/api/users app/api/usergroups app/api/odm/specs/modelBulkWriteStream.spec.ts`
- `grep -rn "usersDirectory" app/api --include="*.ts" --include="*.js"` should return
  nothing.

**Test:** the run above is the test — green suites confirm no regression, and the final grep
confirms full removal.
