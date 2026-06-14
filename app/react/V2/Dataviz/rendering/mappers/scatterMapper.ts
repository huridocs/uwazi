import type { CallbackDataParams } from 'echarts/types/dist/shared.js';
import type { EChartsOption } from 'echarts';
import type { DataPoint } from '#shared/types/datavizSchema.js';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { resolveSeriesColors, type ResolveColorContext } from '#V2/Dataviz/utils/resolveColors.js';
import {
  buildValueAxis,
  computePaddedAxisBounds,
  formatValueAxisTick,
} from '#V2/Dataviz/rendering/valueAxis.js';
import type { DimensionSpec } from '#shared/types/datavizSchema.js';
import {
  buildScatterDateAxis,
  computeYearAxisBounds,
  resolveScatterDateAxisMode,
  scatterDateKeyToAxisValue,
} from '#V2/Dataviz/utils/scatterDateAxis.js';
import {
  resolveDimensionAxisLabel,
} from '#V2/Dataviz/utils/resolveDimensionAxisLabel.js';

type ScatterMapperContext = ResolveColorContext & {
  dimensions?: DimensionSpec[];
  templatePropertiesById?: Record<string, Array<{ name: string; label: string }>>;
};

type ScatterDatum = {
  value: [number, number];
  name: string;
  itemStyle?: { color?: string };
  symbolSize?: number;
  primaryLabel: string;
  secondaryLabel?: string;
  count: number;
  breakdown?: DataPoint[];
};

const hasNumericBreakdown = (points: DataPoint[]): boolean =>
  points.some(point =>
    point.breakdown?.some(item => {
      const y = Number(item.key);
      return Number.isFinite(y) && typeof item.key === 'number';
    })
  );

const pointHasNumericOrDateKey = (key: DataPoint['key']): boolean => {
  if (scatterDateKeyToAxisValue(key) !== undefined) {
    return true;
  }
  return typeof key === 'number' && Number.isFinite(key);
};

const MIN_SYMBOL_SIZE = 5;
const MAX_SYMBOL_SIZE = 22;

/** Bubble diameter in px; count=1 stays small; largest bucket caps at MAX_SYMBOL_SIZE. */
const scaleSymbolSize = (count: number, maxCount: number): number => {
  if (count <= 0) {
    return 0;
  }
  if (maxCount <= 1) {
    return MIN_SYMBOL_SIZE;
  }
  const ratio = (count - 1) / (maxCount - 1);
  return Math.round(MIN_SYMBOL_SIZE + ratio * (MAX_SYMBOL_SIZE - MIN_SYMBOL_SIZE));
};

const formatScatterTooltip = (params: CallbackDataParams): string => {
  const data = params.data as ScatterDatum;
  if (!data || !Array.isArray(data.value)) {
    return '';
  }

  if (data.secondaryLabel) {
    return [
      `<strong>${data.primaryLabel}</strong>`,
      `Value: ${data.secondaryLabel}`,
      `Count: ${data.count}`,
    ].join('<br/>');
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

const mapNumericCrossTabScatter = (
  points: DataPoint[],
  _chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: ScatterMapperContext
): ScatterDatum[] => {
  const flat = points.flatMap(point => {
    const x = scatterDateKeyToAxisValue(point.key) ?? Number(point.key);
    return (point.breakdown ?? [])
      .filter(item => item.value > 0)
      .map(item => ({
        point,
        item,
        x,
        y: Number(item.key),
        count: item.value,
      }));
  });

  const maxCount = Math.max(...flat.map(entry => entry.count), 1);
  const colors = resolveSeriesColors(
    flat.map(entry => entry.item),
    appearance,
    context
  );

  return flat.map((entry, index) => ({
    value: [entry.x, entry.y],
    symbolSize: scaleSymbolSize(entry.count, maxCount),
    itemStyle: { color: colors[index] },
    name: `${entry.point.label} · ${entry.item.label}`,
    primaryLabel: entry.point.label,
    secondaryLabel: entry.item.label,
    count: entry.count,
  }));
};

const resolveScatterAxisName = (
  dimensionIndex: number,
  context: ScatterMapperContext
): string | undefined =>
  resolveDimensionAxisLabel(
    context.dimensions?.[dimensionIndex],
    context.sources,
    context.templatePropertiesById
  );

const shouldShowScatterLabels = (
  chart: DatavizChartConfig,
  _scatterData: ScatterDatum[],
  useNumericCrossTab: boolean
): boolean => {
  if (!chart.showLabels || useNumericCrossTab) {
    return false;
  }

  return true;
};

export const mapScatterOption = (
  dto: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: ScatterMapperContext = {}
): EChartsOption | null => {
  const series = dto.series[0];
  if (!series?.points.length) {
    return null;
  }

  const useNumericCrossTab = hasNumericBreakdown(series.points);
  if (!useNumericCrossTab && !series.points.some(point => pointHasNumericOrDateKey(point.key))) {
    return null;
  }

  const scatterData: ScatterDatum[] = useNumericCrossTab
    ? mapNumericCrossTabScatter(series.points, chart, appearance, context)
    : (() => {
        const colors = resolveSeriesColors(series.points, appearance, context);
        return series.points.map((point, index) => {
          const x =
            scatterDateKeyToAxisValue(point.key) ??
            (() => {
              const numeric = Number(point.key);
              return Number.isFinite(numeric) ? numeric : index + 1;
            })();
          return {
            value: [x, point.value],
            itemStyle: { color: colors[index] },
            name: point.label,
            primaryLabel: point.label,
            count: point.value,
            breakdown: point.breakdown,
          };
        });
      })();

  if (!scatterData.length) {
    return null;
  }

  const xValues = scatterData.map(point => point.value[0]);
  const yValues = scatterData.map(point => point.value[1]);
  const dateAxisMode = resolveScatterDateAxisMode(series.points.map(point => point.key));
  const xBounds = dateAxisMode === 'year' ? computeYearAxisBounds(xValues) : computePaddedAxisBounds(xValues);
  const yBounds = useNumericCrossTab
    ? computePaddedAxisBounds(yValues)
    : { min: 0, max: undefined };

  const showAxisNames = chart.showLegend !== false;
  const xAxisName = showAxisNames ? resolveScatterAxisName(0, context) : undefined;
  const yAxisName =
    showAxisNames && useNumericCrossTab ? resolveScatterAxisName(1, context) : undefined;

  const xAxis =
    dateAxisMode !== undefined
      ? buildScatterDateAxis({
          axisLabelColor: appearance.themeColors?.foreground,
          name: xAxisName,
          nameGap: 28,
          min: xBounds.min,
          max: xBounds.max,
        })
      : buildValueAxis({
          axisLabelColor: appearance.themeColors?.foreground,
          name: xAxisName,
          nameGap: 28,
          scale: true,
          min: xBounds.min,
          max: xBounds.max,
          formatTick: formatValueAxisTick,
        });

  return {
    backgroundColor: appearance.themeColors?.background ?? 'transparent',
    tooltip: chart.showTooltip
      ? {
          trigger: 'item',
          formatter: formatScatterTooltip,
        }
      : undefined,
    grid: {
      left: yAxisName ? 72 : 56,
      right: 20,
      top: 30,
      bottom: xAxisName ? 56 : 48,
      containLabel: true,
    },
    xAxis,
    yAxis: buildValueAxis({
      axisLabelColor: appearance.themeColors?.foreground,
      name: yAxisName,
      nameGap: 50,
      nameLocation: 'middle',
      nameRotate: 90,
      scale: useNumericCrossTab,
      min: yBounds.min,
      max: yBounds.max,
      formatTick: formatValueAxisTick,
    }),
    series: [
      {
        type: 'scatter',
        data: scatterData,
        label: shouldShowScatterLabels(chart, scatterData, useNumericCrossTab)
          ? { show: true, position: 'top', formatter: '{b}' }
          : undefined,
      },
    ],
  };
};

export { formatScatterTooltip, scaleSymbolSize, type ScatterDatum };
