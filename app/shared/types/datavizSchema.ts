/** Client-side placeholder id for visualizations not yet persisted. */
export const DATAVIZ_DRAFT_ID = 'dv_new';

export const TEMPLATE_DIMENSION_PROPERTY = '__template__';

export type PropertyTypeForDataviz =
  | 'select'
  | 'multiselect'
  | 'numeric'
  | 'date'
  | 'daterange'
  | 'multidate'
  | 'multidaterange'
  | 'generatedid';

export type FilterablePropertyType = PropertyTypeForDataviz | 'text';

export type DatavizFilterOperator =
  | 'eq'
  | 'in'
  | 'gte'
  | 'lte'
  | 'between'
  | 'contains';

export type DatavizFilter = {
  id: string;
  sourceAlias?: string;
  property: string;
  propertyType: FilterablePropertyType;
  operator: DatavizFilterOperator;
  value?: string | number;
  values?: string[];
  from?: string;
  to?: string;
};

export type DatavizSource = {
  templateId: string;
  alias?: string;
};

export type RelationshipDimensionMode = 'related_entity' | 'inherited';

export type DimensionSpec = {
  sourceAlias?: string;
  property: string;
  propertyType: PropertyTypeForDataviz;
  /** When set, `property` is a relationship/newRelationship template property. */
  relationshipMode?: RelationshipDimensionMode;
  bucketStrategy?: 'terms' | 'date_histogram' | 'range';
  dateInterval?: 'day' | 'month' | 'year';
  sort?: 'count_desc' | 'label_asc' | 'key_asc';
  maxBuckets?: number;
};

export type MeasureSpec = {
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  property?: string;
  propertyType?: PropertyTypeForDataviz;
  countMode?: 'all' | 'filtered';
};

export type DatavizDataSourceKind = 'query' | 'manual';

export type DatavizQuery = {
  sources: DatavizSource[];
  join?: {
    type: 'union' | 'compare' | 'relationship';
    relationshipProperty?: string;
    relationshipTemplate?: string;
  };
  filters?: DatavizFilter[];
  includeUnpublished?: boolean;
  dimensions: DimensionSpec[];
  measures: MeasureSpec[];
  language?: string;
  limit?: number;
};

export type ChartType =
  | 'pie'
  | 'donut'
  | 'bar'
  | 'horizontal_bar'
  | 'stacked_bar'
  | 'line'
  | 'area'
  | 'list'
  | 'gauge'
  | 'metric'
  | 'scatter'
  | 'heatmap'
  | 'treemap';

export type PieLabelFormat = 'value' | 'percentage' | 'both';

export type DatavizPieOptions = {
  labelFormat?: PieLabelFormat;
  maxSlices?: number;
  othersLabel?: string;
};

export type DatavizChartConfig = {
  type: ChartType;
  orientation?: 'horizontal' | 'vertical';
  stacked?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  excludeZero?: boolean;
  showMissingValues?: boolean;
  missingValueLabel?: string;
  echartsOverrides?: Record<string, unknown>;
  pieOptions?: DatavizPieOptions;
};

export type ColorMode = 'from_data' | 'theme' | 'template' | 'custom';

export type DatavizAppearance = {
  colorMode: ColorMode;
  valueColorMap?: Record<string, string>;
  templateColorSource?: string;
  labelMaxLength?: number;
  emptyStateMessage?: string;
  themeColors?: { background?: string; foreground?: string };
};

export type RefreshMode = 'live' | 'snapshot_manual' | 'snapshot_scheduled';

export type DatavizRefreshPolicy = {
  refreshMode: RefreshMode;
  schedule?: 'daily' | 'weekly' | 'monthly';
  scheduleTime?: string;
  cronTimezone?: string;
  lastRefreshedAt?: string;
  nextScheduledAt?: string;
};

export type DatavizProcessing = {
  active: boolean;
  startedAt?: string;
};

export type DatavizDefinition = {
  id: string;
  name: string;
  description?: string;
  /** Defaults to `query` when omitted (legacy documents). */
  dataSource?: DatavizDataSourceKind;
  query: DatavizQuery;
  manualData?: DatavizManualDataPayload;
  chart: DatavizChartConfig;
  appearance: DatavizAppearance;
  refresh: DatavizRefreshPolicy;
  processing?: DatavizProcessing;
  createdAt?: string;
  updatedAt?: string;
};

export type DatavizDateRangeKey = { from: number; to: number };

export type DatavizBucketKey = string | number | DatavizDateRangeKey;

/** Human-readable labels per installed language (populated at refresh/snapshot time). */
export type LocalizedLabels = Partial<Record<string, string>>;

export type DataPoint = {
  key: DatavizBucketKey;
  /** Default-language label; kept for backward compatibility with legacy snapshots. */
  label: string;
  labels?: LocalizedLabels;
  value: number;
  values?: Record<string, number>;
  breakdown?: DataPoint[];
  color?: string;
};

export type DataSeries = {
  id: string;
  label: string;
  labels?: LocalizedLabels;
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

/** User-authored payload when {@link DatavizDefinition.dataSource} is `manual`. */
export type DatavizManualDataPayload = {
  series: DataSeries[];
  meta?: Partial<Pick<DatavizDataMeta, 'totalEntities' | 'truncated'>>;
};

export type DatavizEmbedPayload = {
  data: DatavizDataDTO;
  chart: DatavizChartConfig;
  appearance: DatavizAppearance;
};

export type DatavizSnapshotRenderPayload = DatavizEmbedPayload;

/** @deprecated Use {@link DatavizEmbedPayload} — `sources` is no longer returned by the public embed API. */
export type DatavizPublicEmbedDTO = DatavizEmbedPayload & {
  sources?: DatavizSource[];
};

export const REFRESH_LIVE_MAX_ENTITIES = 10_000;
export const REFRESH_LIVE_SLOW_QUERY_MS = 10_000;
export const REFRESH_LIVE_TIMEOUT_MS = 30_000;

export const DATAVIZ_MAX_BUCKETS = 50;
