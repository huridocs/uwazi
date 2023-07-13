import api from 'app/Entities/V2NewRelationshipsAPI';
import { RequestParams } from 'app/utils/RequestParams';

const getRelationshipsByEntity = sharedId => api.get(new RequestParams({ sharedId }));

const saveRelationship = (type, from, to) =>
  api.post(
    new RequestParams([
      { type, from: { type: 'entity', entity: from }, to: { type: 'entity', entity: to } },
    ])
  );

const deleteRelationships = ids => api.delete(new RequestParams({ ids }));

const sendMigrationRequest = dryRun => api.migrate(new RequestParams({ dryRun: dryRun || false }));

const testOneHub = (hubId, migrationPlan) =>
  api.testOneHub(new RequestParams({ hubId, migrationPlan }));

const createRelationshipMigrationField = field =>
  api.createRelationshipMigrationField(
    new RequestParams({
      sourceTemplate: field.sourceTemplateId,
      relationType: field.relationTypeId,
      targetTemplate: field.targetTemplateId,
      ignored: field.ignored,
    })
  );

const updateRelationshipMigrationField = field =>
  api.updateRelationshipMigrationField(
    new RequestParams({
      sourceTemplate: field.sourceTemplateId,
      relationType: field.relationTypeId,
      targetTemplate: field.targetTemplateId,
      ignored: field.ignored,
    })
  );

const deleteRelationshipMigrationField = field =>
  api.deleteRelationshipMigrationField(
    new RequestParams({
      sourceTemplate: field.sourceTemplateId,
      relationType: field.relationTypeId,
      targetTemplate: field.targetTemplateId,
    })
  );

const getCurrentPlan = () => api.getCurrentPlan();

export {
  deleteRelationships,
  getCurrentPlan,
  getRelationshipsByEntity,
  saveRelationship,
  sendMigrationRequest,
  testOneHub,
  createRelationshipMigrationField,
  updateRelationshipMigrationField,
  deleteRelationshipMigrationField,
};
