import type { DimensionSpec, PropertyTypeForDataviz } from '#shared/types/datavizSchema.js';

const NUMERIC_PROPERTY_TYPES = new Set<PropertyTypeForDataviz>(['numeric']);

const DATE_LIKE_PROPERTY_TYPES = new Set<PropertyTypeForDataviz>([
  'date',
  'multidate',
  'daterange',
  'multidaterange',
]);

/** Temporarily disabled until multi-value date fields are supported end-to-end. */
const DIMENSION_DISABLED_PROPERTY_TYPES = new Set<PropertyTypeForDataviz>([
  'multidate',
  'daterange',
  'multidaterange',
]);

const isNumericPropertyType = (type?: PropertyTypeForDataviz): boolean =>
  Boolean(type && NUMERIC_PROPERTY_TYPES.has(type));

const isDateLikePropertyType = (type?: PropertyTypeForDataviz): boolean =>
  Boolean(type && DATE_LIKE_PROPERTY_TYPES.has(type));

const isDimensionPropertyTypeEnabled = (type?: string): boolean =>
  Boolean(type && !DIMENSION_DISABLED_PROPERTY_TYPES.has(type as PropertyTypeForDataviz));

const getDefaultDimensionSort = (
  propertyType?: PropertyTypeForDataviz
): NonNullable<DimensionSpec['sort']> => {
  if (
    propertyType &&
    (isNumericPropertyType(propertyType) || isDateLikePropertyType(propertyType))
  ) {
    return 'key_asc';
  }
  return 'count_desc';
};

export {
  isNumericPropertyType,
  isDateLikePropertyType,
  isDimensionPropertyTypeEnabled,
  getDefaultDimensionSort,
  DIMENSION_DISABLED_PROPERTY_TYPES,
};
