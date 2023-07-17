import { Db } from 'mongodb';

export default {
  delta: 140,

  name: 'add collections for v2 relationships migration',

  description:
    'Adds two collections and the related indices: \n' +
    '- relationshipMigrationFields: describes the user choice for what to migrate\n' +
    '- migrationHubRecords: persists the hubs of unused connections after the dry run or migration',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.createCollection('relationshipMigrationFields');
    const fieldColl = db.collection('relationshipMigrationFields');
    await fieldColl.createIndex(
      { sourceTemplate: 1, relationType: 1, targetTemplate: 1 },
      { unique: true }
    );

    await db.createCollection('migrationHubRecords');
  },
};
