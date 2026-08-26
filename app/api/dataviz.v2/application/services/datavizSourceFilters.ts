import { DatavizFilter, DatavizSource } from '#shared/types/datavizSchema.js';

/** Whether a filter targets the given source (by alias, or global when no alias is set). */
export const filterAppliesToSource = (
  filter: DatavizFilter,
  source: DatavizSource,
  sourceIndex: number
): boolean => {
  if (!filter.sourceAlias) {
    return true;
  }

  if (source.alias) {
    return filter.sourceAlias === source.alias;
  }

  return sourceIndex === 0 && filter.sourceAlias === '';
};

export const filtersForSource = (
  filters: DatavizFilter[] | undefined,
  source: DatavizSource,
  sourceIndex: number
): DatavizFilter[] =>
  (filters ?? []).filter(
    filter => filter.property && filterAppliesToSource(filter, source, sourceIndex)
  );

export const mergeSourceFilters = (
  queryFilters: DatavizFilter[] | undefined,
  externalFilters: DatavizFilter[] | undefined,
  source: DatavizSource,
  sourceIndex: number
): DatavizFilter[] => [
  ...filtersForSource(queryFilters, source, sourceIndex),
  ...filtersForSource(externalFilters, source, sourceIndex),
];
