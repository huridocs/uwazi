import { Db } from 'mongodb';

const NAMESPACE_NOT_FOUND = 26;
const INDEX_NOT_FOUND = 27;

export default {
  delta: 203,

  reindex: false,

  name: '203-password-recoveries-ttl-index',

  description:
    'Recreates the TTL index on passwordrecoveries.expiresAt with expireAfterSeconds: 0, so keys are deleted exactly at the stored timestamp instead of 24 hours after it. The collection is written through the raw driver, so the index has to be declared where the collection is owned rather than by a mongoose model no longer imported by anything.',

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const collection = db.collection('passwordrecoveries');

    try {
      await collection.dropIndex('expiresAt_1');
      process.stdout.write(`${this.name}: dropped the previous expiresAt index.\r\n`);
    } catch (error) {
      const { code } = error as { code?: number };
      if (code !== NAMESPACE_NOT_FOUND && code !== INDEX_NOT_FOUND) {
        throw error;
      }
    }

    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    process.stdout.write(`${this.name}: index created.\r\n`);
  },
};
