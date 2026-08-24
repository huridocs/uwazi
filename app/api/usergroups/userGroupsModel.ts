import mongoose from 'mongoose';
import { instanceModel } from '#api/odm/index.js';
import { UserGroupSchema } from '#shared/types/userGroupType.js';

const propsWithDBSpecifics = {
  name: { type: String, index: true },
};

const mongoSchema = new mongoose.Schema(propsWithDBSpecifics, {
  strict: false,
});

/**
 * @deprecated v1 Mongo model, down to a single caller: `getByMemberIdList` in
 * userGroupsMembers.ts, which populates `user.groups` for the legacy `users.js` getters and
 * dies with them. Every other read goes through UserGroupsDirectory / UserGroupsQueryService
 * and every write through MongoUserGroupsDataSource / PostgresUserGroupsDataSource
 * (app/api/core/infrastructure/{mongodb,postgresql}/user/).
 */
const Model = instanceModel<UserGroupSchema>('usergroups', mongoSchema);

export default Model;
