import { risonDecodeOrIgnore } from '#app/utils/index.js';
import { queryToFilter } from '#app/Library/helpers/publishedStatusFilter.js';
import {
  normalizeFilters,
  serializeLibrarySearchParams,
  serializeLibrarySearchString,
  parseLibrarySearchParams,
  type LibraryFiltersState,
  type LibrarySortOrder,
  type LibraryUrlState,
  type LibraryViewMode,
} from './libraryUrlState.js';

type LegacyRisonQuery = {
  searchTerm?: string;
  types?: string[];
  filters?: Record<string, unknown>;
  from?: number;
  limit?: number;
  sort?: string;
  order?: string;
  unpublished?: boolean;
  includeUnpublished?: boolean;
  publishedStatus?: { values?: string[] };
  view?: string;
};

const isLegacyRisonQuery = (params: URLSearchParams): boolean => {
  const q = params.get('q');
  if (!q) {
    return false;
  }
  const trimmed = q.trim();
  return trimmed.startsWith('(') || trimmed === '()';
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
    if (Array.isArray(record.values)) {
      return record.values.map(item => String(item));
    }
    const range: string[] = [];
    if (record.from !== undefined && record.from !== null && record.from !== '') {
      range.push(String(record.from));
    }
    if (record.to !== undefined && record.to !== null && record.to !== '') {
      range.push(String(record.to));
    }
    return range;
  }
  return [];
};

const statusFromLegacy = (query: LegacyRisonQuery): string[] | undefined => {
  if (query.publishedStatus?.values?.length) {
    const values = query.publishedStatus.values.filter(
      value => value === 'published' || value === 'restricted'
    );
    if (values.includes('published') && values.includes('restricted')) {
      return undefined;
    }
    return values.length ? values : undefined;
  }

  if (query.unpublished === undefined && query.includeUnpublished === undefined) {
    return undefined;
  }

  const mapped = queryToFilter(Boolean(query.unpublished), query.includeUnpublished !== false);
  if (mapped.values.includes('published') && mapped.values.includes('restricted')) {
    return undefined;
  }
  return mapped.values.length ? mapped.values : undefined;
};

const filtersFromLegacy = (query: LegacyRisonQuery): LibraryFiltersState => {
  const filters: LibraryFiltersState = {};

  if (query.types?.length) {
    filters.type = query.types.map(String);
  }

  const status = statusFromLegacy(query);
  if (status?.length) {
    filters.status = status;
  }

  Object.entries(query.filters || {}).forEach(([key, value]) => {
    const list = filterValueToList(value);
    if (list.length) {
      filters[key] = list;
    }
  });

  return normalizeFilters(filters);
};

const legacyRisonToLibraryUrlState = (q: string): LibraryUrlState => {
  const query = risonDecodeOrIgnore(q || '()') as LegacyRisonQuery;
  const order: LibrarySortOrder = query.order === 'asc' ? 'asc' : 'desc';
  const view: LibraryViewMode = query.view === 'list' || query.view === 'table' ? 'list' : 'cards';

  return {
    filters: filtersFromLegacy(query),
    search: typeof query.searchTerm === 'string' ? decodeURIComponent(query.searchTerm) : '',
    limit: typeof query.limit === 'number' && query.limit > 0 ? query.limit : 30,
    from: typeof query.from === 'number' && query.from > 0 ? query.from : 0,
    sort: typeof query.sort === 'string' ? query.sort : '',
    order,
    view,
  };
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

export {
  isLegacyRisonQuery,
  legacyRisonToLibraryUrlState,
  translateLegacySearchParams,
  translateLegacySearchString,
};
