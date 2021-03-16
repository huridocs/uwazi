export interface AggregationBucket {
  key: string;
  filtered: {
    // eslint-disable-next-line camelcase
    doc_count: number;
  };
}

export interface Aggregations {
  all: {
    [key: string]: {
      buckets: AggregationBucket[]
    };
  };
}
