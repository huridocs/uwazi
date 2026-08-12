import escapeRegExp from 'lodash/escapeRegExp.js';
import userGroups from '#api/usergroups/userGroups.js';
import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';
import { PermissionType } from '#shared/types/permissionSchema.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { permissionsContext } from './permissionsContext.js';
import { PUBLIC_PERMISSION } from './publicPermission.js';

export const collaborators = {
  search: async (filterTerm: string) => {
    const partialFilterTerm = new RegExp(`^${escapeRegExp(filterTerm)}`, 'i');

    const matchedUsers = await UsersQueryServiceFactory.default().findByEmailOrUsername(
      filterTerm
    );
    const groups = await userGroups.get({ name: { $regex: partialFilterTerm } });

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
