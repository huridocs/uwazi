import { Db } from 'mongodb';

export default {
  delta: 140,

  name: 'add relationshipMigrationFields collection',

  description:
    'Adds the collection relationshipMigrationFields, which describes the user set matchers for the relationship v2 migration.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.createCollection('relationshipMigrationFields');
    const fieldColl = db.collection('relationshipMigrationFields');
    await fieldColl.createIndex(
      { sourceTemplate: 1, relationType: 1, targetTemplate: 1 },
      { unique: true }
    );
  },
};
