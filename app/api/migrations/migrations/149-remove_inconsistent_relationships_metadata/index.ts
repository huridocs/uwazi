import { Db } from 'mongodb';

export default {
  delta: 149,

  name: 'remove_inconsistent_relationships_metadata',

  description:
    'Removes entries from relationships properties in the metadata that do not have the referenced entity in the database.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
