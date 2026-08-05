import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { dbSessionContext } from '#api/odm/sessionsContext.js';
import relationships from '#api/relationships/relationships.js';
import { withConnectedData } from '#api/relationships/relationshipsHelpers.js';
import settings from '#api/settings/index.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import type { Relation } from '../../../relationships/RelationsV1Collection.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TimedMethod } from '#api/core/libs/logger/TimedMethodDecorator.js';
import { MongoEntitiesDAO } from './entity/MongoEntitiesDAO.js';

export class MongoRelationshipsV1DataSource extends MongoDataSource<Relation> {
  protected collectionName = 'connections';

  constructor(
    db: any,
    transactionManager: any,
    private entitiesDAO: MongoEntitiesDAO
  ) {
    super(db, transactionManager);
  }

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

    const _connectedDocuments = await this.entitiesDAO.findBySharedIds(
      dbRelationships.map(r => r.entity),
      (await settings.getDefaultLanguage()).key
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
  @TimedMethod('MongoRelationshipsV1DataSource.getByEntity')
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

  /**
   * Get relationships for a specific entity scoped to only the entities referenced in its
   * metadata relationship properties.
   *
   * The entity (domain model, with its template attached) provides the set of referenced
   * sharedIds via `getReferencedRelationshipEntitySharedIds`. This method then queries the
   * hubs that contain the source entity and fetches only the connections of the referenced
   * entities within those hubs, avoiding loading all hub connections into memory.
   *
   * @param entity - The domain Entity (with template) whose metadata relationships are needed
   * @param language - The language to fetch related entity data in
   * @param includeUnpublished - Whether to include unpublished related entities
   * @returns Array of relationship objects with connected entity data
   */
  @TimedMethod('MongoRelationshipsV1DataSource.getEntityMetadataRelationships')
  async getEntityMetadataRelationships(
    entity: Entity,
    language: LanguageISO6391,
    includeUnpublished: boolean
  ): Promise<Relation[]> {
    const referencedSharedIds = Array.from(
      entity.getReferencedRelationshipEntitySharedIds(language)
    );

    if (referencedSharedIds.length === 0) {
      return [];
    }

    const ownRelations = await this.getCollection()
      .find({ entity: entity.sharedId }, { projection: { hub: 1 } })
      .toArray();

    const hubIds = [...new Set(ownRelations.map(r => r.hub))];
    if (hubIds.length === 0) {
      return [];
    }

    const relevantConnections = await this.getCollection()
      .find({
        entity: { $in: referencedSharedIds },
        hub: { $in: hubIds },
      })
      .toArray();

    if (relevantConnections.length === 0) {
      return [];
    }

    const connectedSharedIds = [...new Set(relevantConnections.map(r => r.entity))];

    const _connectedDocuments = await this.entitiesDAO.findBySharedIds(
      connectedSharedIds,
      language
    );

    const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
      // @ts-ignore sharedId can not be null, this is a misstype on v1 types
      res[doc.sharedId] = doc;
      return res;
    }, {});

    let relations = withConnectedData(relevantConnections, connectedDocuments);
    if (!includeUnpublished) {
      relations = relations.filter((r: any) => r.entityData?.published);
    }

    return relations as Relation[];
  }

  async deleteByFiles(files: BaseFile[]) {
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
