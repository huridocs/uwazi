import mongoose from 'mongoose';
import { getUserInContext } from 'api/permissions/permissionsContext';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { UserSchema } from 'shared/types/userType';
import { createUpdateLogHelper } from './logHelper';
import { DataType, OdmModel } from './model';
import { models, UwaziFilterQuery } from './models';

export type PermissionsUwaziFilterQuery<T> = UwaziFilterQuery<T> & { published?: boolean };

const appendPermissionData = <T>(data: T) => {
  const user = getUserInContext();
  if (user) {
    return {
      ...data,
      permissions: [
        {
          _id: user._id!.toString(),
          type: PermissionType.USER,
          level: AccessLevels.WRITE,
        },
      ],
    };
  }
  return <T>{};
};

const addPermissionsCondition = (user: UserSchema, level: AccessLevels) => {
  let permissionCond;
  const targetIds = user.groups ? user.groups.map(group => group._id.toString()) : [];
  targetIds.push(user._id!.toString());
  if (!['admin', 'editor'].includes(user.role)) {
    const levelCond = level === AccessLevels.WRITE ? { level: AccessLevels.WRITE } : {};
    permissionCond = {
      permissions: { $elemMatch: { _id: { $in: targetIds }, ...levelCond } },
    };
  }
  return permissionCond;
};

const appendPermissionQuery = <T>(query: PermissionsUwaziFilterQuery<T>, level: AccessLevels) => {
  const user = getUserInContext();
  let permissionCond;
  if (user) {
    permissionCond = addPermissionsCondition(user, level);
  } else if (level === AccessLevels.READ) {
    permissionCond = { published: true };
  } else {
    permissionCond = { _id: null };
  }
  return { ...query, ...permissionCond };
};

export class ModelWithPermissions<T> extends OdmModel<T> {
  async save(data: DataType<T>) {
    return data._id
      ? super.save(data, appendPermissionQuery({ _id: data._id }, AccessLevels.WRITE))
      : super.save(appendPermissionData(data));
  }

  get(query: UwaziFilterQuery<T> = {}, select: any = '', options: {} = {}) {
    return super.get(appendPermissionQuery(query, AccessLevels.READ), select, options);
  }

  getInternal(query: UwaziFilterQuery<T> = {}, select: any = '') {
    return super.get(query, select, {});
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
