import { parseAsInteger, parseAsString, parseAsStringLiteral, createParser } from 'nuqs';
import {
  DEFAULT_LIBRARY_URL_STATE,
  parseCompactFilters,
  serializeCompactFilters,
  normalizeFilters,
  type LibraryFiltersState,
} from './libraryUrlState.js';

const parseAsCompactFilters = createParser({
  parse: (value: string) => parseCompactFilters(value),
  serialize: (value: LibraryFiltersState) => serializeCompactFilters(normalizeFilters(value)),
  eq: (a, b) =>
    serializeCompactFilters(normalizeFilters(a)) === serializeCompactFilters(normalizeFilters(b)),
}).withDefault({});

const librarySearchParams = {
  filters: parseAsCompactFilters,
  search: parseAsString.withDefault(DEFAULT_LIBRARY_URL_STATE.search),
  limit: parseAsInteger.withDefault(DEFAULT_LIBRARY_URL_STATE.limit),
  from: parseAsInteger.withDefault(DEFAULT_LIBRARY_URL_STATE.from),
  sort: parseAsString.withDefault(DEFAULT_LIBRARY_URL_STATE.sort),
  order: parseAsStringLiteral(['asc', 'desc']).withDefault(DEFAULT_LIBRARY_URL_STATE.order),
  view: parseAsStringLiteral(['cards', 'list']).withDefault(DEFAULT_LIBRARY_URL_STATE.view),
};

export { librarySearchParams, parseAsCompactFilters };
