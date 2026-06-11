import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DataPoint, DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { resolveSeriesColors, type ResolveColorContext } from '#V2/Dataviz/utils/resolveColors.js';

type StackedBarMapperContext = ResolveColorContext;

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

export const mapStackedBarOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: StackedBarMapperContext = {}
): EChartsOption => {
  const primary = dto.series[0];
  if (!primary?.points.length) {
    return { title: { text: 'No data', left: 'center', top: 'center' } };
  }

  const categories = primary.points.map(p => p.label);
  const secondarySeries = collectSecondarySeries(primary.points);
  const secondaryPoints = secondarySeries.map(s => s.sample!).filter(Boolean);
  const seriesColors = resolveSeriesColors(secondaryPoints, appearance, context);

  const echartsSeries = secondarySeries.map((item, index) => ({
    name: item.label,
    type: 'bar' as const,
    stack: 'total',
    emphasis: { focus: 'series' as const },
    data: primary.points.map(point => {
      const match = point.breakdown?.find(b => String(b.key) === item.key);
      return match?.value ?? 0;
    }),
    itemStyle: { color: seriesColors[index] },
    label: chart.showLabels ? { show: true, position: 'inside' as const } : undefined,
  }));

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    color: seriesColors,
    tooltip: chart.showTooltip ? { trigger: 'axis', axisPointer: { type: 'shadow' } } : undefined,
    legend: chart.showLegend
      ? {
          top: 0,
          textStyle: { color: appearance.themeColors?.foreground },
        }
      : undefined,
    grid: { left: 40, right: 20, top: chart.showLegend ? 40 : 30, bottom: 40 },
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
