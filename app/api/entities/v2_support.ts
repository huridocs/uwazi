import {
  CreateRelationshipService,
  DeleteRelationshipService,
  DenormalizationService,
} from 'api/relationships.v2/services/service_factories';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { EntitySchema } from 'shared/types/entityType';
import { propertyTypes } from 'shared/propertyTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { TemplateMappers } from 'api/templates.v2/database/TemplateMappers';
import { ObjectId } from 'mongodb';
import { PropertySchema } from 'api/migrations/migrations/149-remove_inconsistent_relationships_metadata/types';
import { RelationshipPropertyDBO } from 'api/templates.v2/database/schemas/TemplateDBO';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';

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

const calculateDiff = (currentDoc: EntitySchema, toSave: EntitySchema, name: string) => {
  const newValues = new Set();
  const deletedValues = new Set();

  toSave.metadata?.[name]?.forEach(item => {
    newValues.add(item.value);
  });

  currentDoc.metadata?.[name]?.forEach(item => {
    if (!newValues.has(item.value)) {
      deletedValues.add(item.value);
    }
    newValues.delete(item.value);
  });

  return { newValues: [...newValues], deletedValues: [...deletedValues] };
};

const isRelationshipProperty = (property: PropertySchema): property is RelationshipPropertyDBO =>
  property.type === propertyTypes.newRelationship;

const ignoreNewRelationshipsMetadata = async (
  currentDoc: EntitySchema,
  toSave: EntitySchema,
  template: TemplateSchema
) => {
  const newRelationships: { sharedId: string; template: string }[] = [];
  const removedRelationships: string[] = [];
  const entitiesDataSource = DefaultEntitiesDataSource(DefaultTransactionManager());
  await Promise.all(
    (template.properties || []).map(async property => {
      if (isRelationshipProperty(property)) {
        if (toSave.metadata && currentDoc.metadata) {
          const { newValues, deletedValues } = calculateDiff(currentDoc, toSave, property.name);
          const propertyModel = TemplateMappers.propertyToApp(
            property,
            new ObjectId(template._id!)
          );
          const query = new MatchQueryNode({ sharedId: currentDoc.sharedId }, propertyModel.query);
          await entitiesDataSource.getByIds(newValues as string[]).forEach(async targetEntity => {
            newRelationships.push(
              query.determineRelationship(
                { sharedId: currentDoc.sharedId!, template: currentDoc.template!.toString() },
                {
                  sharedId: targetEntity.sharedId,
                  template: targetEntity.template,
                }
              )
            );
          });

          await entitiesDataSource
            .getByIds(deletedValues as string[])
            .forEach(async targetEntity => {
              removedRelationships.push(
                query.determineRelationship(
                  { sharedId: currentDoc.sharedId!, template: currentDoc.template!.toString() },
                  {
                    sharedId: targetEntity.sharedId,
                    template: targetEntity.template,
                  }
                )
              );
            });

          // eslint-disable-next-line no-param-reassign
          toSave.metadata[property.name] = currentDoc.metadata[property.name] || [];
        }
      }
    })
  );
  return { newRelationships, removedRelationships };
};

const createNewRelationships = async (
  relationships: { type: string; to: string; from: string }[],
  user: any
) => {
  const service = await CreateRelationshipService({ user });
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
  relationships: { type: string; to: string; from: string }[],
  user: any
) => {
  const transactionManager = DefaultTransactionManager();
  const dataSource = DefaultRelationshipDataSource(transactionManager);
  const service = await DeleteRelationshipService({ user });
  await relationships.reduce(async (prev, relationship) => {
    await prev;
    const rels = await dataSource
      .getByDefinition(relationship.from, relationship.type, relationship.to)
      .all();

    await service.delete(rels.map(rel => rel._id));
  }, Promise.resolve());
};

export {
  deleteRelatedNewRelationships,
  ignoreNewRelationshipsMetadata,
  createNewRelationships,
  deleteRemovedRelationships,
  denormalizeAfterEntityCreation,
  denormalizeAfterEntityUpdate,
};
