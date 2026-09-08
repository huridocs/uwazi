import { apiClient } from '#V2/api/client.js';
import { requestHeaders } from '#V2/api/requestHeaders.js';
import type { SearchService } from '../contracts/SearchService.js';
import {
  fromSearchEndpointResult,
  toSearchEndpointQuery,
  type SearchEndpointResult,
} from '../search/librarySearchEndpoint.js';

const httpSearchService: SearchService = {
  searchLibrary: async (query, { headers, language, signal } = {}) => {
    const [data, error] = await apiClient.getJson<SearchEndpointResult>(
      'search',
      toSearchEndpointQuery(query),
      { headers: requestHeaders(headers), language, signal }
    );

    if (error) {
      return [undefined as never, error];
    }

    return [fromSearchEndpointResult(data ?? {})];
  },
};

export { httpSearchService };
