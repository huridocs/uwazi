import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { TemplateProperty } from 'api/core/domain/template/Template';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { MultiLanguageEntity } from '../model/MultiLanguageEntity';

export interface MultiLanguageEntityDataSource {
  bulkUpdate(entitiesToSave: MultiLanguageEntity[], properties: TemplateProperty[]): Promise<void>;

  deleteMetadataProperties(propertyNames: string[], sharedIds: string[]): Promise<void>;

  renameMetadataProperties(
    propertyNames: { [oldName: string]: string },
    sharedIds: string[]
  ): Promise<void>;

  countByTemplateId(templateId: string): Promise<number>;
  getEntitiesByTemplateId(templateId: string): Promise<ResultSet<MultiLanguageEntity>>;
  getEntitiesBySharedIds(sharedIds: string[]): Promise<ResultSet<MultiLanguageEntity>>;
  getSharedIdsByTemplateId(templateId: string): Promise<ResultSet<string>>;

  getEntitiesByRelatedProperties(
    entities: MultiLanguageEntity[],
    properties: V1RelationshipProperty[]
  ): Promise<ResultSet<MultiLanguageEntity>>;
}
