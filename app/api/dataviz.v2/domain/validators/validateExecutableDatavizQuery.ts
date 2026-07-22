import type { DatavizQuery } from '#shared/types/datavizSchema.js';
import { isMetricCountQuery } from '#shared/dataviz/metricCountQuery.js';
import { DatavizInvalidQueryError } from '../errors.js';

const validateQueryStructure = (query: DatavizQuery): void => {
  if (query.sources.length === 0) {
    throw new DatavizInvalidQueryError('At least one data source is required');
  }

  if (query.measures.length === 0) {
    throw new DatavizInvalidQueryError('At least one measure is required');
  }

  if (query.dimensions.length === 0 && !isMetricCountQuery(query)) {
    throw new DatavizInvalidQueryError('At least one dimension is required for this measure');
  }

  if (query.join?.type === 'relationship') {
    throw new DatavizInvalidQueryError('Relationship joins are not supported yet');
  }
};

/** @alias validateQueryStructure */
const validateExecutableDatavizQuery = (query: DatavizQuery): void => {
  validateQueryStructure(query);
};

export { validateExecutableDatavizQuery, validateQueryStructure };
