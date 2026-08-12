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
 * @deprecated v1 Mongo model, used by app/api/usergroups/userGroups.ts,
 * validateUserGroup.ts and userGroupsMembers.ts.
 * Superseded by MongoUserGroupsDataSource / PostgresUserGroupsDataSource
 * (app/api/core/infrastructure/{mongodb,postgresql}/user/).
 * Remove once those v1 callers are migrated.
 */
const Model = instanceModel<UserGroupSchema>('usergroups', mongoSchema);

export default Model;
