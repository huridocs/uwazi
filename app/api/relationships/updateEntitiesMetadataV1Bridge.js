import templatesAPI from '#api/core/v1_layer/templates/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import entities from '#api/entities/entities.js';
import { UpdateEntityUseCaseFactory } from '#api/core/infrastructure/factories/UpdateEntityUseCaseFactory.js';
import {
  reentrantTransactionManager,
  resolveEntityActorForFacade,
  runWithV2Context,
  toUpdateEntityInput,
} from './v1EntityMutationBridge.js';

const getEntityBySharedIdAndLanguage = async (entityId, language) => {
  const docs = await entities.getUnrestrictedWithDocuments(
    { sharedId: entityId, language },
    undefined,
    {
      limit: 1,
    }
  );
  if (docs[0]) {
    return docs[0];
  }
  return entities.getById(entityId, language);
};

const buildRelationshipMetadata = ({ currentMetadata, relations, template }) => {
  const relationshipProperties = template.properties.filter(p => p.type === 'relationship');
  const nextMetadata = { ...currentMetadata };

  relationshipProperties.forEach(property => {
    const relationshipsGoingToThisProperty = relations.filter(
      r =>
        r.template &&
        r.template.toString() === property.relationType.toString() &&
        (!property.content || r.entityData.template.toString() === property.content)
    );

    nextMetadata[property.name] = relationshipsGoingToThisProperty.map(r => ({
      value: r.entity,
      label: r.entityData.title,
    }));
  });

  return { relationshipProperties, nextMetadata };
};

const persistEntityMetadata = async ({ entity, template, language }) => {
  const actor = resolveEntityActorForFacade(entity);
  await runWithV2Context(actor, async () => {
    const useCase = UpdateEntityUseCaseFactory.default({
      transactionManager: reentrantTransactionManager(ExecutionContext.transactionManager),
    });
    await useCase.execute(
      toUpdateEntityInput(entities.sanitize(entity, template), template, language)
    );
  });
};

const getTemplateForEntity = ({ templates, entity }) =>
  templates.find(template => template._id.toString() === entity.template.toString());

// eslint-disable-next-line max-statements
const processEntityMetadataUpdate = async ({ entityId, language, templates, getByDocument }) => {
  const currentEntity = await getEntityBySharedIdAndLanguage(entityId, language);
  const relations = await getByDocument(entityId, language);

  if (!currentEntity || !currentEntity.template) {
    return;
  }

  const template = getTemplateForEntity({ templates, entity: currentEntity });
  if (!template) {
    return;
  }

  const { relationshipProperties, nextMetadata } = buildRelationshipMetadata({
    currentMetadata: currentEntity.metadata || {},
    relations,
    template,
  });
  if (relationshipProperties.length) {
    const entityWithMetadata = { ...currentEntity, metadata: nextMetadata };
    await persistEntityMetadata({ entity: entityWithMetadata, template, language });
  }
};

const updateEntitiesMetadata = async ({ entitiesIds, language, getByDocument }) => {
  const templates = await templatesAPI.get();

  await ArrayUtils.sequentialFor(entitiesIds, entityId =>
    processEntityMetadataUpdate({ entityId, language, templates, getByDocument })
  );
};

const updateEntitiesMetadataByHub = async ({
  hubId,
  language,
  getHub,
  updateEntitiesMetadata: updateEntitiesMetadataFn,
}) => {
  const hub = await getHub(hubId);
  const entitiesIds = hub.map(relation => relation.entity);
  return updateEntitiesMetadataFn(entitiesIds, language);
};

export { updateEntitiesMetadata, updateEntitiesMetadataByHub };
