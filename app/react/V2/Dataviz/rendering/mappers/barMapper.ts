import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import {
  resolveCompareSeriesColor,
  resolveCompareSeriesDisplayLabel,
  resolveSeriesColors,
  type ResolveColorContext,
} from '#V2/Dataviz/utils/resolveColors.js';
import {
  alignMultiSeriesForChart,
  isMultiSeriesCompare,
} from '#V2/Dataviz/rendering/alignMultiSeriesForChart.js';
import {
  buildCompareChartGrid,
  buildCompareChartLegend,
} from '#V2/Dataviz/rendering/compareChartLayout.js';

type BarMapperContext = ResolveColorContext;

export const mapBarOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: BarMapperContext = {}
): EChartsOption => {
  const isHorizontal = chart.type === 'horizontal_bar';

  if (isMultiSeriesCompare(dto)) {
    const aligned = alignMultiSeriesForChart(dto);
    const displayLabels = aligned.series.map(item =>
      resolveCompareSeriesDisplayLabel(item.id, item.label, context)
    );
    const seriesColors = aligned.series.map((item, index) =>
      resolveCompareSeriesColor(item.id, item.label, appearance, context, index)
    );
    const categoryAxis = {
      type: 'category' as const,
      data: aligned.categories,
      axisLabel: { color: appearance.themeColors?.foreground },
    };
    const valueAxis = {
      type: 'value' as const,
      axisLabel: { color: appearance.themeColors?.foreground },
    };

    return {
      backgroundColor: appearance.themeColors?.background ?? 'transparent',
      color: seriesColors,
      tooltip: chart.showTooltip ? { trigger: 'axis' } : undefined,
      legend: buildCompareChartLegend(displayLabels, appearance, chart.showLegend),
      grid: buildCompareChartGrid({ isHorizontal, showLegend: chart.showLegend }),
      xAxis: isHorizontal ? valueAxis : categoryAxis,
      yAxis: isHorizontal ? categoryAxis : valueAxis,
      series: aligned.series.map((item, index) => ({
        name: displayLabels[index],
        type: 'bar' as const,
        data: item.values,
        itemStyle: { color: seriesColors[index] },
        label: chart.showLabels
          ? { show: true, position: isHorizontal ? ('right' as const) : ('top' as const) }
          : undefined,
      })),
    };
  }

  const series = dto.series[0];
  if (!series) {
    return { title: { text: 'No data', left: 'center', top: 'center' } };
  }

  const categories = series.points.map(p => p.label);
  const values = series.points.map(p => p.value);
  const colors = resolveSeriesColors(series.points, appearance, context);

  const categoryAxis = {
    type: 'category' as const,
    data: categories,
    axisLabel: { color: appearance.themeColors?.foreground },
  };

  const valueAxis = {
    type: 'value' as const,
    axisLabel: { color: appearance.themeColors?.foreground },
  };

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    tooltip: chart.showTooltip ? { trigger: 'axis' } : undefined,
    grid: { left: isHorizontal ? 80 : 40, right: 20, top: 30, bottom: 40 },
    xAxis: isHorizontal ? valueAxis : categoryAxis,
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series: [
      {
        type: 'bar',
        data: values.map((value, i) => ({
          value,
          itemStyle: { color: colors[i] },
        })),
        label: chart.showLabels ? { show: true, position: isHorizontal ? 'right' : 'top' } : undefined,
      },
    ],
  };
};
