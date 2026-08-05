import type { EChartsOption } from 'echarts';
import { filterDataForDisplay } from '#shared/dataviz/filterDataForDisplay.js';
import type { DatavizChartConfig } from '#shared/types/datavizSchema.js';
import type { DatavizAppearance } from '#shared/types/datavizSchema.js';
import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { mapPieOption } from './pieMapper.js';
import { mapBarOption } from './barMapper.js';
import { mapStackedBarOption } from './stackedBarMapper.js';
import { mapLineOption } from './lineMapper.js';
import { mapGaugeOption } from './gaugeMapper.js';
import { mapScatterOption } from './scatterMapper.js';
import { mapHeatmapOption, finalizeHeatmapOption } from './heatmapMapper.js';
import { mergeEChartsOption } from '#shared/dataviz/rendering/mergeEChartsOption.js';

export type MapToEChartsOptionContext = {
  templatesById?: Record<string, { color?: string; name?: string }>;
  templatePropertiesById?: Record<string, Array<{ name: string; label: string }>>;
  sources?: import('#shared/types/datavizSchema.js').DatavizSource[];
  dimensions?: import('#shared/types/datavizSchema.js').DimensionSpec[];
  measures?: import('#shared/types/datavizSchema.js').MeasureSpec[];
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
    dimensions: context.dimensions,
    measures: context.measures,
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

  const merged = mergeEChartsOption(option, chart.echartsOverrides);
  if (chart.type === 'heatmap') {
    return finalizeHeatmapOption(option, merged);
  }

  return merged;
};
