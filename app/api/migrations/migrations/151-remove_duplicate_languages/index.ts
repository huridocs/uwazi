import { Db } from 'mongodb';

export default {
  delta: 151,

  name: 'remove_duplicate_languages',

  description: 'Remove duplicate languages from settings, entities and pages.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
