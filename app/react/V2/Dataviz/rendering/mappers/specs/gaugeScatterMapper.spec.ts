import { mapGaugeOption } from '../gaugeMapper.js';
import { mapScatterOption } from '../scatterMapper.js';

describe('gaugeMapper', () => {
  it('should map top bucket to gauge percent', () => {
    const option = mapGaugeOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 10, truncated: false },
        series: [
          {
            id: 'main',
            label: 'Series',
            points: [{ key: 'a', label: 'A', value: 7 }],
          },
        ],
      },
      { type: 'gauge' },
      { colorMode: 'from_data' }
    );

    expect(option.series?.[0]?.data?.[0]?.value).toBe(70);
  });
});

describe('scatterMapper', () => {
  it('should map numeric keys to scatter coordinates', () => {
    const option = mapScatterOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 2, truncated: false },
        series: [
          {
            id: 'main',
            label: 'Series',
            points: [
              { key: 10, label: 'Ten', value: 3 },
              { key: 20, label: 'Twenty', value: 5 },
            ],
          },
        ],
      },
      { type: 'scatter', showTooltip: true },
      { colorMode: 'from_data' }
    );

    expect(option.series?.[0]?.data).toEqual([
      expect.objectContaining({ value: [10, 3], name: 'Ten', count: 3 }),
      expect.objectContaining({ value: [20, 5], name: 'Twenty', count: 5 }),
    ]);
  });

  it('should list second-dimension breakdown in tooltip', () => {
    const option = mapScatterOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 7, truncated: false },
        series: [
          {
            id: 'main',
            label: 'Series',
            points: [
              {
                key: 35,
                label: '35',
                value: 7,
                breakdown: [
                  { key: 'Chile', label: 'Chile', value: 2 },
                  { key: 'Brazil', label: 'Brazil', value: 1 },
                ],
              },
            ],
          },
        ],
      },
      { type: 'scatter', showTooltip: true },
      { colorMode: 'from_data' }
    );

    const datum = (option.series?.[0]?.data as Array<{ breakdown?: unknown[] }>)[0];
    const formatter = option.tooltip?.formatter as (params: { data: typeof datum }) => string;
    const html = formatter({ data: datum! });

    expect(html).toContain('<strong>35</strong>');
    expect(html).toContain('Count: 7');
    expect(html).toContain('Chile: 2');
    expect(html).toContain('Brazil: 1');
  });
});
