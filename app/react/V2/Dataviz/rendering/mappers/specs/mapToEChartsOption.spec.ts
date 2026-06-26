import { mapToEChartsOption } from '../index.js';

const simpleManualData = {
  datavizId: 'dv_new',
  generatedAt: '2026-01-01T00:00:00.000Z',
  stale: false,
  meta: { totalEntities: 50, truncated: false },
  series: [
    {
      id: 'main',
      label: 'Series 1',
      points: [
        { key: 'a', label: 'Category A', value: 10 },
        { key: 'b', label: 'Category B', value: 25 },
        { key: 'c', label: 'Category C', value: 15 },
      ],
    },
  ],
};

describe('mapToEChartsOption', () => {
  it('should map bar and pie for simple categorical manual data', () => {
    const appearance = { colorMode: 'theme' as const };

    expect(mapToEChartsOption(simpleManualData, { type: 'bar' }, appearance)).not.toBeNull();
    expect(mapToEChartsOption(simpleManualData, { type: 'pie' }, appearance)).not.toBeNull();
  });

  it('should return null for cross-tab charts without breakdown data', () => {
    const appearance = { colorMode: 'theme' as const };

    expect(mapToEChartsOption(simpleManualData, { type: 'stacked_bar' }, appearance)).toBeNull();
    expect(mapToEChartsOption(simpleManualData, { type: 'heatmap' }, appearance)).toBeNull();
    expect(mapToEChartsOption(simpleManualData, { type: 'scatter' }, appearance)).toBeNull();
  });
});
