import { instanceModel } from 'api/odm';
import mongoose from 'mongoose';
import { UserGroupSchema } from 'shared/types/userGroupType';

const propsWithDBSpecifics = {
  name: { type: String, index: true },
  usersb: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
};

const mongoSchema = new mongoose.Schema(propsWithDBSpecifics, {
  emitIndexErrors: true,
  strict: false,
});

const Model = instanceModel<UserGroupSchema>('usergroups', mongoSchema);

export default Model;
