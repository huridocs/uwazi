# Plan 02: DAO layer

Redesign both users DAOs into genuine building blocks: uniform guards, named field
groups, no `Result`, no business knowledge, plus the server-side groups join. The write
side (`UsersDataSource`) adapts to the new surface in the same plan — that is what
choosing full DAO cleanup buys, and it is why the command path is in this diff.

Decisions in play: [D4](./users-refactor-00-decisions.md#d4--daos-are-private-building-blocks),
[D5](./users-refactor-00-decisions.md#d5--guards-live-in-the-dao-in-exactly-one-place-per-backend),
[D6](./users-refactor-00-decisions.md#d6--sensitive-fields-are-named-groups-not-booleans),
[D7](./users-refactor-00-decisions.md#d7--the-usersgroups-join-belongs-to-the-dao).

**Depends on:** plan 01 (GIN index, `PUBLIC_USER_ID` as string).

**Must not touch:** call sites in `app/api/**` outside `core/infrastructure`; the read
contracts (plan 03); `users.js`.

**Done when:** `MongoUsersDataSource.spec.ts`, `PostgresUsersDataSource.spec.ts`,
`UsersDAOConsistency.spec.ts`, `UsersQueryServiceConsistency.spec.ts`,
`UsersGettersConsistency.spec.ts` and every use-case spec under
`core/application/specs/` are green — with no assertion changes except where a
deliberate behaviour fix is called out below.

---

## Step 1: The shared vocabulary

**Files:** `app/api/core/infrastructure/mongodb/user/UserReadOptions.ts` (new),
`app/api/core/infrastructure/postgresql/user/UserReadOptions.ts` (new)

Declared **once per backend**, deliberately duplicated. This is a naming convention, not a
cross-backend interface (D4) — a shared type here would be the first step back toward a
shared DAO contract.

**Skeleton:**
```ts
type UserScope = { deleted?: 'exclude' | 'include'; systemUser?: 'exclude' | 'include' };
type UserFieldGroup = 'identity' | 'status' | 'credentials' | 'security';
type ReadOptions = { scope?: UserScope; fields?: UserFieldGroup[] };

const DEFAULT_SCOPE: Required<UserScope> = { deleted: 'exclude', systemUser: 'exclude' };
const DEFAULT_FIELDS: UserFieldGroup[] = ['identity'];
```

**Do:**
- Field group membership per D6: `identity` = `_id, username, role, email`; `status` =
  `using2fa, accountLocked, deletedAt`; `credentials` = `password`; `security` =
  `secret, failedLogins, accountUnlockCode`.
- Mongo resolves groups to a **projection**; Postgres resolves them to a **column list**.
  Keep that resolution next to the type, not inlined in each method.
- `identity` is always included even when not listed — every caller needs `_id`.

**Test:** none directly; covered by steps 2–3.

---

## Step 2: `MongoUsersDAO`

**Files:** `app/api/core/infrastructure/mongodb/user/MongoUsersDAO.ts`,
`app/api/core/infrastructure/mongodb/user/specs/MongoUsersDAO.spec.ts`

**Skeleton:**
```ts
type UserWithGroupsDBO = UserDBO & { groups: { _id: string; name: string }[] };

class MongoUsersDAO extends MongoDataSource<UserDBO> {
  protected collectionName = 'users';

  findOne(filter: Filter<UserDBO>, options?: ReadOptions): Promise<UserDBO | null>;
  findMany(filter?: Filter<UserDBO>, options?: ReadOptions): Promise<UserDBO[]>;
  findWithGroups(filter?: Filter<UserDBO>, options?: ReadOptions): Promise<UserWithGroupsDBO[]>;
  exists(filter: Filter<UserDBO>, options?: ReadOptions): Promise<boolean>;
  count(filter?: Filter<UserDBO>, options?: ReadOptions): Promise<number>;
  insertOne(dbo: UserDBO): Promise<void>;
  updateOne(filter, update, options?: { scope?: UserScope }): Promise<void>;
  softDelete(ids: string[]): Promise<number>;
}
```

**Deleted:** `getById` (and its five booleans), `findByIds`, `getGuards`,
`notDeletedFilter`, `notPublicUserFilter`, `GETBYID_FIELDS_EXCLUSION`,
`CREDENTIAL_FIELDS_EXCLUSION`, `QueryOptions`, `GetByIdOptions`.

**Do:**
- One private `applyScope(filter, scope)` that merges the two guard predicates, called by
  **every** read and by `updateOne`. No method may guard differently (D5).
- `softDelete` currently guards nothing — give it the same scope handling. It is a write,
  but the system-user guard matters there most.
- `findByIds` callers become `findMany({ _id: { $in: ids.map(toObjectId) } })`.
- `getById` callers become `findOne({ _id: toObjectId(id) })`; the `Result` wrapping moves
  up to the adapter (D4).
- `findWithGroups` carries the `$lookup` pipeline currently in `MongoUsersQueryService`.
  Guards go in its `$match` stage via the same `applyScope`, so `getGuards()` has no
  reason to exist.
- Keep the `$project` stage aligned with the resolved field groups rather than the
  hardcoded list it uses today.
- Case-insensitive username-or-email matching needs no dedicated method here — it is
  expressible as a `Filter` and the Directory builds it (D4 permits the asymmetry with
  Postgres, which does need a method; see step 3).

**Test:** rewrite `MongoUsersDAO.spec.ts` against the new surface. It is deleted in plan
04, so keep it minimal — enough to develop against. Assert the guard uniformity
explicitly: every read method, given a deleted user and the public user in fixtures,
returns neither by default and returns them when scoped in.

---

## Step 3: `PostgresUsersDAO`

**Files:** `app/api/core/infrastructure/postgresql/user/PostgresUsersDAO.ts`,
`app/api/core/infrastructure/postgresql/user/specs/PostgresUsersDAO.spec.ts`

**Skeleton:**
```ts
type UserWithGroupsRow = UserRow & { groups: { _id: string; name: string }[] };

class PostgresUsersDAO extends PostgresDataSource<UserRow> {
  findOne(condition: Condition, options?: ReadOptions): Promise<UserRow | undefined>;
  findMany(condition?: Condition, options?: ReadOptions): Promise<UserRow[]>;
  findWithGroups(condition?: Condition, options?: ReadOptions): Promise<UserWithGroupsRow[]>;
  matchUsernameOrEmail(term: string, options?: ReadOptions): Promise<UserRow[]>;
  exists(condition: Condition, options?: ReadOptions): Promise<boolean>;
  count(condition?: Condition, options?: ReadOptions): Promise<number>;
  insertOne(row: UserRow): Promise<void>;
  updateOne(condition, changes, options?: { scope?: UserScope }): Promise<void>;
  softDelete(ids: string[]): Promise<number>;
}
```

**Deleted:** `getById`, `findByIds`, `notPublicUserFilter`, the `EXCLUDE_PUBLIC_USER_KEY`
sentinel and the `applyCondition` destructuring that consumes it, `GETBYID_SAFE_COLUMNS`,
`LIST_SAFE_COLUMNS`.

**Do:**
- The `__excludePublicUser` magic key goes away entirely — it existed only to smuggle a
  guard through an equality-only condition object, and `UserScope` now carries it
  explicitly.
- One private `applyScope(table, scope)` mirroring Mongo's, applied by every read and by
  `updateOne` and `softDelete`.
- `matchUsernameOrEmail` stays a DAO method: `lower(username) = lower(?) OR lower(email)
  = lower(?)` is not expressible in the equality-only condition object. **Keep the
  parentheses in the `whereRaw`** — knex does not wrap raw fragments, so without them
  `AND` binds tighter and the guards apply only to the email branch. That comment is on
  the current implementation and must survive the rewrite.
- `findWithGroups` uses `this.table.raw()` (per decision) — `PostgresTable.join` only does
  column equality and cannot express JSONB containment:

```sql
SELECT u."_id", u."username", u."role", u."email", u."using2fa", u."accountLocked",
       COALESCE(g.groups, '[]'::jsonb) AS groups
FROM users u
LEFT JOIN LATERAL (
  SELECT jsonb_agg(jsonb_build_object('_id', ug."_id", 'name', ug."name")) AS groups
  FROM usergroups ug
  WHERE ug."tenant_id" = u."tenant_id"
    AND ug."members" @> to_jsonb(u."_id")
) g ON TRUE
WHERE u."deletedAt" IS NULL
  AND u."_id" <> ?
```

- `'["a","b"]'::jsonb @> '"a"'::jsonb` is true — scalar-in-array containment is what the
  GIN index from plan 01 accelerates.
- **Verify RLS applies to `.raw()`.** `PostgresTable.raw` calls `withConnection` directly
  with a comment about not inheriting policy; the table's `tenant_isolation` policy should
  scope both `users` and `usergroups` automatically, making an explicit `tenant_id`
  predicate redundant. Confirm this against a two-tenant fixture before trusting it — a
  cross-tenant leak here would be severe.
- The scope guards must be interpolated into the raw `WHERE` from `applyScope`, not
  hardcoded, or `findWithGroups` becomes the one method with its own policy.

**Test:** rewrite `PostgresUsersDAO.spec.ts` as in step 2, plus a **two-tenant fixture
asserting `findWithGroups` never returns another tenant's users or groups**. That case is
worth keeping permanently — move it into plan 04's suite rather than deleting it.

---

## Step 4: Fix `PostgresUserGroupsDAO.getGroupsByUserIds`

**Files:** `app/api/core/infrastructure/postgresql/user/PostgresUserGroupsDAO.ts`

It calls `this.table.all()` — loading every group in the tenant and joining in JS. It is
still used by `getAll()` and by anything not going through `findWithGroups`.

**Do:**
- Push the filter into SQL with `whereJsonSupersetOfAny('members', userIds.map(...))`,
  which `PostgresTable` already provides and which the plan-01 GIN index now serves.
- Keep the `Map` return shape and the pre-seeded empty arrays — callers rely on
  `map.get(id) ?? []` semantics.
- Check `getAll()` for the same full-scan pattern while here.

**Test:** existing user-groups DAO specs green; add a case asserting a user with no groups
still gets an entry in the returned map.

---

## Step 5: Add `getGroupsByUserIds` to `MongoUserGroupsDAO`

**Files:** `app/api/core/infrastructure/mongodb/user/MongoUserGroupsDAO.ts`

Postgres has it, Mongo does not. The Mongo Directory needs it for `getProfile`/`getActor`,
which resolve a single user and cannot reuse `findWithGroups`'s list-shaped pipeline
economically.

**Do:**
- Match the Postgres signature and `Map` semantics exactly, including pre-seeded empties.
- Query `{ 'members.refId': { $in: ids } }` — do not load the collection.

**Test:** new cases in the Mongo user-groups DAO spec mirroring step 4's.

---

## Step 6: Adapt `UsersDataSource` implementations

**Files:** `app/api/core/infrastructure/mongodb/user/MongoUsersDataSource.ts`,
`app/api/core/infrastructure/postgresql/user/PostgresUsersDataSource.ts`

The write side currently passes ad-hoc projections into `dao.findOne`. Those become field
groups.

**Do — the mapping, method by method:**

| Method | fields | scope |
|---|---|---|
| `getById` | `identity, status` | default |
| `getByEmail` | `identity` | default |
| `getByUsername` | `identity, status, credentials, security` | default |
| `getAccountById` | `identity, status, credentials, security` | default |
| `findByUsernameAndUnlockCode` | `identity` | default |
| `getTwoFactorStatus` | `identity, status` | default |
| `getTwoFactorSecret` | `security` | default |
| `checkUniqueUsername` / `checkUniqueEmail` | — (`exists`) | default |
| `countActiveUsers` | — (`count`) | default |

- `Result.fail(new UserNotFound(...))` moves **here**, out of the DAO (D4). Every
  `getById`-shaped method wraps a nullable row itself.
- `countActiveUsers` currently passes `dao.notPublicUserFilter()`; it now relies on the
  default `systemUser: 'exclude'` scope. Confirm the count is unchanged.
- `MongoUsersDataSource.getById`'s inline projection (`password: 0, secret: 0, ...`)
  currently keeps `accountLocked` while the DAO's `getById` dropped it — a live
  inconsistency. The field-group table above resolves it to `identity, status`
  (`accountLocked` included). Check whether any use case depended on its absence.
- `update()`'s `$unset` handling for `accountUnlockCode` is behaviour, not projection —
  leave it exactly as is, including the comment explaining why `$set` is insufficient.

**Test:** both data source specs green, unchanged. If a projection change alters an
assertion, stop and decide whether it is a fix or a regression before editing the spec.

---

## Step 7: Keep the QueryServices compiling

**Files:** `app/api/core/infrastructure/mongodb/user/MongoUsersQueryService.ts`,
`app/api/core/infrastructure/postgresql/user/PostgresUsersQueryService.ts`

Interim only — plan 03 retypes both against the contract. Here they just move onto the new
DAO surface.

**Do:**
- `listWithGroups` delegates to `dao.findWithGroups()` on both backends. The `$lookup`
  leaves `MongoUsersQueryService` for `MongoUsersDAO`; the JS join leaves
  `PostgresUsersQueryService`.
- `MongoUsersQueryService` no longer needs to extend `MongoDataSource` or take `db` /
  `transactionManager` — it becomes a plain class over the DAO. Update
  `UsersQueryServiceFactory` accordingly (the `as any` casts survive until plan 03).
- Leave `listBasicInfo` and `findByEmailOrUsername` in place; plan 03 moves them.

**Test:** `UsersQueryServiceConsistency.spec.ts` green with no assertion changes. This is
the strongest signal that the join relocation preserved semantics on both backends.
