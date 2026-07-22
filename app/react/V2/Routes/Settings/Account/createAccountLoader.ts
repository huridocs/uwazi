import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import type { V2Services } from '#V2/services/types.js';
import { apiErrorToRequestError } from '#V2/shared/errorUtils.js';

/**
 * Loader factory for the Account settings route.
 *
 * Does not import or default to any service implementation — the caller
 * (getRoutes, entry-server, or tests) injects the `V2Services` bundle.
 */
const createAccountLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const [user, error] = await services.users.getCurrent({ headers });
    if (error) throw apiErrorToRequestError(error);
    return user;
  };

export { createAccountLoader };
