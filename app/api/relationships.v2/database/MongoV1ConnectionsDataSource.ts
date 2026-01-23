import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';

import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';

import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { V1ConnectionsDataSource } from '#api/relationships.v2/contracts/V1ConnectionsDataSource.js';
import { V1Connection, ReadableV1Connection } from '#api/relationships.v2/model/V1Connection.js';
import {
  V1ConnectionDBO,
  V1ConnectionDBOWithEntityInfo,
} from '#api/relationships.v2/database/schemas/v1ConnectionTypes.js';
import {
  mapConnectionToApp,
  mapConnectionsWithEntityInfoToApp,
} from '#api/relationships.v2/database/v1ConnectionMappers.js';

export class MongoV1ConnectionsDataSource
  extends MongoDataSource<V1ConnectionDBO>
  implements V1ConnectionsDataSource
{//eslint-disable-line
  protected collectionName = 'connections';

  all(): MongoResultSet<V1ConnectionDBO, V1Connection> {
    const cursor = this.getCollection().find({});
    return new MongoResultSet<V1ConnectionDBO, V1Connection>(cursor, mapConnectionToApp);
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
      mapConnectionsWithEntityInfoToApp
    );
  }

  getSimilarConnections(connection: V1Connection): MongoResultSet<V1ConnectionDBO, V1Connection> {
    const cursor = this.getCollection().find({
      entity: connection.entity,
      template: connection.template ? MongoIdHandler.mapToDb(connection.template) : undefined,
    });
    return new MongoResultSet<V1ConnectionDBO, V1Connection>(cursor, mapConnectionToApp);
  }
}
