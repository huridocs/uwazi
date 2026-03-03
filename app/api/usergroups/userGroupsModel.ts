import mongoose from 'mongoose';
import { instanceModel } from '#api/odm/index.js';
import { UserGroupSchema } from '#shared/types/userGroupType.js';

const propsWithDBSpecifics = {
  name: { type: String, index: true },
};

const mongoSchema = new mongoose.Schema(propsWithDBSpecifics, {
  strict: false,
});

const Model = instanceModel<UserGroupSchema>('usergroups', mongoSchema);

export default Model;
