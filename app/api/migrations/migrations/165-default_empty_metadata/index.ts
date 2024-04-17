import { Db } from 'mongodb';

export default {
  delta: 165,

  name: 'default_empty_metadata',

  description: 'Adds empty array as default metadata for all entities.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
