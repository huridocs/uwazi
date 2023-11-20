/* eslint-disable max-statements */
/* eslint-disable no-await-in-loop */
import assert from 'assert';
import process from 'process';

import mongodb from 'mongodb';

const sharedDbName = 'uwazi_shared_db';

const println = text => process.stdout.write(`${text}\n`);

const getClient = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://127.0.0.1/';
  const client = new mongodb.MongoClient(url);
  await client.connect();

  return client;
};

const getTenants = async client => {
  const sharedDb = client.db(sharedDbName);
  const tenantsCollection = sharedDb.collection('tenants');
  const tenants = await tenantsCollection.find({}).toArray();
  return tenants;
};

const countSettingsLanguages = async db => {
  const settingsCollection = db.collection('settings');
  const settings = await settingsCollection.findOne({});
  assert(settings);
  const languages = settings.languages || [];
  const keys = languages.map(l => l.key);
  const counts = keys.reduce((acc, key) => {
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  counts.duplicated = Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
  return counts;
};

const countSharedIdLanguageDuplicates = async (db, collectionName) => {
  const collection = db.collection(collectionName);
  const cursor = collection.find({});
  const counts = {};

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const { sharedId, language } = doc;
    if (!(sharedId in counts)) {
      counts[sharedId] = {};
    }
    if (!(language in counts[sharedId])) {
      counts[sharedId][language] = 0;
    }
    counts[sharedId][language] += 1;
  }

  let correctTotalCount = 0;
  let languagesWithDuplications = new Set();
  let duplicatedCount = 0;

  Object.entries(counts).forEach(([, languages]) => {
    const langEntries = Object.entries(languages);
    correctTotalCount += langEntries.length;
    const duplicated = langEntries.filter(([, count]) => count > 1);
    duplicatedCount += duplicated.length;
    duplicated.forEach(([language]) => languagesWithDuplications.add(language));
  });

  languagesWithDuplications = Array.from(languagesWithDuplications);

  return { correctTotalCount, duplicatedCount, languagesWithDuplications };
};

const prettyPrintResult = result => {
  const resultEntries = Object.entries(result);
  resultEntries.forEach(([dbName, tenantResult]) => {
    println(`${dbName}`);
    const { settingsLanguages, entities, pages } = tenantResult;
    println(
      `${
        settingsLanguages.duplicated.length
      } duplicated languages in settings: ${settingsLanguages.duplicated.join(', ')}.`
    );
    println(
      `${entities.duplicatedCount} of ${entities.correctTotalCount}(${
        (100 * entities.duplicatedCount) / entities.correctTotalCount
      }%) duplicated sharedId-language pairs in entities. Languages with duplications: ${entities.languagesWithDuplications.join(
        ', '
      )}.`
    );
    println(
      `${pages.duplicatedCount} of ${pages.correctTotalCount}(${
        (100 * pages.duplicatedCount) / pages.correctTotalCount
      }%) duplicated sharedId-language pairs in pages. Languages with duplications: ${pages.languagesWithDuplications.join(
        ', '
      )}.`
    );
    println('');
  });
};

async function main() {
  const client = await getClient();
  const tenants = await getTenants(client);

  const result = {};

  for (let i = 0; i < tenants.length; i += 1) {
    const tenant = tenants[i];
    const db = client.db(tenant.dbName);
    result[tenant.dbName] = {};
    const tenantResult = result[tenant.dbName];
    tenantResult.settingsLanguages = await countSettingsLanguages(db);
    tenantResult.entities = await countSharedIdLanguageDuplicates(db, 'entities');
    tenantResult.pages = await countSharedIdLanguageDuplicates(db, 'pages');
  }

  prettyPrintResult(result);

  await client.close();
}

main();
