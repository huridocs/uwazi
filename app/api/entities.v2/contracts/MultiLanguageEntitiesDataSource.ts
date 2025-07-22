import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Template } from 'api/templates.v2/model/Template';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { IndexTypes } from 'shared/data_utils/objectIndex';
import { MultiLanguageEntity } from '../model/MultiLanguageEntity';

export interface MultiLanguageEntityDataSource {
  bulkUpdate(
    entitiesToSave: MultiLanguageEntity[],
    properties: V1RelationshipProperty[]
  ): Promise<void>;

  getEntitiesByTemplateId(
    templateId: string,
    templates?: Record<IndexTypes, Template>
  ): ResultSet<MultiLanguageEntity>;
  getEntitiesBySharedIds(
    sharedIds: string[],
    templates?: Record<IndexTypes, Template>
  ): ResultSet<MultiLanguageEntity>;
}
