export type {
  DatavizDataSourceKind,
  DatavizManualDataPayload,
  PropertyTypeForDataviz,
  FilterablePropertyType,
  DatavizFilterOperator,
  DatavizFilter,
  DatavizSource,
  DimensionSpec,
  MeasureSpec,
  DatavizQuery,
  ColorMode,
  DatavizAppearance,
  RefreshMode,
  DatavizRefreshPolicy,
  DatavizDefinition,
} from '#shared/types/datavizSchema.js';

export { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';

export type EditorTabId = 'info' | 'data' | 'chart' | 'appearance' | 'refresh';

export type PreviewTabId = 'preview' | 'inspector' | 'query' | 'advanced';
