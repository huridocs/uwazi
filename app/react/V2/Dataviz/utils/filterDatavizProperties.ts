import type { ClientPropertySchema } from '#app/istore.js';

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
  'relationship',
  'newRelationship',
]);

export const isDatavizPropertyType = (type: string): boolean =>
  !EXCLUDED_PROPERTY_TYPES.has(type);

export const filterDatavizProperties = (
  properties: ClientPropertySchema[] = []
): ClientPropertySchema[] => properties.filter(p => isDatavizPropertyType(p.type));
