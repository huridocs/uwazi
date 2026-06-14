import type { ClientPropertySchema } from '#app/istore.js';
import type { DimensionSpec, PropertyTypeForDataviz } from '#V2/Dataviz/types/definition.js';
import { isInheritableRelationshipType } from '#shared/dataviz/relationshipDimension.js';

const RELATIONSHIP_TYPES = new Set(['relationship', 'newRelationship']);

const toDatavizPropertyType = (type: string): PropertyTypeForDataviz | null => {
  const allowed: PropertyTypeForDataviz[] = [
    'select',
    'multiselect',
    'numeric',
    'date',
    'daterange',
    'multidate',
    'multidaterange',
    'generatedid',
  ];
  return allowed.includes(type as PropertyTypeForDataviz)
    ? (type as PropertyTypeForDataviz)
    : null;
};

const defaultDimensionOptions = (
  property: string,
  propertyType: PropertyTypeForDataviz,
  sourceAlias?: string
): DimensionSpec => ({
  sourceAlias,
  property,
  propertyType,
  bucketStrategy: propertyType === 'date' ? 'date_histogram' : 'terms',
  ...(propertyType === 'date' ? { dateInterval: 'year' as const } : {}),
  sort: propertyType === 'date' || propertyType === 'numeric' ? 'key_asc' : 'count_desc',
  maxBuckets: 10,
});

const buildDimensionFromProperty = (
  prop: ClientPropertySchema,
  sourceAlias?: string
): DimensionSpec | null => {
  if (RELATIONSHIP_TYPES.has(prop.type)) {
    const inheritedType = prop.inherit?.type;

    if (inheritedType && isInheritableRelationshipType(inheritedType)) {
      const propertyType = toDatavizPropertyType(inheritedType);
      if (!propertyType) {
        return null;
      }

      return {
        ...defaultDimensionOptions(prop.name, propertyType, sourceAlias),
        relationshipMode: 'inherited',
      };
    }

    return {
      ...defaultDimensionOptions(prop.name, 'select', sourceAlias),
      relationshipMode: 'related_entity',
    };
  }

  const propertyType = toDatavizPropertyType(prop.type);
  if (!propertyType) {
    return null;
  }

  return defaultDimensionOptions(prop.name, propertyType, sourceAlias);
};

export { buildDimensionFromProperty };
