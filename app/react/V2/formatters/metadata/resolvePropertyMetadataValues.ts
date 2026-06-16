import type { Entity } from '#V2/api/entities/types.js';
import type { BaseMetadataProperty, MetadataValue } from '../types.js';

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

const resolvePropertyMetadataValues = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): MetadataValue[] => {
  const metadataValues = (metadata?.[property.name] ?? []) as MetadataValue[];

  if (property.type === 'relationship' && property.inherited) {
    const inheritedRelationship = resolveInheritedRelationship(
      metadataValues,
      property.inheritedType
    );

    return inheritedRelationship.values;
  }

  return metadataValues;
};

const resolvePropertyType = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): BaseMetadataProperty['type'] => {
  if (property.type !== 'relationship' || !property.inherited) {
    return property.type;
  }

  const metadataValues = (metadata?.[property.name] ?? []) as MetadataValue[];

  if (metadataValues.length > 0 && !hasInheritedChildren(metadataValues)) {
    return 'relationship';
  }

  const inheritedRelationship = resolveInheritedRelationship(
    metadataValues,
    property.inheritedType
  );

  return (inheritedRelationship.inheritedType || property.type) as BaseMetadataProperty['type'];
};

export { resolvePropertyMetadataValues, resolvePropertyType };
