import type { ChartType } from '#V2/Dataviz/types/chartTypes.js';
import type {
  DatavizChartConfig,
  DatavizDataSourceKind,
  DimensionSpec,
  MeasureSpec,
} from '#V2/Dataviz/types/definition.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { getEnabledChartTypes } from './getSupportedChartTypes.js';

const stackedBarPatch = (): Partial<DatavizChartConfig> => ({
  type: 'stacked_bar',
  stacked: true,
  showLegend: true,
});

const resolveChartPatchForQuery = (
  currentChart: DatavizChartConfig,
  dimensions: DimensionSpec[],
  measures: MeasureSpec[],
  dataSource?: DatavizDataSourceKind
): Partial<DatavizChartConfig> | null => {
  const enabled = getEnabledChartTypes(dimensions, measures, {
    isManual: isManualDataSource(dataSource),
  });

  if (enabled.length === 0) {
    return null;
  }

  if (enabled.includes(currentChart.type)) {
    if (
      !isManualDataSource(dataSource) &&
      currentChart.type === 'stacked_bar' &&
      dimensions.length < 2
    ) {
      return { type: 'bar', stacked: false };
    }
    return null;
  }

  const nextType: ChartType = enabled[0]!;

  if (nextType === 'stacked_bar') {
    return stackedBarPatch();
  }

  return { type: nextType };
};

export { resolveChartPatchForQuery };
