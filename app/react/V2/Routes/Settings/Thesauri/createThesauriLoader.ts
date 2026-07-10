import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import type { V2Services } from '#V2/services/types.js';
import { apiErrorToRequestError } from '#V2/shared/errorUtils.js';

/**
 * Loader factory for the Thesauri list route.
 *
 * Does not import or default to any service implementation — the caller
 * (getRoutes, entry-server, or tests) injects the `V2Services` bundle.
 */
const createThesauriLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const [data, error] = await services.thesauri.getAll({ headers });
    if (error) throw apiErrorToRequestError(error);
    return data;
  };

export { createThesauriLoader };
