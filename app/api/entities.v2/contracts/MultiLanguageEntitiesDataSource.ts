import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { Property } from '#api/core/domain/template/Property.js';
import { ResultType } from '#api/core/libs/Result.js';
import { Entity } from '../../core/domain/entity/Entity.js';
import { EntityNotFoundError } from '#api/core/application/errors.js';

export interface MultiLanguageEntityDataSource {
  bulkUpdateDeprecated(entitiesToSave: Entity[], properties: Property[]): Promise<void>;
  bulkUpdate(entities: Entity[]): Promise<void>;
  update(entity: Entity): Promise<void>;

  deleteMetadataProperties(propertyNames: string[], sharedIds: string[]): Promise<void>;
  bulkDelete(sharedIds: string[]): Promise<void>;
  deleteReferencesToSharedIds(sharedIds: string[]): Promise<void>;

  renameMetadataProperties(
    propertyNames: { [oldName: string]: string },
    sharedIds: string[]
  ): Promise<void>;

  countByTemplateId(templateId: string): Promise<number>;

  getById(id: string): Promise<ResultType<Entity, EntityNotFoundError>>;
  getEntitiesByTemplateId(templateId: string): Promise<ResultSet<Entity>>;
  getEntitiesBySharedIds(sharedIds: string[]): Promise<ResultSet<Entity>>;
  getSharedIdsByTemplateId(templateId: string): Promise<ResultSet<string>>;
  getAllBySharedId(sharedIds: string[]): Promise<ResultType<Entity[], Error>>; // Todo: Replace by domain error
  getEntitiesByRelatedProperties(
    entities: Entity[],
    properties: V1RelationshipProperty[]
  ): Promise<ResultSet<Entity>>;
  getSharedIdsByTemplateAndTitles(
    templateId: string,
    titles: string[]
  ): Promise<Array<{ title: string; sharedId: string }>>;
  getSharedIdsByTitles(
    titles: string[]
  ): Promise<Array<{ title: string; sharedId: string; templateId: string }>>;
  getSharedIdsUsingThesaurus(thesaurusId: string): Promise<string[]>;

  create(entity: Entity): Promise<void>;
  bulkInsert(entities: Entity[]): Promise<void>;
}
