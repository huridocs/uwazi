import { ObjectId } from 'mongodb';
import model from './model';

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

async function getEntityReferencesByRelationshipTypes(sharedId, relationTypes) {
  return model.db
    .aggregate([
      {
        $match: {
          entity: sharedId,
        },
      },
      {
        $project: {
          hub: 1,
        },
      },
      {
        $lookup: {
          from: 'connections',
          localField: 'hub',
          foreignField: 'hub',
          as: 'rightSide',
        },
      },
      {
        $project: {
          hub: 1,
          'rightSide._id': 1,
          'rightSide.entity': 1,
          'rightSide.template': 1,
        },
      },
      {
        $unwind: '$rightSide',
      },
      {
        $match: {
          'rightSide.template': {
            $in: relationTypes.map(t => new ObjectId(t)),
          },
        },
      },
      {
        $lookup: {
          from: 'entities',
          localField: 'rightSide.entity',
          foreignField: 'sharedId',
          as: 'rightSide.entityData',
        },
      },
      {
        $project: {
          hub: 1,
          'rightSide._id': 1,
          'rightSide.entity': 1,
          'rightSide.template': 1,
          'rightSide.entityData.template': 1,
        },
      },
      {
        $group: {
          _id: '$rightSide.template',
          references: { $push: '$$ROOT' },
        },
      },
    ])
    .then(value =>
      Object.fromEntries(
        value.map(group => [
          group._id,
          Object.fromEntries(group.references.map(r => [r.rightSide.entity, r])),
        ])
      )
    );
}

function guessRelationshipPropertyHub(sharedId, relationType) {
  return model.db.aggregate([
    {
      $match: {
        entity: sharedId,
      },
    },
    {
      $lookup: {
        from: 'connections',
        localField: 'hub',
        foreignField: 'hub',
        as: 'rightSide',
      },
    },
    {
      $unwind: '$rightSide',
    },
    {
      $match: {
        'rightSide.entity': { $ne: sharedId },
      },
    },
    {
      $group: {
        _id: '$rightSide.hub',
        templates: { $addToSet: '$rightSide.template' },
      },
    },
    {
      $match: {
        $and: [{ 'templates.0': relationType }, { 'templates.1': { $exists: false } }],
      },
    },
  ]);
}

function removeOtherLanguageTextReferences(relationshipArray, connectedDocuments) {
  return relationshipArray.filter(r => {
    if (r.filename) {
      const filename = connectedDocuments[r.entity].file
        ? connectedDocuments[r.entity].file.filename
        : '';
      return r.filename === filename;
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
  return relationshipArray
    .map(relationship => ({
      template: null,
      entityData: connectedDocuments[relationship.entity],
      ...relationship,
    }))
    .filter(relationship => Boolean(relationship.entityData));
}

function removeUnpublished(relationshipArray) {
  return relationshipArray.filter(relationship => relationship.entityData.published);
}

function processRelationshipCollection(
  relationshipArray,
  connectedDocuments,
  sharedId,
  unpublished
) {
  let relationshipsCollection = removeOtherLanguageTextReferences(
    relationshipArray,
    connectedDocuments
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
  processRelationshipCollection,
  groupByHubs,
  getEntityReferencesByRelationshipTypes,
  guessRelationshipPropertyHub,
};
