import { Db } from 'mongodb';

export default {
  delta: 169,

  name: 'reindex_persist_filename_with_fullText_object',

  description:
    "We're now indexing document.filename within the fullText object on elasticsearch, this is usefull because on search/v2 endpoint we need to return which filename each text snippet belongs to.",

  reindex: true,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
