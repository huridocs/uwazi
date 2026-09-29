import { search as searchApi } from '#api/search/index.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { SearchService } from '../contracts/SearchService.js';
import {
  fromSearchEndpointResult,
  toSearchEndpointQuery,
} from '../search/librarySearchEndpoint.js';
import type { ServerServiceContext } from './types.js';

const createServerSearchService = (ctx: ServerServiceContext): SearchService => {
  const search: SearchService['search'] = async (query, { language } = {}) => {
    try {
      const endpointQuery = toSearchEndpointQuery(query);
      const result = await (endpointQuery.geolocation
        ? searchApi.searchGeolocations(endpointQuery, language || ctx.language, ctx.user)
        : searchApi.search(endpointQuery, language || ctx.language, ctx.user));
      return [fromSearchEndpointResult(result)];
    } catch (error) {
      return [undefined as never, toApiError(error)];
    }
  };

  return {
    search,
    searchLibrary: search,
  };
};

export { createServerSearchService };
