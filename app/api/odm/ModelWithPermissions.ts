import mongoose from 'mongoose';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { UserSchema } from 'shared/types/userType';
import { PermissionSchema } from 'shared/types/permissionType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { createUpdateLogHelper } from './logHelper';
import {
  DataType,
  OdmModel,
  models,
  UwaziFilterQuery,
  UwaziQueryOptions,
  EnforcedWithId,
} from './model';

type WithPermissions<T> = T & { published?: boolean; permissions?: PermissionSchema[] };
type WithPermissionsDataType<T> = DataType<WithPermissions<T>>;

export type PermissionsUwaziFilterQuery<T> = UwaziFilterQuery<DataType<WithPermissions<T>>>;

const appendPermissionData = <T>(
  data: WithPermissionsDataType<T>,
  user: DataType<UserSchema> | undefined
) => {
  if (!user) {
    return data;
  }

  return {
    ...data,
    permissions: [
      {
        refId: user._id!.toString(),
        type: PermissionType.USER,
        level: AccessLevels.WRITE,
      },
    ],
  };
};

const requestingPermissions = (select: any) =>
  select && ((select.includes && select.includes('+permissions')) || select.permissions === 1);

export const getUserPermissionIds = (user: DataType<UserSchema>) => {
  const userIds = user.groups ? user.groups.map(group => group._id.toString()) : [];
  if (user._id) {
    userIds.push(user._id.toString());
  }
  return userIds;
};

const addPermissionsCondition = (user: DataType<UserSchema>, level: AccessLevels) => {
  let permissionCond = {};
  if (!['admin', 'editor'].includes(user.role)) {
    const userIds = getUserPermissionIds(user);
    if (level === AccessLevels.WRITE) {
      permissionCond = {
        permissions: { $elemMatch: { refId: { $in: userIds }, level: AccessLevels.WRITE } },
      };
    } else {
      permissionCond = {
        $or: [{ permissions: { $elemMatch: { refId: { $in: userIds } } } }, { published: true }],
      };
    }
  }
  return permissionCond;
};

const appendPermissionQuery = <T>(
  query: PermissionsUwaziFilterQuery<T>,
  level: AccessLevels,
  user: DataType<UserSchema> | undefined
): UwaziFilterQuery<DataType<WithPermissions<T>>> => {
  let permissionCond: {} = { _id: null };
  if (user) {
    permissionCond = addPermissionsCondition(user, level);
  } else if (level === AccessLevels.READ) {
    permissionCond = { published: true };
  }
  return { ...query, ...permissionCond };
};

function checkPermissionAccess<T>(
  elem: EnforcedWithId<WithPermissions<T>>,
  userIds: ObjectIdSchema[],
  level: AccessLevels = AccessLevels.WRITE
) {
  const hasAccessLevel = (p: PermissionSchema) =>
    level === AccessLevels.WRITE
      ? p.level === AccessLevels.WRITE && userIds.includes(p.refId)
      : userIds.includes(p.refId);

  const hasAccess = elem.permissions && elem.permissions.find(p => hasAccessLevel(p)) !== undefined;
  if (!hasAccess) {
    return { ...elem, permissions: undefined };
  }
  return elem;
}

const filterPermissionsData = <T>(
  data?: EnforcedWithId<WithPermissions<T>>[],
  user?: DataType<UserSchema> | undefined
) => {
  let filteredData = data || [];
  if (user && !['admin', 'editor'].includes(user.role)) {
    if (filteredData.length > 0) {
      const userIds = getUserPermissionIds(user);
      filteredData = filteredData.map(elem => checkPermissionAccess(elem, userIds));
    }
  }
  return filteredData;
};

const controlPermissionsData = <T>(
  data: EnforcedWithId<WithPermissions<T>>,
  user?: DataType<UserSchema>
) => {
  if (user) {
    if (['admin', 'editor'].includes(user.role)) {
      return data;
    }

    return checkPermissionAccess(data, getUserPermissionIds(user), AccessLevels.WRITE);
  }

  return { ...data, permissions: undefined };
};

export class ModelWithPermissions<T> extends OdmModel<WithPermissions<T>> {
  async save(data: WithPermissionsDataType<T>) {
    const user = permissionsContext.getUserInContext();
    const query = { _id: data._id };
    return data._id || data.permissions
      ? super.save(data, appendPermissionQuery(query, AccessLevels.WRITE, user))
      : super.save(appendPermissionData(data, user));
  }

  async saveMultiple(dataArray: WithPermissionsDataType<T>[]) {
    const user = permissionsContext.getUserInContext();
    const dataArrayWithPermissions = dataArray.map(data =>
      data._id || data.permissions ? data : appendPermissionData(data, user)
    );
    const query = appendPermissionQuery({}, AccessLevels.WRITE, user);
    return super.saveMultiple(dataArrayWithPermissions, query, !!user);
  }

  async saveUnrestricted(data: WithPermissionsDataType<T>) {
    return data._id || data.permissions ? super.save(data, { _id: data._id }) : super.save(data);
  }

  async get(
    query: UwaziFilterQuery<WithPermissions<DataType<T>>> = {},
    select: any = '',
    options: UwaziQueryOptions = {}
  ) {
    const user = permissionsContext.getUserInContext();
    const results = await super.get(
      appendPermissionQuery<WithPermissions<T>>(query, AccessLevels.READ, user),
      select,
      options
    );
    const returnResult = requestingPermissions(select)
      ? filterPermissionsData<T>(results, user)
      : results;
    return returnResult;
  }

  async count(query: UwaziFilterQuery<WithPermissions<DataType<T>>> = {}) {
    const user = permissionsContext.getUserInContext();
    return super.count(appendPermissionQuery(query, AccessLevels.READ, user));
  }

  async getUnrestricted(
    query: UwaziFilterQuery<WithPermissions<DataType<T>>> = {},
    select: any = '',
    options: {} = {}
  ) {
    return super.get(query, select, options);
  }

  async getById(id: any, select?: string) {
    const user = permissionsContext.getUserInContext();
    const query = { _id: id || null };
    const doc = await this.db.findOne(
      appendPermissionQuery<T>(query, AccessLevels.READ, user),
      select
    );

    if (doc && requestingPermissions(select)) {
      return controlPermissionsData<T>(doc, user);
    }

    return doc;
  }

  async delete(condition: any) {
    const user = permissionsContext.getUserInContext();
    return super.delete(appendPermissionQuery(condition, AccessLevels.WRITE, user));
  }
}

export function instanceModelWithPermissions<T = any>(
  collectionName: string,
  schema: mongoose.Schema
) {
  const logHelper = createUpdateLogHelper<T>(collectionName);
  const model = new ModelWithPermissions<T>(logHelper, collectionName, schema);
  models[collectionName] = () => model;
  return model;
}
