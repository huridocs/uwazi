import { ObjectId } from 'mongodb';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { createError } from '#api/utils/index.js';
import {
  getEntityReferencesByRelationshipTypes,
  guessRelationshipPropertyHub,
} from './relationshipsHelpers.js';

const getPropertiesToBeConnections = template => {
  const props = [];
  template.properties.forEach(prop => {
    const repeated = props.find(
      p => p.content === prop.content && p.relationType === prop.relationType
    );

    if (prop.type === 'relationship' && !repeated) {
      props.push(prop);
    }
  });
  return props;
};

const determinePropertyValues = (entity, propertyName) => {
  const metadata = entity.metadata || {};
  const propertyValues = metadata[propertyName] || [];
  return propertyValues.map(mo => mo.value);
};

const generateCreatedReferences = async (property, newValues, entity, existingReferences) => {
  const { relationType: propertyRelationType } = property;
  const toCreate = newValues.filter(
    value =>
      !(existingReferences[propertyRelationType] && existingReferences[propertyRelationType][value])
  );

  let newReferencesBase = [];
  let newReferences = [];
  if (toCreate.length) {
    const candidateHub = await guessRelationshipPropertyHub(
      entity.sharedId,
      new ObjectId(propertyRelationType)
    );

    const hubId = (candidateHub[0] && candidateHub[0]._id) || new ObjectId();
    newReferencesBase = candidateHub[0] ? [] : [{ entity: entity.sharedId, hub: hubId }];

    newReferences = toCreate.map(value => ({
      entity: value,
      hub: hubId,
      template: propertyRelationType,
    }));
  }

  return { newReferencesBase, newReferences };
};

const separateCreatedDeletedReferences = async (property, entity, existingReferences) => {
  const newValues = determinePropertyValues(entity, property.name);
  const newValueSet = new Set(newValues);

  const { relationType: propertyRelationType, content: propertyEntityType } = property;

  const { newReferencesBase, newReferences } = await generateCreatedReferences(
    property,
    newValues,
    entity,
    existingReferences
  );

  const toDelete = Object.entries(existingReferences[propertyRelationType] || {})
    .map(entry => entry[1])
    .filter(
      relationship =>
        relationship.rightSide.entity !== entity.sharedId &&
        (!propertyEntityType ||
          relationship.rightSide.entityData[0].template.toString() === propertyEntityType) &&
        !newValueSet.has(relationship.rightSide.entity)
    )
    .map(relationship => relationship.rightSide._id);

  return { newReferencesBase, newReferences, toDelete };
};

const prepareSaveEntityBasedReferences = async ({
  entity,
  language,
  template,
  getTemplateById,
}) => {
  if (!language) throw createError('Language cant be undefined');
  if (!entity.template) return { relationshipProperties: [], existingReferences: {} };

  const entityTemplate = template || (await getTemplateById(entity.template));
  const relationshipProperties = getPropertiesToBeConnections(entityTemplate);

  if (!relationshipProperties.length) {
    return { relationshipProperties, existingReferences: {} };
  }

  const existingReferences = await getEntityReferencesByRelationshipTypes(
    entity.sharedId,
    relationshipProperties.map(property => property.relationType)
  );

  return { relationshipProperties, existingReferences };
};

const buildRelationshipMutations = async ({
  relationshipProperties,
  entity,
  existingReferences,
}) => {
  const relationshipsToCreate = [];
  const relationshipsToDelete = [];

  await ArrayUtils.sequentialFor(relationshipProperties, async property => {
    const { newReferencesBase, newReferences, toDelete } = await separateCreatedDeletedReferences(
      property,
      entity,
      existingReferences
    );
    relationshipsToCreate.push(...newReferencesBase, ...newReferences);
    relationshipsToDelete.push(...toDelete);
  });

  return { relationshipsToCreate, relationshipsToDelete };
};

const applyRelationshipMutations = async ({
  relationshipsToCreate,
  relationshipsToDelete,
  saveRelationships,
  deleteRelationships,
}) => {
  if (relationshipsToCreate.length) {
    await saveRelationships(relationshipsToCreate);
  }

  if (relationshipsToDelete.length) {
    await deleteRelationships({ _id: { $in: relationshipsToDelete } });
  }
};

const saveEntityBasedReferences = async ({
  entity,
  language,
  template,
  getTemplateById,
  saveRelationships,
  deleteRelationships,
}) => {
  const { relationshipProperties, existingReferences } = await prepareSaveEntityBasedReferences({
    entity,
    language,
    template,
    getTemplateById,
  });

  const { relationshipsToCreate, relationshipsToDelete } = await buildRelationshipMutations({
    relationshipProperties,
    entity,
    existingReferences,
  });

  await applyRelationshipMutations({
    relationshipsToCreate,
    relationshipsToDelete,
    saveRelationships,
    deleteRelationships,
  });
};

export { saveEntityBasedReferences };
