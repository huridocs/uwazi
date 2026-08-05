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

const unionDateSelectData = {
  datavizId: 'dv-union',
  generatedAt: '2026-01-01T00:00:00.000Z',
  stale: false,
  meta: { totalEntities: 4, truncated: false },
  series: [
    {
      id: 'union',
      label: 'Union',
      points: [
        {
          key: 2000,
          label: '2000',
          value: 3,
          breakdown: [
            { key: 'male', label: 'Male', value: 2 },
            { key: 'female', label: 'Female', value: 1 },
          ],
        },
        {
          key: 2005,
          label: '2005',
          value: 1,
          breakdown: [{ key: 'female', label: 'Female', value: 1 }],
        },
      ],
    },
  ],
};

const compareDateSelectData = {
  datavizId: 'dv-compare',
  generatedAt: '2026-01-01T00:00:00.000Z',
  stale: false,
  meta: { totalEntities: 4, truncated: false },
  series: [
    {
      id: 'owners',
      label: 'Owners',
      points: [
        {
          key: 2000,
          label: '2000',
          value: 2,
          breakdown: [
            { key: 'male', label: 'Male', value: 1 },
            { key: 'female', label: 'Female', value: 1 },
          ],
        },
        {
          key: 2005,
          label: '2005',
          value: 0,
          breakdown: [
            { key: 'male', label: 'Male', value: 0 },
            { key: 'female', label: 'Female', value: 0 },
          ],
        },
      ],
    },
    {
      id: 'personas',
      label: 'Personas',
      points: [
        {
          key: 2000,
          label: '2000',
          value: 1,
          breakdown: [
            { key: 'male', label: 'Male', value: 1 },
            { key: 'female', label: 'Female', value: 0 },
          ],
        },
        {
          key: 2005,
          label: '2005',
          value: 1,
          breakdown: [
            { key: 'male', label: 'Male', value: 0 },
            { key: 'female', label: 'Female', value: 1 },
          ],
        },
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

  it('should map union date × select data to line, heatmap, and stacked bar options', () => {
    const appearance = { colorMode: 'theme' as const };

    expect(mapToEChartsOption(unionDateSelectData, { type: 'line' }, appearance)).not.toBeNull();
    expect(mapToEChartsOption(unionDateSelectData, { type: 'area' }, appearance)).not.toBeNull();
    expect(mapToEChartsOption(unionDateSelectData, { type: 'heatmap' }, appearance)).not.toBeNull();
    expect(
      mapToEChartsOption(unionDateSelectData, { type: 'stacked_bar' }, appearance)
    ).not.toBeNull();
  });

  it('should map compare date × select data to line and heatmap options', () => {
    const appearance = { colorMode: 'theme' as const };

    expect(mapToEChartsOption(compareDateSelectData, { type: 'line' }, appearance)).not.toBeNull();
    expect(
      mapToEChartsOption(compareDateSelectData, { type: 'heatmap' }, appearance)
    ).not.toBeNull();
  });
});
