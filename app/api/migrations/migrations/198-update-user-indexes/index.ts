import { Db } from 'mongodb';

export default {
  delta: 198,
  name: 'update-users-indexes',
  description:
    'Updates users collection indexes to include partialFilterExpression for soft-delete support.',
  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    const collection = db.collection('users');
    const indexes = await collection.indexes();

    const targetIndexes = [
      { name: 'username_1', key: { username: 1 } },
      { name: 'email_1', key: { email: 1 } },
    ];

    for (const targetIndex of targetIndexes) {
      const existing = indexes.find(idx => idx.name === targetIndex.name);
      if (existing) {
        process.stdout.write(`Dropping index ${targetIndex.name}...\r\n`);
        // eslint-disable-next-line no-await-in-loop
        await collection.dropIndex(targetIndex.name);
      }
    }

    await collection.createIndex(
      { username: 1 },
      {
        unique: true,
        partialFilterExpression: { deletedAt: null },
        background: true,
      }
    );
    await collection.createIndex(
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: { deletedAt: null },
        background: true,
      }
    );
    process.stdout.write(`${this.name}: indexes updated.\r\n`);
  },
};
