import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoSaveStream } from 'api/common.v2/database/MongoSaveStream';
import {
  MigrationHubRecordDBO,
  RectangleDBO,
  ReferenceDBO,
  V1ConnectionDBOWithEntityInfo,
} from './schemas/v1ConnectionTypes';
import { MigrationHubRecordDataSource } from '../contracts/MigrationHubRecordDataSource';
import { MigrationHubRecord } from '../model/MigrationHubRecord';
import { ReadableV1Connection, V1SelectionRectangle, V1TextReference } from '../model/V1Connection';
import { mapConnectionsWithEntityInfo } from './MongoV1ConnectionsDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';

const mapRectangleToDBO = (rectangle: V1SelectionRectangle): RectangleDBO => ({
  page: rectangle.page,
  top: rectangle.top,
  left: rectangle.left,
  height: rectangle.height,
  width: rectangle.width,
});

const mapReferenceToDBO = (reference: V1TextReference): ReferenceDBO => ({
  text: reference.text,
  selectionRectangles: reference.selectionRectangles.map(mapRectangleToDBO),
});

const mapConnectionToDBO = (connection: ReadableV1Connection): V1ConnectionDBOWithEntityInfo => ({
  _id: MongoIdHandler.mapToDb(connection.id),
  entity: connection.entity,
  entityTemplateId: MongoIdHandler.mapToDb(connection.entityTemplate),
  entityTitle: connection.entityTitle,
  hub: MongoIdHandler.mapToDb(connection.hub),
  template: connection.template ? MongoIdHandler.mapToDb(connection.template) : undefined,
  templateName: connection.templateName,
  file: connection.file,
  reference: connection.reference ? mapReferenceToDBO(connection.reference) : undefined,
});

const mapRecordToDBO = (record: MigrationHubRecord): MigrationHubRecordDBO => ({
  hubId: MongoIdHandler.mapToDb(record.hubId),
  connections: record.connections.map(mapConnectionToDBO),
});

const mapRecordToApp = (record: MigrationHubRecordDBO): MigrationHubRecord => ({
  hubId: MongoIdHandler.mapToApp(record.hubId),
  connections: record.connections.map(mapConnectionsWithEntityInfo),
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
}

export { MongoMigrationHubRecordDataSource };
