import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { denormalizeTemplateEntities } from 'api/templates/templateUpdateDenormalizeUseCase';
import { tenants } from 'api/tenants';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import entities from './entities';

export const bulkDenormalizeEntitiesFromTemplateSave = async (
  template: TemplateSchema,
  language: string,
  relPropertiesThatChanged: V1RelationshipProperty[],
  preloadedData: {
    allTemplates: TemplateSchema[];
  },
  limit = 200,
  reindex = true
) => {
  const query = { template: template._id, language };
  const process = async (offset: number, totalRows: number) => {
    if (offset >= totalRows) {
      return;
    }

    const entitiesSharedIds = (await entities.get(query, 'sharedId', { skip: offset, limit })).map(
      (entity: EntitySchema) => entity.sharedId
    );

    await entities.updateMetdataFromRelationships(entitiesSharedIds, language, reindex);
    await process(offset + limit, totalRows);
  };
  if (!tenants.current().featureFlags?.templatesDenormalizationPerfImprovements) {
    const totalRows = await entities.count(query);
    await process(0, totalRows);
  } else {
    await denormalizeTemplateEntities(
      template,
      language,
      relPropertiesThatChanged,
      preloadedData,
      limit
    );
  }
};
