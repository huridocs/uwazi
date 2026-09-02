export default {
  delta: 2,
  reindex: true,

  async up(db) {
    const collection = await db.collection('migrationProbe');
    await collection.insertOne({ delta: 2 });
  },
};
