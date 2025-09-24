// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoDat... Remove this comment to see the full error message
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoIdG... Remove this comment to see the full error message
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';

import { MongoResultSet } from 'api/common.v2/database/MongoResultSet.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoSav... Remove this comment to see the full error message
import { MongoSaveStream } from 'api/common.v2/database/MongoSaveStream.js';
import { MigrationHubRecordDBO } from './schemas/v1ConnectionTypes';
import { MigrationHubRecordDataSource } from '../contracts/MigrationHubRecordDataSource';
import { MigrationHubRecord } from '../model/MigrationHubRecord';
import {
  mapReadableConnectionToDBO,
  mapConnectionsWithEntityInfoToApp,
} from './v1ConnectionMappers';

const mapRecordToDBO = (record: MigrationHubRecord): MigrationHubRecordDBO => ({
  hubId: MongoIdHandler.mapToDb(record.hubId),
  connections: record.connections.map(mapReadableConnectionToDBO),
});

const mapRecordToApp = (record: MigrationHubRecordDBO): MigrationHubRecord => ({
  hubId: MongoIdHandler.mapToApp(record.hubId),
  connections: record.connections.map(mapConnectionsWithEntityInfoToApp),
});

class MongoMigrationHubRecordDataSource
  extends MongoDataSource<MigrationHubRecordDBO>
  implements MigrationHubRecordDataSource
{
  protected collectionName = 'migrationHubRecords';

  getAll(): MongoResultSet<MigrationHubRecordDBO, MigrationHubRecord> {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const cursor = this.getCollection().find();
    const resultset = new MongoResultSet<MigrationHubRecordDBO, MigrationHubRecord>(
      cursor,
      mapRecordToApp
    );
    return resultset;
  }

  async countAll(): Promise<number> {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    return this.getCollection().countDocuments();
  }

  openSaveStream(): MongoSaveStream<MigrationHubRecordDBO, MigrationHubRecord> {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const collection = this.getCollection();
    return new MongoSaveStream<MigrationHubRecordDBO, MigrationHubRecord>(
      collection,
      mapRecordToDBO
    );
  }

  async deleteAll(): Promise<void> {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    await this.getCollection().deleteMany({});
  }
}

export { MongoMigrationHubRecordDataSource };
