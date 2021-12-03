/* eslint-disable no-await-in-loop */
export default {
  delta: 7,

  name: 'relationships_remove_languages',

  description: 'remove duplication of relationships for each language',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const [{ languages }] = await db.collection('settings').find().toArray();
    const languagesToRemove = languages.filter(l => !l.default).map(l => l.key);

    const cursor = db.collection('connections').find();
    while (await cursor.hasNext()) {
      const relation = await cursor.next();
      const isTextReference = relation.range;
      if (!isTextReference) {
        await db
          .collection('connections')
          .deleteMany({ sharedId: relation.sharedId, language: { $in: languagesToRemove } });
        await db
          .collection('connections')
          .updateMany({ sharedId: relation.sharedId }, { $unset: { language: 1, sharedId: 1 } });
      }

      if (isTextReference) {
        const [entityRelated] = await db
          .collection('entities')
          .find({ sharedId: relation.entity, language: relation.language })
          .toArray();

        await db
          .collection('connections')
          .deleteMany({ sharedId: relation.sharedId, _id: { $ne: relation._id } });

        await db.collection('connections').updateMany(relation, {
          $set: { filename: entityRelated.file.filename },
          $unset: { language: 1, sharedId: 1 },
        });
      }
      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }
    process.stdout.write('\r\n');
  },
};
