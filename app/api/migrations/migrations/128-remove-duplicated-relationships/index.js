/* eslint-disable no-await-in-loop */

import { ObjectId } from 'mongodb';

async function findRelationshipPropertyHub(db, sharedId, relationType) {
  const result = await db
    .collection('connections')
    .aggregate([
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
    ])
    .toArray();

  if (!result[0]) {
    return null;
  }

  return result[0]._id;
}

async function deduplicateHub(db, hubForProperty) {
  const relationshipsInHub = await db
    .collection('connections')
    .find({ hub: hubForProperty })
    .toArray();
  const toDelete = [];
  const unique = [];
  relationshipsInHub.forEach(relationship => {
    if (
      unique.find(
        u =>
          u.template && u.template.equals(relationship.template) && u.entity === relationship.entity
      )
    ) {
      toDelete.push(relationship);
    } else {
      unique.push(relationship);
    }
  });
  if (toDelete.length) {
    await db
      .collection('connections')
      .bulkWrite(toDelete.map(d => ({ deleteOne: { filter: { _id: d._id } } })));
  }
}

export default {
  delta: 128,

  name: 'remove-duplicated-relationships',

  description: 'Removes relationships duplicated by issue #5645',

  reindex: false,

  async up(db) {
    const templates = await db.collection('templates').find({}).toArray();

    await templates.reduce(async (previousTemplate, template) => {
      await previousTemplate;

      const relationshipProperties = template.properties.filter(p => p.type === 'relationship');
      if (relationshipProperties.length) {
        const entitiesInvolved = await db.collection('entities').find({ template: template._id });
        while (await entitiesInvolved.hasNext()) {
          const entity = await entitiesInvolved.next();
          await relationshipProperties.reduce(async (previousProperty, property) => {
            await previousProperty;

            const hubForProperty = await findRelationshipPropertyHub(
              db,
              entity.sharedId,
              new ObjectId(property.relationType)
            );

            if (hubForProperty) {
              await deduplicateHub(db, hubForProperty);
            }
          }, Promise.resolve());
        }
      }
    }, Promise.resolve());
  },
};
