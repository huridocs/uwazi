import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DataPoint, DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { chartTextStyle } from '#V2/Dataviz/rendering/chartTheme.js';
import { mixHexColor } from '#V2/Dataviz/utils/mixHexColor.js';
import {
  DEFAULT_CHART_PALETTE,
  resolveSeriesColors,
  type ResolveColorContext,
} from '#V2/Dataviz/utils/resolveColors.js';

type HeatmapMapperContext = ResolveColorContext;

type HeatmapCell = {
  value: [number, number, number];
  itemStyle?: { color: string };
};

const HEATMAP_GRAY_LOW = '#FFFFFF';
const HEATMAP_GRAY_HIGH = '#2D2D2D';

const collectSecondarySeries = (points: DataPoint[]) => {
  const seriesMap = new Map<string, { key: string; label: string; sample?: DataPoint }>();

  points.forEach(point => {
    point.breakdown?.forEach(item => {
      const key = String(item.key);
      if (!seriesMap.has(key)) {
        seriesMap.set(key, { key, label: item.label, sample: item });
      }
    });
  });

  return Array.from(seriesMap.values());
};

const usesThemeHeatScale = (appearance: DatavizAppearance) =>
  appearance.colorMode === 'theme' || appearance.colorMode === 'from_data';

const buildHeatmapCells = (
  primaryPoints: DataPoint[],
  secondarySeries: ReturnType<typeof collectSecondarySeries>,
  secondaryColors: string[],
  appearance: DatavizAppearance,
  chart: DatavizChartConfig,
  minValue: number,
  maxValue: number
): HeatmapCell[] => {
  const secondaryKeyToIndex = new Map(secondarySeries.map((item, index) => [item.key, index]));
  const secondaryKeyToColor = new Map(
    secondarySeries.map((item, index) => [item.key, secondaryColors[index]!])
  );
  const themeScale = usesThemeHeatScale(appearance);
  const range = Math.max(maxValue - minValue, 1);

  const cells: HeatmapCell[] = [];

  primaryPoints.forEach((point, yIndex) => {
    point.breakdown?.forEach(item => {
      if (chart.excludeZero && item.value === 0) {
        return;
      }

      const xIndex = secondaryKeyToIndex.get(String(item.key));
      if (xIndex === undefined) {
        return;
      }

      const cell: HeatmapCell = {
        value: [xIndex, yIndex, item.value],
      };

      if (!themeScale) {
        const baseColor =
          secondaryKeyToColor.get(String(item.key)) ??
          appearance.valueColorMap?.[String(item.key)] ??
          DEFAULT_CHART_PALETTE[xIndex % DEFAULT_CHART_PALETTE.length]!;
        const intensity = (item.value - minValue) / range;
        cell.itemStyle = { color: mixHexColor(HEATMAP_GRAY_LOW, baseColor, intensity) };
      }

      cells.push(cell);
    });
  });

  return cells;
};

const buildVisualMap = (
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  minValue: number,
  maxValue: number,
  themeScale: boolean
): EChartsOption['visualMap'] => ({
  show: chart.showLegend ?? true,
  min: minValue,
  max: maxValue,
  calculable: true,
  orient: 'horizontal',
  left: 'center',
  bottom: 8,
  inRange: {
    color: themeScale
      ? [HEATMAP_GRAY_LOW, HEATMAP_GRAY_HIGH]
      : [HEATMAP_GRAY_LOW, DEFAULT_CHART_PALETTE[0]!],
  },
  textStyle: chartTextStyle(appearance),
});

export const mapHeatmapOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: HeatmapMapperContext = {}
): EChartsOption => {
  const primary = dto.series[0];
  if (!primary?.points.length) {
    return { title: { text: 'No data', left: 'center', top: 'center' } };
  }

  const yCategories = primary.points.map(point => point.label);
  const secondarySeries = collectSecondarySeries(primary.points);
  if (!secondarySeries.length) {
    return { title: { text: 'No data', left: 'center', top: 'center' } };
  }

  const secondaryPoints = secondarySeries.map(item => item.sample!).filter(Boolean);
  const secondaryColors = resolveSeriesColors(secondaryPoints, appearance, context);
  const values = primary.points.flatMap(point =>
    (point.breakdown ?? [])
      .filter(item => !(chart.excludeZero && item.value === 0))
      .map(item => item.value)
  );
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 1;
  const themeScale = usesThemeHeatScale(appearance);
  const heatmapData = buildHeatmapCells(
    primary.points,
    secondarySeries,
    secondaryColors,
    appearance,
    chart,
    minValue,
    maxValue
  );
  const showColorScale = chart.showLegend ?? true;

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    tooltip: chart.showTooltip
      ? {
          position: 'top',
          formatter: (params: { value?: [number, number, number] }) => {
            const [xIndex, yIndex, value] = params.value ?? [0, 0, 0];
            const xLabel = secondarySeries[xIndex]?.label ?? '';
            const yLabel = yCategories[yIndex] ?? '';
            return `${yLabel} / ${xLabel}<br/>${value}`;
          },
        }
      : undefined,
    grid: {
      left: 80,
      right: 40,
      top: 20,
      bottom: showColorScale ? 72 : 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: secondarySeries.map(item => item.label),
      splitArea: { show: true },
      axisLabel: { color: appearance.themeColors?.foreground, interval: 0 },
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      splitArea: { show: true },
      axisLabel: { color: appearance.themeColors?.foreground, interval: 0 },
    },
    visualMap: buildVisualMap(chart, appearance, minValue, maxValue, themeScale),
    series: [
      {
        name: primary.label,
        type: 'heatmap',
        data: heatmapData,
        label: chart.showLabels
          ? {
              show: true,
              opacity: 1,
              color: appearance.themeColors?.foreground ?? '#1a1a1a',
              formatter: (params: { value?: [number, number, number] }) => {
                const value = params.value?.[2];
                return value === 0 ? '' : String(value ?? '');
              },
            }
          : undefined,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.35)',
          },
        },
      },
    ],
  };
};
