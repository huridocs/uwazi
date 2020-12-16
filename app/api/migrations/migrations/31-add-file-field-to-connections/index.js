/* eslint-disable no-await-in-loop */
const getDefaultLanguage = async db => {
  const settings = await db
    .collection('settings')
    .find()
    .toArray();
  return settings[0].languages.filter(x => x.default)[0].key;
};

export default {
  delta: 31,

  name: 'add-file-field-to-connections',

  description: 'Add file field to the connections that have range and do not have file',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const defaultLanguage = await getDefaultLanguage(db);
    const cursor = db.collection('connections').find();

    while (await cursor.hasNext()) {
      const connection = await cursor.next();
      if (connection.range && !connection.file) {
        const files = await db
          .collection('files')
          .find({ entity: connection.entity, language: defaultLanguage })
          .toArray();

        await db
          .collection('connections')
          .updateOne({ _id: connection._id }, { $set: { file: files[0]._id.toString() } });
        process.stdout.write(`adding file to ${connection._id}\r\n`);
      }
    }
  },
};
