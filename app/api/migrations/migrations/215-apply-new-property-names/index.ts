import { Db } from 'mongodb';
import { applyNewPropertyNames } from './apply.js';

// The migration loader reads `default`. A named export would not run.

// eslint-disable-next-line import/no-default-export
export default {
  delta: 215,

  name: 'apply-new-property-names',

  description: 'Apply the new property-name algorithm and set newNameGeneration',

  reindex: false,

  requiresSchema: 39,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    this.reindex = await applyNewPropertyNames(db);
  },
};
