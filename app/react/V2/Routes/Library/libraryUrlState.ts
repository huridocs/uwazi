import type { LibraryPermissionPick } from '#shared/types/librarySearch.js';
import {
  parseAndFilters,
  parseCompactFilters,
  parsePermissionFilters,
  serializeAndFilters,
  serializeCompactFilters,
  serializePermissionFilters,
  type LibraryFiltersState,
} from './libraryCompactFilters.js';
import { normalizeFilters } from './libraryFilterValues.js';

const LIBRARY_VIEW_MODES = ['cards', 'map', 'table'] as const;
type LibraryViewMode = (typeof LIBRARY_VIEW_MODES)[number];

const isLibraryViewMode = (value: string | null | undefined): value is LibraryViewMode =>
  Boolean(value && (LIBRARY_VIEW_MODES as readonly string[]).includes(value));
type LibrarySortOrder = 'asc' | 'desc';

type LibraryUrlState = {
  filters: LibraryFiltersState;
  /** Properties in AND mode (V1 `filters[name].and: true`). OR is the default. */
  andFilters: string[];
  /** Users and groups records are shared with. Separate from metadata filters. */
  permissionFilters: LibraryPermissionPick[];
  /** One AND for both Can view and Can edit. OR is the default. */
  permissionsAnd: boolean;
  search: string;
  limit: number;
  page: number;
  sort: string;
  order: LibrarySortOrder;
  view: LibraryViewMode;
};

const DEFAULT_LIBRARY_URL_STATE: LibraryUrlState = {
  filters: {},
  andFilters: [],
  permissionFilters: [],
  permissionsAnd: false,
  search: '',
  limit: 50,
  page: 1,
  sort: '',
  order: 'desc',
  view: 'cards',
};

const parsePositiveInt = (raw: string | null, fallback: number): number => {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parsePage = (params: URLSearchParams, limit: number): number => {
  const rawPage = params.get('page');
  if (rawPage) {
    const parsed = Number.parseInt(rawPage, 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : DEFAULT_LIBRARY_URL_STATE.page;
  }
  const from = parsePositiveInt(params.get('from'), 0);
  return from > 0 ? Math.floor(from / limit) + 1 : DEFAULT_LIBRARY_URL_STATE.page;
};

const parseLibrarySearchParams = (params: URLSearchParams): LibraryUrlState => {
  const filters = parseCompactFilters(params.get('filters') || '') ?? {};
  const order = params.get('order') === 'asc' ? 'asc' : DEFAULT_LIBRARY_URL_STATE.order;
  const viewParam = params.get('view');
  const view = isLibraryViewMode(viewParam) ? viewParam : DEFAULT_LIBRARY_URL_STATE.view;
  const limit =
    parsePositiveInt(params.get('limit'), DEFAULT_LIBRARY_URL_STATE.limit) ||
    DEFAULT_LIBRARY_URL_STATE.limit;

  return {
    filters: normalizeFilters(filters),
    andFilters: parseAndFilters(params.get('andFilters') || '') ?? [],
    permissionFilters:
      parsePermissionFilters(params.get('permissionFilters') || params.get('permissions') || '') ??
      [],
    permissionsAnd: params.get('permissionsAnd') === '1',
    search: params.get('search') || '',
    limit,
    page: parsePage(params, limit),
    sort: params.get('sort') || '',
    order,
    view,
  };
};

const setParam = (params: URLSearchParams, key: string, value: string | undefined) => {
  if (value) {
    params.set(key, value);
  }
};

const appendPaging = (params: URLSearchParams, state: Partial<LibraryUrlState>) => {
  if (state.limit && state.limit !== DEFAULT_LIBRARY_URL_STATE.limit) {
    params.set('limit', String(state.limit));
  }
  if (state.page && state.page !== DEFAULT_LIBRARY_URL_STATE.page) {
    params.set('page', String(state.page));
  }
  setParam(params, 'sort', state.sort);
  if (state.order && state.order !== DEFAULT_LIBRARY_URL_STATE.order) {
    params.set('order', state.order);
  }
  if (state.view && state.view !== DEFAULT_LIBRARY_URL_STATE.view) {
    params.set('view', state.view);
  }
};

const serializeLibrarySearchParams = (state: Partial<LibraryUrlState>): URLSearchParams => {
  const params = new URLSearchParams();
  setParam(params, 'filters', serializeCompactFilters(normalizeFilters(state.filters ?? {})));
  setParam(params, 'andFilters', serializeAndFilters(state.andFilters ?? []));
  setParam(params, 'permissionFilters', serializePermissionFilters(state.permissionFilters ?? []));
  if (state.permissionsAnd) {
    params.set('permissionsAnd', '1');
  }
  setParam(params, 'search', state.search);
  appendPaging(params, state);
  return params;
};

const encodeLibraryQueryValue = (key: string, value: string): string => {
  if (
    key === 'filters' ||
    key === 'andFilters' ||
    key === 'permissionFilters' ||
    key === 'permissions'
  ) {
    return value;
  }
  return encodeURIComponent(value).replace(/%20/g, '+');
};

const serializeLibrarySearchString = (state: Partial<LibraryUrlState>): string => {
  const params = serializeLibrarySearchParams(state);
  const parts: string[] = [];
  params.forEach((value, key) => {
    parts.push(`${key}=${encodeLibraryQueryValue(key, value)}`);
  });
  return parts.join('&');
};

const publishedStatusFromFilters = (
  status: string[] | undefined
): 'published' | 'restricted' | 'all' => {
  const values = status ?? [];
  if (!values.length || (values.includes('published') && values.includes('restricted'))) {
    return 'all';
  }
  if (values.includes('restricted') && !values.includes('published')) {
    return 'restricted';
  }
  return 'published';
};

export {
  DEFAULT_LIBRARY_URL_STATE,
  LIBRARY_VIEW_MODES,
  isLibraryViewMode,
  parseCompactFilters,
  serializeCompactFilters,
  parseAndFilters,
  serializeAndFilters,
  parsePermissionFilters,
  serializePermissionFilters,
  normalizeFilters,
  parseLibrarySearchParams,
  serializeLibrarySearchParams,
  serializeLibrarySearchString,
  publishedStatusFromFilters,
};
export type { LibraryFiltersState, LibraryUrlState, LibraryViewMode, LibrarySortOrder };
