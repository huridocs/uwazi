import type { DatavizQuery } from '#shared/types/datavizSchema.js';

export const isMetricCountQuery = (query: DatavizQuery): boolean =>
  query.dimensions.length === 0 && query.measures.some(measure => measure.aggregation === 'count');

export const isPreviewQueryReady = (query: DatavizQuery): boolean =>
  query.sources.length > 0 &&
  query.measures.length > 0 &&
  (query.dimensions.length > 0 || isMetricCountQuery(query));
