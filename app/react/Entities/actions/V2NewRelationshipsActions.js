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

const testOneHub = hubId => api.testOneHub(new RequestParams({ hubId }));

export {
  deleteRelationships,
  getRelationshipsByEntity,
  saveRelationship,
  sendMigrationRequest,
  testOneHub,
};
