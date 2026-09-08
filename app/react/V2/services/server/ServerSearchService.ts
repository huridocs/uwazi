import { search } from '#api/search/index.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { SearchService } from '../contracts/SearchService.js';
import {
  fromSearchEndpointResult,
  toSearchEndpointQuery,
} from '../search/librarySearchEndpoint.js';
import type { ServerServiceContext } from './types.js';

const createServerSearchService = (ctx: ServerServiceContext): SearchService => ({
  searchLibrary: async (query, { language } = {}) => {
    try {
      const result = await search.search(
        toSearchEndpointQuery(query),
        language || ctx.language,
        ctx.user
      );
      return [fromSearchEndpointResult(result)];
    } catch (error) {
      return [undefined as never, toApiError(error)];
    }
  },
});

export { createServerSearchService };
