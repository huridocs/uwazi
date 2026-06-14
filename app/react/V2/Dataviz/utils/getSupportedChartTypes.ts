import { EDITOR_CHART_TYPES, type ChartType } from '#V2/Dataviz/types/chartTypes.js';
import type { DimensionSpec, MeasureSpec } from '#V2/Dataviz/types/definition.js';
import { isCategoricalDimension, isNumericCrossTabQuery, isSequentialDimension, isTwoDimensionalQuery } from './twoDimensionalQuery.js';

export type ChartTypeAvailability = {
  type: ChartType;
  enabled: boolean;
  reason?: string;
};

export type GetSupportedChartTypesOptions = {
  isManual?: boolean;
};

const DATE_TYPES = new Set(['date', 'daterange', 'multidate', 'multidaterange']);
const NUMERIC_TYPES = new Set(['numeric']);

const hasDimension = (dimensions: DimensionSpec[]) => dimensions.length > 0;

const dimensionType = (dimensions: DimensionSpec[]): DimensionSpec['propertyType'] | undefined =>
  dimensions[0]?.propertyType;

const isCountMeasure = (measures: MeasureSpec[]) =>
  measures.some(m => m.aggregation === 'count');

const isSumMeasure = (measures: MeasureSpec[]) =>
  measures.some(m => ['sum', 'avg', 'min', 'max'].includes(m.aggregation));

const getManualSupportedChartTypes = (): ChartTypeAvailability[] =>
  EDITOR_CHART_TYPES.map(type => ({ type, enabled: true }));

export const getSupportedChartTypes = (
  dimensions: DimensionSpec[],
  measures: MeasureSpec[],
  options: GetSupportedChartTypesOptions = {}
): ChartTypeAvailability[] => {
  if (options.isManual) {
    return getManualSupportedChartTypes();
  }

  const twoD = isTwoDimensionalQuery(dimensions);
  const numericCrossTab = isNumericCrossTabQuery(dimensions);
  const anyTwoD = dimensions.length >= 2;
  const hasDim = hasDimension(dimensions);
  const count = isCountMeasure(measures);
  const sum = isSumMeasure(measures);
  const dimType = dimensionType(dimensions);
  const categorical = isCategoricalDimension(dimensions[0]);
  const dateDim = dimType && DATE_TYPES.has(dimType);
  const numericDim = dimType && NUMERIC_TYPES.has(dimType);
  const sequentialDim = isSequentialDimension(dimensions[0]);

  const avail = (type: ChartType, enabled: boolean, reason?: string): ChartTypeAvailability => ({
    type,
    enabled,
    reason,
  });

  if (twoD) {
    return [
      avail('stacked_bar', Boolean(count), 'Requires count measure'),
      avail('heatmap', Boolean(count), 'Requires count measure'),
      avail('list', Boolean(count), 'Cross-tab table of both dimensions'),
      avail('bar', false, 'Requires a single dimension'),
      avail('horizontal_bar', false, 'Requires a single dimension'),
      avail('pie', false, 'Requires a single dimension'),
      avail('donut', false, 'Requires a single dimension'),
      avail('line', false, 'Requires a single date dimension'),
      avail('area', false, 'Requires a single date dimension'),
      avail('gauge', false, 'Not available with two dimensions'),
      avail('metric', false, 'Not available with two dimensions'),
      avail('scatter', false, 'Requires numeric cross-tab dimensions'),
    ];
  }

  if (numericCrossTab) {
    return [
      avail('scatter', Boolean(count), 'Plots year vs numeric breakdown'),
      avail('heatmap', Boolean(count), 'Requires count measure'),
      avail('list', Boolean(count), 'Cross-tab table of both dimensions'),
      avail('stacked_bar', false, 'Requires two categorical dimensions'),
      avail('bar', false, 'Requires a single dimension'),
      avail('horizontal_bar', false, 'Requires a single dimension'),
      avail('pie', false, 'Requires a single dimension'),
      avail('donut', false, 'Requires a single dimension'),
      avail('line', false, 'Requires a single dimension'),
      avail('area', false, 'Requires a single dimension'),
      avail('gauge', false, 'Not available with two dimensions'),
      avail('metric', false, 'Not available with two dimensions'),
    ];
  }

  if (anyTwoD) {
    return [
      avail('heatmap', Boolean(count), 'Requires count measure'),
      avail('list', Boolean(count), 'Cross-tab table of both dimensions'),
      avail('scatter', false, 'Requires date/numeric × numeric dimensions'),
      avail('stacked_bar', false, 'Requires two categorical dimensions'),
      avail('bar', false, 'Requires a single dimension'),
      avail('line', false, 'Requires a single dimension'),
      avail('area', false, 'Requires a single dimension'),
    ];
  }

  return [
    avail('pie', Boolean(hasDim && categorical && count), 'Requires select dimension + count'),
    avail('donut', Boolean(hasDim && categorical && count), 'Requires select dimension + count'),
    avail('bar', Boolean(hasDim && (categorical || dateDim || numericDim) && count), 'Requires dimension + count'),
    avail(
      'horizontal_bar',
      Boolean(hasDim && categorical && count),
      'Requires select dimension + count'
    ),
    avail('list', Boolean(hasDim && categorical && count), 'Requires select dimension + count'),
    avail('gauge', Boolean(hasDim && count), 'Requires dimension + count'),
    avail('metric', Boolean(count && !hasDim), 'Count without dimension'),
    avail(
      'line',
      Boolean(hasDim && sequentialDim && (count || sum)),
      'Requires date or numeric dimension'
    ),
    avail('area', Boolean(hasDim && sequentialDim && count), 'Requires date or numeric dimension'),
    avail(
      'stacked_bar',
      false,
      'Add a second categorical dimension (e.g. sex split by country)'
    ),
    avail('heatmap', false, 'Add a second categorical dimension'),
    avail('scatter', Boolean(numericDim && sum), 'Requires numeric dimension'),
  ];
};

export const getEnabledChartTypes = (
  dimensions: DimensionSpec[],
  measures: MeasureSpec[],
  options: GetSupportedChartTypesOptions = {}
): ChartType[] =>
  getSupportedChartTypes(dimensions, measures, options)
    .filter(item => item.enabled)
    .map(item => item.type);
