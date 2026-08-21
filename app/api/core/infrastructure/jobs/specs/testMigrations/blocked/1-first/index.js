export default {
  delta: 1,
  requiresSchema: 1,
  reindex: true,

  async up(db) {
    const collection = await db.collection('migrationProbe');
    await collection.insertOne({ delta: 1 });
  },
};
