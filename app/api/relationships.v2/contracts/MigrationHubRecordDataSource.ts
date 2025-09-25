import { ResultSet } from '../../common.v2/contracts/ResultSet.js';

import { SaveStream } from '../common.v2/contracts/SaveStream.js';
import { MigrationHubRecord } from '../model/MigrationHubRecord';

interface MigrationHubRecordDataSource {
  getAll(): ResultSet<MigrationHubRecord>;
  countAll(): Promise<number>;
  openSaveStream(): SaveStream<MigrationHubRecord>;
  deleteAll(): Promise<void>;
}

export type { MigrationHubRecordDataSource };
