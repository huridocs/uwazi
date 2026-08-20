import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import model from './userGroupsModel.js';

/**
 * @deprecated v1 read path, used by the legacy `users.get`/`users.getById` group population
 * (app/api/users/users.js). Superseded by `MongoUserGroupsDAO.getGroupsByUserIds`.
 */
export const getByMemberIdList = async (userIds: ObjectIdSchema[]) =>
  model.get({ 'members.refId': { $in: userIds } });
