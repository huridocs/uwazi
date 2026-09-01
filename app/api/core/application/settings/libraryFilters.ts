import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { SettingsFilterSchema } from '#shared/types/settingsType.js';

const removeTemplateFromFilters = (
  filters: SettingsFilterSchema[],
  templateId: ObjectIdSchema
): SettingsFilterSchema[] => {
  const filterTemplate = (filter: SettingsFilterSchema) => filter.id !== templateId;
  return filters.filter(filterTemplate).map(filter => {
    if (filter.items) {
      return { ...filter, items: removeTemplateFromFilters(filter.items, templateId) };
    }
    return filter;
  });
};

const renameFilter = (
  filters: SettingsFilterSchema[],
  filterId: ObjectIdSchema,
  name: string
): SettingsFilterSchema[] | undefined => {
  if (!filters.some(filter => filter.id === filterId)) {
    return undefined;
  }

  return filters.map(filter => (filter.id === filterId ? { ...filter, name } : filter));
};

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

const toReadableFilters = toPersistableFilters;

export { removeTemplateFromFilters, renameFilter, toPersistableFilters, toReadableFilters };
