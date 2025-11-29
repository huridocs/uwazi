import { MongoDataSource } from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import entities from 'api/entities';
import settings from 'api/settings';
import { withConnectedData } from './relationshipsHelpers';
import { Relation } from './RelationsV1Collection';
import relationsFacade from './relationships';

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

  async bulkDeleteBySharedId(sharedIds: string[]) {
    await relationsFacade.delete({ entity: { $in: sharedIds } }, null, false);
  }
}
