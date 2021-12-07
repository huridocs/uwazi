/* eslint-disable no-await-in-loop */
export default {
  delta: 11,

  name: 'missing_full_text',

  description: 're-proccess entities with missing full-text',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const [{ languages }] = await db.collection('settings').find().toArray();
    const defaultLanguage = languages.find(l => l.default).key;

    const cursor = db
      .collection('entities')
      .find({ file: { $exists: true }, fullText: { $exists: false } });
    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      const sibilings = await db
        .collection('entities')
        .find({ sharedId: entity.sharedId })
        .toArray();
      const defaultLanguageEntity = sibilings.find(p => p.language === defaultLanguage);
      entity.fullText = defaultLanguageEntity.fullText;
      await db.collection('entities').replaceOne({ _id: entity._id }, entity);
      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  },
};
