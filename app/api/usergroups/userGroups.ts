import { UserGroupSchema } from 'shared/types/userGroupType';
import users from 'api/users/usersModel';
import model from './userGroupsModel';

export default {
  async get(query: any): Promise<UserGroupSchema[]> {
    users.db.dbForCurrentTenant();
    return model.get(query).populate('members');
  },

  async save(userGroup: UserGroupSchema) {
    return model.save(userGroup);
  },
};
