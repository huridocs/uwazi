import type { EChartsOption } from 'echarts';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { mapPieOption } from './pieMapper.js';
import { mapBarOption } from './barMapper.js';
import { mapStackedBarOption } from './stackedBarMapper.js';
import { mapLineOption } from './lineMapper.js';

export type MapToEChartsOptionContext = {
  templatesById?: Record<string, { color?: string }>;
  themePalette?: string[];
};

export const mapToEChartsOption = (
  data: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: MapToEChartsOptionContext = {}
): EChartsOption | null => {
  switch (chart.type) {
    case 'pie':
    case 'donut':
      return mapPieOption(data, chart, appearance, context);
    case 'stacked_bar':
      return mapStackedBarOption(data, chart, appearance, context);
    case 'bar':
    case 'horizontal_bar':
      return mapBarOption(data, chart, appearance, context);
    case 'line':
    case 'area':
      return mapLineOption(data, chart, appearance);
    case 'list':
    case 'metric':
    case 'gauge':
      return null;
    default:
      return null;
  }
};
