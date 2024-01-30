import { Db } from 'mongodb';

export default {
  delta: 156,

  name: 'populate default map layers',

  description: 'Adds default map layers to settings',

  reindex: false,

  async up(db: Db) {
    const settings = await db.collection('settings').findOne();
    await db
      .collection('settings')
      .updateOne(
        { _id: settings?._id },
        { $set: { mapLayers: ['Streets', 'Hybrid', 'Satellite'] } }
      );
  },
};
