# Plan: Migrate Usergroups CRUD (route level) to V2

Phase 1 of the Usergroups migration (Postgres comes later, as its own follow-up plan
once this is solid — same sequencing as Users). Scope: replace the three
`/api/usergroups` routes (`GET`/`POST`/`DELETE`) with V2 use cases + controllers,
extending the existing `UserGroupsDataSource` contract (currently membership-sync-only,
used by `CreateUser`/`UpdateUser`/`DeleteUsers`) rather than creating a second contract.
Domain tier mirrors `RelationshipType` (thin data bag, one uniqueness invariant, no rich
aggregate) per the design discussion — not a `User`/`UserAccount`-style aggregate.

Explicit decisions carried into this plan:
- One data source/contract, extended in place — both Users use cases and new Usergroups
  use cases share it.
- No delete-time referential-integrity guard — `delete()` stays a pure passthrough,
  matching `userGroups.ts`'s current behavior exactly (no check against entity
  permissions or other usages).
- `collaborators.ts`, `entitiesPermissions.ts`, `search.js`, and `userGroupsMembers.ts`
  (V1 membership-sync used by `users/users.js`) are left untouched — still calling the
  legacy `userGroups.ts`/Mongoose model directly. Only the 3 routes move.
- After the routes are cut over, `app/api/usergroups/userGroups.ts`'s methods get
  `@deprecated` JSDoc (not deleted/removed — `saveMultiple`/`delete`/`get` are still
  live call sites for the untouched consumers above).
- Name-uniqueness check replicates the legacy AJV `uniqueName` keyword exactly,
  including its lack of regex-escaping (`new RegExp(`^${name}$`, 'i')`, excluding the
  group's own `_id`) — preserving existing behavior/bugs, not fixing them here.

## Step 1: Domain object + contract extension

**Files:** `app/api/core/domain/userGroup/UserGroup.ts` (new),
`app/api/core/application/contracts/UserGroupsDataSource.ts`

**Skeleton:**
```ts
// UserGroup.ts
class UserGroup {
  readonly id: string;
  name: string;
  memberIds: string[];
  constructor(id: string, name: string, memberIds?: string[])
}

// UserGroupsDataSource.ts — additions alongside existing 3 methods
type UserGroupMember = { refId: string; username: string; role: string; email: string };
type UserGroupWithMembers = { _id: string; name: string; members: UserGroupMember[] };

interface UserGroupsDataSource {
  // ...existing updateUserGroups/getUserGroups/removeUsersFromGroups unchanged...
  create(name: string, memberIds: string[]): Promise<UserGroup>;
  update(id: string, name: string, memberIds: string[]): Promise<UserGroup>;
  delete(ids: string[]): Promise<void>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  getAll(): Promise<UserGroupWithMembers[]>;
}
```

**Do:**
- `UserGroup` is a plain data bag (mirrors `RelationshipType.ts` exactly — readonly id,
  public mutable name, no methods).
- `getAll()` returns the enriched read shape (`members` joined with username/role/email)
  directly from the contract — this mirrors what `userGroups.ts get()` already does
  inline against the `users` collection, so the join logic stays inside the data source
  rather than requiring a new cross-contract dependency (`UsersDataSource` has no
  batch-by-ids method today; adding one is out of scope).
- `create`/`update` take plain member id arrays (not enriched) — enrichment is a
  read-only (`getAll`) concern.
- Do not touch `updateUserGroups`/`getUserGroups`/`removeUsersFromGroups` signatures —
  those stay as-is for the Users use cases.

**Test:** none, type/contract-only — exercised by Step 2's spec.

---

## Step 2: Extend `MongoUserGroupsDataSource`

**Files:** `app/api/core/infrastructure/mongodb/user/MongoUserGroupsDataSource.ts`,
`app/api/core/infrastructure/mongodb/user/specs/MongoUserGroupsDataSource.spec.ts` (new
or extend existing), `app/api/core/infrastructure/factories/UserGroupsDataSourceFactory.ts`

**Skeleton:**
```ts
type Deps = { idGenerator: IdGenerator };

class MongoUserGroupsDataSource extends MongoDataSource<UserGroupDBO> implements UserGroupsDataSource {
  constructor(db: Db, transactionManager: TransactionManager, idGenerator: IdGenerator, options?: MongoDSOptions)
  async create(name: string, memberIds: string[]): Promise<UserGroup>
  async update(id: string, name: string, memberIds: string[]): Promise<UserGroup>
  async delete(ids: string[]): Promise<void>
  async existsByName(name: string, excludeId?: string): Promise<boolean>
  async getAll(): Promise<UserGroupWithMembers[]>
}
```

**Do:**
- `create`: `_id = this.idGenerator.generate()`, insert `{_id: ObjectId.createFromHexString(_id), name, members: memberIds.map(refId => ({refId}))}`
  (mirrors `updateUserGroups`'s existing `ObjectId.createFromHexString` usage), return
  `new UserGroup(_id, name, memberIds)`.
- `update`: `updateOne({_id}, {$set: {name, members: memberIds.map(refId => ({refId}))}})`,
  return `new UserGroup(id, name, memberIds)`.
- `delete(ids)`: `deleteMany({_id: {$in: ids.map(ObjectId.createFromHexString)}})` — pure
  passthrough, no guard.
- `existsByName(name, excludeId?)`: `countDocuments({name: new RegExp(`^${name}$`, 'i'), ...(excludeId && {_id: {$ne: ObjectId.createFromHexString(excludeId)}})}) > 0`
  — replicate legacy regex exactly, no escaping.
- `getAll()`: fetch all `usergroups` docs via `this.getCollection().find({}).toArray()`,
  collect all `members[].refId`, batch-fetch matching docs from
  `this.db.collection('users').find({_id: {$in: [...]}}, {projection: {username:1, role:1, email:1}})`
  (query the `users` collection directly on the same `db` instance — do not import the
  legacy `#api/users/users.js` singleton from inside a Mongo data source), then map each
  group's members the same way `userGroups.ts get()` does: enriched member if a matching
  user was found, else fall back to `{refId, username: undefined, role: undefined, email: undefined}`
  — actually check `userGroups.ts` line 27-32 exactly: it falls back to the raw stored
  member (`{refId}` only, no other keys) — replicate that, don't synthesize undefined fields.
- Constructor gains `idGenerator` — update `UserGroupsDataSourceFactory.default()` to
  pass `IdGeneratorFactory.default()`.

**Test:** new spec covering: `create` returns a group findable via `getAll`;
`update` renames and replaces members; `delete` removes multiple ids in one call and is
a no-op for unknown ids; `existsByName` is case-insensitive and excludes the group's own
id when renaming to its current name; `getAll` enriches members with username/role/email
and falls back to a bare `{refId}` for a stale/orphaned refId with no matching user.
Run `node ./node_modules/.bin/jest MongoUserGroupsDataSource.spec.ts`.

---

## Step 3: Use cases

**Files:** `app/api/core/application/CreateUserGroup.ts`,
`app/api/core/application/UpdateUserGroup.ts`,
`app/api/core/application/DeleteUserGroups.ts`,
`app/api/core/application/GetUserGroups.ts`,
`app/api/core/application/specs/*.spec.ts` (one per use case, or a shared fixture file)

**Skeleton:**
```ts
// CreateUserGroup.ts
type Input = { name: string; memberIds: string[] };
type Deps = { userGroupsDS: UserGroupsDataSource };
class CreateUserGroupUseCase extends AbstractUseCase<Input, UserGroup, Deps> {
  async execute(input: Input): Promise<UserGroup>
}

// UpdateUserGroup.ts
type Input = { id: string; name: string; memberIds: string[] };
class UpdateUserGroupUseCase extends AbstractUseCase<Input, UserGroup, Deps> {
  async execute(input: Input): Promise<UserGroup>
}

// DeleteUserGroups.ts
type Input = { ids: string[] };
class DeleteUserGroupsUseCase extends AbstractUseCase<Input, boolean, Deps> {
  async execute(input: Input): Promise<boolean>
}

// GetUserGroups.ts
type Output = UserGroupWithMembers[];
class GetUserGroupsUseCase extends AbstractUseCase<{}, Output, Deps> {
  async execute(): Promise<Output>
}
```

**Do:**
- `CreateUserGroupUseCase`: check `existsByName(input.name)`, `throw new Error('duplicated_entry')`
  if true (mirrors `CreateRelationshipTypeUseCase` exactly — plain `Error`, not a typed
  domain error, matching this resource's thin tier); else `deps.userGroupsDS.create(...)`.
- `UpdateUserGroupUseCase`: check `existsByName(input.name, input.id)`, same duplicate
  error; call `deps.userGroupsDS.update(...)` (no not-found check needed — `update()`'s
  `updateOne` on an unknown id is a silent no-op, matching legacy `model.save()`'s
  upsert-by-id behavior... verify against `userGroupsModel.ts`'s `save()` — if it's a
  true upsert, `update` should also upsert rather than assume existence; confirm during
  implementation and adjust Step 2 accordingly if so).
- `DeleteUserGroupsUseCase`: straight passthrough to `deps.userGroupsDS.delete(input.ids)`,
  return `true`.
- `GetUserGroupsUseCase`: straight passthrough to `deps.userGroupsDS.getAll()`.
- No `transactionManager.run()` wrapping needed for any of these — single data-source
  call each, unlike `CreateUser` (which also syncs groups + dispatches email).

**Test:** one spec per use case with a fake/mock `UserGroupsDataSource`, covering the
duplicate-name rejection path and the happy path. Run
`node ./node_modules/.bin/jest CreateUserGroup.spec.ts UpdateUserGroup.spec.ts DeleteUserGroups.spec.ts GetUserGroups.spec.ts`.

---

## Step 4: Factories

**Files:** `app/api/core/infrastructure/factories/CreateUserGroupUseCaseFactory.ts`,
`UpdateUserGroupUseCaseFactory.ts`, `DeleteUserGroupsUseCaseFactory.ts`,
`GetUserGroupsUseCaseFactory.ts`

**Skeleton:**
```ts
class CreateUserGroupUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof CreateUserGroupUseCase>[0]>)
}
// same shape for the other 3
```

**Do:** mirror `CreateRelationshipTypeUseCaseFactory.ts` exactly — wire
`TransactionManagerFactory.default()`, `UserGroupsDataSourceFactory.default()`,
`IdGeneratorFactory.default()`, spread `overrides` last.

**Test:** none, thin DI wiring — exercised transitively by controller specs (Step 5).

---

## Step 5: Controllers + mapper

**Files:** `app/api/core/infrastructure/express/userGroups/CreateUserGroupController.ts`,
`UpdateUserGroupController.ts`, `DeleteUserGroupsController.ts`,
`GetUserGroupsController.ts`, `UserGroupMapper.ts`, `specs/*.spec.ts`

**Skeleton:**
```ts
// CreateUserGroupController.ts — schema lives in this same file, not a shared schemas file
const CreateUserGroupRequestSchema = z.object({
  name: z.string(),
  members: z.array(z.object({ refId: z.string() })),
}).strict();

// UpdateUserGroupController.ts
const UpdateUserGroupRequestSchema = z.object({
  _id: z.string(),
  name: z.string(),
  members: z.array(z.object({ refId: z.string() })),
}).strict();

// DeleteUserGroupsController.ts
const DeleteUserGroupsQuerySchema = z.object({
  ids: z.union([z.string(), z.array(z.string())]).transform(v => Array.isArray(v) ? v : [v]),
});

// UserGroupMapper.ts
type UserGroupDTO = { _id: string; name: string; members: UserGroupMember[] };
const toDTO = (group: UserGroupWithMembers): UserGroupDTO
```

**Do:**
- Each controller extends `AbstractController`, mirrors
  `CreateRelationshipTypeController`/`DeleteRelationshipTypeController` structure
  exactly (try/catch with `ExecutionContext.logger.info` on failure, re-throw).
- Zod schema names are PascalCase (`CreateUserGroupRequestSchema`, not
  `createUserGroupRequestSchema`), and each schema is defined directly in the
  controller file that uses it — no shared `*RouteSchemas.ts` file (deviates from the
  `RelationshipTypeRouteSchemas.ts` precedent on purpose, per explicit convention for
  this module).
- Request schemas use `.strict()` (zod) to replicate the legacy AJV
  `additionalProperties: false` 422-on-extra-fields behavior at both group and member
  level.
- `CreateUserGroupController`/`UpdateUserGroupController` parse `{name, members}`,
  extract `memberIds = members.map(m => m.refId)` before calling the use case.
- `GetUserGroupsController.handle()`: call `GetUserGroupsUseCaseFactory.default().execute()`,
  respond `this.response.json(response.map(toDTO))` — legacy `GET /api/usergroups`
  returns a bare array (not `{rows: [...]}` like relationship types), preserve that
  shape for frontend compatibility (`HttpUserGroupsService.getAll()`).
- `DeleteUserGroupsController` parses `ids` from query via its own
  `DeleteUserGroupsQuerySchema`.

**Test:** one controller spec per verb (request → mocked use-case factory → response
shape/status), matching the existing `CreateRelationshipTypeController.spec.ts` style.
Also explicitly test the `additionalProperties`/extra-field-rejection case, since
`routes.spec.ts` (legacy) asserts on it today and frontend/API-contract parity depends
on it. Run `node ./node_modules/.bin/jest` against the new spec files.

---

## Step 6: Routes + feature-flagged cutover

V1 must keep running behind a feature flag — same rollout mechanism used for Users
(`v2UsersCreate`/`v2UsersUpdate`/`v2UsersGet` in
`app/api/core/infrastructure/express/users/routes.ts`). This is a true fork per verb
(legacy inline logic vs. new V2 controller), not just extra validation middleware,
since the V1 and V2 implementations here are fully distinct end-to-end (different
service files) — matching the `GET /api/users` branch style in that file, not the
lighter POST-only-extra-validation style.

**Files:** `app/api/tenants/tenantsModel.ts`, `app/api/tenants/tenantContext.ts`,
`app/api/config.ts`,
`app/api/core/infrastructure/express/userGroups/routes.ts` (new), `app/api/api.js`

**Skeleton:**
```ts
const userGroupsRoutes = (app: Application) => {
  app.post('/api/usergroups', needsAuthorization(['admin']), async (req, res, next) => {
    if (!tenants.current().featureFlags?.v2Usergroups) {
      return legacyUserGroups.save(req.body).then(saved => res.json(saved)).catch(next);
    }
    if (req.body?._id) return UpdateUserGroupController.createHandler()(req, res);
    return CreateUserGroupController.createHandler()(req, res);
  });
  app.get('/api/usergroups', needsAuthorization(['admin']), async (req, res, next) => {
    if (!tenants.current().featureFlags?.v2Usergroups) {
      return legacyUserGroups.get({}).then(groups => res.json(groups)).catch(next);
    }
    return GetUserGroupsController.createHandler()(req, res);
  });
  app.delete('/api/usergroups', needsAuthorization(['admin']), async (req, res, next) => {
    if (!tenants.current().featureFlags?.v2Usergroups) {
      /* ...legacy ids-parsing + legacyUserGroups.delete(...)... */
    }
    return DeleteUserGroupsController.createHandler()(req, res);
  });
};
export { userGroupsRoutes };
```

**Do:**
- Add `v2Usergroups: Boolean,` to `tenantsModel.ts` (mongoose schema),
  `v2Usergroups?: boolean;` to `tenantContext.ts`'s `featureFlags` type (both needed
  separately — TS only catches the gap in the latter, per the same lesson from the
  `postgresCaptchas` flag), and `v2Usergroups: false,` to `config.ts`'s
  `defaultTenant.featureFlags` — single flag, all 3 verbs gated together (not per-verb
  like Users, since all 3 routes are moving as one unit here).
- Inline the legacy branch by importing `app/api/usergroups/userGroups.ts`'s default
  export directly (same module Step 7 marks `@deprecated`) and replicating exactly what
  `app/api/usergroups/routes.ts` currently does for that verb (including the `DELETE`
  route's query parsing/validation) — do not call into the old `routes.ts` file itself,
  inline the few lines directly here, mirroring how `userRoutes` inlines legacy
  `users.get(...)` rather than importing the old route module.
- New-branch dispatch mirrors `relationshipTypesRoutes`'s dispatch-by-presence-of-`_id`
  pattern for POST (see `app/api/core/infrastructure/express/relationshipType/routes.ts:8-19`).
- All 3 verbs need `needsAuthorization(['admin'])` in both branches — legacy
  `app/api/usergroups/routes.ts` gates all 3 the same way; preserve that.
- In `app/api/api.js`, replace line 51
  (`(await import('./usergroups/routes.js')).default(app);`) with
  `(await import('./core/infrastructure/express/userGroups/routes.js')).userGroupsRoutes(app);`.
  Do not delete `app/api/usergroups/routes.ts` — it becomes unmounted/dead code, kept
  only until the flag is later removed and the file deleted in a future cleanup (out of
  scope here, same treatment `app/api/users/` legacy routes got).

**Test:** new spec for `userGroupsRoutes` covering both branches (flag off → legacy
behavior/shape, flag on → new controller behavior/shape) for all 3 verbs — mirrors
`app/api/core/infrastructure/express/users/specs/routes.spec.ts` if one exists, else
follow the per-controller specs from Step 5 plus a thin routing-only test. Keep the
existing `app/api/usergroups/specs/routes.spec.ts` passing unmodified (default flag is
`false`, so it's still exercising real behavior, just now via the inlined legacy branch
instead of the old dedicated route file). Manually verify via `yarn run:dev` with the
flag on and off that Settings → User Groups still lists/creates/edits/deletes correctly
in both states.

---

## Step 7: Deprecate legacy `userGroups.ts` methods

**Files:** `app/api/usergroups/userGroups.ts`

**Do:**
- Add `@deprecated` JSDoc to `get`, `save`, `saveMultiple`, `delete`, pointing at the
  new V2 use cases (`GetUserGroupsUseCase`, `CreateUserGroupUseCase`/
  `UpdateUserGroupUseCase`, `DeleteUserGroupsUseCase`) for the route-level callers, and
  noting that `collaborators.ts`/`entitiesPermissions.ts`/`search.js`/
  `userGroupsMembers.ts` are still legitimate callers for now (not moved in this phase).
- No behavior change — deprecation is documentation-only here, since the methods are
  still load-bearing for the untouched consumers.

**Test:** none, comment-only change. Run `yarn check-app-types` and
`yarn eslint-diff-branch` to confirm no lint/type regressions from the JSDoc addition.

---

## Step 8: Fix ExecutionContext transaction manager sourcing

**Files:** `CreateUserGroupUseCaseFactory.ts`, `UpdateUserGroupUseCaseFactory.ts`,
`DeleteUserGroupsUseCaseFactory.ts` (and `GetUserGroupsUseCaseFactory.ts`, unless it's
deleted by Step 11 first)

**Do:** replace `transactionManager: TransactionManagerFactory.default()` with
`transactionManager: ExecutionContext.transactionManager` in each factory — mirrors
`UserGroupsDataSourceFactory.ts`'s existing correct usage. Instantiating a fresh
transaction manager here (a pattern copied from `CreateRelationshipTypeUseCaseFactory`,
itself pre-existing debt) bypasses whatever transaction/session is already active on the
execution context.

**Test:** none new — existing use-case/controller specs continue to pass since they don't
assert on which transaction manager instance is used.

---

## Step 9: Typed domain error + Result pattern for name uniqueness

**Files:** `app/api/core/domain/userGroup/errors.ts` (new),
`app/api/core/application/contracts/UserGroupsDataSource.ts`,
`MongoUserGroupsDataSource.ts`, `CreateUserGroup.ts`, `UpdateUserGroup.ts`, their specs

**Skeleton:**
```ts
// errors.ts
class UserGroupNameExists extends DomainError {
  constructor(name: string) {
    super(`The group name "${name}" already exists`, 'usergroup.duplicated_name');
  }
}

// UserGroupsDataSource.ts
checkUniqueName(name: string, excludeId?: string): Promise<ResultType<true, UserGroupNameExists>>;
```

**Do:**
- Rename `existsByName` → `checkUniqueName`, mirroring
  `UsersDataSource.checkUniqueUsername`/`MongoUsersDataSource.checkUniqueUsername`
  exactly: the data source does the lookup and returns `Result.fail(new
  UserGroupNameExists(name))` on a match, `Result.ok(true)` otherwise (still
  case-insensitive, still excludes `excludeId`, no regex-escaping — same lookup logic,
  just wrapped in `Result` instead of returning a bare boolean).
- `CreateUserGroupUseCase`/`UpdateUserGroupUseCase` replace the boolean-check +
  `throw new Error('duplicated_entry')` with
  `(await this.deps.userGroupsDS.checkUniqueName(input.name[, input.id])).getDataOrThrow();`.

**Test:** update existing specs' assertions from `.rejects.toThrow('duplicated_entry')` to
`.rejects.toThrow(UserGroupNameExists)` (or matching on `.code === 'usergroup.duplicated_name'`).

---

## Step 10: Param-object types for multi-arg contract methods

**Files:** `app/api/core/application/contracts/UserGroupsDataSource.ts`,
`MongoUserGroupsDataSource.ts`, `CreateUserGroup.ts`, `UpdateUserGroup.ts`, their specs

**Skeleton:**
```ts
type CreateUserGroupParams = { name: string; memberIds: string[] };
type UpdateUserGroupParams = { id: string; name: string; memberIds: string[] };

create(params: CreateUserGroupParams): Promise<UserGroup>;
update(params: UpdateUserGroupParams): Promise<UserGroup>;
```

**Do:** convert `create`/`update` on the contract and `MongoUserGroupsDataSource` from
positional args to a single params object; update the two use cases' call sites
accordingly (`this.deps.userGroupsDS.create({ name: input.name, memberIds:
input.memberIds })`).

**Test:** no new tests — existing specs updated to call with the new object shape.

---

## Step 11: `getAll()` via `$lookup` aggregation instead of two queries + JS join

**Files:** `MongoUserGroupsDataSource.ts`, its spec

**Do:** replace the current `find()` + separate `users` `find()` + manual `.map()`/`.find()`
join with a single aggregation pipeline on the `usergroups` collection: `$lookup` into
`users` correlated on `members.refId` (mirrors `MongoUsersDAO.get()`'s `$lookup` in the
reverse direction — `let: { memberIds: '$members.refId' }`, sub-pipeline `$match: {
$expr: { $in: [{ $toString: '$_id' }, '$$memberIds'] } }`, project
`username/role/email`), then reshape in a `$addFields`/`$project` stage to merge each
member's `refId` with the matched user (falling back to the bare `refId` when no match
— same orphan-fallback semantics as today, just computed in the pipeline instead of JS).

**Test:** existing `getAll` spec cases (enrichment + orphan-fallback) should pass
unmodified — same JS-level i/o. Run `node ./node_modules/.bin/jest
MongoUsergroupsDataSource.spec.ts` to confirm the aggregation produces \identical output.

---

## Step 12: Delete `GetUserGroupsUseCase` — getters aren't use cases in this codebase

**Files:** `app/api/core/application/GetUserGroups.ts` (delete),
`app/api/core/application/specs/GetUserGroups.spec.ts` (delete),
`app/api/core/infrastructure/factories/GetUserGroupsUseCaseFactory.ts` (delete),
`app/api/core/infrastructure/express/userGroups/GetUserGroupsController.ts`

**Do:** `GetUserGroupsController.handle()` calls
`UserGroupsDataSourceFactory.default().getAll()` directly, replacing
`GetUserGroupsUseCaseFactory.default().execute()`. This was flagged as pre-existing debt
copied from `GetRelationshipTypesUseCase` (also a bare-passthrough "use case" with no
actual logic) — not fixed here, out of scope, but not to be repeated in new code.

**Test:** `GetUserGroupsController.spec.ts` and `routes.spec.ts` continue to pass
unmodified (they test through the controller/route, not the use case directly).

---

## Step 13: Shared request/response contracts in a dedicated `UserGroups.ts` file

**Files:** `app/shared/contracts/UserGroups.ts` (new), `app/shared/contracts/Users.ts`,
the 4 V2 controllers, `app/react/V2/services/index.ts`,
`app/react/V2/services/contracts/UserGroupsService.ts`,
`app/react/V2/services/server/ServerUserGroupsService.ts`

**Skeleton:**
```ts
// app/shared/contracts/UserGroups.ts
type GroupSummary = { _id: string; name: string };
type GroupMember = { refId: string; username: string; role: string; email: string };
type UserGroup = { _id?: string; name: string; members: GroupMember[] };

type CreateUserGroupRequest = { name: string; members: { refId: string }[] };
type CreateUserGroupResponse = UserGroup;
type UpdateUserGroupRequest = { _id: string; name: string; members: { refId: string }[] };
type UpdateUserGroupResponse = UserGroup;
type DeleteUserGroupsRequest = string[];
type DeleteUserGroupsResponse = boolean;
type GetUserGroupsResponse = UserGroup[];
```

**Do:**
- Move `GroupSummary`, `GroupMember`, `UserGroup` out of `Users.ts` into the new file
  (`Users.ts` re-imports `GroupSummary` for `User.groups: GroupSummary[]`).
- `GroupMember` gains `role`/`email` (currently missing from the contract even though the
  live API already returns them) — reflects actual wire shape rather than only what one
  frontend component currently reads.
- Update the 3 frontend files importing `UserGroup`/`GroupMember` from
  `#shared/contracts/Users.js` to import from `#shared/contracts/UserGroups.js` instead
  (`app/react/V2/services/index.ts`, `.../contracts/UserGroupsService.ts`,
  `.../server/ServerUserGroupsService.ts`).
- Each controller's `handle()` types its parsed/returned values against these contract
  types (zod schemas stay as the runtime validators; the contract types are the
  compile-time/shared source of truth), matching how `CreateUserController.ts` etc.
  reference `CreateUserRequest`/`CreateUserResponse` from `Users.ts` today.

**Test:** existing controller specs continue to pass (response shape unchanged, just now
type-checked against the shared contract). Run `yarn check-app-types` to confirm the
frontend import updates don't break the client build.

---

## Open item flagged during Step 3 (resolve during implementation, not before)

`UpdateUserGroupUseCase`'s not-found handling depends on whether `userGroupsModel.ts`'s
`save()` is a true Mongo upsert or requires an existing `_id`. If it upserts, `update()`
in Step 2 should do the same (`updateOne({_id}, {$set:...}, {upsert: true})`) to
preserve exact legacy behavior; if not, decide there whether to add a not-found error or
leave the silent no-op. Don't resolve this in the design phase — check the actual model
code when Step 2 is implemented.
