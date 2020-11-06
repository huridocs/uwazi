import users from 'api/users/users';
import { UserGroupSchema } from 'shared/types/userGroupType';
import model from './userGroupsModel';

export default {
  async get(query: any, select: any = '', options = {}): Promise<UserGroupSchema[]> {
    const userGroups = await model.get(query, select, options);
    const usersInGroups = userGroups.reduce(
      (memo: Array<String>, group) => memo.concat(group.members.map(g => g._id.toString())),
      []
    );
    const usersFound = await users.get(
      { _id: { $in: usersInGroups } },
      { username: 1, role: 1, email: 1 }
    );

    userGroups.forEach((group, index) => {
      userGroups[index].members = group.members.map(m => {
        const user = usersFound.find(u => u._id.toString() === m._id.toString());
        return user || m;
      });
    });

    return userGroups;
  },

  async save(userGroup: UserGroupSchema) {
    const members = userGroup.members.map(m => ({ _id: m._id }));
    return model.save({ ...userGroup, members });
  },
};
