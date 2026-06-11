import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { resolveSeriesColors, type ResolveColorContext } from '#V2/Dataviz/utils/resolveColors.js';

type BarMapperContext = ResolveColorContext;

export const mapBarOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: BarMapperContext = {}
): EChartsOption => {
  const series = dto.series[0];
  if (!series) {
    return { title: { text: 'No data', left: 'center', top: 'center' } };
  }

  const isHorizontal = chart.type === 'horizontal_bar';
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
