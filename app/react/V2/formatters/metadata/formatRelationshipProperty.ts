import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty, MetadataProperty, RelationshipMetadataProperty } from '../types';

type MetadataValue = {
  value?: unknown;
  label?: string;
  authorized?: false;
  icon?: { _id?: string; label?: string } | string;
  inheritedValue?: MetadataValue[];
  inheritedType?: BaseMetadataProperty['inheritedType'];
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

const getInheritedChildren = (values: MetadataValue[]) =>
  values.flatMap(item => (Array.isArray(item?.inheritedValue) ? item.inheritedValue : []));

const hasInheritedChildren = (values: MetadataValue[]) =>
  values.some(item => Array.isArray(item?.inheritedValue) && item.inheritedValue.length > 0);

const resolveInheritedRelationship = (
  metadataValues: MetadataValue[],
  inheritedType?: BaseMetadataProperty['inheritedType']
) => {
  if (!hasInheritedChildren(metadataValues)) {
    return {
      inheritedType,
      values: metadataValues,
    };
  }

  const nextValues = getInheritedChildren(metadataValues);
  const nextInheritedType = nextValues.find(item => item?.inheritedType)?.inheritedType;

  return resolveInheritedRelationship(nextValues, nextInheritedType || inheritedType);
};

const formatRelationshipProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): RelationshipMetadataProperty | MetadataProperty | null => {
  if (property.type !== 'relationship') {
    return null;
  }

  const metadataValues = (metadata?.[property.name] ?? []) as MetadataValue[];

  if (property.inherited && property.inheritedType) {
    const inheritedRelationship = resolveInheritedRelationship(
      metadataValues,
      property.inheritedType
    );

    return {
      _id: property._id,
      name: property.name,
      label: property.label,
      values: inheritedRelationship.values,
      type: inheritedRelationship.inheritedType,
    } as MetadataProperty;
  }

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: 'relationship',
    mode: 'related',
    values: metadataValues.map(mapRelationshipValue),
    inherited: property.inherited,
    inheritedType: property.inheritedType,
    ...(property.relationShipTarget && { relationShipTarget: property.relationShipTarget }),
  };
};

export { formatRelationshipProperty, resolveInheritedRelationship };
