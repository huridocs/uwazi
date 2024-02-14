import { Db } from 'mongodb';

export default {
  delta: 159,

  name: 'reindex',

  description:
    'A previous PR missed a reindex, this migration is an empty migration that only signals a reindex.',

  reindex: true,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
