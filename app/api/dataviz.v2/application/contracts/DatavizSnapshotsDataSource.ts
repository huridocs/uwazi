import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { ResultType } from '#api/core/libs/Result.js';

export type DatavizSnapshot = {
  datavizId: string;
  queryHash: string;
  payload: DatavizDataDTO;
  generatedAt: Date;
};

export interface DatavizSnapshotsDataSource {
  upsert(snapshot: DatavizSnapshot): Promise<void>;
  getByDatavizId(datavizId: string): Promise<ResultType<DatavizSnapshot, Error>>;
  deleteByDatavizId(datavizId: string): Promise<void>;
}
