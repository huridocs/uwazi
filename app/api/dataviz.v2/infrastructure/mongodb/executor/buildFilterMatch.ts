import type { DatavizFilter, DatavizSource } from '#shared/types/datavizSchema.js';

const metadataPath = (property: string) => `metadata.${property}`;

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
  (filters ?? []).filter(filter => filter.property && filterAppliesToSource(filter, source, sourceIndex));

export const buildFilterMatch = (filters: DatavizFilter[] = []): object[] => {
  return filters.map(filter => {
    const path = metadataPath(filter.property);

    switch (filter.operator) {
      case 'eq':
        return { [`${path}.value`]: filter.value };
      case 'in':
        return { [`${path}.value`]: { $in: filter.values ?? [] } };
      case 'gte':
        return { [`${path}.value`]: { $gte: filter.value } };
      case 'lte':
        return { [`${path}.value`]: { $lte: filter.value } };
      case 'between':
        return {
          [`${path}.value`]: { $gte: filter.from, $lte: filter.to },
        };
      case 'contains':
        return { [`${path}.value`]: { $regex: filter.value, $options: 'i' } };
      default:
        return {};
    }
  });
};
