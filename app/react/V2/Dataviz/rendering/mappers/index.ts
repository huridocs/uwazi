import type { EChartsOption } from 'echarts';
import { filterDataForDisplay } from '#V2/Dataviz/rendering/filterDataForDisplay.js';
import type { DatavizChartConfig } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { mapPieOption } from './pieMapper.js';
import { mapBarOption } from './barMapper.js';
import { mapStackedBarOption } from './stackedBarMapper.js';
import { mapLineOption } from './lineMapper.js';
import { mapGaugeOption } from './gaugeMapper.js';
import { mapScatterOption } from './scatterMapper.js';
import { mapHeatmapOption } from './heatmapMapper.js';
import { mergeEChartsOption } from '../mergeEChartsOption.js';

export type MapToEChartsOptionContext = {
  templatesById?: Record<string, { color?: string; name?: string }>;
  sources?: import('#shared/types/datavizSchema.js').DatavizSource[];
  themePalette?: string[];
  locale?: string;
  defaultLocale?: string;
};

export const mapToEChartsOption = (
  data: DatavizDataDTO,
  chart: DatavizChartConfig,
  appearance: DatavizAppearance,
  context: MapToEChartsOptionContext = {}
): EChartsOption | null => {
  const displayData = filterDataForDisplay(data, chart, {
    locale: context.locale,
    defaultLocale: context.defaultLocale,
  });

  let option: EChartsOption | null;
  switch (chart.type) {
    case 'pie':
    case 'donut':
      option = mapPieOption(displayData, chart, appearance, context);
      break;
    case 'stacked_bar':
      option = mapStackedBarOption(displayData, chart, appearance, context);
      break;
    case 'heatmap':
      option = mapHeatmapOption(displayData, chart, appearance, context);
      break;
    case 'bar':
    case 'horizontal_bar':
      option = mapBarOption(displayData, chart, appearance, context);
      break;
    case 'line':
    case 'area':
      option = mapLineOption(displayData, chart, appearance, context);
      break;
    case 'gauge':
      option = mapGaugeOption(displayData, chart, appearance);
      break;
    case 'scatter':
      option = mapScatterOption(displayData, chart, appearance, context);
      break;
    case 'list':
    case 'metric':
      return null;
    default:
      return null;
  }

  if (!option) {
    return null;
  }

  return mergeEChartsOption(option, chart.echartsOverrides);
};
