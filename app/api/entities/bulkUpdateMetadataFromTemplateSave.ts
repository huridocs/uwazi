import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { TemplateInputMappers } from 'api/templates.v2/services/TemplateInputMappers';
import { denormalizeTemplateEntities } from 'api/templates/templateUpdateDenormalizeUseCase';
import { TemplateSchema } from 'shared/types/templateType';

export const bulkDenormalizeEntitiesFromTemplateSave = async (
  template: TemplateSchema,
  language: string,
  relPropertiesThatChanged: V1RelationshipProperty[],
  limit = 200
) => {
  await denormalizeTemplateEntities(
    TemplateInputMappers.toApp(template),
    language,
    relPropertiesThatChanged,
    limit
  );
};
