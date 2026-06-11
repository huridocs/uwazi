import type { DimensionSpec } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';

const CATEGORICAL = new Set(['select', 'multiselect']);

export const isCategoricalDimension = (dim?: DimensionSpec) =>
  Boolean(dim?.propertyType && CATEGORICAL.has(dim.propertyType));

export const hasTwoDimensions = (dimensions: DimensionSpec[]) => dimensions.length >= 2;

export const isTwoDimensionalQuery = (dimensions: DimensionSpec[]) =>
  hasTwoDimensions(dimensions) &&
  isCategoricalDimension(dimensions[0]) &&
  isCategoricalDimension(dimensions[1]);

export const hasBreakdownData = (data: DatavizDataDTO): boolean =>
  Boolean(data.series[0]?.points.some(p => p.breakdown && p.breakdown.length > 0));
