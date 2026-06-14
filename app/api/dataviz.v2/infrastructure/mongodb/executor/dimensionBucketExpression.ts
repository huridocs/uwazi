import type { DimensionSpec } from '#shared/types/datavizSchema.js';
import { dimensionFieldExpression } from './relationshipDimensionFields.js';

const DATE_PROPERTY_TYPES = new Set<DimensionSpec['propertyType']>(['date', 'multidate']);

const toUtcDateExpression = (field: object | string) => ({
  $toDate: { $multiply: [field, 1000] },
});

const dimensionBucketExpression = (dim: DimensionSpec): object | string => {
  const field = dimensionFieldExpression(dim);

  if (!DATE_PROPERTY_TYPES.has(dim.propertyType)) {
    return field;
  }

  const interval = dim.dateInterval ?? 'year';
  const dateExpr = toUtcDateExpression(field);

  if (interval === 'year') {
    return { $year: { date: dateExpr, timezone: 'UTC' } };
  }

  if (interval === 'month') {
    return {
      $dateToString: { format: '%Y-%m', date: dateExpr, timezone: 'UTC' },
    };
  }

  return field;
};

export { dimensionBucketExpression };
