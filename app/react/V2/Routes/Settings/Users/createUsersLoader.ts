import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import type { V2Services } from '#V2/services/types.js';
import { throwApiError } from '#V2/shared/errorUtils.js';

/**
 * Loader factory for the Users & Groups settings route.
 *
 * Does not import or default to any service implementation — the caller
 * (getRoutes, entry-server, or tests) injects the `V2Services` bundle.
 */
const createUsersLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const [[users, usersError], [groups, groupsError]] = await Promise.all([
      services.users.getAll({ headers }),
      services.userGroups.getAll({ headers }),
    ]);

    if (usersError) throwApiError(usersError);
    if (groupsError) throwApiError(groupsError);

    return {
      users: users.map(user => ({ ...user, rowId: user._id! })),
      groups: groups.map(group => ({ ...group, rowId: group._id! })),
    };
  };

export { createUsersLoader };
