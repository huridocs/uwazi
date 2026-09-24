import { LanguageUtils } from '#shared/language/index.js';

function groupByHubs(references) {
  const hubs = references.reduce((_hubs, reference) => {
    if (!_hubs[reference.hub]) {
      _hubs[reference.hub] = []; //eslint-disable-line no-param-reassign
    }
    _hubs[reference.hub].push(reference);
    return _hubs;
  }, []);
  return Object.keys(hubs).map(key => hubs[key]);
}

function removeOtherLanguageTextReferences(relationshipArray, connectedDocuments, language) {
  return relationshipArray.filter(r => {
    if (r.filename) {
      const entity = connectedDocuments[r.entity];
      const hasMatchingDocument =
        entity && entity.documents
          ? entity.documents.some(
              d =>
                d.filename === r.filename &&
                d.language === LanguageUtils.fromISO639_1(language).ISO639_3
            )
          : false;
      return hasMatchingDocument;
    }
    return true;
  });
}

function removeOrphanHubsOf(relationshipArray, sharedId) {
  const hubs = groupByHubs(relationshipArray).filter(h => h.map(r => r.entity).includes(sharedId));
  return Array.prototype.concat(...hubs);
}

function removeSingleHubs(relationshipArray) {
  const hubRelationshipsCount = relationshipArray.reduce((data, r) => {
    data[r.hub.toString()] = data[r.hub.toString()] ? data[r.hub.toString()] + 1 : 1; //eslint-disable-line no-param-reassign
    return data;
  }, {});

  return relationshipArray.filter(r => hubRelationshipsCount[r.hub.toString()] > 1);
}

function withConnectedData(relationshipArray, connectedDocuments) {
  return relationshipArray.reduce((acc, relationship) => {
    const entityData = connectedDocuments[relationship.entity];
    if (entityData) {
      acc.push({ template: null, entityData, ...relationship });
    }
    return acc;
  }, []);
}

function removeUnpublished(relationshipArray) {
  return relationshipArray.filter(relationship => relationship.entityData.published);
}

function processRelationshipCollection({
  relationshipArray,
  connectedDocuments,
  sharedId,
  unpublished,
  language,
}) {
  let relationshipsCollection = removeOtherLanguageTextReferences(
    relationshipArray,
    connectedDocuments,
    language
  );
  relationshipsCollection = withConnectedData(relationshipsCollection, connectedDocuments);
  relationshipsCollection = removeSingleHubs(relationshipsCollection);
  relationshipsCollection = removeOrphanHubsOf(relationshipsCollection, sharedId);
  if (!unpublished) {
    relationshipsCollection = removeUnpublished(relationshipsCollection);
  }
  return relationshipsCollection;
}

export {
  groupByHubs,
  processRelationshipCollection,
  removeOrphanHubsOf,
  removeSingleHubs,
  removeUnpublished,
  withConnectedData,
};
