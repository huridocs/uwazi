import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import type { V2Services } from '#V2/services/types.js';
import { apiErrorToRequestError } from '#V2/shared/errorUtils.js';

/**
 * Loader factory for the Relationship types settings route.
 *
 * Does not import or default to any service implementation — the caller
 * (getRoutes, entry-server, or tests) injects the `V2Services` bundle.
 */
const createRelationshipTypesLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const [data, error] = await services.relationshipTypes.getAll({ headers });
    if (error) throw apiErrorToRequestError(error);
    return data.map(rel => ({ ...rel, rowId: rel._id }));
  };

export { createRelationshipTypesLoader };
