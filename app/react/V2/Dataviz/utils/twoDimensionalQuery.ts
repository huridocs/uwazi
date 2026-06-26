import type { DimensionSpec } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';

const CATEGORICAL = new Set(['select', 'multiselect']);
const SEQUENTIAL = new Set(['date', 'daterange', 'multidate', 'multidaterange', 'numeric']);

export const isCategoricalDimension = (dim?: DimensionSpec) =>
  Boolean(dim?.propertyType && CATEGORICAL.has(dim.propertyType));

export const isSequentialDimension = (dim?: DimensionSpec) =>
  Boolean(dim?.propertyType && SEQUENTIAL.has(dim.propertyType));

export const hasTwoDimensions = (dimensions: DimensionSpec[]) => dimensions.length >= 2;

/** select × select — stacked bar / classic heatmap */
export const isTwoDimensionalQuery = (dimensions: DimensionSpec[]) =>
  hasTwoDimensions(dimensions) &&
  isCategoricalDimension(dimensions[0]) &&
  isCategoricalDimension(dimensions[1]);

/** year/mileage × engine_size — scatter / heatmap */
export const isNumericCrossTabQuery = (dimensions: DimensionSpec[]) => {
  const secondary = dimensions[1];
  return (
    hasTwoDimensions(dimensions) &&
    isSequentialDimension(dimensions[0]) &&
    secondary?.propertyType === 'numeric'
  );
};

export const hasBreakdownData = (data: DatavizDataDTO): boolean =>
  Boolean(data.series[0]?.points.some(p => p.breakdown && p.breakdown.length > 0));
