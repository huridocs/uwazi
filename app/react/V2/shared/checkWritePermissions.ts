import { ClientUserSchema } from '#app/apiResponseTypes.js';
import { Entity } from '../api/entities/types';

type CheckFor = 'all' | 'some';

//hasWritePermissions is used in V1 where permissions could be an immutable
const getValue = (item: any, key: string) =>
  typeof item?.get === 'function' ? item.get(key) : item?.[key];

const hasWritePermission = (permissions: Entity['permissions'], user: ClientUserSchema) => {
  if (!permissions) {
    return false;
  }

  const idsWithWritePermissions = permissions
    .filter(permission => getValue(permission, 'level') === 'write')
    .map(permission => getValue(permission, 'refId'));

  return (
    idsWithWritePermissions.find(
      id => id === user._id || user?.groups?.find(group => group._id === id)
    ) !== undefined
  );
};

const checkWritePermissions = (
  entities: Entity[],
  user?: ClientUserSchema,
  checkFor: CheckFor = 'all'
) => {
  //checkWritePermissions is used in V1 where entities could be an immutable
  const count = 'size' in entities ? (entities.size as number) : entities.length;

  if (!user?._id || !user.role || count === 0) {
    return false;
  }

  return checkFor === 'all'
    ? entities.every(entity => hasWritePermission(getValue(entity, 'permissions'), user))
    : entities.some(entity => hasWritePermission(getValue(entity, 'permissions'), user));
};

export { checkWritePermissions, hasWritePermission };
