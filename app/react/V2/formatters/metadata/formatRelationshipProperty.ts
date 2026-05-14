import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty, RelationshipMetadataProperty } from '../types';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

type MetadataValue = {
  value?: unknown;
  label?: string;
  authorized?: false;
  icon?: { _id?: string; label?: string } | string;
};

const mapRelationshipValue = (metadataValue: MetadataValue) => {
  const icon =
    metadataValue?.icon && typeof metadataValue.icon === 'object' ? metadataValue.icon : undefined;

  return {
    _id: String(metadataValue?.value || ''),
    title: metadataValue?.label || '',
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

const formatRelationshipProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): RelationshipMetadataProperty | null => {
  if (property.type !== 'relationship') {
    return null;
  }

  const resolvedValues = resolvePropertyMetadataValues(property, metadata);
  const type = resolvePropertyType(property, metadata);

  if (property.inherited && type !== 'relationship') {
    return null;
  }

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: 'relationship',
    mode: 'related',
    values: (resolvedValues as MetadataValue[]).map(mapRelationshipValue),
    inherited: property.inherited,
    inheritedType: property.inheritedType,
    ...(property.relationShipTarget && { relationShipTarget: property.relationShipTarget }),
  };
};

export { formatRelationshipProperty };
