import { Dataviz } from '../Dataviz.js';
import { DatavizInvalidQueryError } from '../errors.js';

const publishedBase = {
  id: 'dv_1',
  name: 'Cars by color',
  status: 'published' as const,
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
  it('should allow incomplete query configuration for drafts', () => {
    expect(
      () =>
        new Dataviz({
          id: 'dv_draft',
          name: 'Untitled visualization',
          status: 'draft',
          query: {
            sources: [{ templateId: '507f1f77bcf86cd799439011' }],
            dimensions: [],
            measures: [{ aggregation: 'count', countMode: 'all' }],
          },
          chart: { type: 'pie' },
          appearance: { colorMode: 'from_data' },
          refresh: { refreshMode: 'live' },
        })
    ).not.toThrow();
  });

  it('should require dimensions when status is published', () => {
    expect(
      () =>
        new Dataviz({
          ...publishedBase,
          query: {
            ...publishedBase.query,
            dimensions: [],
          },
        })
    ).toThrow(DatavizInvalidQueryError);
  });

  it('should allow published dataviz when chart type does not match query shape', () => {
    expect(
      () =>
        new Dataviz({
          ...publishedBase,
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
