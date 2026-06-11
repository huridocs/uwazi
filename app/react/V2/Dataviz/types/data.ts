export type DataPoint = {
  key: string | number;
  label: string;
  value: number;
  values?: Record<string, number>;
  breakdown?: DataPoint[];
  color?: string;
};

export type DataSeries = {
  id: string;
  label: string;
  points: DataPoint[];
};

export type DatavizDataMeta = {
  totalEntities: number;
  truncated: boolean;
  appliedFilters?: Record<string, unknown>[];
  queryDurationMs?: number;
};

export type DatavizDataDTO = {
  datavizId: string;
  generatedAt: string;
  stale: boolean;
  meta: DatavizDataMeta;
  series: DataSeries[];
};
