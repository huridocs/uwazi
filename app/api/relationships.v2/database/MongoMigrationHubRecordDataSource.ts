import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoSaveStream } from 'api/common.v2/database/MongoSaveStream';
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

  async getPage(page: number, pageSize: number): Promise<MigrationHubRecord[]> {
    const cursor = this.getCollection().find();
    const resultset = new MongoResultSet<MigrationHubRecordDBO, MigrationHubRecord>(
      cursor,
      mapRecordToApp
    );
    return resultset.page(page, pageSize);
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
