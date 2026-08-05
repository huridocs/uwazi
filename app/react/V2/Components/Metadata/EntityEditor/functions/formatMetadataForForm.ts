import type { MetadataObjectSchema, PropertySchema } from '#shared/types/commonTypes.js';
import { propertyTypes } from '#shared/propertyTypes.js';
import { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';

type FormMetadataProperty = {
  _id: string;
  type: PropertySchema['type'];
  name: string;
  label: string;
  required?: boolean;
  content?: string;
  relationType?: string;
  style?: string;
  inherited?: boolean;
  inheritedType?: MetadataValue['inheritedType'];
  inherit?: { property?: string; type?: MetadataValue['inheritedType'] };
};

const PROPERTY_TYPES = new Set<string>(Object.values(propertyTypes));

const isInheritedType = (value: unknown): value is NonNullable<MetadataValue['inheritedType']> =>
  typeof value === 'string' && PROPERTY_TYPES.has(value);

const toFormMetadataValue = (entry: MetadataObjectSchema): MetadataValue => ({
  value: entry.value,
  ...(typeof entry.label === 'string' ? { label: entry.label } : {}),
  ...(entry.parent ? { parent: entry.parent } : {}),
  ...(typeof entry.type === 'string' ? { type: entry.type } : {}),
  ...(entry.icon !== undefined ? { icon: entry.icon } : {}),
  ...(typeof entry.color === 'string' ? { color: entry.color } : {}),
  ...(entry.authorized === false ? { authorized: false } : {}),
  ...(isInheritedType(entry.inheritedType) ? { inheritedType: entry.inheritedType } : {}),
  ...(entry.inheritedValue
    ? { inheritedValue: entry.inheritedValue.map(toFormMetadataValue) }
    : {}),
});

const formatMetadataForForm = (
  templateProperties: FormMetadataProperty[],
  entityMetadata?: Entity['metadata']
): Record<string, MetadataValue[]> =>
  templateProperties.reduce<Record<string, MetadataValue[]>>((acc, property) => {
    acc[property.name] = (entityMetadata?.[property.name] ?? []).map(toFormMetadataValue);
    return acc;
  }, {});

export { formatMetadataForForm };
export type { FormMetadataProperty };
