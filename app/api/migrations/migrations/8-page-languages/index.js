/* eslint-disable no-await-in-loop */
export default {
  delta: 8,

  name: 'page-languages',

  description: 'Create pages for languages that may be added after page creation',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const [{ languages }] = await db.collection('settings').find().toArray();
    const defaultLanguage = languages.find(l => l.default).key;

    const cursor = db.collection('pages').find({ language: defaultLanguage });
    while (await cursor.hasNext()) {
      const page = await cursor.next();
      const pages = await db.collection('pages').find({ sharedId: page.sharedId }).toArray();
      const defaultLanguagePage = pages.find(p => p.language === defaultLanguage);
      await Promise.all(
        languages.map(async language => {
          const pageInTheLanguage = pages.find(p => p.language === language.key);
          if (!pageInTheLanguage) {
            const newPage = { ...defaultLanguagePage };
            delete newPage._id;
            delete newPage.__v;
            newPage.language = language.key;
            await db.collection('pages').insertOne(newPage);
          }
        })
      );
      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }
    process.stdout.write('\r\n');
  },
};
