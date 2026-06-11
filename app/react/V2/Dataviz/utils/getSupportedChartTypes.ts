import type { ChartType } from '#V2/Dataviz/types/chartTypes.js';
import type { DimensionSpec, MeasureSpec } from '#V2/Dataviz/types/definition.js';
import { isCategoricalDimension, isTwoDimensionalQuery } from './twoDimensionalQuery.js';

export type ChartTypeAvailability = {
  type: ChartType;
  enabled: boolean;
  reason?: string;
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

export const getSupportedChartTypes = (
  dimensions: DimensionSpec[],
  measures: MeasureSpec[]
): ChartTypeAvailability[] => {
  const twoD = isTwoDimensionalQuery(dimensions);
  const dimType = dimensionType(dimensions);
  const hasDim = hasDimension(dimensions);
  const count = isCountMeasure(measures);
  const sum = isSumMeasure(measures);

  const categorical = isCategoricalDimension(dimensions[0]);
  const dateDim = dimType && DATE_TYPES.has(dimType);
  const numericDim = dimType && NUMERIC_TYPES.has(dimType);

  const avail = (type: ChartType, enabled: boolean, reason?: string): ChartTypeAvailability => ({
    type,
    enabled,
    reason,
  });

  if (twoD) {
    return [
      avail('stacked_bar', Boolean(count), 'Requires count measure'),
      avail('bar', Boolean(count), 'Shows primary dimension totals only'),
      avail('horizontal_bar', Boolean(count), 'Shows primary dimension totals only'),
      avail('list', Boolean(count), 'Shows primary dimension totals only'),
      avail('pie', false, 'Requires a single dimension'),
      avail('donut', false, 'Requires a single dimension'),
      avail('line', false, 'Requires a single date dimension'),
      avail('area', false, 'Requires a single date dimension'),
      avail('gauge', false, 'Not available with two dimensions'),
      avail('metric', false, 'Not available with two dimensions'),
      avail('scatter', false, 'Requires numeric dimension'),
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
    avail('line', Boolean(hasDim && dateDim && (count || sum)), 'Requires date dimension'),
    avail('area', Boolean(hasDim && dateDim && count), 'Requires date dimension'),
    avail(
      'stacked_bar',
      false,
      'Add a second categorical dimension (e.g. sex split by country)'
    ),
    avail('scatter', Boolean(numericDim && sum), 'Requires numeric dimension'),
  ];
};

export const getEnabledChartTypes = (
  dimensions: DimensionSpec[],
  measures: MeasureSpec[]
): ChartType[] =>
  getSupportedChartTypes(dimensions, measures)
    .filter(item => item.enabled)
    .map(item => item.type);
