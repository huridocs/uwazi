import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import {
  filterableProperties,
  visibleFilterProperties,
  type FilterableTemplate,
} from './filterableProperties.js';
import {
  normalizeFilters,
  serializeAndFilters,
  serializeCompactFilters,
  type LibraryFiltersState,
} from './libraryUrlState.js';

const filterKeyStays = (key: string, names: ReadonlySet<string>) => {
  const dot = key.indexOf('.');
  const parent = dot > 0 ? key.slice(0, dot) : '';
  return key === 'type' || key === 'status' || names.has(key) || names.has(parent);
};

const pruneToNames = (
  filters: LibraryFiltersState,
  andFilters: string[],
  names: ReadonlySet<string>
) => {
  const next: LibraryFiltersState = {};
  Object.entries(filters).forEach(([key, values]) => {
    if (filterKeyStays(key, names)) {
      next[key] = values;
    }
  });
  return { filters: next, andFilters: andFilters.filter(name => names.has(name)) };
};

const pruneLibraryFilters = (input: {
  filters: LibraryFiltersState;
  andFilters: string[];
  templates: FilterableTemplate[];
  typeIds: string[];
}) => {
  if (!Object.keys(input.filters).length) {
    return { filters: {}, andFilters: [] };
  }
  return pruneToNames(
    input.filters,
    input.andFilters,
    new Set(filterableProperties(input.templates, input.typeIds).map(property => property.name))
  );
};

const pruneUnavailableFilters = (input: {
  filters: LibraryFiltersState;
  andFilters: string[];
  templates: FilterableTemplate[];
  aggregations: LibraryAggregations;
}) =>
  pruneToNames(
    input.filters,
    input.andFilters,
    new Set(
      visibleFilterProperties(input.templates, input.filters.type ?? [], input.aggregations).map(
        property => property.name
      )
    )
  );

const sameLibraryFilterCriteria = (
  current: { filters: LibraryFiltersState; andFilters: string[] },
  next: { filters: LibraryFiltersState; andFilters?: string[] | null }
) =>
  serializeCompactFilters(normalizeFilters(current.filters)) ===
    serializeCompactFilters(normalizeFilters(next.filters)) &&
  serializeAndFilters(current.andFilters) === serializeAndFilters(next.andFilters ?? []);

export { pruneLibraryFilters, pruneUnavailableFilters, sameLibraryFilterCriteria };
