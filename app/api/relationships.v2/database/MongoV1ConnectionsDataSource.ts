import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import {
  V1ConnectionsDataSource,
  V1ConnectionDBO,
  V1ConnectionDBOWithEntityInfo,
} from '../contracts/V1ConnectionsDataSource';
import { V1Connection, V1ConnectionDisplayed } from '../model/V1Connection';

const mapConnections = (dbo: V1ConnectionDBO): V1Connection => {
  try {
    return new V1Connection(
      dbo._id.toString(),
      dbo.entity,
      dbo.hub.toString(),
      dbo.template?.toString()
    );
  } catch (e) {
    console.log(dbo);
    throw e;
  }
};

const mapConnectionsWithEntityInfo = (dbo: V1ConnectionDBOWithEntityInfo): V1ConnectionDisplayed =>
  new V1ConnectionDisplayed(
    dbo._id.toString(),
    dbo.entity,
    dbo.hub.toString(),
    dbo.template?.toString(),
    dbo.entityTemplateId.toString(),
    dbo.entityTitle,
    dbo.templateName
  );

export class MongoV1ConnectionsDataSource
  extends MongoDataSource<V1ConnectionDBO>
  implements V1ConnectionsDataSource
{//eslint-disable-line
  protected collectionName = 'connections';

  all(): MongoResultSet<V1ConnectionDBO, V1Connection> {
    const cursor = this.getCollection().find({}, { session: this.getSession() });
    return new MongoResultSet<V1ConnectionDBO, V1Connection>(cursor, mapConnections);
  }

  getConnectedToHubs(
    hubIds: string[]
  ): MongoResultSet<V1ConnectionDBOWithEntityInfo, V1ConnectionDisplayed> {
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
    return new MongoResultSet<V1ConnectionDBOWithEntityInfo, V1ConnectionDisplayed>(
      cursor,
      mapConnectionsWithEntityInfo
    );
  }
}
