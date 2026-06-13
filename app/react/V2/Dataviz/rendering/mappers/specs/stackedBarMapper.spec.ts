import { mapStackedBarOption } from '../stackedBarMapper.js';

describe('stackedBarMapper', () => {
  const data = {
    datavizId: '1',
    generatedAt: '2026-01-01T00:00:00.000Z',
    stale: false,
    meta: { totalEntities: 16, truncated: false },
    series: [
      {
        id: 'countries',
        label: 'Countries',
        points: [
          {
            key: 'co',
            label: 'Colombia',
            value: 10,
            breakdown: [
              { key: 'm', label: 'Hombre', value: 10 },
              { key: 'f', label: 'Mujer', value: 0 },
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

    const series = option.series as Array<{ data: Array<number | string> }>;
    expect(series[1]?.data).toEqual([0]);
  });

  it('should omit zero segments when excludeZero is enabled', () => {
    const option = mapStackedBarOption(
      data,
      { type: 'stacked_bar', excludeZero: true, showLabels: true },
      { colorMode: 'theme' }
    );

    const series = option.series as Array<{ data: Array<number | string> }>;
    expect(series[1]?.data).toEqual(['-']);
  });
});
