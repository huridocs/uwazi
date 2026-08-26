import { SearchAPI } from '#app/Search/SearchAPI.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { SearchService } from '../contracts/SearchService.js';
import {
  fromV1SearchResult,
  toV1SearchQuery,
  type V1SearchResult,
} from '../search/librarySearchMapping.js';

const httpSearchService: SearchService = {
  searchLibrary: async (query, { headers } = {}) => {
    try {
      const response = (await SearchAPI.search(
        new RequestParams(toV1SearchQuery(query), headers)
      )) as V1SearchResult;
      return [fromV1SearchResult(response)];
    } catch (error) {
      return [undefined as never, toApiError(error)];
    }
  },
};

export { httpSearchService };
