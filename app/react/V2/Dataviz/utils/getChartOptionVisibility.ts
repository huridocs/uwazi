import type { ChartType } from '#V2/Dataviz/types/chartTypes.js';

export type ChartOptionVisibility = {
  legend: boolean;
  legendLabel: string;
  tooltip: boolean;
  labels: boolean;
  missingValues: boolean;
};

const DEFAULT_VISIBILITY: ChartOptionVisibility = {
  legend: true,
  legendLabel: 'Show legend',
  tooltip: true,
  labels: true,
  missingValues: true,
};

const CHART_OPTION_VISIBILITY: Partial<Record<ChartType, Partial<ChartOptionVisibility>>> = {
  heatmap: {
    legend: false,
    tooltip: true,
    labels: true,
    missingValues: true,
  },
  gauge: {
    legend: false,
    tooltip: true,
    labels: false,
    missingValues: false,
  },
  scatter: {
    legend: true,
    tooltip: true,
    labels: true,
    missingValues: true,
  },
  metric: {
    legend: false,
    tooltip: false,
    labels: false,
    missingValues: false,
  },
  list: {
    legend: false,
    tooltip: false,
    labels: false,
    missingValues: true,
  },
};

export const getChartOptionVisibility = (chartType: ChartType): ChartOptionVisibility => ({
  ...DEFAULT_VISIBILITY,
  ...CHART_OPTION_VISIBILITY[chartType],
});
