/* eslint-disable no-await-in-loop */
export default {
  delta: 1,

  name: 'entities_override_mongo_language',

  description: `duplicates entities.language propery to mongoLanguage, 
  this is to be able to configure language "none" 
  when the language is unsuported for text indexes`,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;

    const cursor = db.collection('entities').find();
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      let mongoLanguage = doc.language;
      if (mongoLanguage === 'ar') {
        mongoLanguage = 'none';
      }
      await db.collection('entities').findOneAndUpdate(doc, { $set: { mongoLanguage } });
      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }
    process.stdout.write('\r\n');
  },
};
