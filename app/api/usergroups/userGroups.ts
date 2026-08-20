import users from '#api/users/users.js';
import type { UserView } from '#api/core/application/contracts/UserReadModels.js';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import { usersDirectoryEnabled } from '#api/core/infrastructure/factories/usersBackendFlags.js';
import model from './userGroupsModel.js';

export default {
  /**
   * @deprecated v1 read path. The `/api/usergroups` routes no longer use it — they go through
   * `MongoUserGroupsDAO`/`PostgresUserGroupsDAO` (see
   * app/api/core/infrastructure/express/userGroups/GetUserGroupsController.ts).
   *
   * Still the live read for the call sites that were not part of the V2 route migration:
   * activitylog/helpers.js, permissions/collaborators.ts, permissions/entitiesPermissions.ts,
   * search/search.js and react/V2/services/server/ServerUserGroupsService.ts. Note that it
   * always reads Mongo, so it does not honour the `postgresUsergroups` flag — migrating these
   * call sites is what removes that gap.
   */
  async get(query: any, select: any = '', options = {}) {
    const userGroups = await model.get(query, select, options);
    const usersInGroups = userGroups.reduce(
      (memo: string[], group) => memo.concat(group.members.map(m => m.refId.toString())),
      []
    );
    const usersFound: UserView[] = usersDirectoryEnabled()
      ? await UsersDirectoryFactory.default().getManyByIds(usersInGroups)
      : await users.get({ _id: { $in: usersInGroups } }, { username: 1, role: 1, email: 1 });

    // UserView carries exactly these four fields, so the mapping is a rename of `_id`.
    const members = usersFound.map(u => ({
      refId: u._id,
      username: u.username,
      role: u.role,
      email: u.email,
    }));

    return userGroups.map(group => ({
      ...group,
      members: group.members.map(
        m => members.find(u => u.refId.toString() === m.refId.toString()) || m
      ),
    }));
  },
};
