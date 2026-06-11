// Mirror of dataviz-requirements §5.3 / §6 — migrate to #shared when backend lands.

export type ChartType =
  | 'pie'
  | 'donut'
  | 'bar'
  | 'horizontal_bar'
  | 'stacked_bar'
  | 'line'
  | 'area'
  | 'list'
  | 'gauge'
  | 'metric'
  | 'scatter'
  | 'heatmap'
  | 'treemap';

export type PieLabelFormat = 'value' | 'percentage' | 'both';

export type DatavizPieOptions = {
  labelFormat?: PieLabelFormat;
  maxSlices?: number;
  othersLabel?: string;
};

export type DatavizChartConfig = {
  type: ChartType;
  orientation?: 'horizontal' | 'vertical';
  stacked?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  excludeZero?: boolean;
  pieOptions?: DatavizPieOptions;
};

export const ALL_CHART_TYPES: ChartType[] = [
  'pie',
  'donut',
  'bar',
  'horizontal_bar',
  'stacked_bar',
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
