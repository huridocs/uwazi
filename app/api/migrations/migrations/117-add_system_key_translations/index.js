/*
This migration is meant to be repeatable.
After copy pasting:
  - change the contents of system_keys.csv to the new keyset
  - change the file location in the readCsvToSystemKeys call
  - change the tests, if necessary
*/

async function updateKeys(db, newKeys, removeKeys) {
  const translations = await db.collection('translations').find().toArray();
  const locales = translations.map(tr => tr.locale);

  const locToSystemContext = {};
  translations.forEach(tr => {
    locToSystemContext[tr.locale] = tr.contexts.find(c => c.id === 'System');
  });
  const locToKeys = {};
  Object.entries(locToSystemContext).forEach(([loc, context]) => {
    locToKeys[loc] = new Set(context.values.map(v => v.key));
  });

  newKeys.forEach(row => {
    const { key, value: optionalValue } = row;

    locales.forEach(loc => {
      if (!locToKeys[loc].has(key)) {
        const newValue = optionalValue || key;
        locToSystemContext[loc].values.push({ key, value: newValue });
        locToKeys[loc].add(key);
      }
    });
  });

  removeKeys.forEach(key => {
    locales.forEach(loc => {
      if (locToKeys[loc].has(key)) {
        const value = locToSystemContext[loc].values.find(v => v.key === key);
        const valueIndex = locToSystemContext[loc].values.indexOf(value);
        locToSystemContext[loc].values.splice(valueIndex, 1);
      }
    });
  });

  await Promise.all(
    translations.map(tr => db.collection('translations').replaceOne({ _id: tr._id }, tr))
  );
}

export default {
  delta: 117,

  reindex: false,

  name: 'add_system_key_translations',

  description: 'Adding missing translations for system keys.',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const systemKeys = [
      {
        key: 'Global CSS & JS',
        value: 'Global CSS & JS',
      },
      {
        key: 'Custom JS',
        value: 'Custom JS',
      },
    ];

    const removeKeys = ['Custom styles'];
    await updateKeys(db, systemKeys, removeKeys);
  },
};
