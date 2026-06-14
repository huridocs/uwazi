import { getSupportedChartTypes } from '../getSupportedChartTypes.js';

const twoDimensions = [
  { property: 'country', propertyType: 'select' as const },
  { property: 'sexo', propertyType: 'select' as const },
];

const numericCrossTab = [
  { property: 'registration_date', propertyType: 'date' as const },
  { property: 'engine_size', propertyType: 'numeric' as const },
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

  it('should enable scatter for date × numeric cross-tab', () => {
    const availability = getSupportedChartTypes(numericCrossTab, countMeasure);
    const byType = Object.fromEntries(availability.map(item => [item.type, item]));

    expect(byType.scatter?.enabled).toBe(true);
    expect(byType.heatmap?.enabled).toBe(true);
    expect(byType.stacked_bar?.enabled).toBe(false);
  });

  it('should enable all editor chart types for manual data', () => {
    const availability = getSupportedChartTypes([], [], { isManual: true });
    const byType = Object.fromEntries(availability.map(item => [item.type, item]));

    expect(availability.every(item => item.enabled)).toBe(true);
    expect(availability).toHaveLength(12);
    expect(byType.bar?.enabled).toBe(true);
    expect(byType.stacked_bar?.enabled).toBe(true);
    expect(byType.heatmap?.enabled).toBe(true);
    expect(byType.scatter?.enabled).toBe(true);
    expect(byType.treemap).toBeUndefined();
  });
});
