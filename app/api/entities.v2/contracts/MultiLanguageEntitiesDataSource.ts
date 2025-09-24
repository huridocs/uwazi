// @ts-expect-error TS(2300): Duplicate identifier 'ResultSet'.
import { ResultSet } from '../../common.v2/contracts/ResultSet.js';
import { TemplateProperty } from '../../templates.v2/model/Template.js';
// @ts-expect-error TS(2300): Duplicate identifier 'V1RelationshipProperty'.
import { V1RelationshipProperty } from '../../templates.v2/model/V1RelationshipProperty.js';
// @ts-expect-error TS(2300): Duplicate identifier 'ResultSet'.
import { ResultSet } from '../common.v2/contracts/ResultSet.js';
// @ts-expect-error TS(2300): Duplicate identifier 'V1RelationshipProperty'.
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty.js';

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
