/* eslint-disable no-await-in-loop */
export default {
  delta: 122,

  name: 'Denormalize_templates_in_suggestions',

  description: 'Denormalizes the entities templates into the IX suggestions',

  reindex: false,

  async up(db) {
    const toDenormalize = db.collection('ixsuggestions').aggregate([
      {
        $match: {
          entityTemplate: { $exists: false },
        },
      },
      {
        $lookup: {
          from: 'entities',
          localField: 'entityId',
          foreignField: 'sharedId',
          as: 'entity',
        },
      },
    ]);

    while (await toDenormalize.hasNext()) {
      const suggestion = await toDenormalize.next();

      await db
        .collection('ixsuggestions')
        .updateOne(
          { _id: suggestion._id },
          { $set: { entityTemplate: suggestion.entity[0].template.toString() } }
        );
    }
  },
};
