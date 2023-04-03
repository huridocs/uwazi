import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { validateCreateNewRelationshipProperty } from 'api/templates.v2/routes/validators/createNewRelationshipProperty';
import { CreateTemplateService } from 'api/templates.v2/services/CreateTemplateService';
import { TemplateSchema } from 'shared/types/templateType';

const processNewRelationshipProperty = async (template: TemplateSchema) => {
  const transactionManager = new MongoTransactionManager(getClient());
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return template;
  }
  const templatesDataSource = new MongoTemplatesDataSource(getConnection(), transactionManager);
  const createTemplateSevice = new CreateTemplateService(templatesDataSource);

  const mappedProperties = await Promise.all(
    (template.properties || []).map(async property => {
      if (property.type !== 'newRelationship') {
        return property;
      }

      const relationshipProperty = validateCreateNewRelationshipProperty(property);
      return createTemplateSevice.createRelationshipProperty(relationshipProperty);
    })
  );

  return { ...template, properties: mappedProperties };
};

export { processNewRelationshipProperty };
