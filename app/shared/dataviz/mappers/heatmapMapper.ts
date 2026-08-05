import type { CallbackDataParams } from 'echarts/types/dist/shared.js';
import type { EChartsOption, VisualMapComponentOption } from 'echarts';
import { isDatavizMissingBucketKey } from '#shared/dataviz/missingBucket.js';
import type { DatavizChartConfig } from '#shared/types/datavizSchema.js';
import type { DatavizAppearance } from '#shared/types/datavizSchema.js';
import type { DataPoint, DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { mixHexColor } from '#shared/dataviz/utils/mixHexColor.js';
import { resolveHeatmapCellIntensity } from '#shared/dataviz/utils/resolveHeatmapCellIntensity.js';
import {
  DEFAULT_CHART_PALETTE,
  resolveCompareSeriesDisplayLabel,
  resolveSeriesColors,
  type ResolveColorContext,
} from '#shared/dataviz/utils/resolveColors.js';
import {
  collectSecondaryColumns,
  isCompareBreakdownChart,
  type SecondaryColumn,
} from '#shared/dataviz/rendering/compareBreakdownChart.js';

const formatHeatmapCellLabel = (params: CallbackDataParams): string => {
  const raw = params.value;
  if (Array.isArray(raw)) {
    return String(raw[2] ?? '');
  }
  return String(raw ?? '');
};

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
  maxValue: number,
  seriesIndex = 0
): VisualMapComponentOption => ({
  show: false,
  min: minValue,
  max: maxValue,
  calculable: false,
  seriesIndex,
  inRange: {},
});

const mapSingleHeatmapPanel = (
  primaryPoints: DataPoint[],
  secondarySeries: SecondaryColumn[],
  secondaryColors: string[],
  appearance: DatavizAppearance,
  chart: DatavizChartConfig,
  maxValue: number
): { yCategories: string[]; heatmapData: HeatmapCell[] } => {
  const yCategories = primaryPoints.map(point => point.label);
  const heatmapData = buildHeatmapCells(
    primaryPoints,
    secondarySeries,
    secondaryColors,
    appearance,
    chart,
    maxValue
  );

  return { yCategories, heatmapData };
};

const mapCompareBreakdownHeatmap = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: HeatmapMapperContext = {}
): EChartsOption | null => {
  const panels = dto.series
    .map(source => {
      const primaryPoints = filterHeatmapPrimaryPoints(source.points);
      if (!primaryPoints.length) {
        return null;
      }
      return {
        source,
        primaryPoints,
      };
    })
    .filter((panel): panel is NonNullable<typeof panel> => Boolean(panel));

  if (!panels.length) {
    return null;
  }

  const secondarySeries = collectSecondaryColumns(dto.series);
  if (!secondarySeries.length) {
    return null;
  }

  const secondaryPoints = secondarySeries.map(item => item.sample!).filter(Boolean);
  const secondaryColors = resolveSeriesColors(secondaryPoints, appearance, context);
  const matrixValues = panels.flatMap(panel =>
    collectMatrixValues(panel.primaryPoints, secondarySeries, chart)
  );
  const minValue = matrixValues.length ? Math.min(...matrixValues) : 0;
  const maxValue = matrixValues.length ? Math.max(...matrixValues, 1) : 1;

  const panelCount = panels.length;
  const panelGap = 4;
  const panelHeight = (100 - panelGap * (panelCount - 1)) / panelCount;

  const grids: NonNullable<EChartsOption['grid']> = [];
  const xAxes: NonNullable<EChartsOption['xAxis']> = [];
  const yAxes: NonNullable<EChartsOption['yAxis']> = [];
  const seriesPanels: object[] = [];
  const visualMaps: VisualMapComponentOption[] = [];

  panels.forEach((panel, index) => {
    const top = index * (panelHeight + panelGap);
    const sourceLabel = resolveCompareSeriesDisplayLabel(
      panel.source.id,
      panel.source.label,
      context
    );
    const { yCategories, heatmapData } = mapSingleHeatmapPanel(
      panel.primaryPoints,
      secondarySeries,
      secondaryColors,
      appearance,
      chart,
      maxValue
    );

    grids.push({
      left: 80,
      right: 40,
      top: `${top + 6}%`,
      height: `${panelHeight - 8}%`,
      containLabel: true,
    });
    xAxes.push({
      type: 'category',
      gridIndex: index,
      data: secondarySeries.map(item => item.label),
      splitArea: { show: true },
      axisLabel: { color: appearance.themeColors?.foreground, interval: 0 },
    });
    yAxes.push({
      type: 'category',
      gridIndex: index,
      data: yCategories,
      name: sourceLabel,
      nameLocation: 'middle',
      nameGap: 56,
      splitArea: { show: true },
      axisLabel: { color: appearance.themeColors?.foreground, interval: 0 },
    });
    visualMaps.push(buildVisualMapStub(minValue, maxValue, index));
    seriesPanels.push({
      name: sourceLabel,
      type: 'heatmap',
      xAxisIndex: index,
      yAxisIndex: index,
      visualMapIndex: index,
      data: heatmapData,
      label: chart.showLabels
        ? {
            show: true,
            opacity: 1,
            color: appearance.themeColors?.foreground ?? '#1a1a1a',
            formatter: formatHeatmapCellLabel,
          }
        : undefined,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.35)',
        },
      },
    });
  });

  const xCategories = secondarySeries.map(item => item.label);

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    tooltip: (chart.showTooltip
      ? {
          position: 'top',
          formatter: (params: { value?: [number, number, number]; seriesName?: string }) => {
            const [xIndex, yIndex, value] = params.value ?? [0, 0, 0];
            const xLabel = xCategories[xIndex] ?? '';
            const panel = panels[Number((params as { seriesIndex?: number }).seriesIndex ?? 0)];
            const yLabel = panel?.primaryPoints[yIndex]?.label ?? '';
            const sourceLabel = params.seriesName ?? '';
            return `${sourceLabel}<br/>${yLabel} / ${xLabel}<br/>${value}`;
          },
        }
      : undefined) as EChartsOption['tooltip'],
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    visualMap: visualMaps,
    series: seriesPanels as EChartsOption['series'],
  } as EChartsOption;
};

export const mapHeatmapOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: HeatmapMapperContext = {}
): EChartsOption | null => {
  if (isCompareBreakdownChart(dto)) {
    return mapCompareBreakdownHeatmap(dto, chart, appearance, context);
  }

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
    tooltip: (chart.showTooltip
      ? {
          position: 'top',
          formatter: (params: { value?: [number, number, number] }) => {
            const [xIndex, yIndex, value] = params.value ?? [0, 0, 0];
            const xLabel = secondarySeries[xIndex]?.label ?? '';
            const yLabel = yCategories[yIndex] ?? '';
            return `${yLabel} / ${xLabel}<br/>${value}`;
          },
        }
      : undefined) as EChartsOption['tooltip'],
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
    visualMap: buildVisualMapStub(minValue, maxValue, 0),
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
              formatter: formatHeatmapCellLabel,
            }
          : undefined,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.35)',
          },
        },
      },
    ] as EChartsOption['series'],
  } as EChartsOption;
};

export const finalizeHeatmapOption = (
  base: EChartsOption,
  merged: EChartsOption
): EChartsOption => {
  const toSeriesArray = (series: EChartsOption['series'] | undefined) => {
    if (!series) {
      return [];
    }
    return Array.isArray(series) ? series : [series];
  };

  const baseSeries = toSeriesArray(base.series);
  const mergedSeries = toSeriesArray(merged.series ?? base.series);

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
        data: 'data' in baseItem ? baseItem.data : series.data,
      };
    }) as EChartsOption['series'],
  };
};
