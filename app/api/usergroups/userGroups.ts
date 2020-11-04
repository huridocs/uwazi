import { UserGroupSchema } from 'shared/types/userGroupType';
import model from './userGroupsModel';

export default {
  async get(query: any): Promise<UserGroupSchema[]> {
    return model.get(query);
  },
  async save(userGroup: UserGroupSchema) {
    return model.save(userGroup);
  },
};
