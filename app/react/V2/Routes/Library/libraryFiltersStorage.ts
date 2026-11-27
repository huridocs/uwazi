import type { LibraryPermissionPick } from '#shared/types/librarySearch.js';
import { normalizeFilters, type LibraryFiltersState } from './libraryUrlState.js';

const LIBRARY_FILTERS_STORAGE_KEY = 'library-v2-filters';
const listeners = new Set<() => void>();

const subscribeToLibraryFilters = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

type StoredLibraryFilters = {
  filters: LibraryFiltersState;
  andFilters: string[];
  permissionFilters: LibraryPermissionPick[];
  permissionsAnd: boolean;
};

const emptyStoredLibraryFilters = (): StoredLibraryFilters => ({
  filters: {},
  andFilters: [],
  permissionFilters: [],
  permissionsAnd: false,
});

const parseStoredPermissionFilters = (value: unknown): LibraryPermissionPick[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const pick = item as { refId?: unknown; level?: unknown };
    if ((pick.level !== 'read' && pick.level !== 'write') || typeof pick.refId !== 'string') {
      return [];
    }
    if (!pick.refId) {
      return [];
    }
    return [{ refId: pick.refId, level: pick.level }];
  });
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const parseStoredLibraryFilters = (value: unknown): StoredLibraryFilters => {
  if (!value || typeof value !== 'object') {
    return emptyStoredLibraryFilters();
  }
  const raw = value as {
    filters?: unknown;
    andFilters?: unknown;
    permissionFilters?: unknown;
    permissionsAnd?: unknown;
  };
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
    permissionFilters: parseStoredPermissionFilters(raw.permissionFilters),
    permissionsAnd: raw.permissionsAnd === true,
  };
};

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

const writeStoredLibraryFilters = (
  state: Omit<StoredLibraryFilters, 'permissionFilters' | 'permissionsAnd'> & {
    permissionFilters?: LibraryPermissionPick[];
    permissionsAnd?: boolean;
  }
): void => {
  if (typeof window === 'undefined') {
    return;
  }
  const permissionFilters = state.permissionFilters ?? [];
  const permissionsAnd = state.permissionsAnd ?? false;
  window.localStorage.setItem(
    LIBRARY_FILTERS_STORAGE_KEY,
    JSON.stringify({
      filters: normalizeFilters(state.filters),
      andFilters: [...new Set(state.andFilters.filter(Boolean))],
      ...(permissionFilters.length ? { permissionFilters } : {}),
      ...(permissionsAnd ? { permissionsAnd: true } : {}),
    })
  );
  listeners.forEach(listener => listener());
};

const storedLibraryFiltersFromPatch = (
  patch: {
    filters?: LibraryFiltersState | null;
    andFilters?: string[] | null;
    permissionFilters?: LibraryPermissionPick[] | null;
    permissionsAnd?: boolean | null;
  },
  current: StoredLibraryFilters
): StoredLibraryFilters => ({
  filters: patch.filters === undefined ? current.filters : (patch.filters ?? {}),
  andFilters: patch.andFilters === undefined ? current.andFilters : (patch.andFilters ?? []),
  permissionFilters:
    patch.permissionFilters === undefined
      ? (current.permissionFilters ?? [])
      : (patch.permissionFilters ?? []),
  permissionsAnd:
    patch.permissionsAnd === undefined
      ? Boolean(current.permissionsAnd)
      : Boolean(patch.permissionsAnd),
});

export type { StoredLibraryFilters };
export {
  LIBRARY_FILTERS_STORAGE_KEY,
  readStoredLibraryFilters,
  subscribeToLibraryFilters,
  storedLibraryFiltersFromPatch,
  writeStoredLibraryFilters,
};
