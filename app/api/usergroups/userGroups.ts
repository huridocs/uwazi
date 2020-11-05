import { UserGroupSchema } from 'shared/types/userGroupType';
import users from 'api/users/usersModel';
import model from './userGroupsModel';

export default {
  async get(query: any): Promise<UserGroupSchema[]> {
    const usersModel = users.db.dbForCurrentTenant().model('users');
    return model.get(query).populate({
      path: 'members',
      select: 'username',
      model: usersModel,
      options: { lean: true },
    });
  },
  async save(userGroup: UserGroupSchema) {
    return model.save(userGroup);
  },
};
