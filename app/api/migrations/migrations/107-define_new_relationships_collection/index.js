export default {
  delta: 107,

  name: 'define_new_relationships_collection',

  description: 'Defines the indices and schema validation for the new relationships collection.',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.createCollection('relationships', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          additionalProperties: false,
          properties: {
            _id: { bsonType: 'objectId' },
            from: { bsonType: 'string' },
            to: { bsonType: 'string' },
            type: { bsonType: 'objectId' },
          },
          required: ['_id', 'from', 'to', 'type'],
        },
      },
    });
    await db.collection('relationships').createIndex([['type', 1]]);
    await db.collection('relationships').createIndex([
      ['to', 1],
      ['type', 1],
    ]);
    await db.collection('relationships').createIndex([
      ['from', 1],
      ['type', 1],
    ]);
    await db.collection('relationships').createIndex([
      ['from', 1],
      ['to', 1],
      ['type', 1],
    ]);
  },
};
