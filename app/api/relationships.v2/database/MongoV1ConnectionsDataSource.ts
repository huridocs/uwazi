import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { V1ConnectionsDataSource } from '../contracts/V1ConnectionsDataSource';
import {
  V1Connection,
  ReadableV1Connection,
  V1SelectionRectangle,
  V1TextReference,
} from '../model/V1Connection';
import { V1ConnectionDBO, V1ConnectionDBOWithEntityInfo } from './schemas/v1ConnectionTypes';

const mapReference = (dbo: V1ConnectionDBO): V1TextReference | undefined =>
  dbo.reference
    ? new V1TextReference(
        dbo.reference.text,
        dbo.reference.selectionRectangles.map(
          (rect): V1SelectionRectangle =>
            new V1SelectionRectangle(rect.page, rect.top, rect.left, rect.height, rect.width)
        )
      )
    : undefined;

const mapConnections = (dbo: V1ConnectionDBO): V1Connection =>
  new V1Connection(
    dbo._id.toString(),
    dbo.entity,
    dbo.hub.toString(),
    dbo.template?.toString(),
    dbo.file,
    mapReference(dbo)
  );

const mapConnectionsWithEntityInfo = (dbo: V1ConnectionDBOWithEntityInfo): ReadableV1Connection =>
  new ReadableV1Connection(
    dbo._id.toString(),
    dbo.entity,
    dbo.hub.toString(),
    dbo.template?.toString(),
    dbo.entityTemplateId.toString(),
    dbo.entityTitle,
    dbo.templateName,
    dbo.file,
    mapReference(dbo)
  );

export class MongoV1ConnectionsDataSource
  extends MongoDataSource<V1ConnectionDBO>
  implements V1ConnectionsDataSource
{//eslint-disable-line
  protected collectionName = 'connections';

  all(): MongoResultSet<V1ConnectionDBO, V1Connection> {
    const cursor = this.getCollection().find({});
    return new MongoResultSet<V1ConnectionDBO, V1Connection>(cursor, mapConnections);
  }

  getConnectedToHubs(
    hubIds: string[]
  ): MongoResultSet<V1ConnectionDBOWithEntityInfo, ReadableV1Connection> {
    const collection = this.getCollection();
    const cursor = collection.aggregate<V1ConnectionDBOWithEntityInfo>([
      {
        $match: { hub: { $in: hubIds.map(id => MongoIdHandler.mapToDb(id)) } },
      },
      {
        $lookup: {
          from: 'entities',
          localField: 'entity',
          foreignField: 'sharedId',
          as: 'entityInfo',
        },
      },
      {
        $lookup: {
          from: 'relationtypes',
          localField: 'template',
          foreignField: '_id',
          as: 'relTypeInfo',
        },
      },
      {
        $set: {
          pickedEntity: { $arrayElemAt: ['$entityInfo', 0] },
          pickedRelType: { $arrayElemAt: ['$relTypeInfo', 0] },
        },
      },
      {
        $set: {
          entityTemplateId: '$pickedEntity.template',
          entityTitle: '$pickedEntity.title',
          templateName: '$pickedRelType.name',
        },
      },
      {
        $unset: ['entityInfo', 'pickedEntity', 'relTypeInfo', 'pickedRelType'],
      },
    ]);
    return new MongoResultSet<V1ConnectionDBOWithEntityInfo, ReadableV1Connection>(
      cursor,
      mapConnectionsWithEntityInfo
    );
  }

  getSimilarConnections(connection: V1Connection): MongoResultSet<V1ConnectionDBO, V1Connection> {
    const cursor = this.getCollection().find({
      entity: connection.entity,
      template: connection.template ? MongoIdHandler.mapToDb(connection.template) : undefined,
    });
    return new MongoResultSet<V1ConnectionDBO, V1Connection>(cursor, mapConnections);
  }
}

export { mapConnections, mapConnectionsWithEntityInfo };
