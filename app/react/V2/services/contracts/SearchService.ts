import type { IncomingHttpHeaders } from 'http';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { LibrarySearchQuery, LibrarySearchResult } from '#shared/types/librarySearch.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

interface SearchService {
  searchLibrary(
    query: LibrarySearchQuery,
    options?: ServiceRequestOptions & { language?: string; headers?: IncomingHttpHeaders }
  ): Promise<ApiResponse<LibrarySearchResult>>;
}

export type { SearchService };
