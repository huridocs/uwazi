import { ClientThesaurus, Template } from '#app/apiResponseTypes.js';
import type { LibraryAggregations, LibraryFacetBucket } from '#shared/types/librarySearch.js';

type ChipParts = {
  propertyLabel: string;
  propertyContext?: string;
  valueLabel: string;
  valueContext?: string;
  translateValue: boolean;
};

const findProperty = (templates: Template[], name: string) => {
  const properties = templates.flatMap(template => [
    ...(template.commonProperties ?? []),
    ...(template.properties ?? []),
  ]);
  const direct = properties.find(property => property.name === name);
  if (direct) {
    return direct;
  }
  const separator = name.indexOf('.');
  if (separator < 1) {
    return undefined;
  }
  return properties.find(property => property.name === name.slice(0, separator));
};

const nestedGroupKey = (name: string, propertyName: string) =>
  name.startsWith(`${propertyName}.`) ? name.slice(propertyName.length + 1) : undefined;

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
  const aggregationKey = property?.name ?? key;
  const fromAggregation = aggregationValueLabel(aggregations?.properties?.[aggregationKey], value);
  if (fromAggregation) {
    return {
      propertyLabel: property?.label ?? key,
      propertyContext: property?._id || property?.name,
      valueLabel: fromAggregation,
      translateValue: false,
    };
  }

  const group = property ? nestedGroupKey(key, property.name) : undefined;
  if (group && value === 'any') {
    return {
      propertyLabel: property?.label ?? key,
      propertyContext: property?._id || property?.name,
      valueLabel: group,
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
