import { normalizeLegacyDefinition } from '../normalizeLegacyDefinition.js';

describe('normalizeLegacyDefinition', () => {
  it('should migrate includeMissing from dimensions to chart.showMissingValues', () => {
    const definition = normalizeLegacyDefinition({
      id: '1',
      name: 'Test',
      query: {
        sources: [{ templateId: 'abc' }],
        dimensions: [
          {
            property: 'sexo',
            propertyType: 'select',
            includeMissing: true,
          },
        ],
        measures: [{ aggregation: 'count' }],
      },
      chart: { type: 'bar' },
      appearance: { colorMode: 'from_data' },
      refresh: { refreshMode: 'live' },
    });

    expect(definition.chart.showMissingValues).toBe(true);
    expect(definition.query.dimensions[0]).not.toHaveProperty('includeMissing');
    expect(definition.appearance.colorMode).toBe('theme');
  });
});
