import { buildMeasureGroupAccumulator } from '#api/dataviz.v2/infrastructure/mongodb/executor/measureFieldExpression.js';

describe('measureFieldExpression', () => {
  it('should count entities by default', () => {
    expect(buildMeasureGroupAccumulator({ aggregation: 'count', countMode: 'all' })).toEqual({
      count: { $sum: 1 },
    });
  });

  it('should aggregate numeric measure fields', () => {
    expect(
      buildMeasureGroupAccumulator({
        aggregation: 'max',
        property: 'engine_size',
        propertyType: 'numeric',
      })
    ).toEqual({
      count: { $max: { $arrayElemAt: ['$metadata.engine_size.value', 0] } },
    });
  });
});
