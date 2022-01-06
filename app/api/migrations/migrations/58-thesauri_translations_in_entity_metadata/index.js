/* eslint-disable no-await-in-loop */
import { ObjectID } from 'mongodb';

// eslint-disable-next-line import/no-default-export
export default {
  delta: 58,

  name: 'thesauri_translations_in_entity_metadata',

  description: "Fix Thesauri translations not beeing propagated to entity's metadata",

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
