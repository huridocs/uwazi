# Plan 01: Foundations

Prerequisites for everything else. No behaviour change, no new components — this plan
exists so plans 02–05 don't each carry their own infrastructure detour.

Decisions in play: [D8](./users-refactor-00-decisions.md#d8--one-flag-per-contract),
[D7](./users-refactor-00-decisions.md#d7--the-usersgroups-join-belongs-to-the-dao).

**Must not touch:** any DAO, any data source, any call site, any spec other than the ones
listed below.

**Done when:** the full existing suite is green and `git diff` shows no change in
production behaviour.

---

## Step 1: Mirror `users` / `usergroups` fixtures into Postgres

**Files:** `app/api/utils/testingEnvironment.ts`

Both current users consistency specs hand-maintain a `mongoFixtures` *and* a
`pgFixtures()` with divergent shapes. That double-bookkeeping is exactly what lets the two
backends drift while the suite stays green — and it blocks the single-suite pattern that
plan 04 depends on.

`setFixtures` already auto-mirrors Mongo fixtures into Postgres, but only for
`dictionaries, templates, files, entities, relationtypes, captchas` (line ~186).

**Skeleton:**
```ts
const USER_POSTGRES_DEFAULTS = { password: 'unset-in-fixture', using2fa: false };

const sanitizeUserForPostgres = (user: any) => ({ ...USER_POSTGRES_DEFAULTS, ...user });

// Mongo: members: [{ refId }]   →   Postgres: members: string[] (JSONB)
const sanitizeUserGroupForPostgres = (group: any) => ({
  ...group,
  members: (group.members ?? []).map((m: any) => (typeof m === 'string' ? m : m.refId)),
});
```

**Do:**
- Add `'users'` and `'usergroups'` to the mirrored-table whitelist. Neither needs a
  `PG_TABLE_BY_MONGO_COLLECTION` entry — the names already match.
- Dispatch the per-table sanitizer the same way `entities` does today, rather than
  extending the inline ternary into a chain.
- `_id` needs no handling: `JSON.parse(JSON.stringify(ObjectId))` already emits the hex
  string, and `deletedAt: Date` already round-trips into `TIMESTAMPTZ`.
- `password` and `using2fa` are `NOT NULL` in `009-create-users-table.sql` but optional in
  Mongo fixtures, hence the defaults object. Use a non-empty sentinel for `password` so a
  fixture that omits it can never accidentally satisfy a password comparison.
- Verify `f.user()` in `fixturesFactory` produces something the mapping accepts; extend
  the factory rather than special-casing here if it doesn't.

**Test:** convert `app/api/core/infrastructure/user/specs/UsersQueryServiceConsistency.spec.ts`
to a single fixture declaration (drop its `pgFixtures()`) as the proof. It must stay green
unchanged in its assertions. That spec is deleted in plan 04 — this is a temporary
verification, and it is worth doing because it validates the mapping against assertions
written before the mapping existed.

---

## Step 2: GIN index on `usergroups.members`

**Files:** `app/api/core/infrastructure/postgresql/schema_migrations/014-index-usergroups-members.sql` (new)

Plan 02's Postgres join uses JSONB containment (`members @> to_jsonb(users._id)`). Without
an index that is a sequential scan per user — the same scalability problem as today's
full-table-load, in a different costume.

**Skeleton:**
```sql
-- Migration 014: index usergroups.members for containment lookups
-- Supports the users↔usergroups join in PostgresUsersDAO.findWithGroups (D7).

CREATE INDEX IF NOT EXISTS usergroups_members_gin
  ON usergroups USING GIN ("members" jsonb_path_ops);
```

**Do:**
- `jsonb_path_ops` rather than the default operator class: smaller index, and `@>` is the
  only operator used against this column.
- Follow the numbering and header-comment convention of `013-create-usergroups-table.sql`.
- Confirm the migration runner picks up new files by number with no registration step
  (check `PgMigrator.ts`); if there is a manifest, add it.

**Test:** existing Postgres migration specs green. Add a case to
`UsersMigrationConfig.spec.ts`-adjacent migration tests only if that suite asserts the
schema list explicitly.

---

## Step 3: Register the `usersDirectory` flag

**Files:** `app/api/config.ts` (~line 169), `app/api/tenants/tenantsModel.ts` (~line 51),
`app/api/tenants/tenantContext.ts` (~line 40)

The flag is declared in three places. Missing one produces a flag that silently reads as
`undefined` in some paths.

**Do:**
- `config.ts`: `usersDirectory: false` alongside `v2UsersGet`.
- `tenantsModel.ts`: `usersDirectory: Boolean` in the `featureFlags` schema.
- `tenantContext.ts`: `usersDirectory?: boolean` in the `featureFlags` type.
- Default `false` everywhere. Nothing reads it until plan 05.

**Test:** none — type-level plus schema. Any existing tenant-config spec that enumerates
flags will catch omissions.

---

## Step 4: `PUBLIC_USER_ID` becomes a string in the domain

**Files:** `app/api/core/domain/user/User.ts`,
`app/api/core/infrastructure/mongodb/user/` (new or existing constants module),
all importers

`PUBLIC_USER_ID` is a Mongo `ObjectId` living in the domain layer, and
`PostgresUsersDAO` imports it only to call `.toHexString()`. It is the single most
important business guard in this refactor (D5) and it should not be shaped by one backend.

**Skeleton:**
```ts
// domain/user/User.ts
const PUBLIC_USER_ID = '698c35e7cf8880419d91fe4d';

// infrastructure/mongodb/user/publicUserObjectId.ts
const PUBLIC_USER_OBJECT_ID = ObjectId.createFromHexString(PUBLIC_USER_ID);
```

**Do:**
- Grep every importer of `PUBLIC_USER_ID`. Several compare with `.toString()` already and
  simplify; some pass it straight into a Mongo filter and must switch to the ObjectId
  adapter.
- `app/api/users/users.js` compares `user._id.toString() === PUBLIC_USER_ID.toString()` —
  becomes `=== PUBLIC_USER_ID`. Behaviour identical.
- Fixture files that seed `_id: PUBLIC_USER_ID` into Mongo need the ObjectId adapter.
- This is the one step here that can break things quietly. Do it as its own commit.

**Test:** existing suites. `UsersDAOConsistency.spec.ts` and `UsersGettersConsistency.spec.ts`
both seed the public user and assert it is filtered out — they are the guard rail. Run
both explicitly before moving on.
