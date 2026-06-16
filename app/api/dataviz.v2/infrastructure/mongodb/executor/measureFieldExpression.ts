import type { MeasureSpec } from '#shared/types/datavizSchema.js';
import { dimensionFieldExpression } from './relationshipDimensionFields.js';

const measureFieldExpression = (measure: MeasureSpec): object | string | undefined => {
  if (!measure.property) {
    return undefined;
  }

  return dimensionFieldExpression({
    property: measure.property,
    propertyType: measure.propertyType ?? 'numeric',
  });
};

const buildMeasureGroupAccumulator = (measure: MeasureSpec): Record<string, object> => {
  if (measure.aggregation === 'count' || !measure.property) {
    return { count: { $sum: 1 } };
  }

  const field = measureFieldExpression(measure);
  if (!field) {
    return { count: { $sum: 1 } };
  }

  const operator = `$${measure.aggregation}`;
  return { count: { [operator]: field } };
};

export { measureFieldExpression, buildMeasureGroupAccumulator };
