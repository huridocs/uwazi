import { Db } from 'mongodb';

export default {
  delta: 161,

  name: 'denormalize_published_state',

  description:
    'This migration denormalizes the published state of the related entity in relationship metadata.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    return Promise.reject(new Error('error! change this, recently created migration'));
  },
};
