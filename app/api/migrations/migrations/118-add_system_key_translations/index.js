/*
This migration is meant to be repeatable.
After copy pasting:
  - add new key-value pairs in systemKeys
  - up delta number
  - update test
*/

async function insertSystemKeys(db, newKeys) {
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

  await Promise.all(
    translations.map(tr => db.collection('translations').replaceOne({ _id: tr._id }, tr))
  );
}

export default {
  delta: 118,

  reindex: false,

  name: 'add_system_key_translations',

  description: 'Adding missing translations for system keys.',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const systemKeys = [
      {
        key: 'Sort ascending',
        value: 'Sort ascending',
      },
      {
        key: 'Sort descending',
        value: 'Sort descending',
      },
    ];
    await insertSystemKeys(db, systemKeys);
  },
};
