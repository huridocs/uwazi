export interface Aggregations {
  all: {
    [key: string]: {
      buckets: Array<{
        key: string;
        filtered: {
          // eslint-disable-next-line camelcase
          doc_count: number;
        };
      }>;
    };
  };
}
