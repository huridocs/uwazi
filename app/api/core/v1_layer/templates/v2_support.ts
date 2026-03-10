import { WithId } from 'api/odm';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { validateCreateNewRelationshipProperty } from 'api/core/v1_layer/templates.v2/routes/validators/createNewRelationshipProperty';
import { CreateTemplateService } from 'api/core/v1_layer/templates.v2/services/service_factories';
import { ensure } from 'shared/tsUtils';
import { TemplateSchema } from 'shared/types/templateType';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import templates from './templates';

const processNewRelationshipProperties = async (template: TemplateSchema) => {
  const transactionManager = TransactionManagerFactory.default();
  if (
    !(await SettingsDataSourceFactory.default(transactionManager).readNewRelationshipsAllowed())
  ) {
    return template;
  }

  const createTemplateService = await CreateTemplateService();

  const mappedProperties = await Promise.all(
    (template.properties || []).map(async property => {
      if (property.type !== 'newRelationship') {
        return property;
      }

      const { targetTemplates, ...sanitizedProperty } = property;

      const relationshipProperty = validateCreateNewRelationshipProperty(sanitizedProperty);
      return createTemplateService.createRelationshipProperty(relationshipProperty);
    })
  );

  if (template._id) {
    const currentTemplate = ensure<WithId<TemplateSchema>>(
      await templates.getById(ensure(template._id))
    );
    await createTemplateService.validateUpdateActions(currentTemplate, template);
  }

  return { ...template, properties: mappedProperties };
};

const newRelationshipsAllowed = async () =>
  SettingsDataSourceFactory.default(
    TransactionManagerFactory.default()
  ).readNewRelationshipsAllowed();

const processNewRelationshipPropertiesOnUpdate = async (
  _oldTemplate: TemplateSchema,
  _newTemplate: TemplateSchema
) => {
  const transactionManager = TransactionManagerFactory.default();
  if (
    !(await SettingsDataSourceFactory.default(transactionManager).readNewRelationshipsAllowed())
  ) {
    return _newTemplate;
  }
  const createTemplateService = await CreateTemplateService();

  await createTemplateService.handleRelationshipPropertyUpdates(_oldTemplate, _newTemplate);

  return _newTemplate;
};

const processNewRelationshipPropertiesOnDelete = async (templateId: TemplateSchema['_id']) => {
  const transactionManager = TransactionManagerFactory.default();
  if (
    !(await SettingsDataSourceFactory.default(transactionManager).readNewRelationshipsAllowed())
  ) {
    return;
  }

  const createTemplateService = await CreateTemplateService();
  const isUsed = await createTemplateService.templateIsUsedInQueries(templateId?.toString() || '');

  if (isUsed) {
    throw new Error('The template is still used in a relationship property query.');
  }
};

export {
  newRelationshipsAllowed,
  processNewRelationshipProperties,
  processNewRelationshipPropertiesOnDelete,
  processNewRelationshipPropertiesOnUpdate,
};
