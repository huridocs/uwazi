import { DATAVIZ_MISSING_BUCKET_KEY } from '#shared/dataviz/missingBucket.js';
import { mixHexColor } from '#V2/Dataviz/utils/mixHexColor.js';
import { resolveHeatmapCellIntensity } from '#V2/Dataviz/utils/resolveHeatmapCellIntensity.js';
import { mapToEChartsOption } from '../index.js';
import { finalizeHeatmapOption, mapHeatmapOption } from '../heatmapMapper.js';

const heatmapData = {
  datavizId: '1',
  generatedAt: '2026-01-01T00:00:00.000Z',
  stale: false,
  meta: { totalEntities: 24, truncated: false },
  series: [
    {
      id: 'habitat',
      label: 'Habitat',
      points: [
        {
          key: DATAVIZ_MISSING_BUCKET_KEY,
          label: 'No data',
          value: 15,
          breakdown: [
            { key: DATAVIZ_MISSING_BUCKET_KEY, label: 'No data', value: 14 },
            { key: 'bear', label: 'Bear', value: 1 },
            { key: 'wolf', label: 'Wolf', value: 0 },
          ],
        },
        {
          key: 'forest',
          label: 'Forest',
          value: 11,
          breakdown: [
            { key: DATAVIZ_MISSING_BUCKET_KEY, label: 'No data', value: 0 },
            { key: 'bear', label: 'Bear', value: 10 },
            { key: 'wolf', label: 'Wolf', value: 1 },
          ],
        },
        {
          key: 'wetland',
          label: 'Wetland',
          value: 6,
          breakdown: [
            { key: 'bear', label: 'Bear', value: 6 },
            { key: 'wolf', label: 'Wolf', value: 0 },
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

describe('heatmap rendering integration', () => {
  it('should keep secondary missing as an x-axis column and drop primary missing from y-axis', () => {
    const option = mapHeatmapOption(
      heatmapData,
      { type: 'heatmap', showMissingValues: true },
      { colorMode: 'theme' }
    );

    expect(option!.yAxis).toMatchObject({
      data: ['Forest', 'Wetland'],
    });
    expect(option!.xAxis).toMatchObject({
      data: ['No data', 'Bear', 'Wolf'],
    });
  });

  it('should render custom column colors via itemStyle with per-cell visualMap opt-out', () => {
    const option = mapHeatmapOption(
      heatmapData,
      { type: 'heatmap', showMissingValues: true },
      {
        colorMode: 'custom',
        valueColorMap: {
          [DATAVIZ_MISSING_BUCKET_KEY]: '#00ff00',
          bear: '#0000ff',
          wolf: '#ff00ff',
        },
      }
    );

    expect(option!.visualMap).toMatchObject({
      show: false,
      inRange: {},
    });

    const series = option!.series as Array<{
      data: Array<{ value: number[]; itemStyle?: { color: string }; visualMap?: boolean }>;
    }>;
    expect(series[0]?.data.every(item => item.visualMap === false)).toBe(true);

    const forestBear = series[0]?.data.find(item => item.value[0] === 1 && item.value[1] === 0);
    const forestWolf = series[0]?.data.find(item => item.value[0] === 2 && item.value[1] === 0);
    expect(forestBear?.itemStyle?.color).toBe(
      mixHexColor('#FFFFFF', '#0000ff', resolveHeatmapCellIntensity(10, 10))
    );
    expect(forestWolf?.itemStyle?.color).toBe(
      mixHexColor('#FFFFFF', '#ff00ff', resolveHeatmapCellIntensity(1, 10))
    );
    expect(isGrayscale(forestBear?.itemStyle?.color ?? '')).toBe(false);
    expect(isGrayscale(forestWolf?.itemStyle?.color ?? '')).toBe(false);
  });

  it('should strip merged visualMap overrides', () => {
    const base = mapHeatmapOption(
      heatmapData,
      { type: 'heatmap', showMissingValues: true },
      {
        colorMode: 'custom',
        valueColorMap: { bear: '#123456', wolf: '#654321' },
      }
    );
    const merged = finalizeHeatmapOption(base!, {
      ...base,
      visualMap: {
        show: true,
        inRange: { color: ['#ffffff', '#000000'] },
      },
      series: [
        {
          type: 'heatmap',
          visualMapIndex: 0,
          data: [],
        },
      ],
    });

    expect(merged.visualMap).toMatchObject({
      show: false,
      inRange: {},
    });
    const series = merged.series as Array<{ data: unknown }>;
    expect(series[0]?.data).toEqual((base!.series as Array<{ data: unknown }>)[0]?.data);
  });

  it('should keep custom colors when advanced overrides try to inject a visible visualMap', () => {
    const option = mapToEChartsOption(
      heatmapData,
      {
        type: 'heatmap',
        showMissingValues: true,
        echartsOverrides: {
          visualMap: {
            show: true,
            inRange: { color: ['#ffffff', '#000000'] },
          },
        },
      },
      {
        colorMode: 'custom',
        valueColorMap: { bear: '#112233', wolf: '#33aa66' },
      }
    );

    expect(option?.visualMap).toMatchObject({
      show: false,
      inRange: {},
    });
    const series = option?.series as Array<{
      data: Array<{ value?: number[]; itemStyle?: { color: string }; visualMap?: boolean }>;
    }>;
    expect(series[0]?.data.every(item => item.visualMap === false)).toBe(true);
    const nonZeroColors = series[0]?.data
      .filter(item => (item.value?.[2] ?? 0) > 0)
      .map(item => item.itemStyle?.color)
      .filter(Boolean) as string[];
    expect(nonZeroColors.every(color => !isGrayscale(color))).toBe(true);
  });
});
