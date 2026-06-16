import type {
  DataPoint,
  DatavizChartConfig,
  DimensionSpec,
  MeasureSpec,
} from '#shared/types/datavizSchema.js';

const SEQUENTIAL_DIMENSION_TYPES = new Set([
  'date',
  'daterange',
  'multidate',
  'multidaterange',
  'numeric',
]);

const VALUE_MEASURE_AGGREGATIONS = new Set<MeasureSpec['aggregation']>(['sum', 'avg', 'min', 'max']);

const PRIMARY_MEASURE_CHART_TYPES = new Set<DatavizChartConfig['type']>([
  'line',
  'area',
  'bar',
  'horizontal_bar',
]);

const isNumericCrossTabQuery = (dimensions: DimensionSpec[]): boolean => {
  const secondary = dimensions[1];
  return (
    dimensions.length >= 2 &&
    Boolean(dimensions[0]?.propertyType && SEQUENTIAL_DIMENSION_TYPES.has(dimensions[0].propertyType)) &&
    secondary?.propertyType === 'numeric'
  );
};

const toNumericKey = (key: DataPoint['key']): number | undefined => {
  if (typeof key === 'number' && Number.isFinite(key)) {
    return key;
  }
  const parsed = Number(key);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const aggregateNumericBreakdown = (
  breakdown: DataPoint[],
  aggregation: MeasureSpec['aggregation']
): number => {
  const cells = breakdown
    .map(item => ({ numericKey: toNumericKey(item.key), weight: item.value }))
    .filter((item): item is { numericKey: number; weight: number } =>
      item.numericKey !== undefined && item.weight > 0
    );

  if (!cells.length) {
    return 0;
  }

  if (aggregation === 'max') {
    return Math.max(...cells.map(item => item.numericKey));
  }

  if (aggregation === 'min') {
    return Math.min(...cells.map(item => item.numericKey));
  }

  const weightedTotal = cells.reduce(
    (sum, item) => sum + item.numericKey * item.weight,
    0
  );
  const totalWeight = cells.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) {
    return 0;
  }

  if (aggregation === 'avg') {
    return weightedTotal / totalWeight;
  }

  return weightedTotal;
};

const shouldDerivePrimaryMeasureFromNumericBreakdown = (
  chart: DatavizChartConfig,
  dimensions?: DimensionSpec[],
  measures?: MeasureSpec[]
): boolean => {
  const measure = measures?.[0];
  if (!measure || !dimensions || !isNumericCrossTabQuery(dimensions)) {
    return false;
  }
  if (!VALUE_MEASURE_AGGREGATIONS.has(measure.aggregation)) {
    return false;
  }
  if (!PRIMARY_MEASURE_CHART_TYPES.has(chart.type)) {
    return false;
  }
  if (measure.property && measure.property !== dimensions[1]?.property) {
    return false;
  }
  return true;
};

const derivePrimaryMeasureFromNumericBreakdown = (
  points: DataPoint[],
  aggregation: MeasureSpec['aggregation']
): DataPoint[] =>
  points.map(point => {
    if (!point.breakdown?.length) {
      return point;
    }
    return {
      ...point,
      value: aggregateNumericBreakdown(point.breakdown, aggregation),
    };
  });

export {
  aggregateNumericBreakdown,
  derivePrimaryMeasureFromNumericBreakdown,
  shouldDerivePrimaryMeasureFromNumericBreakdown,
};
