import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import entities from 'api/entities';
import { withConnectedData } from './relationshipsHelpers';
import { Relation } from './RelationsV1Collection';

export class MongoRelationshipsV1DataSource extends MongoDataSource<Relation> {
  protected collectionName = 'connections';

  async getByEntitySharedIds(entitiesSharedIds: string[]) {
    const ownRelations = await this.getCollection()
      .find({
        ...{ entity: { $in: entitiesSharedIds } },
      })
      .toArray();

    const relationships = await this.getCollection()
      .find({
        hub: { $in: ownRelations.map(relationship => relationship.hub) },
      })
      .toArray();

    const _connectedDocuments = await entities.getUnrestricted(
      {
        sharedId: { $in: relationships.map(r => r.entity) },
        language: 'en',
      },
      ['template', 'title']
    );

    const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
      //@ts-ignore
      res[doc.sharedId] = doc;
      return res;
    }, {});

    return withConnectedData(relationships, connectedDocuments) as Relation[];
  }
}
