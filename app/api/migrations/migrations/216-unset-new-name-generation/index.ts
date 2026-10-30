import { Db } from 'mongodb';

// The migration loader reads `default`. A named export would not run.

// eslint-disable-next-line import/no-default-export
export default {
  delta: 216,

  name: 'unset-new-name-generation',

  description: 'Remove newNameGeneration after the property-name repair',

  reindex: false,

  requiresSchema: 40,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.collection('settings').updateMany({}, { $unset: { newNameGeneration: '' } });
    this.reindex = false;
  },
};
