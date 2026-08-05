import { mapLineOption } from '../lineMapper.js';

describe('lineMapper', () => {
  it('should render one line per select value over time', () => {
    const option = mapLineOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 10, truncated: false },
        series: [
          {
            id: 'main',
            label: 'Series',
            points: [
              {
                key: 2000,
                label: '2000',
                value: 5,
                breakdown: [
                  { key: 'male', label: 'Male', value: 3 },
                  { key: 'female', label: 'Female', value: 2 },
                ],
              },
              {
                key: 2005,
                label: '2005',
                value: 4,
                breakdown: [
                  { key: 'male', label: 'Male', value: 1 },
                  { key: 'female', label: 'Female', value: 3 },
                ],
              },
            ],
          },
        ],
      },
      { type: 'line', showLegend: true },
      { colorMode: 'theme' }
    );

    const series = option!.series as Array<{ name: string; data: number[] }>;
    expect(series).toHaveLength(2);
    expect(series.map(item => item.name)).toEqual(['Male', 'Female']);
    expect(series[0]?.data).toEqual([3, 1]);
    expect(series[1]?.data).toEqual([2, 3]);
  });

  it('should render compare lines for each source and select value', () => {
    const option = mapLineOption(
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
                key: 2000,
                label: '2000',
                value: 3,
                breakdown: [{ key: 'male', label: 'Male', value: 3 }],
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
                value: 2,
                breakdown: [{ key: 'female', label: 'Female', value: 2 }],
              },
            ],
          },
        ],
      },
      { type: 'line', showLegend: true },
      { colorMode: 'theme' }
    );

    const series = option!.series as Array<{ name: string; data: number[] }>;
    expect(series).toHaveLength(4);
    expect(series.map(item => item.name)).toEqual(
      expect.arrayContaining([
        'Owners · Male',
        'Owners · Female',
        'Personas · Male',
        'Personas · Female',
      ])
    );
  });

  it('should sort compare date × select lines chronologically on the x-axis', () => {
    const option = mapLineOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 6, truncated: false },
        series: [
          {
            id: 'owners',
            label: 'Owners',
            points: [
              {
                key: 2005,
                label: '2005',
                value: 1,
                breakdown: [{ key: 'male', label: 'Male', value: 1 }],
              },
              {
                key: 2000,
                label: '2000',
                value: 2,
                breakdown: [
                  { key: 'male', label: 'Male', value: 1 },
                  { key: 'female', label: 'Female', value: 1 },
                ],
              },
            ],
          },
          {
            id: 'personas',
            label: 'Personas',
            points: [
              {
                key: 2005,
                label: '2005',
                value: 1,
                breakdown: [{ key: 'female', label: 'Female', value: 1 }],
              },
              {
                key: 2000,
                label: '2000',
                value: 1,
                breakdown: [{ key: 'male', label: 'Male', value: 1 }],
              },
            ],
          },
        ],
      },
      { type: 'line', showLegend: true },
      { colorMode: 'theme' }
    );

    expect(option!.xAxis).toMatchObject({ data: ['2000', '2005'] });

    const ownersMale = (option!.series as Array<{ name: string; data: number[] }>).find(
      series => series.name === 'Owners · Male'
    );
    expect(ownersMale?.data).toEqual([1, 1]);
  });
});
