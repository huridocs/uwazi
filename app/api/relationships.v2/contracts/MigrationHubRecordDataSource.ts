import { Sink } from 'api/common.v2/contracts/Sink';
import { MigrationHubRecord } from '../model/MigrationHubRecord';

interface MigrationHubRecordDataSource {
  getPage(page: number, pageSize: number): Promise<MigrationHubRecord[]>;
  openSaveStream(): Sink<MigrationHubRecord>;
}

export type { MigrationHubRecordDataSource };
