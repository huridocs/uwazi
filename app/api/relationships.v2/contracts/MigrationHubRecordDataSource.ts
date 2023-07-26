import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { SaveStream } from 'api/common.v2/contracts/SaveStream';
import { MigrationHubRecord } from '../model/MigrationHubRecord';

interface MigrationHubRecordDataSource {
  getAll(): ResultSet<MigrationHubRecord>;
  countAll(): Promise<number>;
  openSaveStream(): SaveStream<MigrationHubRecord>;
  deleteAll(): Promise<void>;
}

export type { MigrationHubRecordDataSource };
