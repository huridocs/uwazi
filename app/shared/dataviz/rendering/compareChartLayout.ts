import type { GridComponentOption, LegendComponentOption } from 'echarts';
import type { DatavizAppearance } from '#shared/types/datavizSchema.js';
import { chartTextStyle } from './chartTheme.js';

export const buildCompareChartLegend = (
  labels: string[],
  appearance: DatavizAppearance,
  showLegend?: boolean
): LegendComponentOption | undefined => {
  if (showLegend === false || labels.length === 0) {
    return undefined;
  }

  return {
    data: labels,
    bottom: 6,
    left: 'center',
    orient: 'horizontal',
    itemGap: 20,
    itemWidth: 12,
    itemHeight: 8,
    padding: [4, 0, 0, 0],
    textStyle: chartTextStyle(appearance),
  };
};

type CompareGridOptions = {
  isHorizontal?: boolean;
  showLegend?: boolean;
  left?: number;
};

export const buildCompareChartGrid = ({
  isHorizontal = false,
  showLegend = true,
  left,
}: CompareGridOptions = {}): GridComponentOption => ({
  left: left ?? (isHorizontal ? 80 : 40),
  right: 20,
  top: 30,
  bottom: showLegend !== false ? 64 : 28,
  containLabel: true,
});
