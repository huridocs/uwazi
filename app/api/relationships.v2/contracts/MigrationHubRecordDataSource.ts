import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Sink } from 'api/common.v2/contracts/Sink';
import { MigrationHubRecord } from '../model/MigrationHubRecord';

interface MigrationHubRecordDataSource {
  getAll(): ResultSet<MigrationHubRecord>;
  countAll(): Promise<number>;
  openSaveStream(): Sink<MigrationHubRecord>;
  deleteAll(): Promise<void>;
}

export type { MigrationHubRecordDataSource };
