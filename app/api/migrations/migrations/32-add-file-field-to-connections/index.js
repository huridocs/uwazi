/* eslint-disable no-await-in-loop */
import languages from 'shared/languages';

const getDefaultLanguage = async db => {
  const settings = await db.collection('settings').find().toArray();

  const languageKey = settings[0].languages.filter(x => x.default)[0].key;
  const language = languages.data.filter(x => x.ISO639_1 === languageKey)[0];
  return language ? language.franc : 'other';
};

export default {
  delta: 32,

  name: 'add-file-field-to-connections',

  description: 'Add file field to the connections that have range and do not have file',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const defaultLanguage = await getDefaultLanguage(db);
    const cursor = db.collection('connections').find();

    while (await cursor.hasNext()) {
      const connection = await cursor.next();
      if (connection.range && !connection.file) {
        process.stdout.write(`adding file to ${connection._id}\r\n`);
        const files = await db
          .collection('files')
          .find({ entity: connection.entity, language: defaultLanguage })
          .toArray();

        await db
          .collection('connections')
          .updateOne({ _id: connection._id }, { $set: { file: files[0]._id.toString() } });
      }
    }
  },
};
