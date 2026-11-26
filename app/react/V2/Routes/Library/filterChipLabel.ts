import { ClientThesaurus, Template } from '#app/apiResponseTypes.js';
import type { LibraryAggregations, LibraryFacetBucket } from '#shared/types/librarySearch.js';

type ChipParts = {
  propertyLabel: string;
  propertyContext?: string;
  valueLabel: string;
  valueContext?: string;
  translateValue: boolean;
};

type ChipProperty = {
  type: string;
  content?: string;
  label?: string;
  name: string;
  templateId?: string;
};

const propertiesOf = (template: Template) => [
  ...(template.commonProperties ?? []),
  ...(template.properties ?? []),
];

const namedProperty = (templates: Template[], name: string): ChipProperty | undefined =>
  templates.reduce<ChipProperty | undefined>((found, template) => {
    if (found) {
      return found;
    }
    const property = propertiesOf(template).find(item => item.name === name);
    if (!property) {
      return undefined;
    }
    return {
      type: property.type,
      ...(property.content ? { content: property.content } : {}),
      label: property.label,
      name: property.name,
      templateId: template._id,
    };
  }, undefined);

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

const THESAURUS_PROPERTY_TYPES = new Set(['select', 'multiselect', 'nested']);

const propertyContext = (property: ChipProperty | undefined) =>
  property?.templateId || property?.name;

const thesaurusContent = (property: ChipProperty | undefined) =>
  property?.content && THESAURUS_PROPERTY_TYPES.has(property.type) ? property.content : undefined;

const aggregationChip = (
  property: ChipProperty | undefined,
  key: string,
  valueLabel: string
): ChipParts => {
  const content = thesaurusContent(property);
  return {
    propertyLabel: property?.label ?? key,
    propertyContext: propertyContext(property),
    valueLabel,
    ...(content ? { valueContext: content } : {}),
    translateValue: Boolean(content),
  };
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

type ChipSources = {
  templates: Template[];
  aggregations?: LibraryAggregations;
  thesauri?: ClientThesaurus[];
  typeIds?: string[];
};

const templatesInScope = (templates: Template[], typeIds: string[] | undefined) => {
  const selected = (typeIds ?? []).filter(Boolean);
  if (!selected.length) {
    return templates;
  }
  const scoped = templates.filter(template => selected.includes(template._id));
  return scoped.length ? scoped : templates;
};

const propertyNamed = (templates: Template[], name: string) => {
  const direct = namedProperty(templates, name);
  if (direct) {
    return direct;
  }
  const separator = name.indexOf('.');
  return separator < 1 ? undefined : namedProperty(templates, name.slice(0, separator));
};

const findProperty = (templates: Template[], name: string, typeIds?: string[]) => {
  const scoped = templatesInScope(templates, typeIds);
  const match = propertyNamed(scoped, name);
  if (match || scoped === templates) {
    return match;
  }
  return propertyNamed(templates, name);
};

const statusChip = (value: string): ChipParts => ({
  propertyLabel: 'Status',
  valueLabel: value === 'restricted' ? 'Restricted' : 'Published',
  translateValue: true,
});

const typeChip = (value: string, templates: Template[]): ChipParts => {
  const template = templates.find(item => item._id === value);
  return {
    propertyLabel: 'Type',
    valueLabel: template?.name ?? value,
    valueContext: template?._id,
    translateValue: true,
  };
};

const anyGroupChip = (
  property: ChipProperty | undefined,
  key: string,
  group: string
): ChipParts => ({
  propertyLabel: property?.label ?? key,
  propertyContext: propertyContext(property),
  valueLabel: group,
  translateValue: false,
});

const thesaurusFallbackChip = (
  property: ChipProperty | undefined,
  key: string,
  source: { value: string; thesauri: ClientThesaurus[] }
): ChipParts => {
  const fromThesaurus =
    property?.content && thesaurusValueLabel(source.thesauri, property.content, source.value);
  return {
    propertyLabel: property?.label ?? key,
    propertyContext: propertyContext(property),
    valueLabel: fromThesaurus || source.value,
    valueContext: property?.content,
    translateValue: Boolean(fromThesaurus),
  };
};

const propertyChip = (key: string, value: string, sources: ChipSources): ChipParts => {
  const property = findProperty(sources.templates, key, sources.typeIds);
  const aggregationKey = property?.name ?? key;
  const fromAggregation = aggregationValueLabel(
    sources.aggregations?.properties?.[aggregationKey],
    value
  );
  if (fromAggregation) {
    return aggregationChip(property, key, fromAggregation);
  }
  const group = property ? nestedGroupKey(key, property.name) : undefined;
  if (group && value === 'any') {
    return anyGroupChip(property, key, group);
  }
  return thesaurusFallbackChip(property, key, { value, thesauri: sources.thesauri ?? [] });
};

const resolveFilterChipParts = (key: string, value: string, sources: ChipSources): ChipParts => {
  if (key === 'status') {
    return statusChip(value);
  }
  if (key === 'type') {
    return typeChip(value, sources.templates);
  }
  return propertyChip(key, value, sources);
};

const templateContextForProperty = (templates: Template[], name: string, typeIds?: string[]) =>
  findProperty(templates, name, typeIds)?.templateId;

export { resolveFilterChipParts, templateContextForProperty };
export type { ChipParts };
