import { Db } from 'mongodb';

export default {
  delta: 150,

  name: 'per_namespace_lastSyncs',

  description: 'Note the last synced timestamp on the syncs separately for each namespace.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    const syncs = await db.collection('syncs').find().toArray();
    const updateOperations = syncs.map((sync: any) => {
      const timestamp = sync.lastSync || 0;
      return {
        updateOne: {
          filter: { _id: sync._id },
          update: {
            $set: {
              lastSyncs: {
                settings: timestamp,
                translationsV2: timestamp,
                dictionaries: timestamp,
                relationtypes: timestamp,
                templates: timestamp,
                files: timestamp,
                connections: timestamp,
                entities: timestamp,
              },
            },
            $unset: { lastSync: '' },
          },
        },
      };
    });
    if (updateOperations.length) {
      await db.collection('syncs').bulkWrite(updateOperations);
    }
  },
};
