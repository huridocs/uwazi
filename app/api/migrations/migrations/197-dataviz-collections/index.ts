/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

export default {
  delta: 197,

  reindex: false,

  name: '197-dataviz-collections',

  description: 'Creates dataviz and dataviz_snapshots collections with indexes.',

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    await db.createCollection('dataviz').catch(() => undefined);
    await db.createCollection('dataviz_snapshots').catch(() => undefined);

    await db.collection('dataviz').createIndex({ name: 1 }, { unique: true });
    await db.collection('dataviz_snapshots').createIndex({ datavizId: 1 }, { unique: true });

    process.stdout.write(`${this.name}: indexes created.\r\n`);
  },
};
