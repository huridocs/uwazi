import { Dataviz } from '../Dataviz.js';
import { DatavizInvalidQueryError } from '../errors.js';

const validBase = {
  id: 'dv_1',
  name: 'Cars by color',
  query: {
    sources: [{ templateId: '507f1f77bcf86cd799439011' }],
    dimensions: [{ property: 'color', propertyType: 'select' as const }],
    measures: [{ aggregation: 'count' as const }],
  },
  chart: { type: 'pie' as const },
  appearance: { colorMode: 'from_data' as const },
  refresh: { refreshMode: 'live' as const },
};

describe('Dataviz', () => {
  it('should require dimensions when measure is not a count', () => {
    expect(
      () =>
        new Dataviz({
          id: 'dv_invalid',
          name: 'Untitled visualization',
          query: {
            sources: [{ templateId: '507f1f77bcf86cd799439011' }],
            dimensions: [],
            measures: [{ aggregation: 'sum', property: 'price', propertyType: 'numeric' }],
          },
          chart: { type: 'metric' },
          appearance: { colorMode: 'from_data' },
          refresh: { refreshMode: 'live' },
        })
    ).toThrow(DatavizInvalidQueryError);
  });

  it('should allow metric count queries without dimensions', () => {
    expect(
      () =>
        new Dataviz({
          id: 'dv_metric',
          name: 'Entity total',
          query: {
            sources: [{ templateId: '507f1f77bcf86cd799439011' }],
            dimensions: [],
            measures: [{ aggregation: 'count', countMode: 'all' }],
          },
          chart: { type: 'metric' },
          appearance: { colorMode: 'theme' },
          refresh: { refreshMode: 'live' },
        })
    ).not.toThrow();
  });

  it('should allow dataviz when chart type does not match query shape', () => {
    expect(
      () =>
        new Dataviz({
          ...validBase,
          query: {
            sources: [{ templateId: '507f1f77bcf86cd799439011' }],
            dimensions: [{ property: 'date', propertyType: 'date' }],
            measures: [{ aggregation: 'count' }],
          },
          chart: { type: 'pie' },
        })
    ).not.toThrow();
  });
});
