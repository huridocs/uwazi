import users from 'api/users/users';
import userGroups from 'api/usergroups/userGroups';

export const contributors = {
  getContributors: async (filterTerm: string) => {
    const matchedUsers = await users.get({
      $or: [{ email: filterTerm }, { username: filterTerm }],
    });

    const groups = await userGroups.get({});

    const availableContributors: any[] = [];

    matchedUsers.forEach(user => {
      availableContributors.push({
        _id: user._id,
        type: 'user',
        email: user.email,
        label: user.username,
        role: user.role,
      });
    });

    groups.forEach(group => {
      availableContributors.push({
        _id: group._id,
        type: 'group',
        label: group.name,
      });
    });

    return availableContributors;
  },
};
