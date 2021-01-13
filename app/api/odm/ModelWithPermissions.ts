import mongoose from 'mongoose';
import { getUserInContext } from 'api/permissions/permissionsContext';
import { AccessLevels } from 'shared/types/permissionSchema';
import { createUpdateLogHelper } from './logHelper';
import { DataType, OdmModel } from './model';
import { models, UwaziFilterQuery } from './models';

const appendPermissionQuery = (query: UwaziFilterQuery<any>, level: AccessLevels) => {
  const levelCond = level === AccessLevels.WRITE ? { level: AccessLevels.WRITE } : {};
  const user = getUserInContext();
  const targetIds = [user._id];
  if (!['admin', 'editor'].includes(user.role)) {
    return {
      ...query,
      permissions: { $elemMatch: { _id: { $in: targetIds }, ...levelCond } },
    };
  }
  return query;
};

export class ModelWithPermissions<T> extends OdmModel<T> {
  async save(data: DataType<T>) {
    const queryCondition = data._id
      ? appendPermissionQuery({ _id: data._id }, AccessLevels.WRITE)
      : {};
    return super.save(data, queryCondition);
  }

  get(query: UwaziFilterQuery<T> = {}, select: any = '', options: {} = {}) {
    return super.get(appendPermissionQuery(query, AccessLevels.READ), select, options);
  }

  async delete(condition: any) {
    return super.delete(appendPermissionQuery(condition, AccessLevels.WRITE));
  }
}

export function instanceModel<T = any>(collectionName: string, schema: mongoose.Schema) {
  const logHelper = createUpdateLogHelper<T>(collectionName);
  const model = new ModelWithPermissions<T>(logHelper, collectionName, schema);
  models[collectionName] = model;
  return model;
}
