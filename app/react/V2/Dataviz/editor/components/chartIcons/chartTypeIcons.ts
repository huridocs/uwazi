import type { ComponentType } from 'react';
import {
  ChartBarIcon,
  ChartPieIcon,
  ListBulletIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import type { ChartType } from '#V2/Dataviz/types/chartTypes.js';
import type { ChartIconProps } from './ChartIconProps.js';
import { AreaChartIcon } from './AreaChartIcon.js';
import { HeatmapChartIcon } from './HeatmapChartIcon.js';
import { LineChartIcon } from './LineChartIcon.js';
import { ScatterPlotIcon } from './ScatterPlotIcon.js';

export const CHART_TYPE_ICONS: Partial<Record<ChartType, ComponentType<ChartIconProps>>> = {
  pie: ChartPieIcon,
  donut: ChartPieIcon,
  bar: ChartBarIcon,
  horizontal_bar: ChartBarIcon,
  stacked_bar: ChartBarIcon,
  heatmap: HeatmapChartIcon,
  line: LineChartIcon,
  area: AreaChartIcon,
  scatter: ScatterPlotIcon,
  list: ListBulletIcon,
  gauge: SignalIcon,
  metric: SignalIcon,
};

export const DEFAULT_CHART_TYPE_ICON = ChartBarIcon;
