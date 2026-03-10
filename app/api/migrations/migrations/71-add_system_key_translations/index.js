//eslint-disable-next-line node/no-restricted-import
import * as fs from 'fs';

import csv from 'api/csv/csv';

/*
This migration is meant to be repeatable.
After copy pasting:
  - change the contents of system_keys.csv to the new keyset
  - double check that the delta is correct
  - change the file location in the readCsvToSystemKeys call
  - change the tests, if necessary
*/

// eslint-disable-next-line max-statements
async function readCsvToSystemKeys(db, filename) {
  const fstream = fs.createReadStream(filename);
  const rows = await csv(fstream).read();
  fstream.close();
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

  rows.forEach(row => {
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
  delta: 71,

  reindex: false,

  name: 'add_system_key_translations',

  description: 'Adding missing translations for system keys, through importing from a csv file.',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    await readCsvToSystemKeys(
      db,
      'app/api/migrations/migrations/71-add_system_key_translations/system_keys.csv'
    );
  },
};
