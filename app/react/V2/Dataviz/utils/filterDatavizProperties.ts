import type { ClientPropertySchema } from '#app/istore.js';
import { isDimensionPropertyTypeEnabled } from '#shared/dataviz/dimensionPropertyTypes.js';

const RELATIONSHIP_TYPES = new Set(['relationship', 'newRelationship']);

const EXCLUDED_PROPERTY_TYPES = new Set([
  'text',
  'markdown',
  'media',
  'image',
  'preview',
  'link',
  'geolocation',
  'generatedid',
  'nested',
]);

export const isDatavizPropertyType = (type: string): boolean => !EXCLUDED_PROPERTY_TYPES.has(type);

const isDimensionPropertyEnabled = (property: ClientPropertySchema): boolean => {
  if (!isDatavizPropertyType(property.type)) {
    return false;
  }

  if (!isDimensionPropertyTypeEnabled(property.type)) {
    return false;
  }

  if (
    RELATIONSHIP_TYPES.has(property.type) &&
    property.inherit?.type &&
    !isDimensionPropertyTypeEnabled(property.inherit.type)
  ) {
    return false;
  }

  return true;
};

export const filterDatavizProperties = (
  properties: ClientPropertySchema[] = []
): ClientPropertySchema[] => properties.filter(isDimensionPropertyEnabled);
