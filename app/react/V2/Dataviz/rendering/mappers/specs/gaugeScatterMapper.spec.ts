import { mapGaugeOption } from '../gaugeMapper.js';
import { mapScatterOption, scaleSymbolSize } from '../scatterMapper.js';

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
  it('should keep count=1 bubbles small and cap large counts', () => {
    expect(scaleSymbolSize(1, 1)).toBe(5);
    expect(scaleSymbolSize(1, 10)).toBe(5);
    expect(scaleSymbolSize(10, 10)).toBe(22);
    expect(scaleSymbolSize(0, 10)).toBe(0);
  });

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

    expect(option!.series?.[0]?.data).toEqual([
      expect.objectContaining({ value: [10, 3], name: 'Ten', count: 3 }),
      expect.objectContaining({ value: [20, 5], name: 'Twenty', count: 5 }),
    ]);
  });

  it('should return null for categorical keys without numeric breakdown', () => {
    const option = mapScatterOption(
      {
        datavizId: '1',
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
            ],
          },
        ],
      },
      { type: 'scatter' },
      { colorMode: 'from_data' }
    );

    expect(option).toBeNull();
  });

  it('should plot numeric breakdown on x/y and size by count', () => {
    const option = mapScatterOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 30, truncated: false },
        series: [
          {
            id: 'main',
            label: 'Cars',
            points: [
              {
                key: 2000,
                label: '2000',
                value: 10,
                breakdown: [
                  { key: 1.6, label: '1.6', value: 4 },
                  { key: 2.0, label: '2.0', value: 6 },
                ],
              },
              {
                key: 2001,
                label: '2001',
                value: 8,
                breakdown: [{ key: 2.2, label: '2.2', value: 8 }],
              },
            ],
          },
        ],
      },
      { type: 'scatter', showTooltip: true },
      { colorMode: 'from_data' }
    );

    expect((option.yAxis as { name?: string })?.name).toBeUndefined();
    expect(option.graphic).toBeUndefined();
    expect(option.xAxis).toEqual(
      expect.objectContaining({
        type: 'value',
        scale: true,
        min: 1999.5,
        max: 2001.5,
      })
    );
    expect(option.series?.[0]?.label).toBeUndefined();
    expect(option.series?.[0]?.data).toEqual([
      expect.objectContaining({ value: [2000, 1.6], count: 4, secondaryLabel: '1.6' }),
      expect.objectContaining({ value: [2000, 2], count: 6, secondaryLabel: '2.0' }),
      expect.objectContaining({ value: [2001, 2.2], count: 8, secondaryLabel: '2.2' }),
    ]);
  });

  it('should skip zero breakdown cells in numeric cross-tab scatter', () => {
    const option = mapScatterOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 4, truncated: false },
        series: [
          {
            id: 'main',
            label: 'Cars',
            points: [
              {
                key: 2000,
                label: '2000',
                value: 4,
                breakdown: [
                  { key: 1.6, label: '1.6', value: 4 },
                  { key: 2.0, label: '2.0', value: 0 },
                ],
              },
            ],
          },
        ],
      },
      { type: 'scatter', showTooltip: true },
      { colorMode: 'from_data' }
    );

    expect(option.series?.[0]?.data).toHaveLength(1);
    expect(option.series?.[0]?.data?.[0]).toEqual(
      expect.objectContaining({ value: [2000, 1.6], count: 4 })
    );
  });

  it('should render one bubble per sparse cross-tab cell from date data', () => {
    const option = mapScatterOption(
      {
        datavizId: '1',
        generatedAt: '2026-06-14T11:43:25.462Z',
        stale: false,
        meta: { totalEntities: 3, truncated: true },
        series: [
          {
            id: 'main',
            label: 'Cars',
            points: [
              {
                key: 799744562,
                label: 'May 6, 1995',
                value: 1,
                breakdown: [{ key: 1.4, label: '1.4', value: 1 }],
              },
              {
                key: 804863301,
                label: 'Jul 4, 1995',
                value: 1,
                breakdown: [{ key: 1.5, label: '1.5', value: 1 }],
              },
              {
                key: 812873726,
                label: 'Oct 5, 1995',
                value: 1,
                breakdown: [{ key: 1.5, label: '1.5', value: 1 }],
              },
            ],
          },
        ],
      },
      { type: 'scatter', showTooltip: true },
      { colorMode: 'from_data' }
    );

    expect(option.series?.[0]?.data).toHaveLength(3);
    expect(option.series?.[0]?.data).toEqual([
      expect.objectContaining({ count: 1, secondaryLabel: '1.4', symbolSize: 5 }),
      expect.objectContaining({ count: 1, secondaryLabel: '1.5', symbolSize: 5 }),
      expect.objectContaining({ count: 1, secondaryLabel: '1.5', symbolSize: 5 }),
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

  it('should show dimension property labels on axes when showLegend is enabled', () => {
    const option = mapScatterOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 10, truncated: false },
        series: [
          {
            id: 'main',
            label: 'Cars',
            points: [
              {
                key: 2000,
                label: '2000',
                value: 10,
                breakdown: [{ key: 1.6, label: '1.6', value: 10 }],
              },
            ],
          },
        ],
      },
      { type: 'scatter', showTooltip: true, showLegend: true },
      { colorMode: 'from_data' },
      {
        dimensions: [
          { property: 'registration_date', propertyType: 'date' },
          { property: 'engine_size', propertyType: 'numeric' },
        ],
        sources: [{ templateId: 'cars-template', alias: 'cars' }],
        templatePropertiesById: {
          'cars-template': [
            { name: 'registration_date', label: 'Registration date' },
            { name: 'engine_size', label: 'Engine size' },
          ],
        },
      }
    );

    expect(option.xAxis).toEqual(
      expect.objectContaining({ name: 'Registration date', nameLocation: 'middle' })
    );
    expect(option.yAxis).toEqual(
      expect.objectContaining({ name: 'Engine size', nameLocation: 'middle', nameRotate: 90 })
    );
  });

  it('should humanize axis names from dimensions without template metadata', () => {
    const option = mapScatterOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 1, truncated: false },
        series: [
          {
            id: 'main',
            label: 'Cars',
            points: [
              {
                key: 799744562,
                label: 'May 6, 1995',
                value: 1,
                breakdown: [{ key: 1.4, label: '1.4', value: 1 }],
              },
            ],
          },
        ],
      },
      { type: 'scatter', showTooltip: true, showLegend: true },
      { colorMode: 'from_data' },
      {
        dimensions: [
          { property: 'registration_date', propertyType: 'date' },
          { property: 'engine_size', propertyType: 'numeric' },
        ],
      }
    );

    expect(option.xAxis).toEqual(
      expect.objectContaining({ name: 'Registration Date', nameLocation: 'middle' })
    );
    expect(option.yAxis).toEqual(
      expect.objectContaining({ name: 'Engine Size', nameLocation: 'middle' })
    );
  });

  it('should hide axis labels when showLegend is disabled', () => {
    const option = mapScatterOption(
      {
        datavizId: '1',
        generatedAt: '2026-01-01T00:00:00.000Z',
        stale: false,
        meta: { totalEntities: 10, truncated: false },
        series: [
          {
            id: 'main',
            label: 'Cars',
            points: [
              {
                key: 2000,
                label: '2000',
                value: 10,
                breakdown: [{ key: 1.6, label: '1.6', value: 10 }],
              },
            ],
          },
        ],
      },
      { type: 'scatter', showTooltip: true, showLegend: false },
      { colorMode: 'from_data' },
      {
        dimensions: [
          { property: 'registration_date', propertyType: 'date' },
          { property: 'engine_size', propertyType: 'numeric' },
        ],
        sources: [{ templateId: 'cars-template', alias: 'cars' }],
        templatePropertiesById: {
          'cars-template': [
            { name: 'registration_date', label: 'Registration date' },
            { name: 'engine_size', label: 'Engine size' },
          ],
        },
      }
    );

    expect((option.xAxis as { name?: string })?.name).toBeUndefined();
    expect((option.yAxis as { name?: string })?.name).toBeUndefined();
  });
});
