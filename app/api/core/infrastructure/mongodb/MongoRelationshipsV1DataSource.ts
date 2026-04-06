import { FileWithContents } from '#api/core/domain/files/FileWithContents.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import entities from '#api/entities/index.js';
import { dbSessionContext } from '#api/odm/sessionsContext.js';
import relationships from '#api/relationships/relationships.js';
import { withConnectedData } from '#api/relationships/relationshipsHelpers.js';
import settings from '#api/settings/index.js';
import { Relation } from '../../../relationships/RelationsV1Collection.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

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

  /**
   * Get relationships for a specific entity by its sharedId
   *
   * @param sharedId - The shared ID of the entity
   * @param language - The language to fetch relationships in
   * @param includeUnpublished - Whether to include unpublished related entities
   * @returns Array of relationship objects with connected entity data
   */
  async getByEntity(
    sharedId: string,
    language: LanguageISO6391,
    includeUnpublished: boolean
  ): Promise<Relation[]> {
    return relationships.getByDocument(
      sharedId,
      language,
      includeUnpublished, // Maps to V1's 'unpublished' parameter
      undefined, // file - not filtering by file
      false, // onlyTextReferences - include all relationships
      false // unrestricted - use restricted mode to respect permissions
    );
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
