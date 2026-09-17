import { useCallback, useLayoutEffect, useRef } from 'react';
import { useQueryStates } from 'nuqs';
import {
  readStoredLibraryFilters,
  restoreLibraryFiltersFromStorage,
  storedLibraryFiltersFromPatch,
  writeStoredLibraryFilters,
} from './libraryFiltersStorage.js';
import { librarySearchParams } from './librarySearchParams.js';
import type { LibraryFiltersState } from './libraryUrlState.js';

type LibraryUrlSetter = ReturnType<typeof useQueryStates<typeof librarySearchParams>>[1];
type LibraryUrlPatch = Parameters<LibraryUrlSetter>[0];

const persistLibraryUrlFilters = (
  patch: LibraryUrlPatch,
  current: { filters: LibraryFiltersState; andFilters: string[] }
) => {
  if (!patch || typeof patch !== 'object' || !('filters' in patch || 'andFilters' in patch)) {
    return;
  }
  writeStoredLibraryFilters(storedLibraryFiltersFromPatch(patch, current));
};

const useLibraryUrlState = () => {
  const [urlState, setUrlState] = useQueryStates(librarySearchParams);
  const didRestoreFilters = useRef(false);

  const updateUrl = useCallback(
    (patch: LibraryUrlPatch) => {
      persistLibraryUrlFilters(patch, {
        filters: urlState.filters,
        andFilters: urlState.andFilters,
      });
      setUrlState(patch).catch(() => undefined);
    },
    [setUrlState, urlState.andFilters, urlState.filters]
  );

  useLayoutEffect(() => {
    if (didRestoreFilters.current) {
      return;
    }
    didRestoreFilters.current = true;
    const restored = restoreLibraryFiltersFromStorage(
      { filters: urlState.filters, andFilters: urlState.andFilters },
      readStoredLibraryFilters()
    );
    if (!restored) {
      return;
    }
    updateUrl({
      filters: restored.filters,
      andFilters: restored.andFilters.length ? restored.andFilters : null,
    });
  }, [updateUrl, urlState.andFilters, urlState.filters]);

  return { urlState, updateUrl };
};

export { useLibraryUrlState };
