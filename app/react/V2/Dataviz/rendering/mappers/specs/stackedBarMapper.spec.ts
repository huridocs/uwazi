import { mapStackedBarOption } from '../stackedBarMapper.js';

describe('stackedBarMapper', () => {
  const data = {
    datavizId: '1',
    generatedAt: '2026-01-01T00:00:00.000Z',
    stale: false,
    meta: { totalEntities: 16, truncated: false },
    series: [
      {
        id: 'habitat',
        label: 'Habitat',
        points: [
          {
            key: 'forest',
            label: 'Forest',
            value: 10,
            breakdown: [
              { key: 'bear', label: 'Bear', value: 10 },
              { key: 'wolf', label: 'Wolf', value: 0 },
            ],
          },
        ],
      },
    ],
  };

  it('should render zero segments when excludeZero is disabled', () => {
    const option = mapStackedBarOption(
      data,
      { type: 'stacked_bar', excludeZero: false, showLabels: true },
      { colorMode: 'theme' }
    );

    const series = option!.series as Array<{ data: Array<number | string> }>;
    expect(series[1]?.data).toEqual([0]);
  });

  it('should omit zero segments when excludeZero is enabled', () => {
    const option = mapStackedBarOption(
      data,
      { type: 'stacked_bar', excludeZero: true, showLabels: true },
      { colorMode: 'theme' }
    );

    const series = option!.series as Array<{ data: Array<number | string> }>;
    expect(series[1]?.data).toEqual(['-']);
  });

  it('should return null when points have no breakdown', () => {
    const option = mapStackedBarOption(
      {
        ...data,
        series: [
          {
            id: 'main',
            label: 'Series',
            points: [
              { key: 'a', label: 'Category A', value: 10 },
              { key: 'b', label: 'Category B', value: 25 },
            ],
          },
        ],
      },
      { type: 'stacked_bar' },
      { colorMode: 'theme' }
    );

    expect(option).toBeNull();
  });
});
