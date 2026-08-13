# Users Refactor — Decision Record

Not executable. This is the shared preamble for plans 01–05; every plan references
decisions by number instead of restating them. If a plan seems to contradict something
here, this file wins.

Goal: give users a **defined public contract** so the ~12 modules that depend on users
stop reaching into persistence, and make the DAOs genuine building blocks instead of a
de-facto interface.

---

## Status

| Plan | State |
|---|---|
| 01 — Foundations | **Done** (commit `2094a900f2`), except step 4, deferred by [A1](#a1--plan-01-step-4-public_user_id--string-is-deferred). Step 2 later reverted by [A6](#a6--the-gin-index-is-not-used-findwithgroups-joins-by-unnesting-instead). |
| 02 — DAO layer | **Done**, steps 1–7 (through commit `26010042a2`). See [A7](#a7--the-surface-plan-03-will-actually-find) for what it delivered. |
| 03 — Read contracts | **Done**, steps 1–7. See [A9](#a9--what-plan-03-actually-did) for the six deltas from the plan text. |
| 04 — Contract suites | **Done**, steps 1–3. See [A10](#a10--what-plan-04-actually-did) for the seven deltas from the plan text. |
| 05 — Rollout | Not started. Extended by [A2](#a2--the-fence-hits-nine-files-not-five) and [A9](#a9--what-plan-03-actually-did) (step 1 also deletes the query services' legacy block). |

Working state: `tsc --noEmit` clean, `eslint` clean on the changed files, every suite green.

**Running tests:** use `yarn jest -i`. In parallel, 2–8 suites fail per run with
Elasticsearch `index_not_found_exception`, and the failing set changes run to run — local ES
contention, not real failures. Serial runs are reliable.

The stack must be up first (`docker compose up -d mongo postgres mongoreplicaset_start_script`,
plus `elasticsearch` for anything that indexes). With Postgres down, every Postgres suite
fails as a 5s `beforeAll` hook timeout rather than a connection error — which reads exactly
like a broken spec. Check the containers before believing a red run.

---

## D1 — Three consumers, three roles

There will be a `getById` on three components. This is CQRS, not duplication. Do not
"consolidate" them.

| Component | Question it answers | Returns | Consumers |
|---|---|---|---|
| `UsersDataSource` *(exists)* | "load the user so I can **change** it" | `User` / `UserAccount` aggregate, credentials hydrated | v2 use cases only |
| `UsersDirectory` *(new)* | "who is user X, so I can **act on their behalf or name them**" | `UserView` / `UserProfile` | any internal module |
| `UsersQueryService` *(exists, retyped)* | "what does the **users settings screen** render" | `UserProfile[]` | HTTP controllers, SSR loaders |

Write side loads aggregates and mutates them. Read sides never touch a domain object —
they project rows straight to read models. The mapper is the only bridge.

## D2 — Two read models, no more

Earlier drafts had five. Three didn't earn their place: the settings-list model and the
session model are field-identical, "actor" and "view" are field-identical (the difference
is provenance, which belongs in the method name), and a `{_id, username}` type is a strict
subset of `UserView`.

```ts
type UserView = { _id: string; username: string; role: UserRole; email: string };

type UserProfile = UserView & {
  groups: GroupSummary[];   // from #shared/contracts/UserGroups.js
  using2fa: boolean;
  accountLocked: boolean;
};
```

They partition on a real question: **does the reader get to know account state?**
`UserView` is identity — who is this, what may I call them. `UserProfile` adds account
state and group membership, which only two audiences need: the authenticated subject
itself (session, `getCurrent`, job actors — group membership drives permissions) and an
admin managing accounts. Nobody else may see whether a colleague has 2FA on.

- `role` uses the domain `UserRole` enum from `app/api/core/domain/user/User.ts`, not the
  string unions redeclared in `#shared/contracts/Users.ts` and `app/api/users.v2/model/User.ts`.
- `using2fa` / `accountLocked` are **required** on `UserProfile`; the mappers coerce the
  optional DBO/row fields with `Boolean(...)`.
- Declared as exact object types. Never `UserDBO & { groups }` — that is what leaks
  `password?`/`secret?`/`deletedAt` into `ServerUsersService` today.
- Built **only** by the backend mappers. No structural construction at call sites.

## D3 — Contracts

```ts
interface UsersDirectory {
  getById(id: string): Promise<ResultType<UserView, UserNotFound>>;
  getProfile(id: string): Promise<ResultType<UserProfile, UserNotFound>>;
  getActor(id: string): Promise<ResultType<UserProfile, UserNotFound>>;  // sees soft-deleted
  getManyByIds(ids: string[]): Promise<UserView[]>;
  searchByUsernameOrEmail(term: string): Promise<UserView[]>;
  list(): Promise<UserView[]>;
}

interface UsersQueryService {
  listUsers(): Promise<UserProfile[]>;
}
```

- `ResultType` for the three single-user lookups (absence is a distinct outcome); plain
  arrays for the collection methods (empty is not a failure, and wrapping forces every
  caller to unwrap something that cannot fail).
- **`getActor` is the only method that resolves soft-deleted users.** Four call sites
  need this deliberately — actor attribution on historical records. Keeping it to one
  named method makes those call sites self-documenting and stops every other path from
  opting in.
- `getActor` returns `UserProfile`, not `UserView`, because `setupQueueWorker.ts:93`
  feeds `User.createFrom`, whose `groups` field drives permission checks — an actor
  resolved without groups silently *loses* access inside jobs. Attribution call sites
  ignore the extra fields.
- `UsersQueryService` legitimately has one method. `findByEmailOrUsername` and
  `listBasicInfo` move to the Directory: `collaborators.ts` and `search.js` are internal
  modules composing their own shapes, not HTTP responses. The QueryService owns *the
  settings screen read*, and that is where pagination/sorting/filtering will land — which
  is what the currently-unused `query` parameter was reaching for.
- `listUsers()` takes **no filter argument**. Both current call sites pass `{}`, and the
  parameter is a backend-specific filter type leaking through a public signature.

## D4 — DAOs are private building blocks

Only three components may touch a DAO: `UsersDataSource`, `UsersDirectory`,
`UsersQueryService` — plus the factories that construct them. Enforced by an eslint
`no-restricted-imports` fence (plan 03), because the four duplicated feature-flag
ternaries in `app/api/**` are proof that direct factory access spreads.

`UsersDAOFactory` is demoted to infrastructure-internal. It is not deleted — the three
adapter factories still use it.

**No shared DAO interface.** That is what forces a lowest-common-denominator query
vocabulary and produces the `as any as MongoUsersDAO` casts. Each DAO speaks its own
backend: `Filter<UserDBO>` for Mongo, knex conditions for Postgres.

**DAOs are not required to have matching signatures. They are required to enforce
matching policy** (D5 guards + D6 field groups). Parity is proven at the contract level
in plan 04, not at the DAO level — which is why `UsersDAOConsistency.spec.ts` is deleted
rather than extended.

**DAOs return raw nullable rows, never `Result`.** `Result.fail(new UserNotFound(...))`
is a domain concern; it belongs in the adapter above. Today's `MongoUsersDAO.getById`
returning `ResultType<UserDBO, UserNotFound>` is business leaking into infrastructure.

## D5 — Guards live in the DAO, in exactly one place per backend

Two orthogonal axes, applied **uniformly on every read**, both defaulting to `exclude`:

```ts
type UserScope = { deleted?: 'exclude' | 'include'; systemUser?: 'exclude' | 'include' };
```

Today's DAO applies these five different ways across six methods (`findOne` guards
deleted but not system user, `exists` guards both, `count` guards deleted only,
`findByIds` bakes system-user in, `findMany` makes the *caller* pass a filter,
`softDelete` guards nothing). That is folklore, not policy — you cannot reason about
safety at a call site without reading the DAO.

`getGuards()`, `notDeletedFilter()` and `notPublicUserFilter()` are **deleted**. Nothing
outside the DAO composes guards any more; see D7.

## D6 — Sensitive fields are named groups, not booleans

`getById`'s five independent `includeX` booleans are 32 combinations of which ~4 are real,
and there are two rival default projections whose difference is justified by a comment
about the user-management UI — a business justification inside an infrastructure class.
Replace both with:

```ts
type UserFieldGroup = 'identity' | 'status' | 'credentials' | 'security';
```

| group | fields | opts in |
|---|---|---|
| `identity` *(default)* | `_id, username, role, email` | everyone |
| `status` | `using2fa, accountLocked, deletedAt` | `UserProfile` readers |
| `credentials` | `password` | Login, ValidateCurrentPassword |
| `security` | `secret, failedLogins, accountUnlockCode` | 2FA + lockout flows |

The DAO does not know *why* anyone wants a group. That is what keeps it business-agnostic
while still safe-by-default. Every write-side need is expressible in this vocabulary
(`getByUsername` = all four, `findByUsernameAndUnlockCode` = identity, etc.).

## D7 — The users↔groups join belongs to the DAO

Both backends join server-side. Mongo keeps its `$lookup`; Postgres gets real SQL via
`.raw()` (its current implementation loads **every group in the tenant** and joins in JS —
`PostgresUserGroupsDAO.getGroupsByUserIds` calls `this.table.all()`).

Once both join server-side, the join is a persistence concern, so it lives on the DAO as
`findWithGroups(...)`. Consequences:

- The QueryService becomes a pure projection (`rows → UserProfile[]`) with no query
  language in it at all.
- Guards stay in one place per backend — the aggregation reads them from the inside
  instead of having `dao.getGuards()` injected from outside.
- The same primitive serves `UsersDirectory.getProfile` and `getActor`.

## D8 — One flag per contract

| Contract | Flag | Rolls out |
|---|---|---|
| `UsersQueryService` | `v2UsersGet` *(exists)* | API/controller reads |
| `UsersDirectory` | `usersDirectory` *(new)* | internal module reads |

`v2UsersGet` already means "v2 user reads" and already gates `GET /api/users`
(`express/users/routes.ts:67`) and `users.getById` (`users/users.js:266`), default `false`.
Reusing it for the QueryService is exact. It is **not** reused for the Directory: that
would put the API route and twelve internal modules — sockets, jobs, session
deserialization — behind one switch, so a defect in the socket path could not be rolled
back without also reverting the API route. It would also change what
`GetUsersController.spec.ts` and `UsersGettersConsistency.spec.ts` currently assert.

Backend selection stays orthogonal on `postgresUsers` + `postgresUsergroups`. Because
`getProfile`/`getActor` carry groups, `UsersDirectoryFactory` needs the same
both-flags-must-agree check as `UsersQueryServiceFactory:25`; extract it and share it.

## D9 — Deleted users stay invisible except to `getActor`

`getManyByIds` excludes soft-deleted users, preserving today's behaviour: activitylog
falls back to printing the raw refId when a permission-holder was deleted. This is
intended, not an accident to fix here.

## D10 — Scope boundaries

**In:** DAO redesign on both backends including the write path (`UsersDataSource` adapts
to the new DAO surface); the two read contracts and their four implementations; the
factories; the eslint fence; the fixture-mirroring test infrastructure; the two contract
suites; all 12 call sites behind `usersDirectory`.

**Out, deliberately:**
- `app/api/users/users.js` getters keep their signatures and behaviour. The only edit is
  repointing the `v2UsersGet` branch at line 271 from `UsersDAOFactory` to
  `UsersDirectoryFactory` — required because the eslint fence would otherwise flag it.
  `UsersGettersConsistency.spec.ts` is the safety net for that change and **must not be
  deleted**.
- `permissionsContext.setUserInContext(user: UserSchema)` keeps its legacy typing.
  `UserProfile` is structurally assignable to `UserSchema`, so producers can move to the
  Directory without touching it. Retyping it to `UserProfile` is a **follow-up PR**, once
  every producer is on the Directory — otherwise the session type and the persistence
  routing change in one shot.
- `app/api/users.v2/model/User.ts` (the second domain User) stays.
- Postgres migration of anything beyond the `usergroups.members` index.

## D11 — Sequencing property

**Plan 04 goes green before plan 05 starts.** Parity between backends is proven while the
old path is still live, so the flag flip is a revertable one-line change rather than a bet.

Single PR, but land the plans in order; the flag flip is the final commit.

## D12 — `password` is split out of the shared contract, not deleted

`UpdateUserRequest = User` and `NewUser = Omit<User,'_id'> & {password?}`, and the
settings form genuinely posts a password (`UserFormSidepanel.tsx:301`). So: `User`
(response shape) loses `password?`; `CreateUserRequest` / `UpdateUserRequest` declare it
explicitly. Same end state — a response type that cannot express a credential — without
breaking password changes.

---

## Amendments (agreed at execution time, 2026-08-13)

These override the plan text where they conflict.

### A1 — Plan 01 step 4 (`PUBLIC_USER_ID` → string) is deferred

Not in this PR. `PUBLIC_USER_ID` stays a Mongo `ObjectId` in `domain/user/User.ts` and
`PostgresUsersDAO` keeps its `PUBLIC_USER_ID.toHexString()` line. Nothing in plans 02–05
depends on the change — it is a layering cleanup, and it touches ~20 files including
fixtures and a `$match` in `RetrieveStatsService`, which is risk this PR does not need to
carry.

Knock-on: plan 04's fixture skeleton uses `PUBLIC_USER_OBJECT_ID`; that becomes plain
`PUBLIC_USER_ID`, which is already an `ObjectId`. Fixture mirroring (plan 01 step 1) is
unaffected — `JSON.parse(JSON.stringify(ObjectId))` already emits the hex string Postgres
wants.

### A2 — The fence hits nine files, not five

Plan 03 step 7 expects "four legacy call sites and `users.js:271`". The actual non-exempt
importers of `UsersDAOFactory` are:

| File | Use | Handled in |
|---|---|---|
| `activitylog/helpers.js:110` | `findByIds` | plan 05 step 2 |
| `permissions/entitiesPermissions.ts:34` | `findByIds` | plan 05 step 2 |
| `usergroups/userGroups.ts:25` | `findByIds` | plan 05 step 2 |
| `users/users.js:271` | `getById` | plan 05 step 7 |
| `activitylog/helpers.js:166` (`loadUser`) | `getById` | **plan 05 step 2b (new)** |
| `core/infrastructure/jobs/SendPasswordRecoveryEmailHandler.ts:24` | `getById` | **plan 05 step 2b (new)** |
| `core/infrastructure/jobs/SendAccountLockedEmailHandler.ts:27` | `getById` | **plan 05 step 2b (new)** |
| `core/application/specs/Login.spec.ts:67` | write-side test wiring | see below |
| `core/application/specs/ValidateCurrentPassword.spec.ts:22` | write-side test wiring | see below |

The three new production sites read only `username`/`email`, so `getById` → `UserView`
covers all of them. The two email handlers currently `getDataOrThrow()` and should keep
throwing. `activitylog`'s `loadUser` keeps its `result.isError() ? undefined : getData()`
fallback and its `user || { username: data._id.toString() }` default.

The two specs legitimately construct `MongoUsersDataSource` for the write side; route them
through `UsersDataSourceFactory` if that preserves the Mongo-specific wiring, otherwise add
`app/api/core/application/specs/**` to the fence's `ignores` with a comment. Decide in plan
03 step 7, do not leave a bare disable.

`UsersDAOConsistency.spec.ts` also imports it and is deleted in plan 04 — no action.

### A3 — `matchEmailOrUsername` keeps its existing name

Plan 02 step 3 writes it as `matchUsernameOrEmail`. The method already exists on
`PostgresUsersDAO` as `matchEmailOrUsername`; keep that spelling and do not rename. The
Directory method is still `searchByUsernameOrEmail` per D3.

### A4 — Execution cadence

One plan per pass. Each plan's stated "Done when" suites run and are reported before the
next plan starts.

### A6 — The GIN index is not used; `findWithGroups` joins by unnesting instead

Measured during plan 02 step 4, at 300 users / 5000 groups in one tenant:

| Query shape | Execution |
|---|---|
| `LEFT JOIN LATERAL ... WHERE ug."members" @> to_jsonb(u."_id")` (as planned) | ~500 ms |
| Unnest members once, aggregate by member id, hash-join to users | ~26 ms |

Identical results; 20x apart. **The planner never chooses `usergroups_members_gin`.** RLS's
`tenant_id = current_setting('app.current_tenant')` predicate is unestimable, so Postgres
guesses ~11 rows, takes the `(tenant_id, _id)` primary key, and applies `members @>` as a
filter over the whole tenant's groups — once per user. That makes the LATERAL form
O(users x groups), i.e. *slower* than the JS-side join D7 replaced. Verified this is not
caused by the defence-in-depth `ug."tenant_id" = u."tenant_id"` correlation: removing it
produces the same plan (473 ms vs 475 ms), so the correlation stays.

A composite `GIN (tenant_id, members jsonb_path_ops)` would be usable, but it needs the
`btree_gin` extension and `CREATE EXTENSION` is **permission denied** for the migrator role.

So `PostgresUsersDAO.findWithGroups` unnests instead, which needs no index at all. D7's
"both backends join server-side" still holds — only the SQL shape changed.

**Migration 015 is dropped** (decided at review). Nothing uses it: `findWithGroups` no
longer contains a `@>` at all, and `getGroupsByUserIds` still uses one but the planner
prefers the primary key there too (~0.9 ms at 5000 groups, fine for a single lookup). An
index no query chooses is write amplification on every `usergroups` write, so it goes.

This supersedes **plan 01 step 2**, whose premise ("without an index that is a sequential
scan per user") turned out not to hold under RLS. A local database that already applied
delta 015 keeps the index until dropped by hand; `PgMigrator` tracks applied deltas and
ignores ones with no matching file, so nothing breaks.

### A7 — The surface plan 03 will actually find

Plan 02 delivered a DAO surface that differs from what plans 03–05 assume in a few places.
These are the deltas, not a full listing.

**Both DAOs**

```
findOne(filter, options?: ReadOptions)          // null / undefined, never Result
findMany(filter?, options?: ReadOptions)
findWithGroups(filter?, options?: ReadOptions)  // rows + groups: {_id, name}[]
exists / count / insertOne / updateOne / softDelete
```

`ReadOptions = { scope?: UserScope; fields?: UserFieldGroup[] }`, declared once per backend
in `mongodb/user/UserReadOptions.ts` and `postgresql/user/UserReadOptions.ts`.

- `findWithGroups` needs **`{ fields: ['status'] }`** to carry `using2fa` / `accountLocked`.
  With the default `identity` it returns neither, and `UserProfile` requires both.
- Guard helpers live in `UserReadOptions`, not on the DAO: Mongo exports `scopeFilters` /
  `applyScope`, Postgres exports `scopePredicates` / `scopeSql`. `getGuards()`,
  `notDeletedFilter()` and `notPublicUserFilter()` are gone on both.

**Postgres-only**

- `findManyByIds(ids, options?)` — plan 03 step 4's table says `getManyByIds` maps to
  `findMany({_id: {$in: ids}})`, which is Mongo-only phrasing. Postgres's `Condition` is
  equality-only and cannot express `IN`; use `findManyByIds`.
- `matchEmailOrUsername(term, options?)` — not `matchUsernameOrEmail` ([A3](#a3--matchemailorusername-keeps-its-existing-name)).
- `Condition` keys are validated against the known column set; an unknown key throws.

**Legacy shims on both DAOs** — `getById(id, {includePassword?, includeDeleted?})` returning
`Result`, and `findByIds(ids)`. They exist only for the `app/api/**` call sites plan 05
migrates ([A2](#a2--the-fence-hits-nine-files-not-five)) and are fenced off in a commented block. **Plan 03 must leave them
alone**; plan 05 deletes them. Removing them also clears the `max-lines` lint warning on
`PostgresUsersDAO.ts`.

**Constructor changes plan 03's factories must match**

- `MongoUserGroupsDAO(db, transactionManager, options?)` — no longer takes a users DAO; it
  reads the users guards from `UserReadOptions` directly.
- `PostgresUsersQueryService({ usersDAO })` — no longer takes a user-groups DAO; the join is
  in SQL. `UsersQueryServiceFactory` therefore no longer calls `UserGroupsDAOFactory`.
- `MongoUsersQueryService({ dao })` — a plain class, no longer a `MongoDataSource`.
- Both query services still expose `listWithGroups` / `listBasicInfo` /
  `findByEmailOrUsername` and both `as any` casts remain in the factory, exactly as plan 02
  step 7 intended. Plan 03 steps 5–6 are what remove them.

**Shared helper changed:** `PostgresTable.whereJsonSupersetOfAny` now accepts strings and
JSON-encodes them. A bare `'u1'` reached Postgres as invalid JSON and threw.

### A8 — Open items

1. ~~**`UsersDAOConsistency.spec.ts` is failing**~~ — **resolved**: deleted during plan 03
   step 7 (see [A9](#a9--what-plan-03-actually-did)). Plan 04 step 3 no longer has to.
2. **`PostgresUsersDAO.ts` exceeds the 250-line lint max** (270). Entirely the shim block;
   resolves itself in plan 05.

### A9 — What plan 03 actually did

Six deltas from the plan text, agreed before execution. Plans 04 and 05 inherit them.

**1. The query services keep a legacy read block; the factory return type is widened.**
Plan 03 step 5 deletes `listBasicInfo` / `findByEmailOrUsername` outright, but their call
sites (`search.js`, `collaborators.ts`) are explicitly out of plan 03's scope and belong to
plan 05 step 1. Both methods therefore survive on `MongoUsersQueryService` /
`PostgresUsersQueryService` in a fenced `// removed in plan 05 step 1` block, mirroring the
DAO shims from [A7](#a7--the-surface-plan-03-will-actually-find), and
`UsersQueryServiceFactory.default()` returns `UsersQueryService & LegacyUsersReads`.

Plan 05 step 1 deletes the block, the `LegacyUsersReads` type and the intersection, leaving
`default(): UsersQueryService`. The rename (`listWithGroups` → `listUsers`, filter dropped)
did happen, so `GetUsersController` and `ServerUsersService.mapUsers` were updated now
rather than in plan 05 step 8 — compile-forced. What remains for step 8 is the `password?`
split in the shared contract.

**2. `UsersDAOFactory` keeps its `as any as MongoUsersDAO`.** Plan 03's "Done when" grep
(`as any as MongoUsers` returns nothing) cannot be satisfied while the legacy shims exist:
a union return type breaks `userGroups.ts:25`, which annotates `findByIds`'s result
`WithId<UserSchema>[]` and is a file plan 03 must not touch. The gate for plan 03 is
therefore **no `as any` in `UsersQueryServiceFactory`**, which holds. The last cast dies in
plan 05 with the shims.

**3. `resolveUsersBackend(contract)` is shared by three factories, not two.**
`UserGroupsDAOFactory` carried a third copy of the both-flags-must-agree check. All three
now call `factories/usersBackendFlags.ts`. The message is canonicalised to the
`UsersQueryService` wording with the contract name substituted, so `UserGroupsDAO`'s
message now names the flags in the order `postgresUsers`, `postgresUsergroups` (it used to
name them the other way round). No spec asserted the old text.

**4. The domain's `UserProfile` was renamed to `UserProfileProps`.** It is `updateProfile`'s
argument type in `domain/user/User.ts`, and having it share a name with the `UserProfile`
read model in `application/contracts/UserReadModels.ts` — one a write-side input, the other
a read projection with account state — is a trap. Used in one place; renamed.

**5. The write-side specs go through `UsersDataSourceFactory`,** resolving
[A2](#a2--the-fence-hits-nine-files-not-five)'s open question. `Login.spec.ts` and
`ValidateCurrentPassword.spec.ts` built `new MongoUsersDataSource({ dao:
UsersDAOFactory.default() })`, which is byte-for-byte what the factory's mongo branch
returns, and both suites run with `postgresUsers` off. No fence exemption for
`core/application/specs/**` was needed. The fence's remaining six violations
(`activitylog/helpers.js`, `entitiesPermissions.ts`, `userGroups.ts`, `users.js`, the two
email job handlers) each carry `// eslint-disable-next-line no-restricted-imports --
removed in plan 05` on the import line, so the branch lints clean.

**6. Both Directory implementations treat a malformed id as a miss, not an exception.**
`MongoUsersDirectory` checks `/^[0-9a-fA-F]{24}$/` before `ObjectId.createFromHexString`
and returns `UserNotFound` — deliberately *not* `ObjectId.isValid`, which also accepts any
12-character string and then throws inside the constructor. `getManyByIds` filters
malformed ids out of the batch rather than failing the whole call. This is what makes the
two backends agree: Postgres's `_id` is text and simply matches nothing. Plan 04's
"`UserNotFound` for an unknown id" case can use any string.

### A10 — What plan 04 actually did

Seven deltas from the plan text. Plan 05 inherits them.

**1. Step 3 trims the two DAO specs instead of deleting them.** The plan lists six files to
delete; three went (`MongoUsersQueryService.spec.ts`, `PostgresUsersQueryService.spec.ts`,
`UsersQueryServiceConsistency.spec.ts`) and `UsersDAOConsistency.spec.ts` was already gone
([A9](#a9--what-plan-03-actually-did)). The two DAO specs stay, reduced to what the contracts
cannot reach — which is what step 3's own instruction ("anything not covered is either a
missing case or dead assertion, decide which, do not drop it silently") points at:

| Kept in the DAO specs | Why no contract reaches it |
|---|---|
| The guard-uniformity table (D5) | `exists`/`count` have no contract caller; no contract requests a non-default scope except `getActor` |
| The field-group table (D6) | The contracts pin `identity` and `identity + status`; `credentials`/`security` are write-side |
| The write path and its guards | These are read contracts |
| Postgres: unknown condition key is rejected, not interpolated | Not expressible through a contract |
| Postgres: RLS scopes `raw()` statements directly | The end-to-end case cannot tell RLS from the defence-in-depth tenant correlation |

Removed from them: the `findWithGroups` projection cases and Postgres's
`matchEmailOrUsername` matching cases, now asserted against both backends at once, plus the
end-to-end cross-tenant case, which moved to the QueryService suite as the plan intended.
D4 says parity is not asserted at DAO level; it does not say DAOs go untested.

**2. The fixture is shared between the two suites,** in
`app/api/core/application/specs/UsersContractFixtures.ts` — one declaration for both
backends *and* both suites, so a field added for one cannot leave the other testing
something else. It also exports the sort helpers and the credential-field sweep.

**3. The two-tenant case is Postgres-only and sits outside `describe.each`.** Mongo tenancy
is a separate database, which the harness cannot straddle inside one suite. It also seeds the
foreign tenant through `testingEnvironment.pg.pool` rather than `testingPG.setFixtures`,
which truncates each table it writes and would take the mirrored fixture with it. The foreign
group lists one of *our* users as a member, so a failure of either defence surfaces as a
local user gaining a group it never joined; an assertion that the admin pool (which bypasses
RLS) can see the foreign rows keeps the case from passing vacuously.

**4. The soft-deleted fixture user is a member of Group B.** The plan's fixture left them in
no group, which makes "`getActor` carries groups" untestable on the only path that matters —
D3's argument is that a job actor resolved without groups silently loses permissions, and
that actor is by definition soft-deleted.

**5. `searchByUsernameOrEmail('.*')` is the regex-metacharacter case,** not the plan's
`a.b*`: `^a.b*$` matches nothing in this fixture even unescaped, so it cannot fail. `^.*$`
matches every user. Verified by mutation — removing `escapeRegExp` from
`MongoUsersDirectory` fails the Mongo branch and leaves Postgres green, which is exactly the
drift the suites exist to catch.

**6. "Without touching the database" is not asserted** for `getManyByIds([])`. It is not
observable through a factory-built SUT; the short-circuit stays covered by the DAO specs.

**7. `app/api/core/infrastructure/user/specs/` is not empty and stays.**
`UserGroupsDAOConsistency.spec.ts` and `UserGroupsDataSourceConsistency.spec.ts` still live
there.

No production file was touched and no defect was exposed: both backends agreed on every
case on the first green run.

### A5 — Migration renumbering (unplanned, blocking)

The merge in `6a704642a4` left two migrations numbered `012`: production's
`012-add-entities-sharedid-language-unique-index.sql` and this branch's
`012-create-captchas-table.sql`. `PgMigrator.readMigrationFiles` throws on duplicate
deltas, so **every Postgres spec on the branch was red** before plan 01 started (baseline:
27 suites / 564 tests failing).

Fixed by renumbering the two branch-local migrations, keeping production's numbering:

- `012-create-captchas-table.sql` → `013-create-captchas-table.sql`
- `013-create-usergroups-table.sql` → `014-create-usergroups-table.sql`
- plan 01's new GIN index lands at `015-index-usergroups-members.sql`, not `014`

Header comments updated to match. No code references migration filenames. `PgMigrator`
tracks applied migrations by delta and both renumbered files are `CREATE TABLE IF NOT
EXISTS`, so a dev database that already applied them re-runs them harmlessly.
