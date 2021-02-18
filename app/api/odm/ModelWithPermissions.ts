import mongoose from 'mongoose';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { UserSchema } from 'shared/types/userType';
import { PermissionSchema } from 'shared/types/permissionType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { createUpdateLogHelper } from './logHelper';
import { DataType, OdmModel } from './model';
import { models, UwaziFilterQuery } from './models';

export type PermissionsUwaziFilterQuery<T> = UwaziFilterQuery<T> & {
  published?: boolean;
  permissions?: PermissionSchema[];
};

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

export const getUserPermissionIds = (user: UserSchema) => {
  const userIds = user.groups ? user.groups.map(group => group._id.toString()) : [];
  userIds.push(user._id!.toString());
  return userIds;
};

const addPermissionsCondition = (user: UserSchema, level: AccessLevels) => {
  let permissionCond = {};
  if (!['admin', 'editor'].includes(user.role)) {
    const userIds = getUserPermissionIds(user);
    const levelCond = level === AccessLevels.WRITE ? { level: AccessLevels.WRITE } : {};
    permissionCond = {
      $or: [
        { permissions: { $elemMatch: { _id: { $in: userIds }, ...levelCond } } },
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

function checkPermissionAccess<T>(
  elem: T & { permissions?: PermissionSchema[] },
  userIds: ObjectIdSchema[],
  level: AccessLevels = AccessLevels.WRITE
) {
  const hasAccessLevel = (p: PermissionSchema) =>
    level === AccessLevels.WRITE
      ? p.level === AccessLevels.WRITE && userIds.includes(p._id)
      : userIds.includes(p._id);

  const hasAccess = elem.permissions && elem.permissions.find(p => hasAccessLevel(p)) !== undefined;
  if (!hasAccess) {
    return { ...elem, permissions: undefined };
  }
  return elem;
}

const filterPermissionsData = (data: any) => {
  const user = permissionsContext.getUserInContext();
  let filteredData = data;
  if (user && !['admin', 'editor'].includes(user.role)) {
    if (Array.isArray(data) && data.length > 0) {
      const userIds = getUserPermissionIds(user);
      filteredData = data.map(elem => checkPermissionAccess(elem, userIds));
    }
  }
  return filteredData;
};

const controlPermissionsData = <T>(data: T & { published?: boolean }) => {
  const user = permissionsContext.getUserInContext();
  let controlledData = null;
  if (user) {
    if (['admin', 'editor'].includes(user.role)) {
      controlledData = data;
    } else {
      const doc = checkPermissionAccess(data, getUserPermissionIds(user), AccessLevels.READ);
      if (doc.permissions) {
        controlledData = { ...data, permissions: undefined };
      }
    }
  } else if (data.published) {
    controlledData = { ...data, permissions: undefined };
  }
  return controlledData;
};

export class ModelWithPermissions<T> extends OdmModel<T> {
  async save(data: DataType<T>) {
    return data._id
      ? super.save(data, appendPermissionQuery({ _id: data._id }, AccessLevels.WRITE))
      : super.save(appendPermissionData(data));
  }

  get(query: UwaziFilterQuery<T> = {}, select: any = '', options: {} = {}) {
    const results = super.get(appendPermissionQuery(query, AccessLevels.READ), select, options);
    return results.map(filterPermissionsData);
  }

  getWithUnrestrictedAccess(query: UwaziFilterQuery<T> = {}, select: any = '', options: {} = {}) {
    return super.get(query, select, options);
  }

  async getById(id: any, select?: any) {
    const doc = await this.db.findById(id, select ? `${select}, +permissions` : select);
    return doc ? controlPermissionsData(doc) : null;
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
