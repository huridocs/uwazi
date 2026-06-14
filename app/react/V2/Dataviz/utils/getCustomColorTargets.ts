import type { ChartType } from '#shared/types/datavizSchema.js';
import type { DataPoint, DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { isMultiSeriesCompare } from '#V2/Dataviz/rendering/alignMultiSeriesForChart.js';
import {
  resolveCompareSeriesDisplayLabel,
  type ResolveColorContext,
} from '#V2/Dataviz/utils/resolveColors.js';

export type CustomColorTargetKind = 'none' | 'bucket' | 'series' | 'stacked_series';

export type CustomColorTarget = {
  key: string;
  label: string;
  defaultColor?: string;
};

const CHARTS_WITHOUT_CUSTOM: ChartType[] = ['list', 'metric', 'gauge'];

const COMPARE_SERIES_CHARTS: ChartType[] = ['line', 'area', 'bar', 'horizontal_bar'];

const SINGLE_SERIES_LINE_CHARTS: ChartType[] = ['line', 'area'];

const collectBreakdownTargets = (points: DataPoint[]): CustomColorTarget[] => {
  const seriesMap = new Map<string, CustomColorTarget>();

  points.forEach(point => {
    point.breakdown?.forEach(item => {
      const key = String(item.key);
      if (!seriesMap.has(key)) {
        seriesMap.set(key, {
          key,
          label: item.label,
          defaultColor: item.color,
        });
      }
    });
  });

  return Array.from(seriesMap.values());
};

export const getCustomColorTargetKind = (
  chartType: ChartType,
  data: DatavizDataDTO | null | undefined
): CustomColorTargetKind => {
  if (!data?.series.length) {
    return 'none';
  }

  if (CHARTS_WITHOUT_CUSTOM.includes(chartType)) {
    return 'none';
  }

  if (chartType === 'stacked_bar' || chartType === 'heatmap') {
    return hasBreakdownTargets(data) ? 'stacked_series' : 'none';
  }

  if (COMPARE_SERIES_CHARTS.includes(chartType) && isMultiSeriesCompare(data)) {
    return 'series';
  }

  if (SINGLE_SERIES_LINE_CHARTS.includes(chartType)) {
    return 'none';
  }

  return 'bucket';
};

const hasBreakdownTargets = (data: DatavizDataDTO): boolean =>
  collectBreakdownTargets(data.series[0]?.points ?? []).length > 0;

export const supportsCustomColorMode = (
  chartType: ChartType,
  data: DatavizDataDTO | null | undefined
): boolean => getCustomColorTargetKind(chartType, data) !== 'none';

export const getCustomColorTargets = (
  chartType: ChartType,
  data: DatavizDataDTO | null | undefined,
  context: ResolveColorContext = {}
): CustomColorTarget[] => {
  const kind = getCustomColorTargetKind(chartType, data);
  if (!data || kind === 'none') {
    return [];
  }

  if (kind === 'series') {
    return data.series.map(series => ({
      key: series.id,
      label: resolveCompareSeriesDisplayLabel(series.id, series.label, context),
    }));
  }

  if (kind === 'stacked_series') {
    return collectBreakdownTargets(data.series[0]?.points ?? []);
  }

  const points = data.series[0]?.points ?? [];
  return points.map(point => ({
    key: String(point.key),
    label: point.label,
    defaultColor: point.color,
  }));
};

export const CUSTOM_COLOR_TARGET_HINTS: Record<
  Exclude<CustomColorTargetKind, 'none'>,
  string
> = {
  series: 'Override the color of each data series (line or bar group).',
  bucket: 'Override the color of each category or slice.',
  stacked_series: 'Override the color of each stack segment or heatmap column.',
};
