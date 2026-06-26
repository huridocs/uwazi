import type { ChartType, DatavizSource } from '#shared/types/datavizSchema.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';

const CHARTS_WITHOUT_TEMPLATE_MODE: ChartType[] = ['heatmap', 'stacked_bar'];

export const supportsTemplateColorMode = (
  chartType: ChartType,
  sources: DatavizSource[],
  primaryDimensionProperty?: string
): boolean => {
  if (CHARTS_WITHOUT_TEMPLATE_MODE.includes(chartType)) {
    return false;
  }

  return sources.length > 1 || primaryDimensionProperty === TEMPLATE_DIMENSION_PROPERTY;
};
