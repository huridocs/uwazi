import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#shared/types/datavizSchema.js';
import type { DatavizAppearance } from '#shared/types/datavizSchema.js';
import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { compareDatavizBucketKeys } from '#shared/dataviz/formatDimensionKeyLabel.js';
import {
  alignMultiSeriesForChart,
  isMultiSeriesCompare,
} from '#shared/dataviz/rendering/alignMultiSeriesForChart.js';
import {
  resolveCompareSeriesColor,
  resolveCompareSeriesDisplayLabel,
  type ResolveColorContext,
} from '#shared/dataviz/utils/resolveColors.js';
import {
  buildCompareChartGrid,
  buildCompareChartLegend,
} from '#shared/dataviz/rendering/compareChartLayout.js';

export const mapLineOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: ResolveColorContext = {}
): EChartsOption | null => {
  const isArea = chart.type === 'area';

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
