import { search } from '#api/search/index.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { SearchService } from '../contracts/SearchService.js';
import { fromV1SearchResult, toV1SearchQuery } from '../search/librarySearchMapping.js';
import type { ServerServiceContext } from './types.js';

const createSearchQueryService = (ctx: ServerServiceContext): SearchService => ({
  searchLibrary: async (query, { language } = {}) => {
    try {
      const result = await search.search(
        toV1SearchQuery(query),
        language || ctx.language,
        ctx.user
      );
      return [fromV1SearchResult(result)];
    } catch (error) {
      return [undefined as never, toApiError(error)];
    }
  },
});

export { createSearchQueryService };
