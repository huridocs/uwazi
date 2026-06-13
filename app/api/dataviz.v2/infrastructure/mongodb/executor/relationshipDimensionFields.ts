import type { DimensionSpec } from '#shared/types/datavizSchema.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';
import { isRelationshipDimension } from '#shared/dataviz/relationshipDimension.js';

const metadataPath = (property: string) => `metadata.${property}`;

const inheritedValueField = (property: string): object => ({
  $let: {
    vars: {
      inherited: `$${metadataPath(property)}.inheritedValue`,
    },
    in: {
      $cond: {
        if: { $isArray: '$$inherited' },
        then: { $arrayElemAt: ['$$inherited.value', 0] },
        else: '$$inherited.value',
      },
    },
  },
});

const relationshipDimensionField = (dim: DimensionSpec): object | string => {
  if (dim.relationshipMode === 'related_entity') {
    return `$${metadataPath(dim.property)}.value`;
  }

  if (dim.relationshipMode === 'inherited') {
    if (dim.propertyType === 'multiselect') {
      return `$${metadataPath(dim.property)}.inheritedValue.value`;
    }
    return inheritedValueField(dim.property);
  }

  return inheritedValueField(dim.property);
};

const dimensionFieldExpression = (dim: DimensionSpec): object | string => {
  if (dim.property === TEMPLATE_DIMENSION_PROPERTY) {
    return '$template';
  }

  if (isRelationshipDimension(dim)) {
    return relationshipDimensionField(dim);
  }

  if (dim.propertyType === 'multiselect') {
    return `$${metadataPath(dim.property)}.value`;
  }

  return { $arrayElemAt: [`$${metadataPath(dim.property)}.value`, 0] };
};

export { dimensionFieldExpression, metadataPath };
