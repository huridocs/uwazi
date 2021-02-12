import users from 'api/users/users';
import { GroupMemberSchema, UserGroupSchema } from 'shared/types/userGroupType';
import { validateUserGroup } from 'api/usergroups/validateUserGroup';
import model from './userGroupsModel';

export default {
  async get(query: any, select: any = '', options = {}): Promise<UserGroupSchema[]> {
    const userGroups = await model.get(query, select, options);
    const usersInGroups = userGroups.reduce(
      (memo: Array<String>, group) => memo.concat(group.members.map(g => g._id.toString())),
      []
    );
    const usersFound: GroupMemberSchema[] = await users.get(
      { _id: { $in: usersInGroups } },
      { username: 1, role: 1, email: 1 }
    );

    return userGroups.map(group => ({
      ...group,
      members: group.members.map(
        m => usersFound.find(u => u._id.toString() === m._id.toString()) || m
      ),
    }));
  },

  async save(userGroup: UserGroupSchema) {
    await validateUserGroup(userGroup);
    const members = userGroup.members.map(m => ({ _id: m._id }));

    return model.save({ ...userGroup, members });
  },

  async saveMultiple(userGroups: UserGroupSchema[]) {
    const groupsToUpdate = userGroups.map(userGroup => {
      const members = userGroup.members.map(m => ({ _id: m._id.toString() }));
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
