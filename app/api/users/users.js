import { getByMemberIdList } from '#api/usergroups/userGroupsMembers.js';

import model from './usersModel.js';

const populateGroupsOfUsers = async (user, groups) => {
  const memberships = groups
    .filter(group => group.members.find(member => member.refId === user._id.toString()))
    .map(group => ({
      _id: group._id,
      name: group.name,
    }));
  return { ...user, groups: memberships };
};

export default {
  /**
   * @deprecated v1 Mongo-only query path, no longer routed through the postgresUsers flag
   * (see UsersDAOFactory) since PostgresUsersDAO has no equivalent generic get(). The
   * /api/users GET route no longer reaches it — that read is `UsersQueryService`'s now. What
   * is left is activitylog/helpers.js, entitiesPermissions.ts and userGroups.ts when
   * `usersDirectory` is off; those call sites read through UsersDirectory when it is on.
   * `collaborators.ts` and `search.js` no longer appear here: they went to UsersDirectory
   * unconditionally, which resolves the backend itself (plan 05 step 1).
   */
  async get(query, select) {
    const users = await model.get({ ...query, deletedAt: { $exists: false } }, select);
    if (typeof select === 'string' && select.includes('+groups')) {
      const userIds = users.map(user => user._id.toString());
      const groups = await getByMemberIdList(userIds);
      return Promise.all(users.map(user => populateGroupsOfUsers(user, groups)));
    }
    return users;
  },

  /**
   * @deprecated v1 single-user read. Use `UsersDirectory` (`UsersDirectoryFactory.default()`),
   * which resolves the backend itself and returns a read model that cannot carry credentials.
   * Pick the method by what the caller actually needs (D1/D3):
   *
   * | this call | UsersDirectory |
   * |---|---|
   * | `getById(id)` | `getById` → `UserView` |
   * | `getById(id, '', true)` | `getProfile` → adds `groups`, `using2fa`, `accountLocked` |
   * | `getById(id, '', _, true)` | `getActor` → the only read that resolves a soft-deleted user |
   * | `getById(id, '+password')` | **nothing** — no read model carries a password, and no
   *   caller asks for one any more. Load the aggregate through `UsersDataSource` instead. |
   *
   * Every production caller has a UsersDirectory path already and reaches this one only when
   * `usersDirectory` is off (passport_conf.js, jobs/getUserById.ts, files.ts, OcrManager.ts,
   * preserveSync.ts, setupSockets.ts, suggestions/updateEntities.ts, tocService.ts). Retiring
   * that flag retires this method; `UsersGettersConsistency.spec.ts` pins it until then.
   */
  async getById(id, select = '', includeGroups = false, includeDeleted = false) {
    const [user] = await model.get(
      { _id: id, ...(!includeDeleted && { deletedAt: { $exists: false } }) },
      select
    );

    if (includeGroups && user) {
      const groups = await getByMemberIdList([user._id.toString()]);
      return populateGroupsOfUsers(user, groups);
    }

    return user ?? null;
  },
};
