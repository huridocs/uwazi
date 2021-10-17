import * as fs from 'fs';

import csv from 'api/csv/csv';
import { Db } from 'mongodb';

export type TranslationContext = {
  _id: string;
  id: string;
  label: string;
  type: string;
  values: [
    {
      key: string;
      value: string;
    }
  ];
};

export type Translation = {
  locale: string;
  contexts: TranslationContext[];
};

type SystemKey = { key: string; optionalValue?: string };

async function readCsvToSystemKeys(filename: string) {
  const fstream = fs.createReadStream(filename);
  const rows = await csv(fstream).read();
  fstream.close();
  return rows;
}

async function migrateTranslations(db: Db, systemKeys: SystemKey[]) {
  const translations = await db
    .collection('translations')
    .find()
    .toArray();
  const locales = translations.map(tr => tr.locale);

  const locToSystemContext: { [key: string]: TranslationContext } = {};
  translations.forEach((tr: Translation) => {
    locToSystemContext[tr.locale] = tr.contexts.find(c => c.id === 'System')!;
  });
  const locToKeys: { [key: string]: Set<string> } = {};
  Object.entries(locToSystemContext).forEach(([loc, context]: [string, TranslationContext]) => {
    locToKeys[loc] = new Set(context.values.map(v => v.key));
  });

  systemKeys.forEach(entry => {
    const { key, optionalValue } = entry;
    locales.forEach(loc => {
      if (!locToKeys[loc].has(key)) {
        const newValue = optionalValue || key;
        locToSystemContext[loc].values.push({ key, value: newValue });
        locToKeys[loc].add(key);
      }
    });
  });

  return Promise.all(
    translations.map(async (tr: TranslationContext) =>
      db.collection('translations').replaceOne({ _id: tr._id }, tr)
    )
  );
}

async function migrateTranslationsFromCSV(db: Db, csvPath: string) {
  const systemKeys: SystemKey[] = await readCsvToSystemKeys(csvPath);
  await migrateTranslations(db, systemKeys);
}

export { migrateTranslationsFromCSV, migrateTranslations };
