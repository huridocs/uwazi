export interface AggregationBucket {
  key: string;
  filtered: {
    // eslint-disable-next-line camelcase
    doc_count: number;
  };
  label?: string;
  icon?: string;
}

export interface Aggregations {
  all: {
    [key: string]: {
      buckets: AggregationBucket[];
    };
  };
}
