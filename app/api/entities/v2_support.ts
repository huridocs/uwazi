import { ObjectId } from 'mongodb';

import templates from 'api/templates';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DenormalizationService } from 'api/relationships.v2/services/service_factories';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { EntitySchema } from 'shared/types/entityType';
import { MetadataSchema } from 'shared/types/commonTypes';
import { propertyTypes } from 'shared/propertyTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';

const entityTypeCheck = (
  entity: EntitySchema
): entity is EntitySchema & {
  template: ObjectId;
  sharedId: string;
  metadata: MetadataSchema;
} => !!entity.template && !!entity.sharedId && !!entity.metadata;

const assignNewRelationshipFieldsValues = async (entities: EntitySchema[]) => {
  const transactionManager = new MongoTransactionManager(getClient());
  if (!(await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed())) {
    return;
  }

  const templateIdToProperties = objectIndex(
    await templates.get({ _id: entities.map(e => e.template) }),
    t => t._id.toString(),
    t => (t.properties || []).filter(prop => prop.type === 'newRelationship')
  );
  const entitiesDataSource = DefaultEntitiesDataSource(transactionManager);

  await entities.filter(entityTypeCheck).reduce(async (previous, entity) => {
    await previous;

    const relProperties = templateIdToProperties[entity.template.toHexString()];
    if (!relProperties) return;

    const queryedEntity = await entitiesDataSource
      .getByIds([entity.sharedId], entity.language)
      .first();

    if (queryedEntity) {
      relProperties.forEach(relProperty => {
        entity.metadata[relProperty.name] = queryedEntity.metadata[relProperty.name];
      });
    }
  }, Promise.resolve());

  entities.forEach(entity => {
    entity.obsoleteMetadata = [];
  });
};

const deleteRelatedNewRelationships = async (sharedId: string) => {
  const transactionManager = new MongoTransactionManager(getClient());
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
  const transactionManager = new MongoTransactionManager(getClient());
  if (await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed()) {
    const denormalizationService = DenormalizationService(transactionManager);
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
  const transactionManager = new MongoTransactionManager(getClient());
  if (await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed()) {
    const denormalizationService = DenormalizationService(transactionManager);
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
  assignNewRelationshipFieldsValues,
  denormalizeAfterEntityUpdate,
};
