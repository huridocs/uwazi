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

  it('should render grouped stacked bars for compare breakdown data', () => {
    const option = mapStackedBarOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 10, truncated: false },
        series: [
          {
            id: 'owners',
            label: 'Owners',
            points: [
              {
                key: 'spain',
                label: 'Spain',
                value: 5,
                breakdown: [
                  { key: 'male', label: 'Male', value: 3 },
                  { key: 'female', label: 'Female', value: 2 },
                ],
              },
            ],
          },
          {
            id: 'owners_2',
            label: 'Owners 2',
            points: [
              {
                key: 'spain',
                label: 'Spain',
                value: 1,
                breakdown: [{ key: 'male', label: 'Male', value: 1 }],
              },
            ],
          },
        ],
      },
      { type: 'stacked_bar', excludeZero: false, showLabels: true },
      { colorMode: 'theme' }
    );

    const series = option!.series as Array<{ name: string; stack: string; data: number[] }>;
    expect(series).toHaveLength(4);
    expect(series.map(item => item.name)).toEqual(
      expect.arrayContaining([
        'Owners · Male',
        'Owners · Female',
        'Owners 2 · Male',
        'Owners 2 · Female',
      ])
    );
    expect(new Set(series.map(item => item.stack))).toEqual(new Set(['owners', 'owners_2']));
  });
});
