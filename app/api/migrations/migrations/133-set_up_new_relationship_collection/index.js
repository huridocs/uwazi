export default {
  delta: 133,

  name: 'set_up_new_relationship_collection',

  description:
    'Sets up the new relationships collection ("relationships") with indices. Unique constraints and strict schemas are not set, it is deferred until the feature is more stable.',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.createCollection('relationships');
    const relationships = await db.collection('relationships');
    await relationships.createIndex({ type: 1, 'from.entity': 1, 'to.entity': 1 });
    await relationships.createIndex({ 'from.entity': 1, 'to.entity': 1 });
    await relationships.createIndex({ 'to.entity': 1, type: 1 });
  },
};
