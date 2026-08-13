# Plan 04: Contract suites

> **DONE**, steps 1-3. What it delivered differs from this text in seven places -- see A10
> in the decision record. Most importantly, step 3 **trims** the two DAO specs rather than
> deleting them, so three files went, not six.

One suite per contract, proving Mongo and Postgres accept and return exactly the same
thing. Replaces six per-implementation and consistency suites.

Decisions in play: [D3](./users-refactor-00-decisions.md#d3--contracts),
[D4](./users-refactor-00-decisions.md#d4--daos-are-private-building-blocks),
[D9](./users-refactor-00-decisions.md#d9--deleted-users-stay-invisible-except-to-getactor),
[D11](./users-refactor-00-decisions.md#d11--sequencing-property).

**Depends on:** plan 01 (fixture mirroring), plan 03 (contracts + factories).

**This plan must be green before plan 05 starts** (D11). Parity is proven while the old
path is still live, so the flag flip becomes revertable rather than a bet.

**Must not touch:** any production file. If a suite exposes a defect, fix it in the owning
plan's files and note it here.

---

## Step 1: `UsersDirectory` contract suite

**Files:** `app/api/core/application/specs/UsersDirectory.spec.ts` (new)

Follows the `FileDelete.spec.ts` pattern: `describe.each` over backends, real databases,
SUT from the factory inside `runWithContext`.

**Skeleton:**
```ts
const testConfigs = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const fixtures: DBFixture = {
  users: [
    f.user({ username: 'active1', role: UserRole.ADMIN, email: 'active1@test.com' }),
    f.user({ username: 'active2', role: UserRole.EDITOR, email: 'active2@test.com' }),
    f.user({ username: 'deleted', role: UserRole.EDITOR, email: 'deleted@test.com', deletedAt: new Date() }),
    f.user({ username: 'sensitive', role: UserRole.ADMIN, email: 'sensitive@test.com',
             password: 'hash', secret: 's', failedLogins: 3, accountUnlockCode: 'abc',
             accountLocked: true, using2fa: true }),
    { _id: PUBLIC_USER_OBJECT_ID, username: 'public', role: UserRole.COLLABORATOR, email: 'public@uwazi.local' },
  ],
  usergroups: [
    f.usergroup('Group A', [{ refId: f.idString('active1') }]),
    f.usergroup('Group B', [{ refId: f.idString('active1') }, { refId: f.idString('active2') }]),
  ],
};

describe('UsersDirectory', () => {
  beforeAll(async () => { await testingEnvironment.setUp({}, { postgres: true }); });
  afterAll(async () => { await testingEnvironment.tearDown(); });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: 'users-directory',
        featureFlags: { postgresUsers: usePostgres, postgresUsergroups: usePostgres },
      });
      await testingEnvironment.setFixtures(fixtures);   // ← one declaration, both backends
    });

    const sut = () => testingEnvironment.runWithContext(() => UsersDirectoryFactory.default());
    // ...
  });
});
```

**Do — the cases that must exist:**

*Per method, on both backends:*
- `getById` — returns `UserView` for an active user; `UserNotFound` for the deleted user,
  the public user, and an unknown id.
- `getProfile` — returns groups, `using2fa`, `accountLocked`; `active2` has one group,
  `sensitive` has none (assert the empty array, not `undefined`).
- `getActor` — **returns the deleted user** (the one method that does, D3/D9); still
  refuses the public user; carries groups.
- `getManyByIds` — filters deleted and public; returns `[]` for `[]` without touching the
  database; ignores unknown ids rather than erroring.
- `searchByUsernameOrEmail` — case-insensitive exact match on both fields; a term matching
  neither returns `[]`; a term with regex metacharacters (`a.b*`) is treated literally
  (this is what `escapeRegExp` protects on the Mongo side and what `lower(?)` gives on
  Postgres — the two must agree).
- `list` — excludes deleted and public.

*Cross-cutting, asserted on every method returning a read model:*
- **No credential fields present.** Iterate `['password','secret','failedLogins','accountUnlockCode','deletedAt']`
  and assert `expect(user).not.toHaveProperty(field)` — including on `getActor`, which sees
  a deleted user but must not expose `deletedAt`.
- Field-for-field deep equality between the two backends. The cleanest form is to collect
  results per backend into a shared object across the `describe.each` and assert equality
  once at the end; if that fights the fixture lifecycle, assert against an explicit literal
  in each branch instead — the literal is duplicated but the drift is still caught.

**Test:** this *is* the test. Run both backends before and after every subsequent change.

---

## Step 2: `UsersQueryService` contract suite

**Files:** `app/api/core/application/specs/UsersQueryService.spec.ts` (new)

**Do:**
- Same harness, same single fixture set.
- `listUsers()` — three active non-public users; groups populated per user; `using2fa` and
  `accountLocked` present and coerced to booleans (never `undefined`); credential fields
  absent; deleted and public users excluded.
- Assert ordering is either explicitly stable or explicitly not asserted. Mongo's
  aggregation and Postgres's `LEFT JOIN LATERAL` have no shared natural order, and an
  incidental order match here would become a flake later.
- Assert the group objects are exactly `{ _id, name }` — Mongo's `$lookup` projection and
  Postgres's `jsonb_build_object` are two independent chances to include an extra field.
- One case with **two tenants** asserting no cross-tenant bleed in `findWithGroups`.
  Postgres reaches this through raw SQL and RLS (plan 02 step 3); carry that case here
  permanently rather than leaving it in the deleted DAO spec.

---

## Step 3: Delete the superseded suites

**Files to delete:**
- `app/api/core/infrastructure/mongodb/user/specs/MongoUsersDAO.spec.ts`
- `app/api/core/infrastructure/postgresql/user/specs/PostgresUsersDAO.spec.ts`
- `app/api/core/infrastructure/mongodb/user/specs/MongoUsersQueryService.spec.ts`
- `app/api/core/infrastructure/postgresql/user/specs/PostgresUsersQueryService.spec.ts`
- `app/api/core/infrastructure/user/specs/UsersDAOConsistency.spec.ts`
- `app/api/core/infrastructure/user/specs/UsersQueryServiceConsistency.spec.ts`

**Files that stay — do not delete:**
- `MongoUsersMapper.spec.ts` / `PostgresUsersMapper.spec.ts` — backend-specific units, and
  the last line of defence on field leakage (plan 03 step 3).
- `MongoUsersDataSource.spec.ts` / `PostgresUsersDataSource.spec.ts` — the write side,
  which has its own contract (`UsersDataSource`) and is not covered by these suites.
- `app/api/users/specs/UsersGettersConsistency.spec.ts` — **load-bearing.** It pins
  `users.js` getter behaviour across `v2UsersGet` on/off, making it the safety net for
  plan 05's `users.js` edit (D10).

**Do:**
- `UsersDAOConsistency.spec.ts` goes because DAOs are no longer a contract (D4); asserting
  Mongo/Postgres parity at that level tests an implementation detail, and it is the thing
  currently forcing the two DAOs to grow matching methods.
- Before deleting each file, diff its assertions against the new suites and confirm every
  behaviour is covered. Anything not covered is either a missing case or dead assertion —
  decide which, do not drop it silently.
- Check `app/api/core/infrastructure/user/specs/` for emptiness afterwards and remove the
  directory if so.

**Test:** full suite green; total spec count drops by six files with no loss of covered
behaviour.
