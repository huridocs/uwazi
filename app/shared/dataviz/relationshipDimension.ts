import type { DimensionSpec } from '#shared/types/datavizSchema.js';

const INHERITABLE_RELATIONSHIP_TYPES = new Set([
  'select',
  'multiselect',
  'numeric',
  'date',
  'daterange',
  'multidate',
  'multidaterange',
]);

const isRelationshipDimension = (dim: DimensionSpec) =>
  dim.relationshipMode === 'related_entity' || dim.relationshipMode === 'inherited';

const isInheritableRelationshipType = (type: string) => INHERITABLE_RELATIONSHIP_TYPES.has(type);

const dimensionNeedsUnwind = (dim: DimensionSpec) =>
  dim.propertyType === 'multiselect' || isRelationshipDimension(dim);

export {
  INHERITABLE_RELATIONSHIP_TYPES,
  isRelationshipDimension,
  isInheritableRelationshipType,
  dimensionNeedsUnwind,
};
