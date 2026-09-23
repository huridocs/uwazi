import { risonDecodeOrIgnore } from '#app/utils/index.js';
import { queryToFilter } from '#app/Library/helpers/publishedStatusFilter.js';
import {
  DEFAULT_LIBRARY_URL_STATE,
  isLibraryViewMode,
  normalizeFilters,
  serializeLibrarySearchParams,
  serializeLibrarySearchString,
  parseLibrarySearchParams,
  type LibraryFiltersState,
  type LibraryUrlState,
  type LibraryViewMode,
} from './libraryUrlState.js';

type LegacyRisonQuery = {
  searchTerm?: unknown;
  types?: unknown;
  filters?: unknown;
  from?: unknown;
  limit?: unknown;
  sort?: unknown;
  order?: unknown;
  unpublished?: unknown;
  includeUnpublished?: unknown;
  publishedStatus?: { values?: unknown };
  view?: unknown;
};

const isLegacyRisonQuery = (params: URLSearchParams): boolean => {
  const q = params.get('q');
  if (!q) {
    return false;
  }
  const trimmed = q.trim();
  return trimmed.startsWith('(') || trimmed === '()';
};

const viewFromLibraryPath = (pathname: string): LibraryViewMode | undefined => {
  const trimmed = pathname.replace(/\/+$/, '');
  if (trimmed.endsWith('/table')) {
    return 'table';
  }
  if (trimmed.endsWith('/map')) {
    return 'map';
  }
  return undefined;
};

const canonicalLibraryPath = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, '').replace(/\/(table|map)$/, '');
  return trimmed || '/';
};

const rangeFromRecord = (record: { from?: unknown; to?: unknown }): string[] => {
  const range: string[] = [];
  if (record.from !== undefined && record.from !== null && record.from !== '') {
    range.push(String(record.from));
  }
  if (record.to !== undefined && record.to !== null && record.to !== '') {
    range.push(String(record.to));
  }
  return range;
};

const filterValueToList = (value: unknown): string[] => {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap(filterValueToList);
  }
  if (typeof value === 'object') {
    const record = value as { values?: unknown; from?: unknown; to?: unknown };
    return Array.isArray(record.values)
      ? record.values.map(item => String(item))
      : rangeFromRecord(record);
  }
  return [];
};

const decodeSearchTerm = (value: unknown): string => {
  if (typeof value !== 'string' || !value) {
    return '';
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const asLegacyQuery = (value: unknown): LegacyRisonQuery | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as LegacyRisonQuery;
};

const uniqueStatus = (values: string[]): string[] | undefined => {
  if (values.includes('published') && values.includes('restricted')) {
    return undefined;
  }
  return values.length ? values : undefined;
};

const statusFromLegacy = (query: LegacyRisonQuery): string[] | undefined => {
  const publishedValues = filterValueToList(query.publishedStatus?.values).filter(
    value => value === 'published' || value === 'restricted'
  );
  if (publishedValues.length) {
    return uniqueStatus(publishedValues);
  }
  if (query.unpublished === undefined && query.includeUnpublished === undefined) {
    return undefined;
  }
  const mapped = queryToFilter(Boolean(query.unpublished), query.includeUnpublished !== false);
  return uniqueStatus(mapped.values);
};

const isAndFilter = (value: unknown): boolean =>
  Boolean(
    value && typeof value === 'object' && !Array.isArray(value) && (value as { and?: boolean }).and
  );

const recordFilters = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const filtersFromLegacy = (
  query: LegacyRisonQuery
): { filters: LibraryFiltersState; andFilters: string[] } => {
  const filters: LibraryFiltersState = {};
  const andFilters: string[] = [];
  const types = filterValueToList(query.types);
  if (types.length) {
    filters.type = types;
  }
  const status = statusFromLegacy(query);
  if (status?.length) {
    filters.status = status;
  }
  Object.entries(recordFilters(query.filters)).forEach(([key, value]) => {
    const list = filterValueToList(value);
    if (list.length) {
      filters[key] = list;
    }
    if (isAndFilter(value)) {
      andFilters.push(key);
    }
  });
  return { filters: normalizeFilters(filters), andFilters: [...new Set(andFilters)] };
};

const stateFromLegacyQuery = (query: LegacyRisonQuery): LibraryUrlState => {
  const { filters, andFilters } = filtersFromLegacy(query);
  return {
    filters,
    andFilters,
    search: decodeSearchTerm(query.searchTerm),
    limit: typeof query.limit === 'number' && query.limit > 0 ? query.limit : 30,
    from: typeof query.from === 'number' && query.from > 0 ? query.from : 0,
    sort: typeof query.sort === 'string' ? query.sort : '',
    order: query.order === 'asc' ? 'asc' : 'desc',
    view: isLibraryViewMode(String(query.view ?? '')) ? (query.view as LibraryViewMode) : 'cards',
  };
};

const legacyRisonToLibraryUrlState = (q: string): LibraryUrlState => {
  try {
    const query = asLegacyQuery(risonDecodeOrIgnore(q || '()'));
    return query ? stateFromLegacyQuery(query) : { ...DEFAULT_LIBRARY_URL_STATE };
  } catch {
    return { ...DEFAULT_LIBRARY_URL_STATE };
  }
};

const translateLegacySearchParams = (params: URLSearchParams): URLSearchParams => {
  const next = serializeLibrarySearchParams(legacyRisonToLibraryUrlState(params.get('q') || '()'));
  params.forEach((value, key) => {
    if (key === 'q' || next.has(key)) {
      return;
    }
    next.set(key, value);
  });
  return next;
};

const translateLegacySearchString = (params: URLSearchParams): string =>
  serializeLibrarySearchString(parseLibrarySearchParams(translateLegacySearchParams(params)));

const urlStateFromLegacyLocation = (url: URL, pathView?: LibraryViewMode): LibraryUrlState => {
  const state = isLegacyRisonQuery(url.searchParams)
    ? parseLibrarySearchParams(translateLegacySearchParams(url.searchParams))
    : parseLibrarySearchParams(url.searchParams);
  if (pathView) {
    state.view = pathView;
  }
  return state;
};

const legacyLibraryRedirectUrl = (url: URL): string | undefined => {
  try {
    const pathView = viewFromLibraryPath(url.pathname);
    if (!isLegacyRisonQuery(url.searchParams) && !pathView) {
      return undefined;
    }
    const search = serializeLibrarySearchString(urlStateFromLegacyLocation(url, pathView));
    const next = `${canonicalLibraryPath(url.pathname)}${search ? `?${search}` : ''}`;
    return next === `${url.pathname}${url.search}` ? undefined : next;
  } catch {
    return canonicalLibraryPath(url.pathname);
  }
};

export {
  isLegacyRisonQuery,
  legacyRisonToLibraryUrlState,
  translateLegacySearchParams,
  translateLegacySearchString,
  viewFromLibraryPath,
  canonicalLibraryPath,
  legacyLibraryRedirectUrl,
};
