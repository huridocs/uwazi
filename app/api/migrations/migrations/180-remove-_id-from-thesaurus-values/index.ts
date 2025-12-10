/* eslint-disable import/no-default-export, no-await-in-loop */
import { Db } from 'mongodb';

export default {
  delta: 180,

  reindex: false,

  name: '180-remove-_id-from-thesaurus-values',

  description: 'Remove _id from thesaurus values',

  async up(db: Db) {
    const thesaurus = db.collection('dictionaries');

    process.stdout.write(`${this.name}...\r\n`);

    const cursor = thesaurus.find({
      $or: [{ 'values._id': { $exists: true } }, { 'values.values._id': { $exists: true } }],
    });

    const cleanValues = (values: any[]): any[] =>
      values.map(({ _id, ...rest }: any) => ({
        ...rest,
        ...(rest.values ? { values: cleanValues(rest.values) } : {}),
      }));

    let processed = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc || !doc.values) {
        // eslint-disable-next-line no-continue
        continue;
      }

      await thesaurus.updateOne({ _id: doc._id }, { $set: { values: cleanValues(doc.values) } });
      processed += 1;
    }

    process.stdout.write(`Processed ${processed} thesaurus documents.\r\n`);
  },
};
