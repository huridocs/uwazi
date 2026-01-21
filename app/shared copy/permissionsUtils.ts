import { PermissionSchema } from './types/permissionType';
import { UserSchema } from '#shared/types/userType.js';

export const checkWritePermissions = (
  user: UserSchema | undefined,
  permissions?: PermissionSchema[] | undefined
) => {
  if (!user) {
    return false;
  }

  if (['admin', 'editor'].includes(user.role)) {
    return true;
  }

  const ids = permissions
    ? permissions.filter(p => p.level === 'write').map(p => p.refId.toString())
    : [];
  const userIds = [user._id!.toString(), ...(user.groups || []).map(g => g._id.toString())];

  return !!ids.find(p => userIds.includes(p));
};
