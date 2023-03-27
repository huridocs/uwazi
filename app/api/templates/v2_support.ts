import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { validateCreateNewRelationshipProperty } from 'api/templates.v2/routes/validators/createNewRelationshipProperty';
import { CreateTemplateService } from 'api/templates.v2/services/CreateTemplateService';
import { TemplateSchema } from 'shared/types/templateType';

const validateNewRelationshipPropertiesInInput = async (template: TemplateSchema) => {
  const transactionManager = new MongoTransactionManager(getClient());
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return true; // todo: discuss, not sure about this
  }
  if (template.properties) {
    return template.properties.every(
      property =>
        property.type !== 'newRelationship' || validateCreateNewRelationshipProperty(property)
    );
  }
  return true;
};

const mapNewRelationshipPropertiesToDBO = async (template: TemplateSchema) => {
  const transactionManager = new MongoTransactionManager(getClient());
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return template;
  }

  const createTemplateSevice = new CreateTemplateService();

  const mappedProperties = template.properties?.map(property => {
    if (property.type !== 'newRelationship') {
      return property;
    }

    return createTemplateSevice.createRelationshipProperty(property);
  });

  return { ...template, properties: mappedProperties };
};

export { validateNewRelationshipPropertiesInInput, mapNewRelationshipPropertiesToDBO };
