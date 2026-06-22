import { ObjectId } from 'mongodb';
import type {
  DatavizAppearance,
  DatavizChartConfig,
  DatavizDataSourceKind,
  DatavizManualDataPayload,
  DatavizProcessing,
  DatavizQuery,
  DatavizRefreshPolicy,
} from '#shared/types/datavizSchema.js';

export type DatavizDBO = {
  _id: ObjectId;
  name: string;
  description?: string;
  dataSource?: DatavizDataSourceKind;
  query: DatavizQuery;
  manualData?: DatavizManualDataPayload;
  chart: DatavizChartConfig;
  appearance: DatavizAppearance;
  refresh: DatavizRefreshPolicy;
  processing?: DatavizProcessing;
  embedPublic?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type DatavizSnapshotDBO = {
  _id: ObjectId;
  datavizId: ObjectId;
  queryHash: string;
  payload: object;
  generatedAt: number;
};
