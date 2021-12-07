/*
This migration is meant to be repeatable.
After copy pasting:
  - change the contents of system_keys.csv to the new keyset
  - change the file location in the readCsvToSystemKeys call
  - change the tests, if necessary
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
    const { key, optionalValue } = row;

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
  delta: 57,

  name: 'add_system_key_translations',

  description: 'Inserts system keys of added translations.',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const systemKeys = [
      {
        key: 'Suggestion',
        value: 'Suggestion',
      },
      {
        key: 'All',
        value: 'All',
      },
      {
        key: 'Matching',
        value: 'Matching',
      },
      {
        key: 'Pending',
        value: 'Pending',
      },
      {
        key: 'Empty',
        value: 'Empty',
      },
      {
        key: 'Segment',
        value: 'Segment',
      },
      {
        key: 'State',
        value: 'State',
      },
      {
        key: 'Reviewing',
        value: 'Reviewing',
      },
      {
        key: 'Review',
        value: 'Review',
      },
      {
        key: 'Dashboard',
        value: 'Dashboard',
      },
      {
        key: 'Find suggestions',
        value: 'Find suggestions',
      },
      {
        key: 'per page',
        value: 'per page',
      },
      {
        key: 'Confirm suggestion acceptance',
        value: 'Confirm suggestion acceptance',
      },
      {
        key: 'Apply to all languages',
        value: 'Apply to all languages',
      },
    ];
    await insertSystemKeys(db, systemKeys);
  },
};
