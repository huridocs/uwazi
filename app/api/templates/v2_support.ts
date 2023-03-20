import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { validateNewRelationshipQueryInput } from 'api/templates.v2/routes/schemas/propertyValidators';

const validateNewRelationshipPropertiesInInput = async (template: any) => {
  const transactionManager = new MongoTransactionManager(getClient());
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return true; // todo: discuss, not sure about this
  }
  if (template.properties) {
    return template.properties.every(
      (p: any) => p.type !== 'newRelationship' || validateNewRelationshipQueryInput(p.query)
    );
  }
  return true;
};

export { validateNewRelationshipPropertiesInInput };
