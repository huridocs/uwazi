import type { DatavizChartConfig } from './chartTypes.js';

export type DatavizStatus = 'draft' | 'published';

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

export type DimensionSpec = {
  sourceAlias?: string;
  property: string;
  propertyType: PropertyTypeForDataviz;
  bucketStrategy?: 'terms' | 'date_histogram' | 'range';
  dateInterval?: 'day' | 'month' | 'year';
  sort?: 'count_desc' | 'label_asc' | 'key_asc';
  includeMissing?: boolean;
  maxBuckets?: number;
};

export type MeasureSpec = {
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  property?: string;
  propertyType?: PropertyTypeForDataviz;
  countMode?: 'all' | 'filtered';
};

export type DatavizQuery = {
  sources: DatavizSource[];
  join?: { type: 'union' | 'relationship'; relationshipProperty?: string; relationshipTemplate?: string };
  filters?: DatavizFilter[];
  includeUnpublished?: boolean;
  dimensions: DimensionSpec[];
  measures: MeasureSpec[];
  language?: string;
  limit?: number;
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

export type DatavizDefinition = {
  id: string;
  name: string;
  description?: string;
  status?: DatavizStatus;
  query: DatavizQuery;
  chart: DatavizChartConfig;
  appearance: DatavizAppearance;
  refresh: DatavizRefreshPolicy;
  createdAt?: string;
  updatedAt?: string;
};

export type EditorTabId = 'basic' | 'data' | 'chart' | 'appearance' | 'refresh';

export type PreviewTabId = 'preview' | 'inspector' | 'query';
