import type { EChartsOption, LegendComponentOption } from 'echarts';
import type { DatavizChartConfig } from '#shared/types/datavizSchema.js';
import type { DatavizAppearance } from '#shared/types/datavizSchema.js';
import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { chartTextStyle } from '#shared/dataviz/rendering/chartTheme.js';
import { resolveSeriesColors, type ResolveColorContext } from '#shared/dataviz/utils/resolveColors.js';

type PieMapperContext = ResolveColorContext;

const applyMaxSlices = (
  data: { name: string; value: number }[],
  maxSlices: number,
  othersLabel: string
) => {
  if (data.length <= maxSlices) return data;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, maxSlices - 1);
  const rest = sorted.slice(maxSlices - 1);
  const otherValue = rest.reduce((sum, item) => sum + item.value, 0);
  return [...top, { name: othersLabel, value: otherValue }];
};

const buildPieLegend = (
  names: string[],
  appearance: DatavizAppearance,
  showLegend?: boolean
): LegendComponentOption | undefined => {
  if (showLegend === false || names.length === 0) {
    return undefined;
  }

  return {
    type: names.length > 8 ? 'scroll' : 'plain',
    orient: 'vertical',
    right: 8,
    top: 'middle',
    height: names.length > 8 ? '75%' : undefined,
    data: names,
    itemWidth: 12,
    itemHeight: 8,
    itemGap: 10,
    textStyle: chartTextStyle(appearance),
  };
};

export const mapPieOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: PieMapperContext = {}
): EChartsOption | null => {
  const series = dto.series[0];
  if (!series?.points.length) {
    return null;
  }

  const maxSlices = chart.pieOptions?.maxSlices ?? 10;
  const othersLabel = chart.pieOptions?.othersLabel ?? 'Other';
  const isDonut = chart.type === 'donut';

  let chartData = series.points.map(p => ({ name: p.label, value: p.value }));
  chartData = applyMaxSlices(chartData, maxSlices, othersLabel);

  const colors = resolveSeriesColors(
    series.points.slice(0, chartData.length),
    appearance,
    context
  );

  const labelFormat = chart.pieOptions?.labelFormat ?? 'percentage';
  const formatter =
    labelFormat === 'value'
      ? '{b}: {c}'
      : labelFormat === 'both'
        ? '{b}: {c} ({d}%)'
        : '{b}: {d}%';
  const legendNames = chartData.map(item => item.name);
  const showLegend = chart.showLegend ?? true;
  const labelColor = chartTextStyle(appearance).color;

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    color: colors,
    tooltip: chart.showTooltip
      ? { trigger: 'item', formatter: '{b}: {c} ({d}%)' }
      : undefined,
    legend: buildPieLegend(legendNames, appearance, showLegend),
    series: [
      {
        type: 'pie',
        radius: isDonut ? ['40%', '70%'] : '70%',
        center: showLegend ? ['38%', '50%'] : ['50%', '50%'],
        data: chartData,
        label: {
          show: chart.showLabels ?? true,
          formatter,
          color: labelColor,
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
        },
      },
    ],
  };
};
