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

export { removeTemplateFromFilters, renameFilter };
