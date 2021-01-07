import { ObjectIdSchema } from 'shared/types/commonTypes';
import model from './userGroupsModel';

export const getByMemberIdList = (userIds: ObjectIdSchema[]) =>
  model.get({ 'members._id': { $in: userIds } });
