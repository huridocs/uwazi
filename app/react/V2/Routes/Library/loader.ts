import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, redirect } from 'react-router';
import { searchLibrary } from '#V2/api/librarySearch.js';
import { httpServices } from '#V2/services/http/index.js';
import type { V2Services } from '#V2/services/types.js';
import { parseLibrarySearchParams } from './libraryUrlState.js';
import { isLegacyRisonQuery, translateLegacySearchString } from './risonLegacy.js';
import type { LoaderResponse } from './types.js';

const createLibraryLoader =
  (_services: V2Services) =>
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
    const result = await searchLibrary(
      { ...urlState, from: fetchFrom, limit: fetchLimit },
      headers
    );

    return { ...result, urlState };
  };

const libraryLoader = createLibraryLoader(httpServices);

export { createLibraryLoader, libraryLoader };
