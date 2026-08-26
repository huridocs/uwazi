import { ClientThesaurus, Template } from '#app/apiResponseTypes.js';
import type { LibraryAggregations, LibraryFacetBucket } from '#shared/types/librarySearch.js';

type ChipParts = {
  propertyLabel: string;
  propertyContext?: string;
  valueLabel: string;
  valueContext?: string;
  translateValue: boolean;
};

const findProperty = (templates: Template[], name: string) =>
  templates
    .flatMap(template => [...(template.commonProperties ?? []), ...(template.properties ?? [])])
    .find(property => property.name === name);

const flattenThesaurusValues = (
  values: ClientThesaurus['values'] | undefined
): { id: string; label: string }[] => {
  if (!values) {
    return [];
  }
  return values.flatMap(value => [
    ...(value.id ? [{ id: value.id, label: value.label }] : []),
    ...flattenThesaurusValues(value.values as ClientThesaurus['values'] | undefined),
  ]);
};

const thesaurusValueLabel = (thesauri: ClientThesaurus[], contentId: string, valueId: string) => {
  const thesaurus = thesauri.find(item => item._id === contentId);
  if (!thesaurus) {
    return undefined;
  }
  return flattenThesaurusValues(thesaurus.values).find(value => value.id === valueId)?.label;
};

const aggregationValueLabel = (
  buckets: LibraryFacetBucket[] | undefined,
  value: string
): string | undefined => {
  if (!buckets) {
    return undefined;
  }
  const match = buckets.find(bucket => bucket.id === value);
  if (match?.label) {
    return match.label;
  }
  return buckets.reduce<string | undefined>((found, bucket) => {
    if (found) {
      return found;
    }
    return aggregationValueLabel(bucket.values, value);
  }, undefined);
};

const resolveFilterChipParts = (
  key: string,
  value: string,
  templates: Template[],
  aggregations?: LibraryAggregations,
  thesauri: ClientThesaurus[] = []
): ChipParts => {
  if (key === 'status') {
    return {
      propertyLabel: 'Status',
      valueLabel: value === 'restricted' ? 'Restricted' : 'Published',
      translateValue: true,
    };
  }

  if (key === 'type') {
    const template = templates.find(item => item._id === value);
    return {
      propertyLabel: 'Type',
      valueLabel: template?.name ?? value,
      valueContext: template?._id,
      translateValue: true,
    };
  }

  const property = findProperty(templates, key);
  const fromAggregation = aggregationValueLabel(aggregations?.properties?.[key], value);
  if (fromAggregation) {
    return {
      propertyLabel: property?.label ?? key,
      propertyContext: property?._id || property?.name,
      valueLabel: fromAggregation,
      translateValue: false,
    };
  }

  const fromThesaurus = property?.content && thesaurusValueLabel(thesauri, property.content, value);

  return {
    propertyLabel: property?.label ?? key,
    propertyContext: property?._id || property?.name,
    valueLabel: fromThesaurus || value,
    valueContext: property?.content,
    translateValue: Boolean(fromThesaurus),
  };
};

export { resolveFilterChipParts };
export type { ChipParts };
