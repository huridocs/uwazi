import { ResultSet } from '#api/core/application/contracts/ResultSet.js';

import { SaveStream } from '#api/common.v2/contracts/SaveStream.js';
import { MigrationHubRecord } from '#api/relationships.v2/model/MigrationHubRecord.js';

interface MigrationHubRecordDataSource {
  getAll(): ResultSet<MigrationHubRecord>;
  countAll(): Promise<number>;
  openSaveStream(): SaveStream<MigrationHubRecord>;
  deleteAll(): Promise<void>;
}

export type { MigrationHubRecordDataSource };
