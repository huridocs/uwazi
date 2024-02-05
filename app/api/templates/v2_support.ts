import { WithId } from 'api/odm';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { validateCreateNewRelationshipProperty } from 'api/templates.v2/routes/validators/createNewRelationshipProperty';
import { CreateTemplateService } from 'api/templates.v2/services/service_factories';
import { ensure } from 'shared/tsUtils';
import { TemplateSchema } from 'shared/types/templateType';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import templates from './templates';

const processNewRelationshipProperties = async (template: TemplateSchema) => {
  const transactionManager = DefaultTransactionManager();
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
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

const processNewRelationshipPropertiesOnUpdate = async (
  _oldTemplate: TemplateSchema,
  _newTemplate: TemplateSchema
) => {
  const transactionManager = DefaultTransactionManager();
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return _newTemplate;
  }
  const createTemplateService = await CreateTemplateService();

  await createTemplateService.handleRelationshipPropertyUpdates(_oldTemplate, _newTemplate);

  return _newTemplate;
};

const processNewRelationshipPropertiesOnDelete = async (templateId: TemplateSchema['_id']) => {
  const transactionManager = DefaultTransactionManager();
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return;
  }

  const createTemplateService = await CreateTemplateService();
  const isUsed = await createTemplateService.templateIsUsedInQueries(templateId?.toString() || '');

  if (isUsed) {
    throw new Error('The template is still used in a relationship property query.');
  }
};

export {
  processNewRelationshipProperties,
  processNewRelationshipPropertiesOnDelete,
  processNewRelationshipPropertiesOnUpdate,
};
