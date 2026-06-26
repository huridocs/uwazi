import { buildPreviewFetchKey } from '../buildPreviewFetchKey.js';

describe('buildPreviewFetchKey', () => {
  it('should change when query content changes', () => {
    const baseQuery = {
      sources: [{ templateId: 'tpl_a' }],
      dimensions: [{ property: 'colors', propertyType: 'select' as const }],
      measures: [{ aggregation: 'count' as const, countMode: 'all' as const }],
    };

    const keyA = buildPreviewFetchKey('dv_1', baseQuery);
    const keyB = buildPreviewFetchKey('dv_1', {
      ...baseQuery,
      filters: [
        {
          id: 'year-filter',
          property: 'year',
          propertyType: 'numeric',
          operator: 'gte' as const,
          value: 2020,
        },
      ],
    });

    expect(keyA).not.toBe(keyB);
  });

  it('should stay stable for equivalent query objects', () => {
    const query = {
      sources: [{ templateId: 'tpl_a' }],
      dimensions: [],
      measures: [{ aggregation: 'count' as const, countMode: 'all' as const }],
    };

    expect(buildPreviewFetchKey('dv_1', query)).toBe(buildPreviewFetchKey('dv_1', { ...query }));
  });
});
