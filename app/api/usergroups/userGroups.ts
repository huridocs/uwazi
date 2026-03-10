import users from 'api/users/users';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { validateUserGroup } from 'api/usergroups/validateUserGroup';
import { WithId } from 'api/odm';
import { UserSchema } from 'shared/types/userType';
import model from './userGroupsModel';

export default {
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

  async save(userGroup: UserGroupSchema) {
    await validateUserGroup(userGroup);
    const members = userGroup.members.map(m => ({ refId: m.refId }));

    return model.save({ ...userGroup, members });
  },

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

  async delete(query: any) {
    return model.delete(query);
  },
};
