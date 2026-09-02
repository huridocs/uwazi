const LIBRARY_VIEW_MODES = ['cards', 'list', 'map', 'table', 'timeline'] as const;
type LibraryViewMode = (typeof LIBRARY_VIEW_MODES)[number];

const isLibraryViewMode = (value: string | null | undefined): value is LibraryViewMode =>
  Boolean(value && (LIBRARY_VIEW_MODES as readonly string[]).includes(value));
type LibrarySortOrder = 'asc' | 'desc';

type LibraryFiltersState = Record<string, string[]>;

type LibraryUrlState = {
  filters: LibraryFiltersState;
  /** Properties in AND mode (V1 `filters[name].and: true`). OR is the default. */
  andFilters: string[];
  search: string;
  limit: number;
  from: number;
  sort: string;
  order: LibrarySortOrder;
  view: LibraryViewMode;
};

const DEFAULT_LIBRARY_URL_STATE: LibraryUrlState = {
  filters: {},
  andFilters: [],
  search: '',
  limit: 30,
  from: 0,
  sort: '',
  order: 'desc',
  view: 'cards',
};

const SIMPLE_VALUE = /^[A-Za-z0-9._-]+$/;
const IDENT = /[A-Za-z0-9._-]/;

const serializeFilterValue = (value: string): string => {
  if (SIMPLE_VALUE.test(value)) {
    return value;
  }
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
};

const parseCompactFilters = (raw: string): LibraryFiltersState | null => {
  const input = raw.trim();
  if (!input) {
    return {};
  }
  if (input[0] !== '(' || input[input.length - 1] !== ')') {
    return null;
  }

  const inner = input.slice(1, -1);
  if (!inner.trim()) {
    return {};
  }

  const result: LibraryFiltersState = {};
  let i = 0;

  const skipComma = () => {
    if (inner[i] === ',') {
      i += 1;
    }
  };

  const readIdent = (): string => {
    const start = i;
    while (i < inner.length && IDENT.test(inner[i]!)) {
      i += 1;
    }
    return inner.slice(start, i);
  };

  const readValue = (): string | null => {
    if (inner[i] === "'") {
      i += 1;
      let out = '';
      while (i < inner.length && inner[i] !== "'") {
        const escaped = inner.slice(i, i + 2);
        if (escaped === "\\'") {
          out += "'";
          i += 2;
        } else if (escaped === '\\\\') {
          out += '\\';
          i += 2;
        } else {
          out += inner[i];
          i += 1;
        }
      }
      if (inner[i] !== "'") {
        return null;
      }
      i += 1;
      return out;
    }
    const ident = readIdent();
    return ident || null;
  };

  while (i < inner.length) {
    const key = readIdent();
    if (!key || inner[i] !== ':') {
      return null;
    }
    i += 1;
    if (inner[i] !== '(') {
      return null;
    }
    i += 1;

    const values: string[] = [];
    if (inner[i] !== ')') {
      while (i < inner.length) {
        const value = readValue();
        if (value === null) {
          return null;
        }
        values.push(value);
        if (inner[i] !== ',') {
          break;
        }
        i += 1;
      }
    }
    if (inner[i] !== ')') {
      return null;
    }
    i += 1;
    result[key] = values;
    skipComma();
  }

  return result;
};

const serializeCompactFilters = (filters: LibraryFiltersState): string => {
  const parts = Object.entries(filters)
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => `${key}:(${values.map(serializeFilterValue).join(',')})`);
  return parts.length ? `(${parts.join(',')})` : '';
};

const parseAndFilters = (raw: string): string[] | null => {
  const input = raw.trim();
  if (!input) {
    return [];
  }
  if (input[0] !== '(' || input[input.length - 1] !== ')') {
    return null;
  }

  const inner = input.slice(1, -1);
  if (!inner.trim()) {
    return [];
  }

  const names: string[] = [];
  let i = 0;
  while (i < inner.length) {
    const start = i;
    while (i < inner.length && IDENT.test(inner[i]!)) {
      i += 1;
    }
    const name = inner.slice(start, i);
    if (!name) {
      return null;
    }
    names.push(name);
    if (inner[i] === ',') {
      i += 1;
    } else if (i < inner.length) {
      return null;
    }
  }
  return [...new Set(names)];
};

const serializeAndFilters = (names: string[]): string => {
  const unique = [...new Set(names.filter(Boolean))];
  return unique.length ? `(${unique.join(',')})` : '';
};

const normalizeFilters = (filters: LibraryFiltersState): LibraryFiltersState => {
  const next: LibraryFiltersState = {};
  Object.entries(filters).forEach(([key, values]) => {
    if (!values.length) {
      return;
    }
    if (key === 'status') {
      const unique = [...new Set(values)];
      const hasPublished = unique.includes('published');
      const hasRestricted = unique.includes('restricted');
      if (hasPublished && hasRestricted) {
        return;
      }
      next.status = unique.filter(value => value === 'published' || value === 'restricted');
      return;
    }
    next[key] = values;
  });
  return next;
};

const parsePositiveInt = (raw: string | null, fallback: number): number => {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseLibrarySearchParams = (params: URLSearchParams): LibraryUrlState => {
  const filters = parseCompactFilters(params.get('filters') || '') ?? {};
  const order = params.get('order') === 'asc' ? 'asc' : DEFAULT_LIBRARY_URL_STATE.order;
  const viewParam = params.get('view');
  const view = isLibraryViewMode(viewParam) ? viewParam : DEFAULT_LIBRARY_URL_STATE.view;

  return {
    filters: normalizeFilters(filters),
    andFilters: parseAndFilters(params.get('andFilters') || '') ?? [],
    search: params.get('search') || '',
    limit:
      parsePositiveInt(params.get('limit'), DEFAULT_LIBRARY_URL_STATE.limit) ||
      DEFAULT_LIBRARY_URL_STATE.limit,
    from: parsePositiveInt(params.get('from'), DEFAULT_LIBRARY_URL_STATE.from),
    sort: params.get('sort') || '',
    order,
    view,
  };
};

const serializeLibrarySearchParams = (state: Partial<LibraryUrlState>): URLSearchParams => {
  const params = new URLSearchParams();
  const filters = serializeCompactFilters(normalizeFilters(state.filters ?? {}));
  if (filters) {
    params.set('filters', filters);
  }
  const andFilters = serializeAndFilters(state.andFilters ?? []);
  if (andFilters) {
    params.set('andFilters', andFilters);
  }
  if (state.search) {
    params.set('search', state.search);
  }
  if (state.limit && state.limit !== DEFAULT_LIBRARY_URL_STATE.limit) {
    params.set('limit', String(state.limit));
  }
  if (state.from) {
    params.set('from', String(state.from));
  }
  if (state.sort) {
    params.set('sort', state.sort);
  }
  if (state.order && state.order !== DEFAULT_LIBRARY_URL_STATE.order) {
    params.set('order', state.order);
  }
  if (state.view && state.view !== DEFAULT_LIBRARY_URL_STATE.view) {
    params.set('view', state.view);
  }
  return params;
};

const encodeLibraryQueryValue = (key: string, value: string): string => {
  if (key === 'filters' || key === 'andFilters') {
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
  normalizeFilters,
  parseLibrarySearchParams,
  serializeLibrarySearchParams,
  serializeLibrarySearchString,
  publishedStatusFromFilters,
};
export type { LibraryFiltersState, LibraryUrlState, LibraryViewMode, LibrarySortOrder };
