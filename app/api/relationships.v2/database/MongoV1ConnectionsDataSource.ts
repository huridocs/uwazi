import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import {
  V1ConnectionsDataSource,
  V1ConnectionDBO,
  V1ConnectionDBOWithEntityInfo,
} from '../contracts/V1ConnectionsDataSource';
import { V1Connection } from '../model/V1Connection';

const mapConnections = (dbo: V1ConnectionDBO): V1Connection =>
  new V1Connection(dbo._id.toString(), dbo.entity, dbo.hub.toString(), dbo.template.toString());

const mapConnectionsWithEntityInfo = (dbo: V1ConnectionDBOWithEntityInfo): V1Connection =>
  new V1Connection(
    dbo._id.toString(),
    dbo.entity,
    dbo.hub.toString(),
    dbo.template.toString(),
    dbo.entityTemplateId.toString()
  );

export class MongoV1ConnectionsDataSource
  extends MongoDataSource<V1ConnectionDBO>
  implements V1ConnectionsDataSource
{//eslint-disable-line
  protected collectionName = 'connections';

  allCursor(): MongoResultSet<V1ConnectionDBO, V1Connection> {
    const cursor = this.getCollection().find({}, { session: this.getSession() });
    return new MongoResultSet<V1ConnectionDBO, V1Connection>(cursor, mapConnections);
  }

  getConnectedToHubs(
    _hubIds: string[]
  ): MongoResultSet<V1ConnectionDBOWithEntityInfo, V1Connection> {
    const hubIds = _hubIds.map(id => MongoIdHandler.mapToDb(id));
    const collection = this.getCollection();
    const cursor = collection.aggregate<V1ConnectionDBOWithEntityInfo>([
      {
        $match: { hub: { $in: hubIds } },
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
        $set: {
          pickedEntity: { $arrayElemAt: ['$entityInfo', 0] },
        },
      },
      {
        $set: {
          entityTemplateId: '$pickedEntity.template',
          // entityTitle: '$pickedEntity.title',
        },
      },
      {
        $unset: ['entityInfo', 'pickedEntity'],
      },
    ]);
    return new MongoResultSet<V1ConnectionDBOWithEntityInfo, V1Connection>(
      cursor,
      mapConnectionsWithEntityInfo
    );
  }
}
