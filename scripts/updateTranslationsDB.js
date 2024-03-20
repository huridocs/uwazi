/* eslint-disable max-statements */
/* eslint-disable node/no-restricted-import */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import csvtojson from 'csvtojson';
import fs from 'fs';
import { DB } from '../app/api/odm/DB.ts';
import { config } from '../app/api/config.ts';
import { exit } from 'process';

const TRANSLATIONS_DIR = `${__dirname}/../contents/ui-translations`;
const logger = new console.Console(process.stdout, process.stderr);
const operationsLog = { update: [], insert: [], remove: [] };

let auth;
if (process.env.DBUSER) {
  auth = {
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

const getKeysFromRepository = async (locale = 'en') =>
  new Promise((resolve, reject) => {
    fs.readFile(`${TRANSLATIONS_DIR}/${locale}.csv`, (err, fileContent) => {
      if (err) reject(err);

      csvtojson({
        delimiter: [',', ';'],
        quote: '"',
        headers: ['key', 'value'],
      })
        .fromString(fileContent.toString())
        .then(resolve)
        .catch(reject);
    });
  });

const getAvailableLanguages = async () =>
  new Promise((resolve, reject) => {
    fs.readdir(TRANSLATIONS_DIR, (err, files) => {
      if (err) reject(err);
      resolve(files.map(file => file.replace('.csv', '')));
    });
  });

const updateLanguage = async (db, language, csvTranslations) => {
  const context = { type: 'Uwazi UI', label: 'User Interface', id: 'System' };
  const collection = db.collection('translationsV2');
  const currentTranslations = await collection
    .find({ language, 'context.id': context.id })
    .toArray();
  const bulkOperations = [];

  currentTranslations.forEach(async translation => {
    const csvValue = csvTranslations.find(t => t.key === translation.key);
    if (csvValue && translation.key === translation.value && translation.value !== csvValue.value) {
      operationsLog.update.push({
        language,
        key: translation.key.length > 50 ? `${translation.key.slice(0, 50)}...` : translation.key,
      });
      bulkOperations.push({
        updateOne: {
          filter: { _id: translation._id },
          update: { $set: { value: csvValue.value } },
        },
      });
    }

    if (!csvValue) {
      operationsLog.remove.push({
        language,
        key: translation.key.length > 50 ? `${translation.key.slice(0, 50)}...` : translation.key,
      });
      bulkOperations.push({
        deleteOne: {
          filter: { _id: translation._id },
        },
      });
    }
  });

  csvTranslations.forEach(translation => {
    const currentTranslation = currentTranslations.find(t => t.key === translation.key);
    if (!currentTranslation) {
      operationsLog.insert.push({
        language,
        key: translation.key.length > 50 ? `${translation.key.slice(0, 50)}...` : translation.key,
      });
      bulkOperations.push({
        insertOne: {
          document: {
            key: translation.key,
            value: translation.value,
            language,
            context,
          },
        },
      });
    }
  });

  if (bulkOperations.length) {
    await collection.bulkWrite(bulkOperations);
  }
};

const report = () => {
  logger.log(`=== Tenant: \x1b[32m ${config.defaultTenant.dbName} \x1b[0m ===`);
  if (operationsLog.insert.length) {
    logger.log(`\n=== Inserted \x1b[32m ${operationsLog.insert.length} \x1b[0m translations ===`);
    logger.table(operationsLog.insert, ['language', 'key']);
  }
  if (operationsLog.update.length) {
    logger.log(`\n=== Updated \x1b[32m ${operationsLog.update.length} \x1b[0m translations ===`);
    logger.table(operationsLog.update, ['language', 'key']);
  }

  if (operationsLog.remove.length) {
    logger.log(`\n=== Removed \x1b[32m ${operationsLog.remove.length} \x1b[0m translations ===`);
    logger.table(operationsLog.remove, ['language', 'key']);
  }
};

const checkCSVsIntegrity = async availableCSVs => {
  const allLanguagesKeys = [];

  for (const lang of availableCSVs) {
    const cvsKeys = await getKeysFromRepository(lang);
    allLanguagesKeys.push({ lang, keys: cvsKeys, set: new Set(cvsKeys.map(k => k.key)) });
  }

  let keysLength;
  for (const lang of allLanguagesKeys) {
    if (!keysLength) {
      keysLength = lang.keys.length;
    }

    if (keysLength !== lang.keys.length) {
      logger.log(
        `The number of keys in the ${lang.lang}.csv file is different from other languages \n`
      );
      exit(1);
    }
  }

  for (const lang of allLanguagesKeys) {
    for (const lang2 of allLanguagesKeys) {
      if (lang.set !== lang2.set) {
        const diff = new Set([...lang.set].filter(x => !lang2.set.has(x)));
        if (diff.size) {
          logger.log(
            `The keys in the ${lang.lang}.csv file are different from the keys in the ${lang2.lang}.csv file: \x1b[31m ${[...diff].join(', ')} \x1b[0m \n`
          );
          exit(1);
        }
      }
    }
  }
};

// eslint-disable-next-line max-statements
const run = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://127.0.0.1/';
  await DB.connect(url, auth);
  const { db } = DB.connectionForDB(config.defaultTenant.dbName);

  const settings = await db.collection('settings').findOne();
  const installedLanguages = settings?.languages
    .map(l => l.key)
    .filter((value, index, array) => array.indexOf(value) === index);

  const availableCSVs = await getAvailableLanguages();
  await checkCSVsIntegrity(availableCSVs);
  for (const lang of installedLanguages) {
    const csvLang = availableCSVs.includes(lang) ? lang : 'en';
    const cvsKeys = await getKeysFromRepository(csvLang);
    await updateLanguage(db, lang, cvsKeys);
  }

  await DB.disconnect();
  report();
};

run();
