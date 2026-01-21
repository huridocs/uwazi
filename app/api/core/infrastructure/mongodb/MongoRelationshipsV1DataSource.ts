import { FileWithContents } from '#api/core/domain/files/FileWithContents.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import entities from '#api/entities/index.js';
import { dbSessionContext } from '#api/odm/sessionsContext.js';
import relationships from '#api/relationships/relationships.js';
import { withConnectedData } from '#api/relationships/relationshipsHelpers.js';
import settings from '#api/settings/index.js';
import { Relation } from '#api/relationships/RelationsV1Collection.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';

export class MongoRelationshipsV1DataSource extends MongoDataSource<Relation> {
  protected collectionName = 'connections';

  async getByEntitySharedIds(entitiesSharedIds: string[]) {
    const ownRelations = await this.getCollection()
      .find({
        ...{ entity: { $in: entitiesSharedIds } },
      })
      .toArray();

    const dbRelationships = await this.getCollection()
      .find({
        hub: { $in: ownRelations.map(relationship => relationship.hub) },
      })
      .toArray();

    const language = (await settings.getDefaultLanguage()).key;

    const _connectedDocuments = await entities.getUnrestricted(
      {
        sharedId: { $in: dbRelationships.map(r => r.entity) },
        language,
      },
      ['sharedId', 'template', 'title']
    );

    const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
      // @ts-ignore sharedId can not be null, this is a misstype on v1 types
      res[doc.sharedId] = doc;
      return res;
    }, {});

    return withConnectedData(dbRelationships, connectedDocuments) as Relation[];
  }

  async deleteByFiles(files: FileWithContents[]) {
    const session = this.transactionManager.getSession();
    if (session) {
      dbSessionContext.setSession(session);
    }

    await relationships.delete({ file: { $in: files.map(f => f.id) } }, null, false);

    dbSessionContext.clearContext();
  }

  async bulkDeleteBySharedId(sharedIds: string[]) {
    await relationships.delete({ entity: { $in: sharedIds } }, null, false);
  }
}
