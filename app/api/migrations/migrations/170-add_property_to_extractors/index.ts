import { Db } from 'mongodb';

export default {
  delta: 170,

  name: 'add_property_to_extractors',

  description:
    "Add a new 'source' property to IX extractors to know if the source is a PDF or a metadata property",

  reindex: false,

  async up(db: Db) {
    await db.collection('ixextractors').updateMany({}, { $set: { source: { pdf: true } } });
  },
};
