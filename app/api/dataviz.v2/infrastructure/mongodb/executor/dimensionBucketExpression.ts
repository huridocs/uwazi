import type { DimensionSpec } from '#shared/types/datavizSchema.js';
import { isDateLikePropertyType } from '#shared/dataviz/dimensionPropertyTypes.js';
import { dimensionFieldExpression } from './relationshipDimensionFields.js';

const toUtcDateExpression = (unixSeconds: object | string) => ({
  $toDate: { $multiply: [unixSeconds, 1000] },
});

const dateUnixSecondsExpression = (dim: DimensionSpec, field: object | string): object => {
  if (dim.propertyType === 'daterange' || dim.propertyType === 'multidaterange') {
    return {
      $let: {
        vars: { value: field },
        in: {
          $cond: {
            if: { $eq: [{ $type: '$$value' }, 'object'] },
            then: '$$value.from',
            else: '$$value',
          },
        },
      },
    };
  }

  return field as object;
};

const dimensionBucketExpression = (dim: DimensionSpec): object | string => {
  const field = dimensionFieldExpression(dim);

  if (!isDateLikePropertyType(dim.propertyType)) {
    return field;
  }

  const interval = dim.dateInterval ?? 'year';
  const unixSeconds = dateUnixSecondsExpression(dim, field);
  const dateExpr = toUtcDateExpression(unixSeconds);

  if (interval === 'year') {
    return { $year: { date: dateExpr, timezone: 'UTC' } };
  }

  if (interval === 'month') {
    return {
      $dateToString: { format: '%Y-%m', date: dateExpr, timezone: 'UTC' },
    };
  }

  if (interval === 'week') {
    return {
      $dateToString: { format: '%G-W%V', date: dateExpr, timezone: 'UTC' },
    };
  }

  if (interval === 'computed_years') {
    return {
      $dateDiff: {
        startDate: dateExpr,
        endDate: '$$NOW',
        unit: 'year',
      },
    };
  }

  return unixSeconds;
};

export { dimensionBucketExpression, dateUnixSecondsExpression, toUtcDateExpression };
