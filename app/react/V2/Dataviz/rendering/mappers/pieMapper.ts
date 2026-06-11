import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { resolveSeriesColors, type ResolveColorContext } from '#V2/Dataviz/utils/resolveColors.js';

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

export const mapPieOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: PieMapperContext = {}
): EChartsOption => {
  const series = dto.series[0];
  if (!series) {
    return { title: { text: 'No data', left: 'center', top: 'center' } };
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

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    color: colors,
    tooltip: chart.showTooltip
      ? { trigger: 'item', formatter: '{b}: {c} ({d}%)' }
      : undefined,
    legend: chart.showLegend
      ? { orient: 'vertical', right: 10, top: 'center', textStyle: { color: appearance.themeColors?.foreground } }
      : undefined,
    series: [
      {
        type: 'pie',
        radius: isDonut ? ['40%', '70%'] : '70%',
        center: chart.showLegend ? ['40%', '50%'] : ['50%', '50%'],
        data: chartData,
        label: {
          show: chart.showLabels ?? true,
          formatter,
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
        },
      },
    ],
  };
};
