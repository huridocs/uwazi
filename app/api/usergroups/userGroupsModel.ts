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
 * @deprecated v1 Mongo model. Read-only now: its remaining callers are the getters in
 * app/api/usergroups/userGroups.ts and userGroupsMembers.ts. Every write goes through
 * MongoUserGroupsDataSource / PostgresUserGroupsDataSource
 * (app/api/core/infrastructure/{mongodb,postgresql}/user/).
 * Remove once those two getters are migrated.
 */
const Model = instanceModel<UserGroupSchema>('usergroups', mongoSchema);

export default Model;
