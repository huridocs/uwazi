import type { Template } from '#app/apiResponseTypes.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';

const DATE_FILTER_TYPES = new Set(['date', 'multidate', 'daterange', 'multidaterange']);
const LIST_FILTER_TYPES = new Set(['select', 'multiselect', 'relationship']);

const filterPropertyType = (property: PropertySchema, templates: Template[] = []): string => {
  if (property.inherit?.type) {
    return property.inherit.type;
  }
  if (property.type === 'newRelationship') {
    if (property.denormalizedProperty) {
      const match = templates
        .flatMap(template => template.properties ?? [])
        .find(candidate => candidate.name === property.denormalizedProperty);
      return match?.type || 'text';
    }
    return 'relationship';
  }
  return property.type;
};

const isDateFilterType = (type: string) => DATE_FILTER_TYPES.has(type);
const isListFilterType = (type: string) => LIST_FILTER_TYPES.has(type);

export {
  DATE_FILTER_TYPES,
  LIST_FILTER_TYPES,
  filterPropertyType,
  isDateFilterType,
  isListFilterType,
};
