import { Sink } from 'api/common.v2/contracts/Sink';
import { MigrationHubRecord } from '../model/MigrationHubRecord';

interface MigrationHubRecordDataSource {
  getPage(page: number, pageSize: number): Promise<MigrationHubRecord[]>;
  countAll(): Promise<number>;
  openSaveStream(): Sink<MigrationHubRecord>;
  deleteAll(): Promise<void>;
}

export type { MigrationHubRecordDataSource };
