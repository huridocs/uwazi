import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { validateCreateNewRelationshipProperty } from 'api/templates.v2/routes/validators/createNewRelationshipPropertyValidator';
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

export { validateNewRelationshipPropertiesInInput };
