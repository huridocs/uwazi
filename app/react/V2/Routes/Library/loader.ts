import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, redirect } from 'react-router';
import type { ApiError } from '#shared/apiClient/index.js';
import type { LibrarySearchQuery, LibrarySearchResult } from '#shared/types/librarySearch.js';
import { throwApiError } from '#V2/shared/errorUtils.js';
import type { V2Services } from '#V2/services/types.js';
import { httpServices } from '#V2/services/http/index.js';
import {
  parseLibrarySearchParams,
  publishedStatusFromFilters,
  type LibraryUrlState,
} from './libraryUrlState.js';
import { isLegacyRisonQuery, translateLegacySearchString } from './risonLegacy.js';
import type { LoaderResponse } from './types.js';

const MAP_GEO_LIMIT = 9999;

type SearchRequestOptions = {
  headers?: IncomingHttpHeaders;
  language?: string;
};

type SearchRange = {
  from: number;
  limit: number;
  geolocation?: boolean;
};

const toSearchQuery = (urlState: LibraryUrlState, range: SearchRange): LibrarySearchQuery => {
  const { type, status, ...propertyFilters } = urlState.filters;
  return {
    searchTerm: urlState.search,
    templateIds: type,
    filters: propertyFilters,
    ...(urlState.andFilters.length ? { andFilters: urlState.andFilters } : {}),
    publishedStatus: publishedStatusFromFilters(status),
    from: range.from,
    limit: range.limit,
    sort: urlState.sort || undefined,
    order: urlState.order,
    ...(range.geolocation ? { geolocation: true } : {}),
  };
};

const pageRange = (urlState: LibraryUrlState): SearchRange => ({
  from: 0,
  limit: urlState.from > 0 ? urlState.from + urlState.limit : urlState.limit,
});

const unwrapSearch = (result: LibrarySearchResult | undefined, error?: ApiError) => {
  if (error) {
    throwApiError(error);
  }
  return result!;
};

const loadLibraryResult = async (
  services: V2Services,
  urlState: LibraryUrlState,
  requestOptions: SearchRequestOptions
) => {
  const range = pageRange(urlState);
  if (urlState.view !== 'map') {
    const [result, error] = await services.search.searchLibrary(
      toSearchQuery(urlState, range),
      requestOptions
    );
    return unwrapSearch(result, error);
  }

  const [[listResult, listError], [geoResult, geoError]] = await Promise.all([
    services.search.searchLibrary(toSearchQuery(urlState, range), requestOptions),
    services.search.searchLibrary(
      toSearchQuery(urlState, { from: 0, limit: MAP_GEO_LIMIT, geolocation: true }),
      requestOptions
    ),
  ]);
  const list = unwrapSearch(listResult, listError);
  const geo = unwrapSearch(geoResult, geoError);
  return { ...list, rows: geo.rows, totalRows: geo.totalRows };
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
    const result = await loadLibraryResult(services, urlState, {
      headers,
      language:
        typeof headers?.['content-language'] === 'string' ? headers['content-language'] : undefined,
    });

    return { ...result, urlState };
  };

const libraryLoader = createLibraryLoader(httpServices);

export { createLibraryLoader, libraryLoader };
