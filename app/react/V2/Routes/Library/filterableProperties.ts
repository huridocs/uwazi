import comonProperties from '#shared/commonProperties.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import { filterPropertyType, isDateFilterType } from './filterPropertyType.js';

type FilterableTemplate = {
  _id: string;
  properties?: PropertySchema[];
};

const filterableProperties = (
  templates: FilterableTemplate[],
  typeIds: string[] = []
): PropertySchema[] => {
  const selected = typeIds.filter(Boolean);
  if (selected.length) {
    return comonProperties.comonFilters(templates, selected);
  }
  return comonProperties.defaultFilters(templates);
};

const showsWithoutBuckets = (type: string) =>
  type === 'text' || type === 'markdown' || type === 'numeric' || isDateFilterType(type);

const visibleFilterProperties = (
  templates: FilterableTemplate[],
  typeIds: string[],
  aggregations: LibraryAggregations
) =>
  filterableProperties(templates, typeIds).filter(property => {
    const type = filterPropertyType(property, templates);
    if (showsWithoutBuckets(type)) {
      return true;
    }
    return (aggregations.properties[property.name] ?? []).some(bucket => bucket.count > 0);
  });

export type { FilterableTemplate };
export { filterableProperties, visibleFilterProperties };
