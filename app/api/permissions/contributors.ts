import users from 'api/users/users';
import userGroups from 'api/usergroups/userGroups';
import { PermissionType } from 'shared/types/permissionSchema';

export const contributors = {
  getContributors: async (filterTerm: string) => {
    const exactFilterTerm = new RegExp(`^${filterTerm}$`, 'i');
    const partialFilterTerm = new RegExp(`^${filterTerm}`, 'i');

    const matchedUsers = await users.get({
      $or: [{ email: exactFilterTerm }, { username: exactFilterTerm }],
    });
    const groups = await userGroups.get({ name: { $regex: partialFilterTerm } });

    const availableContributors: any[] = [];

    matchedUsers.forEach(user => {
      availableContributors.push({
        _id: user._id,
        type: PermissionType.USER,
        email: user.email,
        label: user.username,
        role: user.role,
      });
    });

    groups.forEach(group => {
      availableContributors.push({
        _id: group._id,
        type: PermissionType.GROUP,
        label: group.name,
      });
    });

    return availableContributors;
  },
};
