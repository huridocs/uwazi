import { parseAsInteger, parseAsString, parseAsStringLiteral, createParser } from 'nuqs';
import type { LibraryPermissionPick } from '#shared/types/librarySearch.js';
import {
  DEFAULT_LIBRARY_URL_STATE,
  LIBRARY_VIEW_MODES,
  parseCompactFilters,
  serializeCompactFilters,
  parseAndFilters,
  serializeAndFilters,
  parsePermissionFilters,
  serializePermissionFilters,
  normalizeFilters,
  type LibraryFiltersState,
} from './libraryUrlState.js';

/** Search params the loader reads. nuqs defaults to shallow URL updates (no RR navigation),
 *  which would leave useLoaderData stale after filter/search/sort changes. */
const notifyLoader = { shallow: false };

const parseAsCompactFilters = createParser({
  parse: (value: string) => parseCompactFilters(value),
  serialize: (value: LibraryFiltersState) => serializeCompactFilters(normalizeFilters(value)),
  eq: (a, b) =>
    serializeCompactFilters(normalizeFilters(a)) === serializeCompactFilters(normalizeFilters(b)),
})
  .withDefault({})
  .withOptions(notifyLoader);

const parseAsAndFilters = createParser({
  parse: (value: string) => parseAndFilters(value),
  serialize: (value: string[]) => serializeAndFilters(value),
  eq: (a, b) => serializeAndFilters(a) === serializeAndFilters(b),
})
  .withDefault([])
  .withOptions(notifyLoader);

const parseAsPermissionFilters = createParser({
  parse: (value: string) => parsePermissionFilters(value),
  serialize: (value: LibraryPermissionPick[]) => serializePermissionFilters(value),
  eq: (a, b) => serializePermissionFilters(a) === serializePermissionFilters(b),
})
  .withDefault([])
  .withOptions(notifyLoader);

const parseAsPermissionsAnd = createParser({
  parse: (value: string) => value === '1',
  serialize: (value: boolean) => (value ? '1' : ''),
})
  .withDefault(false)
  .withOptions(notifyLoader);

const librarySearchParams = {
  filters: parseAsCompactFilters,
  andFilters: parseAsAndFilters,
  permissionFilters: parseAsPermissionFilters,
  permissionsAnd: parseAsPermissionsAnd,
  search: parseAsString.withDefault(DEFAULT_LIBRARY_URL_STATE.search).withOptions(notifyLoader),
  limit: parseAsInteger.withDefault(DEFAULT_LIBRARY_URL_STATE.limit).withOptions(notifyLoader),
  page: parseAsInteger.withDefault(DEFAULT_LIBRARY_URL_STATE.page).withOptions(notifyLoader),
  sort: parseAsString.withDefault(DEFAULT_LIBRARY_URL_STATE.sort).withOptions(notifyLoader),
  order: parseAsStringLiteral(['asc', 'desc'])
    .withDefault(DEFAULT_LIBRARY_URL_STATE.order)
    .withOptions(notifyLoader),
  view: parseAsStringLiteral(LIBRARY_VIEW_MODES).withDefault(DEFAULT_LIBRARY_URL_STATE.view),
};

export { librarySearchParams, parseAsCompactFilters, parseAsAndFilters };
