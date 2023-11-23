import { Db } from 'mongodb';

export default {
  delta: 151,

  name: 'remove_duplicate_entities',

  description: 'Repair cases, where an entity has multiple entries in a language.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
