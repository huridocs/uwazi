/* eslint-disable max-statements */
/* eslint-disable no-await-in-loop */
import assert from 'assert';
import process from 'process';

import _ from 'lodash';
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

const shallowObjectDiff = (left, right, ignoredProps) => {
  const ignoredPropSet = new Set(ignoredProps);
  const leftProps = new Set(Object.keys(left).filter(p => !ignoredPropSet.has(p)));
  const rightProps = new Set(Object.keys(right).filter(p => !ignoredPropSet.has(p)));
  const missing = Array.from(leftProps).filter(p => !rightProps.has(p));
  const extra = Array.from(rightProps).filter(p => !leftProps.has(p));
  const inBoth = Array.from(leftProps).filter(p => rightProps.has(p));
  const differentValue = inBoth.filter(p => !_.isEqual(left[p], right[p]));
  const all = missing.concat(extra, differentValue);
  return {
    isDifferent: !!all.length,
    missing,
    extra,
    differentValue,
    all,
  };
};

const diffDocs = async (sharedId, language, collectionName, db) => {
  const collection = db.collection(collectionName);
  const [left, right] = await collection.find({ sharedId, language }).toArray();
  assert(left);
  assert(right);
  const diff = shallowObjectDiff(left, right, ['_id']);
  return diff;
};

const logDifferences = async (counts, collectionName, db) => {
  const _counts = _.cloneDeep(counts);
  const countEntries = Object.entries(_counts);
  const duplicatedCounts = [];
  for (let i = 0; i < countEntries.length; i += 1) {
    const [sharedId, languagesObj] = countEntries[i];
    const diffObj = {};
    const languages = Object.entries(languagesObj);
    const duplicated = languages.filter(([, count]) => count > 1);
    for (let j = 0; j < duplicated.length; j += 1) {
      const [language] = duplicated[j];
      const diff = await diffDocs(sharedId, language, collectionName, db);
      diffObj[language] = diff;
    }
    duplicatedCounts.push([sharedId, diffObj]);
  }
  return duplicatedCounts;
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
  let maximumMultiplicity = 1;
  let languagesWithDuplications = new Set();
  let duplicatedCount = 0;
  let differenceLog = await logDifferences(counts, collectionName, db);

  Object.entries(counts).forEach(([, languages]) => {
    const langEntries = Object.entries(languages);
    correctTotalCount += langEntries.length;
    const duplicated = langEntries.filter(([, count]) => count > 1);
    duplicated.forEach(([, count]) => {
      if (count > maximumMultiplicity) {
        maximumMultiplicity = count;
      }
    });
    duplicatedCount += duplicated.length;
    duplicated.forEach(([language]) => languagesWithDuplications.add(language));
  });

  languagesWithDuplications = Array.from(languagesWithDuplications);

  return {
    correctTotalCount,
    duplicatedCount,
    maximumMultiplicity,
    languagesWithDuplications,
    differenceLog,
  };
};

const prettyPrintDiffLog = diffLog => {
  let sameCount = 0;
  const diffLines = [];
  diffLog.forEach(([sharedId, languages]) => {
    Object.entries(languages).forEach(([language, diff]) => {
      if (!diff.isDifferent) {
        sameCount += 1;
        return;
      }
      diffLines.push(`  ${sharedId} ${language}:`);
      if (diff.missing.length) diffLines.push(`    missing: ${diff.missing.join(', ')}`);
      if (diff.extra.length) diffLines.push(`    extra: ${diff.extra.join(', ')}`);
      if (diff.differentValue.length) {
        diffLines.push(`    differentValue: ${diff.differentValue.join(', ')}`);
      }
    });
  });
  println(`  ${sameCount} documents are the same.`);
  diffLines.forEach(line => println(line));
};

const prettyPrintResult = result => {
  const resultEntries = Object.entries(result);
  resultEntries.forEach(([dbName, tenantResult]) => {
    const { settingsLanguages, entities, pages } = tenantResult;
    if (
      settingsLanguages.duplicated.length === 0 &&
      entities.duplicatedCount === 0 &&
      pages.duplicatedCount === 0
    ) {
      return;
    }
    println(`${dbName}`);
    println(
      `${
        settingsLanguages.duplicated.length
      } duplicated languages in settings: ${settingsLanguages.duplicated.join(', ')}.`
    );
    println(
      `${entities.duplicatedCount} of ${entities.correctTotalCount}(${
        (100 * entities.duplicatedCount) / entities.correctTotalCount
      }%) duplicated sharedId-language pairs in entities. Maximum multiplicity is ${
        entities.maximumMultiplicity
      }. Languages with duplications: ${entities.languagesWithDuplications.join(', ')}.`
    );
    prettyPrintDiffLog(entities.differenceLog);
    println(
      `${pages.duplicatedCount} of ${pages.correctTotalCount}(${
        (100 * pages.duplicatedCount) / pages.correctTotalCount
      }%) duplicated sharedId-language pairs in pages. Maximum multiplicity is ${
        pages.maximumMultiplicity
      }. Languages with duplications: ${pages.languagesWithDuplications.join(', ')}.`
    );
    prettyPrintDiffLog(pages.differenceLog);
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
