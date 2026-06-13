import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';

export const mapGaugeOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance
): EChartsOption => {
  const series = dto.series[0];
  const points = series?.points ?? [];
  const total = dto.meta.totalEntities || points.reduce((sum, point) => sum + point.value, 0);
  const top = points[0];
  const value = top?.value ?? total;
  const max = total || value || 100;
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    tooltip: chart.showTooltip ? { formatter: '{b}: {c} ({d}%)' } : undefined,
    series: [
      {
        type: 'gauge',
        min: 0,
        max: 100,
        progress: { show: true },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: appearance.themeColors?.foreground,
        },
        data: [{ value: percent, name: top?.label ?? 'Total' }],
        axisLabel: { color: appearance.themeColors?.foreground },
        title: { color: appearance.themeColors?.foreground },
      },
    ],
  };
};
