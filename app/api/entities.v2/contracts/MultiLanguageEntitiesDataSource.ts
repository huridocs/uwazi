import { ResultSet } from '#api/common.v2/contracts/ResultSet.js';
import { TemplateProperty } from '#api/templates.v2/model/Template.js';
import { V1RelationshipProperty } from '#api/templates.v2/model/V1RelationshipProperty.js';

import { MultiLanguageEntity } from '../model/MultiLanguageEntity';

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
