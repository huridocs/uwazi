import users from '#api/users/users.js';
import { UserGroupSchema } from '#shared/types/userGroupType.js';
import { validateUserGroup } from './validateUserGroup.js';
import { WithId } from '#api/odm/index.js';
import { UserSchema } from '#shared/types/userType.js';
import model from './userGroupsModel.js';

export default {
  /**
   * @deprecated Route-level callers should use GetUserGroupsUseCase (see
   * app/api/core/application/GetUserGroups.ts) instead, wired behind the v2Usergroups
   * feature flag in app/api/core/infrastructure/express/userGroups/routes.ts. Still a
   * legitimate call site for collaborators.ts, entitiesPermissions.ts, and search.js,
   * which are out of scope for the V2 migration for now.
   */
  async get(query: any, select: any = '', options = {}) {
    const userGroups = await model.get(query, select, options);
    const usersInGroups = userGroups.reduce(
      (memo: Array<String>, group) => memo.concat(group.members.map(m => m.refId.toString())),
      []
    );
    const usersFound: WithId<UserSchema>[] = await users.get(
      { _id: { $in: usersInGroups } },
      { username: 1, role: 1, email: 1 }
    );

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

  /**
   * @deprecated Route-level callers should use CreateUserGroupUseCase/UpdateUserGroupUseCase
   * (see app/api/core/application/CreateUserGroup.ts / UpdateUserGroup.ts) instead, wired
   * behind the v2Usergroups feature flag.
   */
  async save(userGroup: UserGroupSchema) {
    await validateUserGroup(userGroup);
    const members = userGroup.members.map(m => ({ refId: m.refId }));

    return model.save({ ...userGroup, members });
  },

  /**
   * @deprecated V1 predecessor of MongoUserGroupsDataSource.updateUserGroups, used only by
   * the legacy user create/update/delete flow (app/api/users/users.js). Not moved as part of
   * the V2 route-level migration.
   */
  async saveMultiple(userGroups: UserGroupSchema[]) {
    const groupsToUpdate = userGroups.map(userGroup => {
      const members = userGroup.members.map(m => ({ refId: m.refId.toString() }));
      return { ...userGroup, members };
    });
    await Promise.all(
      groupsToUpdate.map(async group => {
        await validateUserGroup(group);
      })
    );
    return model.saveMultiple(groupsToUpdate);
  },

  /**
   * @deprecated Route-level callers should use DeleteUserGroupsUseCase (see
   * app/api/core/application/DeleteUserGroups.ts) instead, wired behind the v2Usergroups
   * feature flag.
   */
  async delete(query: any) {
    return model.delete(query);
  },
};
