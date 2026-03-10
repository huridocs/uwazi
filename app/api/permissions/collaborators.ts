import users from 'api/users/users';
import userGroups from 'api/usergroups/userGroups';
import { PermissionType } from 'shared/types/permissionSchema';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { UserSchema } from 'shared/types/userType';
import { WithId } from 'api/odm';
import { permissionsContext } from './permissionsContext';
import { PUBLIC_PERMISSION } from './publicPermission';

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
        refId: user._id,
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
