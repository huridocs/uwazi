import errorLog from 'api/log/errorLog';
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

function getEntityReferencesByRelationshipTypes(sharedId, relationTypes) {
  return model.db.aggregate([
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
          $in: relationTypes,
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
  ]);
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

class RelationshipCollection extends Array {
  removeOtherLanguageTextReferences(connectedDocuments) {
    return this.filter(r => {
      if (r.filename) {
        const filename = connectedDocuments[r.entity].file
          ? connectedDocuments[r.entity].file.filename
          : '';
        return r.filename === filename;
      }
      return true;
    });
  }

  removeOrphanHubsOf(sharedId) {
    const hubs = groupByHubs(this).filter(h => h.map(r => r.entity).includes(sharedId));
    return new RelationshipCollection(...Array.prototype.concat(...hubs));
  }

  removeSingleHubs() {
    const hubRelationshipsCount = this.reduce((data, r) => {
      data[r.hub.toString()] = data[r.hub.toString()] ? data[r.hub.toString()] + 1 : 1; //eslint-disable-line no-param-reassign
      return data;
    }, {});

    return this.filter(r => hubRelationshipsCount[r.hub.toString()] > 1);
  }

  withConnectedData(connectedDocuments) {
    return this.map(relationship => ({
      template: null,
      entityData: connectedDocuments[relationship.entity],
      ...relationship,
    })).filter(relationship => {
      if (!relationship.entityData) {
        errorLog.error(
          `There's a connection to entity: ${relationship.entity} on hub: ${relationship.hub}, but no entity data.`
        );
        return false;
      }
      return true;
    });
  }

  removeUnpublished() {
    return this.filter(relationship => relationship.entityData.published);
  }
}

export {
  RelationshipCollection,
  groupByHubs,
  getEntityReferencesByRelationshipTypes,
  guessRelationshipPropertyHub,
};
