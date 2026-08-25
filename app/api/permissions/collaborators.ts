import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import { UserGroupsDirectoryFactory } from '#api/core/infrastructure/factories/UserGroupsDirectoryFactory.js';
import { PermissionType } from '#shared/types/permissionSchema.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { permissionsContext } from './permissionsContext.js';
import { PUBLIC_PERMISSION } from './publicPermission.js';

export const collaborators = {
  search: async (filterTerm: string) => {
    const matchedUsers = await UsersDirectoryFactory.default().searchByUsernameOrEmail(filterTerm);
    const groups = await UserGroupsDirectoryFactory.default().searchByName(filterTerm);

    const availableCollaborators: MemberWithPermission[] = [];

    matchedUsers.forEach(user => {
      availableCollaborators.push({
        refId: user._id,
        type: PermissionType.USER,
        label: user.username,
      });
    });

    groups.forEach(group => {
      availableCollaborators.push({
        refId: group._id,
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
