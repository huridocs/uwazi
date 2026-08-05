import type { Entity, MetadataObjectSchema } from '#V2/api/entities/types.js';
import type {
  BaseMetadataProperty,
  MetadataValue,
  RelationshipMetadataProperty,
} from '../types.js';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const readRelationshipIcon = (icon: unknown): { _id: string; label?: string } | undefined => {
  if (!icon || typeof icon !== 'object') {
    return undefined;
  }
  if (!('_id' in icon)) {
    return undefined;
  }
  const id = icon._id;
  if (typeof id !== 'string' || !id) {
    return undefined;
  }
  const label = 'label' in icon ? readOptionalString(icon.label) : undefined;
  return label ? { _id: id, label } : { _id: id };
};

const mapRelationshipValue = (metadataValue: MetadataValue) => {
  const icon = readRelationshipIcon(metadataValue.icon);
  const type = readOptionalString(metadataValue.type);
  const templateId =
    type && type !== 'entity' && type !== 'relationship' && type !== 'newRelationship'
      ? type
      : undefined;

  return {
    _id: String(metadataValue.value || ''),
    title: metadataValue.label || '',
    ...(templateId && { templateId }),
    ...(metadataValue.authorized === false && { authorized: false as const }),
    ...(icon && { icon }),
  };
};

const isRelationshipLike = (t: BaseMetadataProperty['type']) =>
  t === 'relationship' || t === 'newRelationship';

const toFormatterMetadataValue = (item: MetadataObjectSchema): MetadataValue => {
  const type = readOptionalString(item.type);
  const authorized = item.authorized === false ? (false as const) : undefined;
  return {
    value: item.value,
    label: item.label,
    parent: item.parent,
    ...(type !== undefined && { type }),
    ...(authorized !== undefined && { authorized }),
    icon: item.icon,
  };
};

const resolveLinkMetadataValues = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): MetadataValue[] => {
  const values = metadata?.[property.name];
  if (!values?.length) {
    return [];
  }
  return values.map(toFormatterMetadataValue);
};

const toRelationshipProperty = (
  property: BaseMetadataProperty,
  values: MetadataValue[]
): RelationshipMetadataProperty => ({
  _id: property._id,
  name: property.name,
  label: property.label,
  type: 'relationship',
  mode: 'related',
  values: values.map(mapRelationshipValue),
  inherited: property.inherited,
  inheritedType: property.inheritedType,
  ...(property.relationShipTarget && { relationShipTarget: property.relationShipTarget }),
});

const formatRelationshipLinks = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): RelationshipMetadataProperty | null => {
  if (!isRelationshipLike(property.type)) {
    return null;
  }
  return toRelationshipProperty(property, resolveLinkMetadataValues(property, metadata));
};

const formatRelationshipProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): RelationshipMetadataProperty | null => {
  if (!isRelationshipLike(property.type)) {
    return null;
  }

  const resolvedValues = resolvePropertyMetadataValues(property, metadata);
  const type = resolvePropertyType(property, metadata);

  if (property.inherited && !isRelationshipLike(type)) {
    return null;
  }

  return toRelationshipProperty(property, resolvedValues);
};

export { formatRelationshipProperty, formatRelationshipLinks };
