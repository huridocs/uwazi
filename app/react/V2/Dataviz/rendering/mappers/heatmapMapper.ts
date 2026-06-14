import type { EChartsOption } from 'echarts';
import { isDatavizMissingBucketKey } from '#shared/dataviz/missingBucket.js';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DataPoint, DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { mixHexColor } from '#V2/Dataviz/utils/mixHexColor.js';
import { resolveHeatmapCellIntensity } from '#V2/Dataviz/utils/resolveHeatmapCellIntensity.js';
import {
  DEFAULT_CHART_PALETTE,
  resolveSeriesColors,
  type ResolveColorContext,
} from '#V2/Dataviz/utils/resolveColors.js';

type HeatmapMapperContext = ResolveColorContext;

type HeatmapCell = {
  value: [number, number, number];
  itemStyle: { color: string };
  visualMap: false;
};

const CELL_TINT_LOW = '#FFFFFF';

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

const filterHeatmapPrimaryPoints = (points: DataPoint[]): DataPoint[] =>
  points.filter(point => !isDatavizMissingBucketKey(point.key));

const collectMatrixValues = (
  primaryPoints: DataPoint[],
  secondarySeries: ReturnType<typeof collectSecondarySeries>,
  chart: DatavizChartConfig
): number[] =>
  primaryPoints
    .flatMap(point =>
      secondarySeries.map(secondary => {
        const match = point.breakdown?.find(item => String(item.key) === secondary.key);
        return match?.value ?? 0;
      })
    )
    .filter(value => !(chart.excludeZero && value === 0));

const resolveColumnColor = (
  secondary: { key: string; label: string },
  index: number,
  secondaryColors: string[],
  appearance: DatavizAppearance
): string =>
  appearance.valueColorMap?.[secondary.key] ??
  appearance.valueColorMap?.[secondary.label] ??
  secondaryColors[index] ??
  DEFAULT_CHART_PALETTE[index % DEFAULT_CHART_PALETTE.length]!;

const buildHeatmapCells = (
  primaryPoints: DataPoint[],
  secondarySeries: ReturnType<typeof collectSecondarySeries>,
  secondaryColors: string[],
  appearance: DatavizAppearance,
  chart: DatavizChartConfig,
  maxValue: number
): HeatmapCell[] => {
  const cells: HeatmapCell[] = [];

  primaryPoints.forEach((point, yIndex) => {
    secondarySeries.forEach((secondary, xIndex) => {
      const match = point.breakdown?.find(item => String(item.key) === secondary.key);
      const value = match?.value ?? 0;

      if (chart.excludeZero && value === 0) {
        return;
      }

      const intensity = resolveHeatmapCellIntensity(value, maxValue);
      cells.push({
        value: [xIndex, yIndex, value],
        itemStyle: {
          color: mixHexColor(
            CELL_TINT_LOW,
            resolveColumnColor(secondary, xIndex, secondaryColors, appearance),
            intensity
          ),
        },
        visualMap: false,
      });
    });
  });

  return cells;
};

const buildVisualMapStub = (
  minValue: number,
  maxValue: number
): NonNullable<EChartsOption['visualMap']> => ({
  show: false,
  min: minValue,
  max: maxValue,
  calculable: false,
  seriesIndex: 0,
  inRange: {},
});

export const mapHeatmapOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: HeatmapMapperContext = {}
): EChartsOption | null => {
  const primary = dto.series[0];
  if (!primary?.points.length) {
    return null;
  }

  const primaryPoints = filterHeatmapPrimaryPoints(primary.points);
  if (!primaryPoints.length) {
    return null;
  }

  const yCategories = primaryPoints.map(point => point.label);
  const secondarySeries = collectSecondarySeries(primaryPoints);
  if (!secondarySeries.length) {
    return null;
  }

  const secondaryPoints = secondarySeries.map(item => item.sample!).filter(Boolean);
  const secondaryColors = resolveSeriesColors(secondaryPoints, appearance, context);
  const matrixValues = collectMatrixValues(primaryPoints, secondarySeries, chart);
  const minValue = matrixValues.length ? Math.min(...matrixValues) : 0;
  const maxValue = matrixValues.length ? Math.max(...matrixValues, 1) : 1;
  const heatmapData = buildHeatmapCells(
    primaryPoints,
    secondarySeries,
    secondaryColors,
    appearance,
    chart,
    maxValue
  );

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
      bottom: 24,
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
    visualMap: buildVisualMapStub(minValue, maxValue),
    series: [
      {
        name: primary.label,
        type: 'heatmap',
        visualMapIndex: 0,
        data: heatmapData,
        label: chart.showLabels
          ? {
              show: true,
              opacity: 1,
              color: appearance.themeColors?.foreground ?? '#1a1a1a',
              formatter: (params: { value?: [number, number, number] }) =>
                String(params.value?.[2] ?? ''),
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

export const finalizeHeatmapOption = (
  base: EChartsOption,
  merged: EChartsOption
): EChartsOption => {
  const baseSeries = (base.series as EChartsOption['series']) ?? [];
  const mergedSeries = (merged.series as EChartsOption['series']) ?? baseSeries;

  return {
    ...merged,
    visualMap: base.visualMap,
    legend: undefined,
    series: mergedSeries.map((series, index) => {
      const baseItem = baseSeries[index];
      if (!baseItem || typeof baseItem !== 'object') {
        return series;
      }

      return {
        ...series,
        visualMapIndex: 0,
        data: baseItem.data ?? series.data,
      };
    }),
  };
};
