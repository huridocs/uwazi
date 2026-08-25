import type {
  DatavizFilter,
  DatavizQuery,
  DimensionSpec,
} from '#shared/types/datavizSchema.js';

/** One raw (unlabeled) aggregation bucket as produced by a backend strategy. */
export type RawBucket = {
  _id:
    | string
    | number
    | null
    | { primary: string | number; secondary: string | number }
    | { from: number; to: number };
  count: number;
};

export type AggregateSourceParams = {
  query: DatavizQuery;
  externalFilters?: DatavizFilter[];
  source: DatavizQuery['sources'][number];
  sourceIndex: number;
  sourceTemplateId: string;
  language: string;
  primaryDim: DimensionSpec;
  secondaryDim?: DimensionSpec;
  maxBuckets: number;
  includeUnpublished: boolean;
  timeoutMs: number;
};

export type CountSourceEntitiesParams = {
  query: DatavizQuery;
  externalFilters?: DatavizFilter[];
  source: DatavizQuery['sources'][number];
  sourceIndex: number;
  sourceTemplateId: string;
  language: string;
  includeUnpublished: boolean;
  timeoutMs: number;
};

/**
 * The aggregation engine a backend must provide. `aggregateSource` computes
 * the (bucketed) raw counts for one source of a query with dimensions;
 * `countSourceEntities` counts the entities of one source for metric-only
 * queries (no dimensions).
 */
export type DatavizAggregationStrategy = {
  aggregateSource(params: AggregateSourceParams): Promise<RawBucket[]>;
  countSourceEntities(params: CountSourceEntitiesParams): Promise<number>;
};
