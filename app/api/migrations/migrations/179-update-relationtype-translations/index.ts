/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

export default {
  delta: 179,

  reindex: false,

  name: 'update_relationtype_translations',

  description: 'Updates all Connection translations to Relationship Type',

  async up(db: Db) {
    await db
      .collection('translationsV2')
      .updateMany(
        { 'context.type': 'Connection' },
        { $set: { 'context.type': 'Relationship Type' } }
      );

    process.stdout.write(`${this.name}...\r\n`);
  },
};
