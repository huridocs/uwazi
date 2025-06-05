import { Db } from 'mongodb';

export default {
  delta: 171,

  name: 'px_mongo_indexes',

  description: 'add indexes for the new px collections',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db
      .collection('px_entities_status')
      .createIndex({ extractorId: 1, entitySharedId: 1 }, { unique: true, background: true });
    await db.collection('px_extractors').createIndex({ sourceTemplateId: 1 }, { background: true });
  },
};
