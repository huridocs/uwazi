import type { CallbackDataParams } from 'echarts/types/dist/shared.js';
import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#shared/types/datavizSchema.js';
import type { DatavizAppearance } from '#shared/types/datavizSchema.js';
import type { DataPoint, DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { buildCompareChartLegend } from '#shared/dataviz/rendering/compareChartLayout.js';
import {
  collectSecondaryColumns,
  getPrimaryCategories,
  isCompareBreakdownChart,
  resolveCompareBreakdownSegmentValue,
} from '#shared/dataviz/rendering/compareBreakdownChart.js';
import {
  resolveCompareSeriesDisplayLabel,
  resolveSeriesColors,
  type ResolveColorContext,
} from '#shared/dataviz/utils/resolveColors.js';

type StackedBarMapperContext = ResolveColorContext;

const collectSecondarySeriesFromPoints = (points: DataPoint[]) => {
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

const resolveStackedSegmentValue = (
  match: DataPoint | undefined,
  chart: DatavizChartConfig
): number | string => resolveCompareBreakdownSegmentValue(match, chart.excludeZero);

const mapCompareBreakdownStackedBar = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: StackedBarMapperContext
): EChartsOption | null => {
  const categories = getPrimaryCategories(dto.series);
  const secondarySeries = collectSecondaryColumns(dto.series);
  if (!categories.length || !secondarySeries.length) {
    return null;
  }

  const secondaryPoints = secondarySeries.map(item => item.sample!).filter(Boolean);
  const segmentColors = resolveSeriesColors(secondaryPoints, appearance, context);
  const rotateLabels = categories.length > 5;

  const echartsSeries = dto.series.flatMap(source => {
    const sourceLabel = resolveCompareSeriesDisplayLabel(source.id, source.label, context);

    return secondarySeries.map((secondary, secondaryIndex) => ({
      name: `${sourceLabel} · ${secondary.label}`,
      type: 'bar' as const,
      stack: source.id,
      emphasis: { focus: 'series' as const },
      data: source.points.map(point => {
        const match = point.breakdown?.find(item => String(item.key) === secondary.key);
        return resolveStackedSegmentValue(match, chart);
      }),
      itemStyle: { color: segmentColors[secondaryIndex] },
      label: chart.showLabels
        ? {
            show: true,
            position: 'inside' as const,
            formatter: (params: CallbackDataParams) => {
              const value = params.value;
              if (value === '-') {
                return '';
              }
              return String(value ?? '');
            },
          }
        : undefined,
    }));
  });

  const legendLabels = echartsSeries.map(series => String(series.name));

  const resolveGridBottom = () => {
    if (rotateLabels) {
      return 72;
    }
    if (chart.showLegend === false) {
      return 40;
    }
    return 64;
  };

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    color: segmentColors,
    tooltip: chart.showTooltip ? { trigger: 'axis', axisPointer: { type: 'shadow' } } : undefined,
    legend: buildCompareChartLegend(legendLabels, appearance, chart.showLegend),
    grid: {
      left: 40,
      right: 20,
      top: 30,
      bottom: resolveGridBottom(),
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: appearance.themeColors?.foreground,
        interval: 0,
        hideOverlap: false,
        rotate: rotateLabels ? 35 : 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: appearance.themeColors?.foreground },
    },
    series: echartsSeries as EChartsOption['series'],
  };
};

export const mapStackedBarOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: StackedBarMapperContext = {}
): EChartsOption | null => {
  if (isCompareBreakdownChart(dto)) {
    return mapCompareBreakdownStackedBar(dto, chart, appearance, context);
  }

  const primary = dto.series[0];
  if (!primary?.points.length) {
    return null;
  }

  const categories = primary.points.map(point => point.label);
  const secondarySeries = collectSecondarySeriesFromPoints(primary.points);
  if (!secondarySeries.length) {
    return null;
  }
  const secondaryPoints = secondarySeries.map(item => item.sample!).filter(Boolean);
  const seriesColors = resolveSeriesColors(secondaryPoints, appearance, context);
  const secondaryLabels = secondarySeries.map(item => item.label);
  const rotateLabels = categories.length > 5;

  const echartsSeries = secondarySeries.map((item, index) => ({
    name: item.label,
    type: 'bar' as const,
    stack: 'total',
    emphasis: { focus: 'series' as const },
    data: primary.points.map(point => {
      const match = point.breakdown?.find(breakdown => String(breakdown.key) === item.key);
      return resolveStackedSegmentValue(match, chart);
    }),
    itemStyle: { color: seriesColors[index] },
    label: chart.showLabels
      ? {
          show: true,
          position: 'inside' as const,
          formatter: (params: CallbackDataParams) => {
            const value = params.value;
            if (value === '-') {
              return '';
            }
            return String(value ?? '');
          },
        }
      : undefined,
  }));

  const resolveGridBottom = () => {
    if (rotateLabels) {
      return 72;
    }
    if (chart.showLegend === false) {
      return 40;
    }
    return 64;
  };

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    color: seriesColors,
    tooltip: chart.showTooltip ? { trigger: 'axis', axisPointer: { type: 'shadow' } } : undefined,
    legend: buildCompareChartLegend(secondaryLabels, appearance, chart.showLegend),
    grid: {
      left: 40,
      right: 20,
      top: 30,
      bottom: resolveGridBottom(),
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: appearance.themeColors?.foreground,
        interval: 0,
        hideOverlap: false,
        rotate: rotateLabels ? 35 : 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: appearance.themeColors?.foreground },
    },
    series: echartsSeries as EChartsOption['series'],
  };
};
