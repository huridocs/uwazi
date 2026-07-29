import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty, RelationshipMetadataProperty } from '../types';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

type MetadataValue = {
  value?: unknown;
  label?: string;
  type?: string;
  authorized?: false;
  icon?: { _id?: string; label?: string } | string;
};

const mapRelationshipValue = (metadataValue: MetadataValue) => {
  const icon =
    metadataValue?.icon && typeof metadataValue.icon === 'object' ? metadataValue.icon : undefined;
  const templateId =
    typeof metadataValue?.type === 'string' &&
    metadataValue.type !== 'entity' &&
    metadataValue.type !== 'relationship' &&
    metadataValue.type !== 'newRelationship'
      ? metadataValue.type
      : undefined;

  return {
    _id: String(metadataValue?.value || ''),
    title: metadataValue?.label || '',
    ...(templateId && { templateId }),
    ...(typeof metadataValue?.authorized === 'boolean' && {
      authorized: metadataValue.authorized,
    }),
    ...(icon &&
      icon._id && {
        icon: {
          _id: icon._id,
          ...(icon.label && { label: icon.label }),
        },
      }),
  };
};

const isRelationshipLike = (t: BaseMetadataProperty['type']) =>
  t === 'relationship' || t === 'newRelationship';

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
  return toRelationshipProperty(property, (metadata?.[property.name] ?? []) as MetadataValue[]);
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

  return toRelationshipProperty(property, resolvedValues as MetadataValue[]);
};

export { formatRelationshipProperty, formatRelationshipLinks };
