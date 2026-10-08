import type {
  DatavizAppearance,
  DatavizChartConfig,
  DatavizDataSourceKind,
  DatavizManualDataPayload,
  DatavizProcessing,
  DatavizQuery,
  DatavizRefreshPolicy,
  DatavizSnapshotRenderPayload,
} from '#shared/types/datavizSchema.js';

export type DatavizRow = {
  _id: string;
  name: string;
  description?: string;
  dataSource?: DatavizDataSourceKind;
  query: DatavizQuery;
  manualData?: DatavizManualDataPayload;
  chart: DatavizChartConfig;
  appearance: DatavizAppearance;
  refresh: DatavizRefreshPolicy;
  processing?: DatavizProcessing;
  embedPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DatavizSnapshotRow = {
  _id: string;
  datavizId: string;
  queryHash: string;
  payload: DatavizSnapshotRenderPayload;
  generatedAt: Date;
};
