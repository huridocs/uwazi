import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, redirect } from 'react-router';
import type { LibrarySearchQuery } from '#shared/types/librarySearch.js';
import { throwApiError } from '#V2/shared/errorUtils.js';
import type { V2Services } from '#V2/services/types.js';
import { httpServices } from '#V2/services/http/index.js';
import { parseLibrarySearchParams, publishedStatusFromFilters } from './libraryUrlState.js';
import { isLegacyRisonQuery, translateLegacySearchString } from './risonLegacy.js';
import type { LoaderResponse } from './types.js';

const toSearchQuery = (
  urlState: ReturnType<typeof parseLibrarySearchParams>,
  from: number,
  limit: number
): LibrarySearchQuery => {
  const { type, status, ...propertyFilters } = urlState.filters;
  return {
    searchTerm: urlState.search,
    templateIds: type,
    filters: propertyFilters,
    publishedStatus: publishedStatusFromFilters(status),
    from,
    limit,
    sort: urlState.sort || undefined,
    order: urlState.order,
  };
};

const createLibraryLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ request }): Promise<LoaderResponse | Response> => {
    const url = new URL(request.url);
    if (isLegacyRisonQuery(url.searchParams)) {
      const nextSearch = translateLegacySearchString(url.searchParams);
      const destination = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
      return redirect(destination);
    }

    const urlState = parseLibrarySearchParams(url.searchParams);
    const fetchFrom = 0;
    const fetchLimit = urlState.from > 0 ? urlState.from + urlState.limit : urlState.limit;
    const [result, error] = await services.search.searchLibrary(
      toSearchQuery(urlState, fetchFrom, fetchLimit),
      {
        headers,
        language:
          typeof headers?.['content-language'] === 'string'
            ? headers['content-language']
            : undefined,
      }
    );

    if (error) {
      throwApiError(error);
    }

    return { ...result!, urlState };
  };

const libraryLoader = createLibraryLoader(httpServices);

export { createLibraryLoader, libraryLoader };
