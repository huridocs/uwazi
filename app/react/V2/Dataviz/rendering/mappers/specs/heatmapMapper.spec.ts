import { mixHexColor } from '#V2/Dataviz/utils/mixHexColor.js';
import { mapHeatmapOption } from '../heatmapMapper.js';

const twoDimensionalData = {
  datavizId: '1',
  generatedAt: '2026-01-01T00:00:00.000Z',
  stale: false,
  meta: { totalEntities: 6, truncated: false },
  series: [
    {
      id: 'countries',
      label: 'Countries',
      points: [
        {
          key: 'pe',
          label: 'Peru',
          value: 3,
          breakdown: [
            { key: 'm', label: 'Male', value: 2 },
            { key: 'f', label: 'Female', value: 1 },
          ],
        },
        {
          key: 'co',
          label: 'Colombia',
          value: 3,
          breakdown: [
            { key: 'm', label: 'Male', value: 1 },
            { key: 'f', label: 'Female', value: 2 },
          ],
        },
      ],
    },
  ],
};

describe('heatmapMapper', () => {
  it('should use a grayscale visualMap with a filter slider in chart palette mode', () => {
    const option = mapHeatmapOption(
      twoDimensionalData,
      { type: 'heatmap', showLabels: true, showLegend: true },
      { colorMode: 'theme' }
    );

    expect(option.visualMap).toMatchObject({
      show: true,
      calculable: true,
      min: 1,
      max: 2,
      inRange: { color: ['#FFFFFF', '#2D2D2D'] },
    });

    const series = option.series as Array<{ type: string; data: Array<{ itemStyle?: unknown }> }>;
    expect(series[0]?.data.every(item => item.itemStyle === undefined)).toBe(true);
  });

  it('should apply intensity gradients for custom colors', () => {
    const option = mapHeatmapOption(
      twoDimensionalData,
      { type: 'heatmap' },
      {
        colorMode: 'custom',
        valueColorMap: {
          m: '#111111',
          f: '#222222',
        },
      }
    );

    const series = option.series as Array<{
      data: Array<{ value: number[]; itemStyle?: { color: string } }>;
    }>;
    const colors = series[0]?.data.map(item => item.itemStyle?.color);
    expect(colors?.[0]).toBe(mixHexColor('#FFFFFF', '#111111', 1));
    expect(colors?.[1]).toBe(mixHexColor('#FFFFFF', '#222222', 0));
    expect(colors?.[2]).toBe(mixHexColor('#FFFFFF', '#111111', 0));
    expect(colors?.[3]).toBe(mixHexColor('#FFFFFF', '#222222', 1));
  });

  it('should omit zero-value cells when excludeZero is enabled', () => {
    const option = mapHeatmapOption(
      {
        ...twoDimensionalData,
        series: [
          {
            ...twoDimensionalData.series[0]!,
            points: [
              {
                key: 'cl',
                label: 'Chile',
                value: 1,
                breakdown: [
                  { key: 'm', label: 'Male', value: 1 },
                  { key: 'f', label: 'Female', value: 0 },
                ],
              },
            ],
          },
        ],
      },
      { type: 'heatmap', excludeZero: true },
      { colorMode: 'theme' }
    );

    const series = option.series as Array<{ data: Array<{ value: number[] }> }>;
    expect(series[0]?.data).toHaveLength(1);
    expect(series[0]?.data[0]?.value).toEqual([0, 0, 1]);
  });
});
