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

const updateFilters = (templates: ClientTemplateSchema[], selectedTemplatesIds: string[]) => {
  const newFilters = selectedTemplatesIds.map(templateId => {
    const template = templates.find(templ => templ._id === templateId);
    return { id: templateId, name: template?.name };
  });
  return newFilters;
};

export { filterAvailableTemplates, updateFilters };
