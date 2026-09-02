import type { Template } from '#app/apiResponseTypes.js';
import comonProperties from '#shared/commonProperties.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';

const filterableProperties = (templates: Template[], typeIds: string[] = []): PropertySchema[] => {
  const selected = typeIds.filter(Boolean);
  if (selected.length) {
    return comonProperties.comonFilters(templates, selected);
  }
  return comonProperties.defaultFilters(templates);
};

export { filterableProperties };
