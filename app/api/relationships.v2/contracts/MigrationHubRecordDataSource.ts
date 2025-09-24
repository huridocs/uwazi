// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/ResultS... Remove this comment to see the full error message
import { ResultSet } from '../common.v2/contracts/ResultSet.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/SaveStr... Remove this comment to see the full error message
import { SaveStream } from '../common.v2/contracts/SaveStream.js';
import { MigrationHubRecord } from '../model/MigrationHubRecord';

interface MigrationHubRecordDataSource {
  getAll(): ResultSet<MigrationHubRecord>;
  countAll(): Promise<number>;
  openSaveStream(): SaveStream<MigrationHubRecord>;
  deleteAll(): Promise<void>;
}

export type { MigrationHubRecordDataSource };
