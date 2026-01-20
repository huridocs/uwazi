import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { TemplateProperty } from '#api/core/domain/template/Template.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';

import { MultiLanguageEntity } from '#api/entities.v2/model/MultiLanguageEntity.js';

export interface MultiLanguageEntityDataSource {
  bulkUpdate(entitiesToSave: Entity[], properties: Property[]): Promise<void>;

  deleteMetadataProperties(propertyNames: string[], sharedIds: string[]): Promise<void>;
  bulkDelete(sharedIds: string[]): Promise<void>;
  deleteReferencesToSharedIds(sharedIds: string[]): Promise<void>;

  renameMetadataProperties(
    propertyNames: { [oldName: string]: string },
    sharedIds: string[]
  ): Promise<void>;

  countByTemplateId(templateId: string): Promise<number>;
  getEntitiesByTemplateId(templateId: string): Promise<ResultSet<Entity>>;
  getEntitiesBySharedIds(sharedIds: string[]): Promise<ResultSet<Entity>>;
  getSharedIdsByTemplateId(templateId: string): Promise<ResultSet<string>>;
  getAllBySharedId(sharedIds: string[]): Promise<ResultType<Entity[], Error>>; // Todo: Replace by domain error
  getEntitiesByRelatedProperties(
    entities: Entity[],
    properties: V1RelationshipProperty[]
  ): Promise<ResultSet<Entity>>;

  create(entity: Entity): Promise<void>;
}
