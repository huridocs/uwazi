# Plan 03: Read contracts

Introduce the two ports, their four implementations, the read models, and the fence that
keeps DAOs private. Nothing consumes any of it yet — that is plan 05.

Decisions in play: [D1](./users-refactor-00-decisions.md#d1--three-consumers-three-roles),
[D2](./users-refactor-00-decisions.md#d2--two-read-models-no-more),
[D3](./users-refactor-00-decisions.md#d3--contracts),
[D4](./users-refactor-00-decisions.md#d4--daos-are-private-building-blocks),
[D8](./users-refactor-00-decisions.md#d8--one-flag-per-contract).

**Depends on:** plan 02 (DAO surface, `findWithGroups`, `getGroupsByUserIds` on both) --
**done**. Read [A7](./users-refactor-00-decisions.md#a7--the-surface-plan-03-will-actually-find)
first: step 4's DAO-call table and step 6's factory wiring both predate the rewrite, and the
legacy DAO shims must survive this plan.

**Must not touch:** call sites in `app/api/**` outside `core/infrastructure`; `users.js`;
`permissionsContext`.

**Done when:** the project compiles, existing suites are green, and
`grep -rn "as any as MongoUsers" app/` returns nothing.

---

## Step 1: Read models

**Files:** `app/api/core/application/contracts/UserReadModels.ts` (new)

**Skeleton:**
```ts
import type { UserRole } from '#api/core/domain/user/User.js';
import type { GroupSummary } from '#shared/contracts/UserGroups.js';

type UserView = {
  _id: string;
  username: string;
  role: UserRole;
  email: string;
};

type UserProfile = UserView & {
  groups: GroupSummary[];
  using2fa: boolean;
  accountLocked: boolean;
};

export type { UserView, UserProfile };
```

**Do:**
- Exact object types. No intersection with a DBO or row type, ever (D2) — that is what
  leaks `password?`/`secret?`/`deletedAt` through `ServerUsersService` today.
- Domain `UserRole` enum, not a string union (D2).
- These live in `application/contracts/`, not `domain/`. They are read projections, not
  aggregates; `domain/user/` already owns `User`/`UserAccount` and mixing DTOs in muddies
  the write side.
- They are **server-side** models. `#shared/contracts/Users.ts` remains the wire contract
  and controllers map across the boundary, so the two can version independently.

**Test:** none, type-only.

---

## Step 2: The two ports

**Files:** `app/api/core/application/contracts/UsersDirectory.ts` (new),
`app/api/core/application/contracts/UsersQueryService.ts` (new)

**Skeleton:**
```ts
interface UsersDirectory {
  getById(id: string): Promise<ResultType<UserView, UserNotFound>>;
  getProfile(id: string): Promise<ResultType<UserProfile, UserNotFound>>;
  getActor(id: string): Promise<ResultType<UserProfile, UserNotFound>>;
  getManyByIds(ids: string[]): Promise<UserView[]>;
  searchByUsernameOrEmail(term: string): Promise<UserView[]>;
  list(): Promise<UserView[]>;
}

interface UsersQueryService {
  listUsers(): Promise<UserProfile[]>;
}
```

**Do:**
- Carry the D3 rationale into JSDoc on the two non-obvious members, because both will look
  wrong to a reader who wasn't in the design discussion:
  - `getActor` — *the only* method that resolves soft-deleted users, and it returns
    `UserProfile` (not `UserView`) because job actors need `groups` for permission checks.
  - `UsersQueryService` having one method — it owns the settings-screen read, and is where
    pagination/sorting will land.
- `list()` returns `UserView[]`, superseding `listBasicInfo`'s `{_id, username}` shape.
  `search.js` reads only two of the four fields; the extra two are free.
- No filter parameter anywhere. If plan 05 finds a call site that needs one, stop and
  amend D3 rather than adding an untyped `Record<string, unknown>` back in.

**Test:** none, type-only.

---

## Step 3: Mapper extensions

**Files:** `app/api/core/infrastructure/mongodb/user/MongoUsersMapper.ts`,
`app/api/core/infrastructure/postgresql/user/PostgresUsersMapper.ts`

**Skeleton:**
```ts
static toView(dbo: UserDBO): UserView;
static toProfile(dbo: UserWithGroupsDBO): UserProfile;
```

**Do:**
- Extend the existing mappers rather than adding read-specific ones — one mapper per
  backend keeps the DBO/row knowledge in a single file.
- `toProfile` coerces with `Boolean(dbo.using2fa)` / `Boolean(dbo.accountLocked)` — both
  are optional in the DBO and required in `UserProfile` (D2).
- Mongo's `_id` needs `.toHexString()`; Postgres's is already a string. Group `_id`s too.
- **These constructors are the only way a read model comes into existence.** No call site,
  adapter or controller builds one structurally.

**Test:** extend `MongoUsersMapper.spec.ts` / `PostgresUsersMapper.spec.ts` — assert that
a DBO/row carrying `password`, `secret`, `failedLogins`, `accountUnlockCode` and
`deletedAt` produces a read model with none of them present. These two specs survive plan
04 precisely because they are the last line of defence on field leakage.

---

## Step 4: `MongoUsersDirectory` / `PostgresUsersDirectory`

**Files:** `app/api/core/infrastructure/mongodb/user/MongoUsersDirectory.ts` (new),
`app/api/core/infrastructure/postgresql/user/PostgresUsersDirectory.ts` (new)

**Skeleton:**
```ts
class MongoUsersDirectory implements UsersDirectory {
  constructor(deps: { usersDAO: MongoUsersDAO; userGroupsDAO: MongoUserGroupsDAO }) {}
}
```

**Do — the DAO call each method makes:**

| Method | DAO call | fields | scope |
|---|---|---|---|
| `getById` | `findOne({_id})` | `identity` | default |
| `getProfile` | `findOne({_id})` + `getGroupsByUserIds([id])` | `identity, status` | default |
| `getActor` | `findOne({_id})` + `getGroupsByUserIds([id])` | `identity, status` | `deleted: 'include'` |
| `getManyByIds` | `findMany({_id: {$in}})` | `identity` | default |
| `searchByUsernameOrEmail` | Mongo: `findMany({$or:[regex,regex]})` · Postgres: `matchUsernameOrEmail(term)` | `identity` | default |
| `list` | `findMany()` | `identity` | default |

- `getActor` is the **only** row with a non-default scope (D3, D9). Add a one-line comment
  at that call saying so.
- Mongo's case-insensitive search builds `new RegExp('^' + escapeRegExp(term) + '$', 'i')`
  — keep `escapeRegExp`, it is currently in `MongoUsersQueryService` and must not be lost.
  Postgres delegates to the DAO's `matchUsernameOrEmail`. This asymmetry is expected (D4).
- `Result.fail(new UserNotFound(id))` on the three single-user lookups; plain arrays
  elsewhere.
- Empty `ids` short-circuits to `[]` in `getManyByIds` without hitting the database — both
  DAOs currently do this and the behaviour must survive.
- Adapters hold no query language and no guard logic. If either appears here, it belongs
  in the DAO (D5/D7).

**Test:** none here — plan 04 owns the tests, and writing throwaway per-implementation
specs is exactly what plan 04 removes. Develop against plan 04's suite directly if it is
convenient to write it in parallel.

---

## Step 5: Retype the QueryServices

**Files:** `app/api/core/infrastructure/mongodb/user/MongoUsersQueryService.ts`,
`app/api/core/infrastructure/postgresql/user/PostgresUsersQueryService.ts`

**Do:**
- Both `implements UsersQueryService`. Both reduce to
  `listUsers() { return (await dao.findWithGroups()).map(Mapper.toProfile); }`.
- Delete `listBasicInfo` and `findByEmailOrUsername` — they move to the Directory (D3).
- Delete the locally-declared `UserWithGroups` types in both files.
- Rename `listWithGroups` → `listUsers` and drop the filter parameter.

**Test:** `UsersQueryServiceConsistency.spec.ts` updated for the rename only. It is deleted
in plan 04; keep the edit mechanical.

---

## Step 6: Factories

**Files:** `app/api/core/infrastructure/factories/UsersDirectoryFactory.ts` (new),
`app/api/core/infrastructure/factories/UsersQueryServiceFactory.ts`,
`app/api/core/infrastructure/factories/usersBackendFlags.ts` (new),
`app/api/core/infrastructure/factories/UsersDAOFactory.ts`

**Skeleton:**
```ts
// usersBackendFlags.ts
function resolveUsersBackend(): 'postgres' | 'mongo' {
  // throws when postgresUsers !== postgresUsergroups
}
```

**Do:**
- Extract the both-flags-must-agree check currently inlined in
  `UsersQueryServiceFactory:25` into `resolveUsersBackend()`, and use it from **both**
  factories. The Directory needs it too because `getProfile`/`getActor` carry groups (D8).
  Preserve the existing error message and its explanation of why a mixed configuration is
  rejected rather than silently degraded.
- `UsersQueryServiceFactory.default(): UsersQueryService` — return the **interface**. All
  three `as any` casts go.
- `UsersDAOFactory.default()` keeps its `as any as MongoUsersDAO` shape for now but is
  used only by the three adapter factories; consider returning a union and narrowing
  inside each factory instead. Either way it stops appearing in `app/api/**`.

**Test:** a small factory spec asserting the mixed-flag configuration throws for **both**
factories, since that guard is now shared and a regression would be silent.

---

## Step 7: Fence the DAOs

**Files:** `eslint.config.mjs`

**Skeleton:**
```js
{
  files: ['app/**/*.{ts,tsx,js,jsx}'],
  ignores: [
    'app/api/core/infrastructure/factories/**',
    'app/api/core/infrastructure/mongodb/user/**',
    'app/api/core/infrastructure/postgresql/user/**',
  ],
  rules: {
    'no-restricted-imports': ['error', { patterns: [{
      group: ['**/infrastructure/*/user/*UsersDAO*', '**/factories/UsersDAOFactory*'],
      message: 'Users DAOs are private. Use UsersDirectory, UsersQueryService or UsersDataSource (see plans/users-refactor-00-decisions.md#d4).',
    }]}],
  },
}
```

**Do:**
- The message must point at the alternative, not just forbid. A developer hitting this
  needs to know which of the three doors is theirs (D1).
- Specs under the allowlisted infrastructure directories are exempt by the same `ignores`.
- Expect this to fail immediately on the four legacy call sites and on `users.js:271` —
  that is the point. Plan 05 clears them. Either land this step **last within plan 03**
  with the violations already queued for plan 05, or add a temporary
  `eslint-disable-next-line` at each of the five sites with a `// removed in plan 05`
  comment. Prefer the latter so the branch never has a red lint.

**Test:** `yarn lint` (or the project's equivalent) reports exactly the five expected
violations, or zero with the temporary disables in place.
