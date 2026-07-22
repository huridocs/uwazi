import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#shared/types/datavizSchema.js';
import type { DatavizAppearance } from '#shared/types/datavizSchema.js';
import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { compareDatavizBucketKeys } from '#shared/dataviz/formatDimensionKeyLabel.js';
import {
  alignPointsToChronologicalCategories,
  collectSecondaryColumns,
  hasCategoricalBreakdown,
  isCompareBreakdownChart,
  sortPointsChronologically,
} from '#shared/dataviz/rendering/compareBreakdownChart.js';
import {
  alignMultiSeriesForChart,
  isMultiSeriesCompare,
} from '#shared/dataviz/rendering/alignMultiSeriesForChart.js';
import {
  resolveCompareSeriesColor,
  resolveCompareSeriesDisplayLabel,
  resolveSeriesColors,
  type ResolveColorContext,
} from '#shared/dataviz/utils/resolveColors.js';
import {
  buildCompareChartGrid,
  buildCompareChartLegend,
} from '#shared/dataviz/rendering/compareChartLayout.js';

const mapCategoricalBreakdownLineOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: ResolveColorContext,
  isArea: boolean
): EChartsOption | null => {
  const secondaryColumns = collectSecondaryColumns(dto.series);
  if (!secondaryColumns.length || !dto.series[0]?.points.length) {
    return null;
  }

  const referencePoints = sortPointsChronologically(dto.series[0].points);
  const categories = referencePoints.map(point => point.label);
  const secondaryPoints = secondaryColumns.map(column => column.sample!).filter(Boolean);
  const segmentColors = resolveSeriesColors(secondaryPoints, appearance, context);
  const compare = isCompareBreakdownChart(dto);

  const echartsSeries = compare
    ? dto.series.flatMap(source =>
        secondaryColumns.map((secondary, secondaryIndex) => ({
          name: `${resolveCompareSeriesDisplayLabel(source.id, source.label, context)} · ${secondary.label}`,
          type: 'line' as const,
          data: alignPointsToChronologicalCategories(
            referencePoints,
            sortPointsChronologically(source.points)
          ).map(point => {
            const match = point.breakdown?.find(item => String(item.key) === secondary.key);
            return match?.value ?? 0;
          }),
          itemStyle: {
            color:
              appearance.valueColorMap?.[secondary.key] ??
              appearance.valueColorMap?.[secondary.label] ??
              segmentColors[secondaryIndex],
          },
          lineStyle: {
            color:
              appearance.valueColorMap?.[secondary.key] ??
              appearance.valueColorMap?.[secondary.label] ??
              segmentColors[secondaryIndex],
          },
          areaStyle: isArea ? {} : undefined,
          smooth: true,
        }))
      )
    : secondaryColumns.map((secondary, secondaryIndex) => ({
        name: secondary.label,
        type: 'line' as const,
        data: alignPointsToChronologicalCategories(
          referencePoints,
          sortPointsChronologically(dto.series[0]!.points)
        ).map(point => {
          const match = point.breakdown?.find(item => String(item.key) === secondary.key);
          return match?.value ?? 0;
        }),
        itemStyle: { color: segmentColors[secondaryIndex] },
        areaStyle: isArea ? {} : undefined,
        smooth: true,
      }));

  const legendLabels = echartsSeries.map(series => String(series.name));

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    color: segmentColors,
    tooltip: chart.showTooltip ? { trigger: 'axis' } : undefined,
    legend: buildCompareChartLegend(legendLabels, appearance, chart.showLegend),
    grid: buildCompareChartGrid({ showLegend: chart.showLegend, left: 50 }),
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: appearance.themeColors?.foreground },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: appearance.themeColors?.foreground },
    },
    series: echartsSeries,
  };
};

export const mapLineOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: ResolveColorContext = {}
): EChartsOption | null => {
  const isArea = chart.type === 'area';

  if (hasCategoricalBreakdown(dto)) {
    return mapCategoricalBreakdownLineOption(dto, chart, appearance, context, isArea);
  }

  if (isMultiSeriesCompare(dto)) {
    const aligned = alignMultiSeriesForChart(dto);
    const displayLabels = aligned.series.map(item =>
      resolveCompareSeriesDisplayLabel(item.id, item.label, context)
    );
    const seriesColors = aligned.series.map((item, index) =>
      resolveCompareSeriesColor(item.id, item.label, appearance, context, index)
    );

    return {
      backgroundColor: appearance.themeColors?.background ?? 'transparent',
      color: seriesColors,
      tooltip: chart.showTooltip ? { trigger: 'axis' } : undefined,
      legend: buildCompareChartLegend(displayLabels, appearance, chart.showLegend),
      grid: buildCompareChartGrid({ showLegend: chart.showLegend, left: 50 }),
      xAxis: {
        type: 'category',
        data: aligned.categories,
        axisLabel: { color: appearance.themeColors?.foreground },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: appearance.themeColors?.foreground },
      },
      series: aligned.series.map((item, index) => ({
        name: displayLabels[index],
        type: 'line' as const,
        data: item.values,
        itemStyle: { color: seriesColors[index] },
        areaStyle: isArea ? {} : undefined,
        smooth: true,
      })),
    };
  }

  const series = dto.series[0];
  if (!series?.points.length) {
    return null;
  }

  const sortedPoints = [...series.points].sort((a, b) => compareDatavizBucketKeys(a.key, b.key));
  const categories = sortedPoints.map(p => p.label);
  const values = sortedPoints.map(p => p.value);

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    tooltip: chart.showTooltip ? { trigger: 'axis' } : undefined,
    grid: { left: 50, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: appearance.themeColors?.foreground },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: appearance.themeColors?.foreground },
    },
    series: [
      {
        type: 'line',
        data: values,
        areaStyle: isArea ? {} : undefined,
        smooth: true,
      },
    ],
  };
};
