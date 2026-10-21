import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import {
  readStoredLibraryFilters,
  subscribeToLibraryFilters,
  type StoredLibraryFilters,
} from './libraryFiltersStorage.js';
import { serializeLibrarySearchString } from './libraryUrlState.js';

const useRememberedLibraryUrl = (path: string, enabled: boolean): string => {
  const { key, pathname, search } = useLocation();
  const [storedFilters, setStoredFilters] = useState<StoredLibraryFilters>();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const refreshFilters = () => setStoredFilters(readStoredLibraryFilters());
    refreshFilters();
    return subscribeToLibraryFilters(refreshFilters);
  }, [enabled, key, pathname, search]);

  const query = enabled && storedFilters ? serializeLibrarySearchString(storedFilters) : '';
  return query ? `${path}?${query}` : path;
};

export { useRememberedLibraryUrl };
