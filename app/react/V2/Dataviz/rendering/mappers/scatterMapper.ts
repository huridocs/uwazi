import type { CallbackDataParams } from 'echarts/types/dist/shared.js';
import type { EChartsOption } from 'echarts';
import type { DataPoint } from '#shared/types/datavizSchema.js';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { resolveSeriesColors, type ResolveColorContext } from '#V2/Dataviz/utils/resolveColors.js';

type ScatterDatum = {
  value: [number, number];
  name: string;
  itemStyle?: { color?: string };
  primaryLabel: string;
  count: number;
  breakdown?: DataPoint[];
};

const formatScatterTooltip = (params: CallbackDataParams): string => {
  const data = params.data as ScatterDatum;
  if (!data || !Array.isArray(data.value)) {
    return '';
  }

  const lines = [`<strong>${data.primaryLabel}</strong>`, `Count: ${data.count}`];

  if (data.breakdown?.length) {
    lines.push('');
    data.breakdown.forEach(item => {
      lines.push(`${item.label}: ${item.value}`);
    });
  }

  return lines.join('<br/>');
};

export const mapScatterOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: ResolveColorContext = {}
): EChartsOption => {
  const series = dto.series[0];
  if (!series?.points.length) {
    return { title: { text: 'No data', left: 'center', top: 'center' } };
  }

  const colors = resolveSeriesColors(series.points, appearance, context);
  const scatterData: ScatterDatum[] = series.points.map((point, index) => {
    const x = Number(point.key);
    return {
      value: [Number.isFinite(x) ? x : index + 1, point.value],
      itemStyle: { color: colors[index] },
      name: point.label,
      primaryLabel: point.label,
      count: point.value,
      breakdown: point.breakdown,
    };
  });

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    tooltip: chart.showTooltip
      ? {
          trigger: 'item',
          formatter: formatScatterTooltip,
        }
      : undefined,
    grid: { left: 48, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'value',
      axisLabel: { color: appearance.themeColors?.foreground },
    },
    yAxis: {
      type: 'value',
      name: 'Count',
      nameGap: 40,
      axisLabel: { color: appearance.themeColors?.foreground },
    },
    series: [
      {
        type: 'scatter',
        data: scatterData,
        label: chart.showLabels ? { show: true, position: 'top', formatter: '{b}' } : undefined,
      },
    ],
  };
};

export { formatScatterTooltip, type ScatterDatum };
