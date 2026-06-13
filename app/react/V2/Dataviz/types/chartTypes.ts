export type {
  ChartType,
  PieLabelFormat,
  DatavizPieOptions,
  DatavizChartConfig,
} from '#shared/types/datavizSchema.js';

import type { ChartType } from '#shared/types/datavizSchema.js';

export const ALL_CHART_TYPES: ChartType[] = [
  'pie',
  'donut',
  'bar',
  'horizontal_bar',
  'stacked_bar',
  'heatmap',
  'line',
  'area',
  'list',
  'gauge',
  'metric',
];

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  pie: 'Pie',
  donut: 'Donut',
  bar: 'Bar',
  horizontal_bar: 'Horizontal bar',
  stacked_bar: 'Stacked bar',
  line: 'Line',
  area: 'Area',
  list: 'List',
  gauge: 'Gauge',
  metric: 'Metric',
  scatter: 'Scatter',
  heatmap: 'Heatmap',
  treemap: 'Treemap',
};

export const isEchartsChartType = (type: ChartType): boolean =>
  type !== 'list' && type !== 'metric';
