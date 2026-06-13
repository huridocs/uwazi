import { getSupportedChartTypes } from '../getSupportedChartTypes.js';

const twoDimensions = [
  { property: 'country', propertyType: 'select' as const },
  { property: 'sexo', propertyType: 'select' as const },
];

const countMeasure = [{ aggregation: 'count' as const }];

describe('getSupportedChartTypes', () => {
  it('should enable cross-tab friendly charts and disable single-dimension bars for two dimensions', () => {
    const availability = getSupportedChartTypes(twoDimensions, countMeasure);
    const byType = Object.fromEntries(availability.map(item => [item.type, item]));

    expect(byType.stacked_bar?.enabled).toBe(true);
    expect(byType.heatmap?.enabled).toBe(true);
    expect(byType.list?.enabled).toBe(true);
    expect(byType.bar?.enabled).toBe(false);
    expect(byType.horizontal_bar?.enabled).toBe(false);
    expect(byType.treemap).toBeUndefined();
  });
});
