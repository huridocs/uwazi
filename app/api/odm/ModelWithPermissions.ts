import mongoose from 'mongoose';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { UserSchema } from 'shared/types/userType';
import { checkWritePermissions } from 'shared/permissionsUtils';
import { createUpdateLogHelper } from './logHelper';
import { DataType, OdmModel } from './model';
import { models, UwaziFilterQuery } from './models';

export type PermissionsUwaziFilterQuery<T> = UwaziFilterQuery<T> & { published?: boolean };
export interface DocumentWithPermissions {
  permissions: PermissionType[];
}

const appendPermissionData = <T>(data: T) => {
  const user = permissionsContext.getUserInContext();
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
  throw Error('Unauthorized');
};

const addPermissionsCondition = (user: UserSchema, level: AccessLevels) => {
  let permissionCond;
  const targetIds = user.groups ? user.groups.map(group => group._id.toString()) : [];
  targetIds.push(user._id!.toString());
  if (!['admin', 'editor'].includes(user.role)) {
    const levelCond = level === AccessLevels.WRITE ? { level: AccessLevels.WRITE } : {};
    permissionCond = {
      $or: [
        { permissions: { $elemMatch: { _id: { $in: targetIds }, ...levelCond } } },
        { published: true },
      ],
    };
  }
  return permissionCond;
};

const appendPermissionQuery = <T>(query: PermissionsUwaziFilterQuery<T>, level: AccessLevels) => {
  const user = permissionsContext.getUserInContext();
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

const filterPermissionsData = (user: UserSchema) => (elem: any) => {
  if (elem === null || !elem.length) {
    return elem;
  }

  //only take the element 0
  const writeAccess: boolean = checkWritePermissions(user, elem[0].permissions);

  if (!writeAccess) {
    // eslint-disable-next-line no-param-reassign
    delete elem[0].permissions;
  }

  return elem;
};

export class ModelWithPermissions<T> extends OdmModel<T> {
  async save(data: DataType<T>) {
    return data._id
      ? super.save(data, appendPermissionQuery({ _id: data._id }, AccessLevels.WRITE))
      : super.save(appendPermissionData(data));
  }

  get(query: UwaziFilterQuery<T> = {}, select: any = '', options: {} = {}) {
    const results = super.get(appendPermissionQuery(query, AccessLevels.READ), select, options);
    return results.map(filterPermissionsData(permissionsContext.getUserInContext()));
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
