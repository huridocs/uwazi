import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { MongoSaveStream } from '#api/core/infrastructure/mongodb/common/MongoSaveStream.js';
import { MigrationHubRecordDBO } from './schemas/v1ConnectionTypes.js';
import { MigrationHubRecordDataSource } from '../contracts/MigrationHubRecordDataSource.js';
import { MigrationHubRecord } from '../model/MigrationHubRecord.js';
import {
  mapReadableConnectionToDBO,
  mapConnectionsWithEntityInfoToApp,
} from './v1ConnectionMappers.js';

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
    const cursor = this.getCollection().find();
    const resultset = new MongoResultSet<MigrationHubRecordDBO, MigrationHubRecord>(
      cursor,
      mapRecordToApp
    );
    return resultset;
  }

  async countAll(): Promise<number> {
    return this.getCollection().countDocuments();
  }

  openSaveStream(): MongoSaveStream<MigrationHubRecordDBO, MigrationHubRecord> {
    const collection = this.getCollection();
    return new MongoSaveStream<MigrationHubRecordDBO, MigrationHubRecord>(
      collection,
      mapRecordToDBO
    );
  }

  async deleteAll(): Promise<void> {
    await this.getCollection().deleteMany({});
  }
}

export { MongoMigrationHubRecordDataSource };
