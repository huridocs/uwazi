import type { IncomingHttpHeaders } from 'http';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { LibrarySearchQuery, LibrarySearchResult } from '#shared/types/librarySearch.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type SearchRequestOptions = ServiceRequestOptions & {
  language?: string;
  headers?: IncomingHttpHeaders;
};

interface SearchService {
  search(
    query: LibrarySearchQuery,
    options?: SearchRequestOptions
  ): Promise<ApiResponse<LibrarySearchResult>>;
  searchLibrary(
    query: LibrarySearchQuery,
    options?: SearchRequestOptions
  ): Promise<ApiResponse<LibrarySearchResult>>;
}

export type { SearchRequestOptions, SearchService };
