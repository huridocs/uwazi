import { ClientSettingsFilterSchema } from 'app/apiResponseTypes';
import { ClientTemplateSchema } from 'app/istore';

const filterAvailableTemplates = (
  templates: ClientTemplateSchema[],
  filters?: ClientSettingsFilterSchema[]
) => {
  const usedTemplatesIds: string[] = [];

  filters?.forEach(filter => {
    if (filter.items) {
      filter.items.forEach(item => {
        usedTemplatesIds.push(item.id!);
      });
    }
    if (filter.id) {
      usedTemplatesIds.push(filter.id);
    }
  });

  return templates.filter(template => !usedTemplatesIds.includes(template._id));
};

const updateFilters = (selectedTemplatesIds: string[], templates?: ClientTemplateSchema[]) => {
  const newFilters = selectedTemplatesIds.map(templateId => {
    const template = templates?.find(templ => templ._id === templateId);
    return { id: templateId, name: template?.name };
  });
  return newFilters;
};

const deleteFilters = (
  originalFilters?: ClientSettingsFilterSchema[],
  filtersToRemove?: (string | undefined)[]
) => {
  if (!filtersToRemove) {
    return originalFilters;
  }

  return originalFilters
    ?.map(filter => {
      if (filtersToRemove.includes(filter.id!)) {
        return {};
      }

      if (filter.items) {
        const nestedFilters = filter.items.filter(item => !filtersToRemove.includes(item.id!));
        return { ...filter, items: nestedFilters };
      }

      return { ...filter };
    })
    .filter(filter => {
      if (!filter.id) {
        return false;
      }
      if (filter.items && filter.items.length === 0) {
        return false;
      }
      return true;
    });
};

export { filterAvailableTemplates, updateFilters, deleteFilters };
