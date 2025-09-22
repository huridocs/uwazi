import { MongoDataSource } from '../common.v2/database/MongoDataSource.js';
import entities from '../entities/index.js';
import { withConnectedData } from './relationshipsHelpers.js';
import { Relation } from './RelationsV1Collection.js';
import settings from '../settings/index.js';

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

    const language = (await settings.getDefaultLanguage()).key;

    const _connectedDocuments = await entities.getUnrestricted(
      {
        sharedId: { $in: relationships.map(r => r.entity) },
        language,
      },
      ['sharedId', 'template', 'title']
    );

    const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
      // @ts-ignore sharedId can not be null, this is a misstype on v1 types
      res[doc.sharedId] = doc;
      return res;
    }, {});

    return withConnectedData(relationships, connectedDocuments) as Relation[];
  }
}
