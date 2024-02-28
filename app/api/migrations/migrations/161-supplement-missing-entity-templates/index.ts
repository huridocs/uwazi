import { Db } from 'mongodb';

export default {
  delta: 161,

  name: 'supplement-missing-entity-templates',

  description:
    'This migration adds the default template to all entities that are missing a template.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    return Promise.reject(new Error('error! change this, recently created migration'));
  },
};
