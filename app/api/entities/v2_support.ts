import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { RelationshipProperty } from 'api/core/domain/template/RelationshipProperty';
import { TemplateDBO } from 'api/core/infrastructure/mongodb/template/DBOs/TemplateDBO';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/MongoTemplateMapper';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { DenormalizationService } from 'api/relationships.v2/services/DenormalizationService';
import {
  DenormalizationService as CreateDenormalizationService,
  CreateRelationshipService,
  DeleteRelationshipService,
} from 'api/relationships.v2/services/service_factories';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { arrayBidirectionalDiff } from 'shared/data_utils/arrayBidirectionalDiff';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';

const newRelationshipsEnabled = async () => {
  const transactionManager = TransactionManagerFactory.default();
  return SettingsDataSourceFactory.default(transactionManager).readNewRelationshipsAllowed();
};

const deleteRelatedNewRelationships = async (sharedId: string) => {
  if (await newRelationshipsEnabled()) {
    const datasource = DefaultRelationshipDataSource(TransactionManagerFactory.default());
    await datasource.deleteByEntities([sharedId]);
  }
};

const withDenormalizationService = async (
  cb: (service: DenormalizationService) => Promise<void>
) => {
  if (await newRelationshipsEnabled()) {
    const transactionManager = TransactionManagerFactory.default();
    const denormalizationService = await CreateDenormalizationService(transactionManager);
    await cb(denormalizationService);
    await transactionManager.executeOnCommitHandlers(undefined);
  }
};

const denormalizeAfterEntityCreation = async (data: { sharedId: string; language: string }) => {
  await withDenormalizationService(async service =>
    service.denormalizeAfterCreatingEntities([data.sharedId], data.language)
  );
};

const denormalizeAfterEntityUpdate = async (data: { sharedId: string; language: string }) => {
  await withDenormalizationService(async service =>
    service.denormalizeAfterUpdatingEntities([data.sharedId], data.language)
  );
};

const diffMetadataValues = (
  currentDoc: EntitySchema,
  toSave: EntitySchema,
  propertyName: string
) => {
  const diff = arrayBidirectionalDiff(
    currentDoc?.metadata?.[propertyName] ?? [],
    toSave?.metadata?.[propertyName] ?? [],
    v => v.value as string,
    v => v.value as string
  );

  return { newValues: diff.added, deletedValues: diff.removed };
};

interface RelationshipDefinition {
  type: string;
  to: string;
  from: string;
}

interface DefinitionsToUpdate {
  newRelationships: RelationshipDefinition[];
  removedRelationships: RelationshipDefinition[];
}

const determineRelationships = async (
  entitiesDataSource: EntitiesDataSource,
  values: string[],
  entity: EntitySchema,
  query: MatchQueryNode
) => {
  const relationships: RelationshipDefinition[] = [];
  await entitiesDataSource.getByIds(values, entity.language).forEach(async targetEntity => {
    relationships.push(query.determineRelationship(targetEntity));
  });
  return relationships;
};

const ignoreNewRelationshipsMetadata = async (
  currentDoc: EntitySchema,
  toSave: EntitySchema,
  template: TemplateSchema
): Promise<DefinitionsToUpdate> => {
  const newRelationships: RelationshipDefinition[] = [];
  const removedRelationships: RelationshipDefinition[] = [];
  const entitiesDataSource = DefaultEntitiesDataSource(TransactionManagerFactory.default());
  if (await newRelationshipsEnabled()) {
    const templateModel = MongoTemplateMapper.toDomain(template as TemplateDBO);
    await Promise.all(
      templateModel.properties.map(async property => {
        if (property instanceof RelationshipProperty) {
          if (toSave.metadata && currentDoc.metadata) {
            const { newValues, deletedValues } = diffMetadataValues(
              currentDoc,
              toSave,
              property.name
            );

            const query = property.buildQueryRootedInEntity(currentDoc.sharedId!);
            newRelationships.push(
              ...(await determineRelationships(entitiesDataSource, newValues, currentDoc, query))
            );
            removedRelationships.push(
              ...(await determineRelationships(
                entitiesDataSource,
                deletedValues,
                currentDoc,
                query
              ))
            );

            // eslint-disable-next-line no-param-reassign
            toSave.metadata[property.name] = currentDoc.metadata[property.name] || [];
          }
        }
      })
    );
  }
  return { newRelationships, removedRelationships };
};

const createNewRelationships = async (
  relationships: { type: string; to: string; from: string }[]
) => {
  const service = await CreateRelationshipService();
  await service.create(
    relationships.map(r => ({
      type: r.type,
      to: {
        type: 'entity',
        entity: r.to,
      },
      from: {
        type: 'entity',
        entity: r.from,
      },
    }))
  );
};

const deleteRemovedRelationships = async (
  relationships: { type: string; to: string; from: string }[]
) => {
  if (relationships.length) {
    const transactionManager = TransactionManagerFactory.default();
    const dataSource = DefaultRelationshipDataSource(transactionManager);
    const service = await DeleteRelationshipService();
    const toDelete: string[] = [];

    await dataSource.getByDefinition(relationships).forEach(async relationship => {
      toDelete.push(relationship._id);
    });

    await service.delete(toDelete);
  }
};

const updateNewRelationships = async (updates: DefinitionsToUpdate) => {
  if (await newRelationshipsEnabled()) {
    await createNewRelationships(updates.newRelationships);
    await deleteRemovedRelationships(updates.removedRelationships);
  }
};

export {
  deleteRelatedNewRelationships,
  denormalizeAfterEntityCreation,
  denormalizeAfterEntityUpdate,
  ignoreNewRelationshipsMetadata,
  updateNewRelationships,
};
