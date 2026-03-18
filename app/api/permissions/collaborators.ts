import users from '#api/users/users.js';
import userGroups from '#api/usergroups/userGroups.js';
import { PermissionType } from '#shared/types/permissionSchema.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { UserSchema } from '#shared/types/userType.js';
import { WithId } from '#api/odm/index.js';
import { permissionsContext } from './permissionsContext.js';
import { PUBLIC_PERMISSION } from './publicPermission.js';

export const collaborators = {
  search: async (filterTerm: string) => {
    const exactFilterTerm = new RegExp(`^${filterTerm}$`, 'i');
    const partialFilterTerm = new RegExp(`^${filterTerm}`, 'i');

    const matchedUsers = await users.get({
      $or: [{ email: exactFilterTerm }, { username: exactFilterTerm }],
    });
    const groups = await userGroups.get({ name: { $regex: partialFilterTerm } });

    const availableCollaborators: MemberWithPermission[] = [];

    matchedUsers.forEach((user: WithId<UserSchema>) => {
      availableCollaborators.push({
        refId: user._id.toString(),
        type: PermissionType.USER,
        label: user.username!,
      });
    });

    groups.forEach(group => {
      availableCollaborators.push({
        refId: group._id!.toString(),
        type: PermissionType.GROUP,
        label: group.name,
      });
    });

    const user = permissionsContext.getUserInContext();

    if (user && ['admin', 'editor'].includes(user.role)) {
      availableCollaborators.push({
        ...PUBLIC_PERMISSION,
      });
    }

    return availableCollaborators;
  },
};
