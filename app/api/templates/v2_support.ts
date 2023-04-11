import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { validateCreateNewRelationshipProperty } from 'api/templates.v2/routes/validators/createNewRelationshipProperty';
import { CreateTemplateService } from 'api/templates.v2/services/service_factories';
import { TemplateSchema } from 'shared/types/templateType';

const processNewRelationshipProperties = async (template: TemplateSchema) => {
  const client = getClient();
  const transactionManager = new MongoTransactionManager(client);
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return template;
  }

  const createTemplateService = CreateTemplateService();

  const mappedProperties = await Promise.all(
    (template.properties || []).map(async property => {
      if (property.type !== 'newRelationship') {
        return property;
      }

      const relationshipProperty = validateCreateNewRelationshipProperty(property);
      return createTemplateService.createRelationshipProperty(relationshipProperty);
    })
  );

  return { ...template, properties: mappedProperties };
};

const processNewRelationshipPropertiesOnUpdate = async (
  _oldTemplate: TemplateSchema,
  _newTemplate: TemplateSchema
) => {
  const client = getClient();
  const transactionManager = new MongoTransactionManager(client);
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return _newTemplate;
  }
  const createTemplateService = CreateTemplateService();

  await createTemplateService.handleRelationshipPropertyUpdates(_oldTemplate, _newTemplate);

  return _newTemplate;
};

const processNewRelationshipPropertiesOnDelete = async (templateId: TemplateSchema['_id']) => {
  const client = getClient();
  const transactionManager = new MongoTransactionManager(client);
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return;
  }

  const createTemplateService = CreateTemplateService();
  const count = await createTemplateService.countQueriesUsingTemplate(templateId?.toString() || '');

  if (count > 0) {
    throw new Error('The template is still used in a relationship property query.');
  }
};

export {
  processNewRelationshipProperties,
  processNewRelationshipPropertiesOnDelete,
  processNewRelationshipPropertiesOnUpdate,
};
