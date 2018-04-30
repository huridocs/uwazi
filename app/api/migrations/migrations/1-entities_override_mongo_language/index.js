export default {
  delta: 1,

  name: 'entities_override_mongo_language',

  description:
  `duplicates entities.language propery to mongoLanguage, 
  this is to be able to configure language "none" 
  when the language is unsuported for text indexes`,

  up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    return new Promise((resolve, reject) => {
      const cursor = db.collection('entities').find();
      let index = 1;
      cursor.on('data', (doc) => {
        cursor.pause();
        let mongoLanguage = doc.language;
        if (mongoLanguage === 'ar') {
          mongoLanguage = 'none';
        }
        db.collection('entities').findOneAndUpdate(doc, { $set: { mongoLanguage } }, () => {
          process.stdout.write(`processed -> ${index}\r`);
          index += 1;
          cursor.resume();
        });
      });

      cursor.on('err', reject);
      cursor.on('end', () => {
        process.stdout.write(`processed -> ${index}\r\n`);
        resolve();
      });
    });
  }
};
