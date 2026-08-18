import escapeRegExp from 'lodash/escapeRegExp.js';
import userGroups from '#api/usergroups/userGroups.js';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import { PermissionType } from '#shared/types/permissionSchema.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { permissionsContext } from './permissionsContext.js';
import { PUBLIC_PERMISSION } from './publicPermission.js';

export const collaborators = {
  search: async (filterTerm: string) => {
    // Users are matched exactly and case-insensitively; groups by prefix. That asymmetry is
    // long-standing and deliberate — this term is only for the groups query.
    const partialFilterTerm = new RegExp(`^${escapeRegExp(filterTerm)}`, 'i');

    const matchedUsers = await UsersDirectoryFactory.default().searchByUsernameOrEmail(filterTerm);
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
