import type { DatavizFilter, DatavizSource } from '#shared/types/datavizSchema.js';

const metadataPath = (property: string) => `metadata.${property}`;

const coerceNumericBound = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const filterBound = (
  filter: DatavizFilter,
  bound: 'from' | 'to' | 'value'
): string | number | undefined => {
  const raw =
    bound === 'from'
      ? filter.from ?? filter.value
      : bound === 'to'
        ? filter.to ?? filter.value
        : filter.value;

  if (filter.propertyType === 'numeric') {
    return coerceNumericBound(raw);
  }

  return raw;
};

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
        return { [`${path}.value`]: filterBound(filter, 'value') };
      case 'ne':
        return { [`${path}.value`]: { $ne: filterBound(filter, 'value') } };
      case 'in':
        return { [`${path}.value`]: { $in: filter.values ?? [] } };
      case 'nin':
        return { [`${path}.value`]: { $nin: filter.values ?? [] } };
      case 'gte':
        return { [`${path}.value`]: { $gte: filterBound(filter, 'from') } };
      case 'lte':
        return { [`${path}.value`]: { $lte: filterBound(filter, 'to') } };
      case 'between':
        return {
          [`${path}.value`]: {
            $gte: filterBound(filter, 'from'),
            $lte: filterBound(filter, 'to'),
          },
        };
      case 'contains':
        return { [`${path}.value`]: { $regex: filter.value, $options: 'i' } };
      default:
        return {};
    }
  });
};
