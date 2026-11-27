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

type ChipSource = {
  key: string;
  value: string;
  templates: Template[];
  aggregations?: LibraryAggregations;
  thesauri?: ClientThesaurus[];
};

const labeled = (
  propertyLabel: string,
  valueLabel: string,
  extra: Partial<ChipParts> = {}
): ChipParts => ({
  propertyLabel,
  valueLabel,
  translateValue: false,
  ...extra,
});

const permissionChip = (
  key: string,
  value: string,
  aggregations?: LibraryAggregations
): ChipParts | undefined => {
  if (key !== 'permissions.read' && key !== 'permissions.write') {
    return undefined;
  }
  const level = key === 'permissions.write' ? 'write' : 'read';
  const bucket = aggregations?.permissions?.[level]?.find(item => item.id === value);
  return labeled(level === 'write' ? 'Can edit' : 'Can view', bucket?.label || value);
};

const statusChip = (key: string, value: string): ChipParts | undefined => {
  if (key !== 'status') {
    return undefined;
  }
  return labeled('Status', value === 'restricted' ? 'Restricted' : 'Published', {
    translateValue: true,
  });
};

const typeChip = (key: string, value: string, templates: Template[]): ChipParts | undefined => {
  if (key !== 'type') {
    return undefined;
  }
  const template = templates.find(item => item._id === value);
  return labeled('Type', template?.name ?? value, {
    valueContext: template?._id,
    translateValue: true,
  });
};

const propertyChip = ({
  key,
  value,
  templates,
  aggregations,
  thesauri = [],
}: ChipSource): ChipParts => {
  const property = findProperty(templates, key);
  const fromAggregation = aggregationValueLabel(
    aggregations?.properties?.[property?.name ?? key],
    value
  );
  if (fromAggregation) {
    return labeled(property?.label ?? key, fromAggregation, {
      propertyContext: property?._id || property?.name,
    });
  }
  const group = property ? nestedGroupKey(key, property.name) : undefined;
  if (group && value === 'any') {
    return labeled(property?.label ?? key, group, {
      propertyContext: property?._id || property?.name,
    });
  }
  const fromThesaurus = property?.content && thesaurusValueLabel(thesauri, property.content, value);
  return labeled(property?.label ?? key, fromThesaurus || value, {
    propertyContext: property?._id || property?.name,
    valueContext: property?.content,
    translateValue: Boolean(fromThesaurus),
  });
};

const resolveFilterChipParts = (source: ChipSource): ChipParts =>
  permissionChip(source.key, source.value, source.aggregations) ??
  statusChip(source.key, source.value) ??
  typeChip(source.key, source.value, source.templates) ??
  propertyChip(source);

export { resolveFilterChipParts };
export type { ChipParts };
