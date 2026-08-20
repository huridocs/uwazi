import { Db } from 'mongodb';

const NAMESPACE_NOT_FOUND = 26;
const INDEX_NOT_FOUND = 27;

export default {
  delta: 204,

  reindex: false,

  name: '204-drop-captchas-autoexpire-index',

  description:
    'Deletes captchas left behind by the removed v1 captcha implementation and drops their autoexpire index. The index was never declared by a migration: mongoose auto-ensured it from the deleted CaptchaModel, so it exists in databases that ran v1 and is absent from newer ones. The v2 TTL index on createdAt, from 201-captchas-ttl-index, is the replacement and is left untouched.',

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const collection = db.collection('captchas');

    // Legacy documents have no createdAt, so they are only expirable while autoexpire_1
    // exists. Delete them before dropping the index, never after.
    const { deletedCount } = await collection.deleteMany({ createdAt: { $exists: false } });
    process.stdout.write(`${this.name}: deleted ${deletedCount} legacy captchas.\r\n`);

    try {
      await collection.dropIndex('autoexpire_1');
      process.stdout.write(`${this.name}: dropped the autoexpire index.\r\n`);
    } catch (error) {
      const { code } = error as { code?: number };
      if (code !== NAMESPACE_NOT_FOUND && code !== INDEX_NOT_FOUND) {
        throw error;
      }
    }

    process.stdout.write(`${this.name}: done.\r\n`);
  },
};
