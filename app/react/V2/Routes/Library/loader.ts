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
  serializeLibrarySearchString,
  type LibraryUrlState,
} from './libraryUrlState.js';
import { legacyLibraryRedirectUrl } from './risonLegacy.js';
import {
  pruneLibraryFilters,
  pruneUnavailableFilters,
  sameLibraryFilterCriteria,
} from './pruneLibraryFilters.js';
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
  from: (urlState.page - 1) * urlState.limit,
  limit: urlState.limit,
});

const unwrapSearch = (result: LibrarySearchResult | undefined, error?: ApiError) => {
  if (error) {
    throwApiError(error);
  }
  return result!;
};

const searchOptions = (headers?: IncomingHttpHeaders): SearchRequestOptions => ({
  headers,
  language:
    typeof headers?.['content-language'] === 'string' ? headers['content-language'] : undefined,
});

const withPrunedFilters = async (
  services: V2Services,
  urlState: LibraryUrlState,
  requestOptions: SearchRequestOptions
) => {
  const hasPropertyFilter = Object.keys(urlState.filters).some(
    key => key !== 'type' && key !== 'status'
  );
  if (!hasPropertyFilter && !urlState.andFilters.length) {
    return { urlState, templates: [] };
  }
  const [templates, error] = await services.templates.getAll({ headers: requestOptions.headers });
  if (error) {
    throwApiError(error);
  }
  const loaded = templates ?? [];
  const pruned = pruneLibraryFilters({
    filters: urlState.filters,
    andFilters: urlState.andFilters,
    templates: loaded,
    typeIds: urlState.filters.type ?? [],
  });
  return {
    templates: loaded,
    urlState: { ...urlState, filters: pruned.filters, andFilters: pruned.andFilters },
  };
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

const redirectResponse = (url: URL, state: LibraryUrlState) => {
  const next = serializeLibrarySearchString(state);
  return redirect(`${url.pathname}${next ? `?${next}` : ''}`);
};

const availableFiltersRedirect = (
  url: URL,
  prepared: Awaited<ReturnType<typeof withPrunedFilters>>,
  aggregations: LibrarySearchResult['aggregations']
) => {
  const available = pruneUnavailableFilters({
    filters: prepared.urlState.filters,
    andFilters: prepared.urlState.andFilters,
    templates: prepared.templates,
    aggregations,
  });
  return sameLibraryFilterCriteria(prepared.urlState, available)
    ? undefined
    : redirectResponse(url, { ...prepared.urlState, ...available });
};

const libraryResponse = async (
  services: V2Services,
  url: URL,
  headers?: IncomingHttpHeaders
): Promise<LoaderResponse | Response> => {
  const requested = parseLibrarySearchParams(url.searchParams);
  const requestOptions = searchOptions(headers);
  const prepared = await withPrunedFilters(services, requested, requestOptions);
  if (url.searchParams.has('from') || !sameLibraryFilterCriteria(requested, prepared.urlState)) {
    return redirectResponse(url, prepared.urlState);
  }
  const result = await loadLibraryResult(services, prepared.urlState, requestOptions);
  return (
    availableFiltersRedirect(url, prepared, result.aggregations) ?? {
      ...result,
      urlState: prepared.urlState,
    }
  );
};

const createLibraryLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ request }): Promise<LoaderResponse | Response> => {
    const url = new URL(request.url);
    const legacyDestination = legacyLibraryRedirectUrl(url);
    if (legacyDestination) {
      return redirect(legacyDestination);
    }
    return libraryResponse(services, url, headers);
  };

const libraryLoader = createLibraryLoader(httpServices);

export { createLibraryLoader, libraryLoader };
