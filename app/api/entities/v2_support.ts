import { DenormalizationService } from 'api/relationships.v2/services/service_factories';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { EntitySchema } from 'shared/types/entityType';
import { propertyTypes } from 'shared/propertyTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';

const deleteRelatedNewRelationships = async (sharedId: string) => {
  const transactionManager = DefaultTransactionManager();
  if (await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed()) {
    const datasource = DefaultRelationshipDataSource(transactionManager);
    await datasource.deleteByEntities([sharedId]);
  }
};

const denormalizeAfterEntityCreation = async ({
  sharedId,
  language,
}: {
  sharedId: string;
  language: string;
}) => {
  const transactionManager = DefaultTransactionManager();
  if (await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed()) {
    const denormalizationService = await DenormalizationService(transactionManager);
    await denormalizationService.denormalizeAfterCreatingEntities([sharedId], language);
    await transactionManager.executeOnCommitHandlers(undefined);
  }
};

const denormalizeAfterEntityUpdate = async ({
  sharedId,
  language,
}: {
  sharedId: string;
  language: string;
}) => {
  const transactionManager = DefaultTransactionManager();
  if (await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed()) {
    const denormalizationService = await DenormalizationService(transactionManager);
    await denormalizationService.denormalizeAfterUpdatingEntities([sharedId], language);
    await transactionManager.executeOnCommitHandlers(undefined);
  }
};

const ignoreNewRelationshipsMetadata = async (
  currentDoc: EntitySchema,
  toSave: EntitySchema,
  template: TemplateSchema
) => {
  const newrelationshipProperties =
    template.properties?.filter(p => p.type === propertyTypes.newRelationship) || [];
  newrelationshipProperties.forEach(({ name }) => {
    if (toSave.metadata && currentDoc.metadata) {
      // eslint-disable-next-line no-param-reassign
      toSave.metadata[name] = currentDoc.metadata[name];
    }
  });
};

export {
  deleteRelatedNewRelationships,
  ignoreNewRelationshipsMetadata,
  denormalizeAfterEntityCreation,
  denormalizeAfterEntityUpdate,
};
