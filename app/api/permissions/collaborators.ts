import users from 'api/users/users';
import userGroups from 'api/usergroups/userGroups';
import { PermissionType, UserRole } from 'shared/types/permissionSchema';
import { MemberWithPermission } from 'shared/types/EntityPermisions';

export const collaborators = {
  getCollaborators: async (filterTerm: string) => {
    const exactFilterTerm = new RegExp(`^${filterTerm}$`, 'i');
    const partialFilterTerm = new RegExp(`^${filterTerm}`, 'i');

    const matchedUsers = await users.get({
      $or: [{ email: exactFilterTerm }, { username: exactFilterTerm }],
    });
    const groups = await userGroups.get({ name: { $regex: partialFilterTerm } });

    const availableCollaborators: MemberWithPermission[] = [];

    matchedUsers.forEach(user => {
      availableCollaborators.push({
        _id: user._id,
        type: PermissionType.USER,
        label: user.username!,
        role: user.role! as UserRole,
      });
    });

    groups.forEach(group => {
      availableCollaborators.push({
        _id: group._id!.toString(),
        type: PermissionType.GROUP,
        label: group.name,
      });
    });

    return availableCollaborators;
  },
};
