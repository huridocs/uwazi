import type { Entity } from '#V2/api/entities/types.js';
import { hasInheritedValues, resolveInheritedValues } from '#V2/shared/resolveInheritedValues.js';
import type { BaseMetadataProperty, MetadataValue } from '../types.js';

const resolveInheritedRelationship = (
  metadataValues: MetadataValue[],
  inheritedType?: BaseMetadataProperty['inheritedType']
) => resolveInheritedValues(metadataValues, inheritedType);

const resolvePropertyMetadataValues = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): MetadataValue[] => {
  const metadataValues = (metadata?.[property.name] ?? []) as MetadataValue[];

  if (property.type === 'relationship' && property.inherited) {
    return resolveInheritedRelationship(metadataValues, property.inheritedType).values;
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

  if (metadataValues.length > 0 && !hasInheritedValues(metadataValues)) {
    return 'relationship';
  }

  const inheritedRelationship = resolveInheritedRelationship(
    metadataValues,
    property.inheritedType
  );

  return (inheritedRelationship.inheritedType || property.type) as BaseMetadataProperty['type'];
};

export { resolveInheritedRelationship, resolvePropertyMetadataValues, resolvePropertyType };
