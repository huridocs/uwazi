import { UserSchema } from './types/userType';
import { PermissionSchema } from './types/permissionType';

export const checkWritePermissions = (
  user: UserSchema | undefined,
  permissions?: PermissionSchema[] | undefined
) => {
  if (!user) {
    return false;
  }

  const ids = permissions ? permissions.filter(p => p.level === 'write').map(p => p._id) : [];
  const userIds = [user._id!.toString(), ...(user.groups || []).map(g => g._id)];

  return !!ids.find(p => userIds.includes(p));
};
