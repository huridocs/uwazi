import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { Property } from 'api/core/domain/template/Property';
import { Entity } from '../../core/domain/entity/Entity';

export interface MultiLanguageEntityDataSource {
  bulkUpdate(entitiesToSave: Entity[], properties: Property[]): Promise<void>;

  deleteMetadataProperties(propertyNames: string[], sharedIds: string[]): Promise<void>;

  renameMetadataProperties(
    propertyNames: { [oldName: string]: string },
    sharedIds: string[]
  ): Promise<void>;

  countByTemplateId(templateId: string): Promise<number>;
  getEntitiesByTemplateId(templateId: string): Promise<ResultSet<Entity>>;
  getEntitiesBySharedIds(sharedIds: string[]): Promise<ResultSet<Entity>>;
  getSharedIdsByTemplateId(templateId: string): Promise<ResultSet<string>>;

  getEntitiesByRelatedProperties(
    entities: Entity[],
    properties: V1RelationshipProperty[]
  ): Promise<ResultSet<Entity>>;

  create(entity: Entity): Promise<void>;
}
