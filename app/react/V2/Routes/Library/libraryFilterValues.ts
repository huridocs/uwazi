import type { LibraryFiltersState } from './libraryUrlState.js';

const nonEmptyFilterValues = (values: string[]): string[] =>
  values.map(value => value.trim()).filter(Boolean);

const normalizeStatus = (values: string[]): string[] | undefined => {
  const unique = [...new Set(values)].filter(
    value => value === 'published' || value === 'restricted'
  );
  if (!unique.length || (unique.includes('published') && unique.includes('restricted'))) {
    return undefined;
  }
  return unique;
};

const normalizeFilters = (filters: LibraryFiltersState): LibraryFiltersState => {
  const next: LibraryFiltersState = {};
  Object.entries(filters).forEach(([key, values]) => {
    const usable = nonEmptyFilterValues(values);
    if (!usable.length) {
      return;
    }
    if (key === 'status') {
      const status = normalizeStatus(usable);
      if (status) {
        next.status = status;
      }
      return;
    }
    next[key] = usable;
  });
  return next;
};

export { normalizeFilters };
