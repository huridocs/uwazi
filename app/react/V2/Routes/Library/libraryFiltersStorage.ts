import { normalizeFilters, type LibraryFiltersState } from './libraryUrlState.js';

const LIBRARY_FILTERS_STORAGE_KEY = 'library-v2-filters';

type StoredLibraryFilters = {
  filters: LibraryFiltersState;
  andFilters: string[];
};

const emptyStoredLibraryFilters = (): StoredLibraryFilters => ({ filters: {}, andFilters: [] });

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const parseStoredLibraryFilters = (value: unknown): StoredLibraryFilters => {
  if (!value || typeof value !== 'object') {
    return emptyStoredLibraryFilters();
  }
  const raw = value as { filters?: unknown; andFilters?: unknown };
  const filters: LibraryFiltersState = {};
  if (raw.filters && typeof raw.filters === 'object' && !Array.isArray(raw.filters)) {
    Object.entries(raw.filters as Record<string, unknown>).forEach(([key, values]) => {
      const next = asStringArray(values);
      if (next.length) {
        filters[key] = next;
      }
    });
  }
  return {
    filters: normalizeFilters(filters),
    andFilters: [...new Set(asStringArray(raw.andFilters).filter(Boolean))],
  };
};

const isEmptyStoredLibraryFilters = (value: StoredLibraryFilters): boolean =>
  !Object.keys(value.filters).length && !value.andFilters.length;

const readStoredLibraryFilters = (): StoredLibraryFilters => {
  if (typeof window === 'undefined') {
    return emptyStoredLibraryFilters();
  }
  try {
    const raw = window.localStorage.getItem(LIBRARY_FILTERS_STORAGE_KEY);
    if (!raw) {
      return emptyStoredLibraryFilters();
    }
    return parseStoredLibraryFilters(JSON.parse(raw));
  } catch {
    return emptyStoredLibraryFilters();
  }
};

const writeStoredLibraryFilters = (state: StoredLibraryFilters): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(
    LIBRARY_FILTERS_STORAGE_KEY,
    JSON.stringify({
      filters: normalizeFilters(state.filters),
      andFilters: [...new Set(state.andFilters.filter(Boolean))],
    })
  );
};

const restoreLibraryFiltersFromStorage = (
  url: StoredLibraryFilters,
  stored: StoredLibraryFilters
): StoredLibraryFilters | null => {
  if (!isEmptyStoredLibraryFilters(url) || isEmptyStoredLibraryFilters(stored)) {
    return null;
  }
  return stored;
};

const storedLibraryFiltersFromPatch = (
  patch: { filters?: LibraryFiltersState | null; andFilters?: string[] | null },
  current: StoredLibraryFilters
): StoredLibraryFilters => ({
  filters: patch.filters === undefined ? current.filters : (patch.filters ?? {}),
  andFilters: patch.andFilters === undefined ? current.andFilters : (patch.andFilters ?? []),
});

export type { StoredLibraryFilters };
export {
  LIBRARY_FILTERS_STORAGE_KEY,
  readStoredLibraryFilters,
  restoreLibraryFiltersFromStorage,
  storedLibraryFiltersFromPatch,
  writeStoredLibraryFilters,
};
