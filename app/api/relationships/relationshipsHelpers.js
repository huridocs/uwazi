import { RelationshipsV1DataSourceFactory } from '#api/core/infrastructure/factories/RelationshipsV1DataSourceFactory.js';
import {
  groupByHubs,
  processRelationshipCollection,
  withConnectedData,
} from './relationshipProcessing.js';

async function getEntityReferencesByRelationshipTypes(sharedId, relationTypes) {
  return RelationshipsV1DataSourceFactory.default().getEntityReferencesByRelationshipTypes(
    sharedId,
    relationTypes
  );
}

async function guessRelationshipPropertyHub(sharedId, relationType) {
  return RelationshipsV1DataSourceFactory.default().guessRelationshipPropertyHub(
    sharedId,
    relationType.toString()
  );
}

export {
  getEntityReferencesByRelationshipTypes,
  groupByHubs,
  guessRelationshipPropertyHub,
  processRelationshipCollection,
  withConnectedData,
};
