import {
  CreateRelationshipService,
  DeleteRelationshipService,
  DenormalizationService,
} from 'api/relationships.v2/services/service_factories';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { TemplateMappers } from 'api/templates.v2/database/TemplateMappers';
import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty';

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

const denormalizeAfterEntityAction = async (
  {
    sharedId,
    language,
  }: {
    sharedId: string;
    language: string;
  },
  method: 'Creating' | 'Updating'
) => {
  if (await newRelationshipsEnabled()) {
    const transactionManager = DefaultTransactionManager();
    const denormalizationService = await DenormalizationService(transactionManager);
    await denormalizationService[`denormalizeAfter${method}Entities`]([sharedId], language);
    await transactionManager.executeOnCommitHandlers(undefined);
  }
};
const denormalizeAfterEntityCreation = async (data: { sharedId: string; language: string }) =>
  denormalizeAfterEntityAction(data, 'Creating');

const denormalizeAfterEntityUpdate = async (data: { sharedId: string; language: string }) =>
  denormalizeAfterEntityAction(data, 'Updating');

const calculateDiff = (currentDoc: EntitySchema, toSave: EntitySchema, name: string) => {
  const newValues = new Set<string>();
  const deletedValues = new Set<string>();

  toSave.metadata?.[name]?.forEach(item => {
    newValues.add(item.value as string);
  });

  currentDoc.metadata?.[name]?.forEach(item => {
    const value = item.value as string;
    if (!newValues.has(value)) {
      deletedValues.add(value);
    }
    newValues.delete(value);
  });

  return { newValues: [...newValues], deletedValues: [...deletedValues] };
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
  const entitiesDataSource = DefaultEntitiesDataSource(DefaultTransactionManager());
  if (await newRelationshipsEnabled()) {
    const templateModel = TemplateMappers.toApp(template as TemplateDBO);
    await Promise.all(
      templateModel.properties.map(async property => {
        if (property instanceof RelationshipProperty) {
          if (toSave.metadata && currentDoc.metadata) {
            const { newValues, deletedValues } = calculateDiff(currentDoc, toSave, property.name);

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
  const transactionManager = DefaultTransactionManager();
  const dataSource = DefaultRelationshipDataSource(transactionManager);
  const service = await DeleteRelationshipService();
  const toDelete: string[] = [];

  await relationships.reduce(async (prev, relationship) => {
    await prev;
    const rels = await dataSource
      .getByDefinition(relationship.from, relationship.type, relationship.to)
      .all();
    rels.forEach(rel => {
      toDelete.push(rel._id);
    });
  }, Promise.resolve());

  await service.delete(toDelete);
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
