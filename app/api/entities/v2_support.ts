import {
  CreateRelationshipService,
  DeleteRelationshipService,
  DenormalizationService as CreateDenormalizationService,
} from '../relationships.v2/services/service_factories.js';
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
import { EntitySchema } from 'shared/types/entityType.js';
import { TemplateSchema } from 'shared/types/templateType.js';
import { DefaultRelationshipDataSource } from '../relationships.v2/database/data_source_defaults.js';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
import { TemplateMappers } from 'api/templates.v2/database/TemplateMappers.js';
import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO.js';
import { MatchQueryNode } from '../relationships.v2/model/MatchQueryNode.js';
import { DefaultEntitiesDataSource } from '../entities.v2/database/data_source_defaults.js';
import { EntitiesDataSource } from '../entities.v2/contracts/EntitiesDataSource.js';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty.js';
import { arrayBidirectionalDiff } from 'shared/data_utils/arrayBidirectionalDiff.js';
import { DenormalizationService } from '../relationships.v2/services/DenormalizationService.js';

const newRelationshipsEnabled = async () => {
  const transactionManager = DefaultTransactionManager();
  return DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed();
};

const deleteRelatedNewRelationships = async (sharedId: string) => {
  if (await newRelationshipsEnabled()) {
    const datasource = DefaultRelationshipDataSource(DefaultTransactionManager());
    await datasource.deleteByEntities([sharedId]);
  }
};

const withDenormalizationService = async (
  cb: (service: DenormalizationService) => Promise<void>
) => {
  if (await newRelationshipsEnabled()) {
    const transactionManager = DefaultTransactionManager();
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
  // @ts-expect-error TS(7006): Parameter 'targetEntity' implicitly has an 'any' t... Remove this comment to see the full error message
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
  const entitiesDataSource = DefaultEntitiesDataSource(DefaultTransactionManager());
  if (await newRelationshipsEnabled()) {
    const templateModel = TemplateMappers.toApp(template as TemplateDBO);
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
    const transactionManager = DefaultTransactionManager();
    const dataSource = DefaultRelationshipDataSource(transactionManager);
    const service = await DeleteRelationshipService();
    const toDelete: string[] = [];

    // @ts-expect-error TS(7006): Parameter 'relationship' implicitly has an 'any' t... Remove this comment to see the full error message
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
  ignoreNewRelationshipsMetadata,
  updateNewRelationships,
  denormalizeAfterEntityCreation,
  denormalizeAfterEntityUpdate,
};
