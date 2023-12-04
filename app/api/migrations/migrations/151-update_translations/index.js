const newKeys = [{ key: 'Updated' }, { key: 'No Group' }, { key: 'Using URLs' }];

const deletedKeys = [];

export default {
  delta: 151,

  reindex: false,

  name: 'update_translations',

  description: 'Updates some translations for new Menu UI in settings',

  async up(db) {
    const settings = await db.collection('settings').findOne();
    const languages = settings.languages
      .map(l => l.key)
      .filter((value, index, array) => array.indexOf(value) === index);

    await db.collection('translationsV2').deleteMany({
      key: { $in: deletedKeys.concat(newKeys).map(k => k.key) },
      'context.id': 'System',
    });

    const insertMany = languages.map(l =>
      db.collection('translationsV2').insertMany(
        newKeys.map(k => ({
          key: k.key,
          value: k.key,
          language: l,
          context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
        }))
      )
    );
    await Promise.all(insertMany);

    process.stdout.write(`${this.name}...\r\n`);
  },
};

export { newKeys, deletedKeys };
