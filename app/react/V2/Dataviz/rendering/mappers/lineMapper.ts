import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';

export const mapLineOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance
): EChartsOption => {
  const series = dto.series[0];
  if (!series) {
    return { title: { text: 'No data', left: 'center', top: 'center' } };
  }

  const categories = series.points.map(p => p.label);
  const values = series.points.map(p => p.value);
  const isArea = chart.type === 'area';

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
