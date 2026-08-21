export default {
  delta: 1,
  reindex: false,

  async up(db) {
    const collection = await db.collection('migrationProbe');
    await collection.insertOne({ delta: 1 });
  },
};
