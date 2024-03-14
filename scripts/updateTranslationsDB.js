/* eslint-disable node/no-restricted-import */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import csvtojson from 'csvtojson';
import fs from 'fs';
import { DB } from '../app/api/odm/DB.ts';
import { config } from '../app/api/config.ts';

const TRANSLATIONS_DIR = `${__dirname}/../contents/ui-translations`;
const logger = new console.Console(process.stdout, process.stderr);
const operations = [];

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
  const currentTranslations = await collection.find({ language }).toArray();
  const bulkOperations = [];

  currentTranslations.forEach(async translation => {
    const csvValue = csvTranslations.find(t => t.key === translation.key);
    if (csvValue && translation.key === translation.value && translation.value !== csvValue.value) {
      operations.push({
        language,
        key: translation.key.length > 50 ? `${translation.key.slice(0, 50)}...` : translation.key,
        action: 'Update',
      });
      bulkOperations.push({
        updateOne: {
          filter: { _id: translation._id },
          update: { $set: { value: csvValue.value } },
        },
      });
    }

    if (!csvValue) {
      operations.push({
        language,
        key: translation.key.length > 50 ? `${translation.key.slice(0, 50)}...` : translation.key,
        action: 'Remove',
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
      operations.push({
        language,
        key: translation.key.length > 50 ? `${translation.key.slice(0, 50)}...` : translation.key,
        action: 'Insert',
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

// eslint-disable-next-line max-statements
const run = async () => {
  await DB.connect(config.DBHOST, auth);
  const { db } = DB.connectionForDB(config.defaultTenant.dbName);

  const settings = await db.collection('settings').findOne();
  const installedLanguages = settings?.languages
    .map(l => l.key)
    .filter((value, index, array) => array.indexOf(value) === index);

  const availableCSVs = await getAvailableLanguages();

  for (const lang of installedLanguages) {
    const csvLang = availableCSVs.includes(lang) ? lang : 'en';
    const cvsKeys = await getKeysFromRepository(csvLang);
    await updateLanguage(db, lang, cvsKeys);
  }

  await DB.disconnect();

  logger.log(`Tenant: ${config.defaultTenant.dbName}`);
  if (operations.length === 0) {
    logger.log('No translations were updated');
    return;
  }

  logger.table(operations, ['language', 'key', 'action']);
  logger.log('\n');
};

run();
