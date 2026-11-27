import { useCallback } from 'react';
import { useQueryStates } from 'nuqs';
import {
  storedLibraryFiltersFromPatch,
  writeStoredLibraryFilters,
  type StoredLibraryFilters,
} from './libraryFiltersStorage.js';
import { librarySearchParams } from './librarySearchParams.js';

type LibraryUrlSetter = ReturnType<typeof useQueryStates<typeof librarySearchParams>>[1];
type LibraryUrlPatch = Parameters<LibraryUrlSetter>[0];

const persistLibraryUrlFilters = (patch: LibraryUrlPatch, current: StoredLibraryFilters) => {
  if (
    !patch ||
    typeof patch !== 'object' ||
    !(
      'filters' in patch ||
      'andFilters' in patch ||
      'permissionFilters' in patch ||
      'permissionsAnd' in patch
    )
  ) {
    return;
  }
  writeStoredLibraryFilters(storedLibraryFiltersFromPatch(patch, current));
};

const useLibraryUrlState = () => {
  const [urlState, setUrlState] = useQueryStates(librarySearchParams);

  const updateUrl = useCallback(
    (patch: LibraryUrlPatch) => {
      persistLibraryUrlFilters(patch, {
        filters: urlState.filters,
        andFilters: urlState.andFilters,
        permissionFilters: urlState.permissionFilters,
        permissionsAnd: urlState.permissionsAnd,
      });
      setUrlState(patch).catch(() => undefined);
    },
    [
      setUrlState,
      urlState.andFilters,
      urlState.filters,
      urlState.permissionFilters,
      urlState.permissionsAnd,
    ]
  );

  return { urlState, updateUrl };
};

export { useLibraryUrlState };
