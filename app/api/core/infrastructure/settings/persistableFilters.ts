import { SettingsFilterSchema } from '#shared/types/settingsType.js';

const omitNestedId = <T extends object>(item: T): Omit<T, '_id'> => {
  const { _id: _nestedId, ...rest } = item as T & { _id?: unknown };
  return rest;
};

const toPersistableFilters = (filters: SettingsFilterSchema[]): SettingsFilterSchema[] =>
  filters.map(filter => {
    const withoutId = omitNestedId(filter);
    if (!withoutId.items) {
      return withoutId;
    }
    return {
      ...withoutId,
      items: withoutId.items.map(item => omitNestedId(item)),
    };
  });

export { toPersistableFilters };
