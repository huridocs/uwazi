import { mixHexColor } from '#V2/Dataviz/utils/mixHexColor.js';
import { resolveHeatmapCellIntensity } from '#V2/Dataviz/utils/resolveHeatmapCellIntensity.js';
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

const parseRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const isGrayscale = (hex: string) => {
  const { r, g, b } = parseRgb(hex);
  return Math.abs(r - g) < 3 && Math.abs(g - b) < 3;
};

describe('heatmapMapper', () => {
  it('should paint cells from palette colors with a hidden visualMap stub', () => {
    const option = mapHeatmapOption(
      twoDimensionalData,
      { type: 'heatmap', showLabels: true },
      { colorMode: 'theme' }
    );

    expect(option.visualMap).toMatchObject({
      show: false,
      inRange: {},
    });

    const series = option.series as Array<{
      visualMapIndex?: number;
      data: Array<{ itemStyle?: { color: string }; visualMap?: boolean }>;
    }>;
    expect(series[0]?.visualMapIndex).toBe(0);
    expect(series[0]?.data.every(item => item.visualMap === false)).toBe(true);

    const colors = series[0]?.data.map(item => item.itemStyle?.color).filter(Boolean) as string[];
    expect(colors.length).toBe(4);
    expect(colors.some(color => !isGrayscale(color))).toBe(true);
  });

  it('should apply custom column colors with per-cell visualMap opt-out', () => {
    const option = mapHeatmapOption(
      twoDimensionalData,
      { type: 'heatmap' },
      {
        colorMode: 'custom',
        valueColorMap: {
          m: '#111111',
          f: '#00aa55',
        },
      }
    );

    const series = option.series as Array<{
      data: Array<{ value: number[]; itemStyle?: { color: string }; visualMap?: boolean }>;
    }>;

    const colors = series[0]?.data.map(item => item.itemStyle?.color).filter(Boolean) as string[];
    expect(colors[0]).toBe(
      mixHexColor('#FFFFFF', '#111111', resolveHeatmapCellIntensity(2, 2))
    );
    expect(colors[1]).toBe(
      mixHexColor('#FFFFFF', '#00aa55', resolveHeatmapCellIntensity(1, 2))
    );
  });

  it('should render zero-value cells when excludeZero is disabled', () => {
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
      { type: 'heatmap', excludeZero: false, showLabels: true },
      { colorMode: 'theme' }
    );

    const series = option.series as Array<{ data: Array<{ value: number[] }> }>;
    expect(series[0]?.data).toHaveLength(2);
    expect(series[0]?.data[1]?.value).toEqual([1, 0, 0]);
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

  it('should return null when points have no breakdown', () => {
    const option = mapHeatmapOption(
      {
        ...twoDimensionalData,
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
      { type: 'heatmap' },
      { colorMode: 'theme' }
    );

    expect(option).toBeNull();
  });
});
