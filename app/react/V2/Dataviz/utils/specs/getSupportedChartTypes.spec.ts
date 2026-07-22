import { getSupportedChartTypes } from '../getSupportedChartTypes.js';

const twoDimensions = [
  { property: 'country', propertyType: 'select' as const },
  { property: 'sexo', propertyType: 'select' as const },
];

const numericCrossTab = [
  { property: 'registration_date', propertyType: 'date' as const },
  { property: 'engine_size', propertyType: 'numeric' as const },
];

const sequentialCategoricalCrossTab = [
  { property: 'date_of_birth', propertyType: 'date' as const },
  { property: 'sex', propertyType: 'select' as const },
];

const countMeasure = [{ aggregation: 'count' as const }];
const maxMeasure = [{ aggregation: 'max' as const, countMode: 'all' as const }];

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

  it('should enable line and area for date × select cross-tab', () => {
    const availability = getSupportedChartTypes(sequentialCategoricalCrossTab, countMeasure);
    const byType = Object.fromEntries(availability.map(item => [item.type, item]));

    expect(byType.line?.enabled).toBe(true);
    expect(byType.area?.enabled).toBe(true);
    expect(byType.heatmap?.enabled).toBe(true);
    expect(byType.stacked_bar?.enabled).toBe(true);
    expect(byType.scatter?.enabled).toBe(false);
  });

  it('should enable line and bar for date × numeric cross-tab with value measures', () => {
    const availability = getSupportedChartTypes(numericCrossTab, maxMeasure);
    const byType = Object.fromEntries(availability.map(item => [item.type, item]));

    expect(byType.line?.enabled).toBe(true);
    expect(byType.area?.enabled).toBe(true);
    expect(byType.bar?.enabled).toBe(true);
    expect(byType.scatter?.enabled).toBe(true);
    expect(byType.heatmap?.enabled).toBe(true);
    expect(byType.pie?.enabled).toBe(false);
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
