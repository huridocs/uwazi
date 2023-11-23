/* eslint-disable max-statements */
/* eslint-disable no-await-in-loop */
/*
Run this script simply with node, from the project root folder: node ./scripts/checkLanguageDuplication.mjs
Depending on the state of the database, the output may be long, it is useful to pipe it to a file.
*/
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

const uniqueConcatProps = (objs, prop) => _.uniq(_.flatten(objs.map(o => o[prop])));

const combineDiffs = diffs => ({
  isDifferent: diffs.some(diff => diff.isDifferent),
  missing: uniqueConcatProps(diffs, 'missing'),
  extra: uniqueConcatProps(diffs, 'extra'),
  differentValue: uniqueConcatProps(diffs, 'differentValue'),
  all: uniqueConcatProps(diffs, 'all'),
});

const diffDocs = async (sharedId, language, collectionName, db) => {
  const collection = db.collection(collectionName);
  const docs = await collection.find({ sharedId, language }).toArray();
  assert(docs.length > 1);
  const diffs = [];
  for (let i = 0; i < docs.length - 1; i += 1) {
    const diff = shallowObjectDiff(docs[i], docs[i + 1], ['_id']);
    diffs.push(diff);
  }
  const diff = combineDiffs(diffs);
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
  const moreThanTwos = {};

  Object.entries(counts).forEach(([sharedId, languages]) => {
    const langEntries = Object.entries(languages);
    correctTotalCount += langEntries.length;
    const duplicated = langEntries.filter(([, count]) => count > 1);
    const moreThanTwo = duplicated.filter(([, count]) => count > 2);
    duplicated.forEach(([, count]) => {
      if (count > maximumMultiplicity) {
        maximumMultiplicity = count;
      }
    });
    duplicatedCount += duplicated.length;
    duplicated.forEach(([language]) => languagesWithDuplications.add(language));
    if (moreThanTwo.length) {
      moreThanTwos[sharedId] = moreThanTwo;
    }
  });

  languagesWithDuplications = Array.from(languagesWithDuplications);

  return {
    correctTotalCount,
    duplicatedCount,
    maximumMultiplicity,
    languagesWithDuplications,
    differenceLog,
    moreThanTwos,
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

const prettyPrintCategory = (category, countObj) => {
  println(
    `${countObj.duplicatedCount} of ${countObj.correctTotalCount}(${
      (100 * countObj.duplicatedCount) / countObj.correctTotalCount
    }%) duplicated sharedId-language pairs in ${category}. Maximum multiplicity is ${
      countObj.maximumMultiplicity
    }. Languages with duplications: ${countObj.languagesWithDuplications.join(', ')}.`
  );
  // if (Object.keys(countObj.moreThanTwos).length) {
  //   println('  More than two instances:');
  //   Object.entries(countObj.moreThanTwos).forEach(([sharedId, languages]) => {
  //     println(
  //       `    ${sharedId}: ${languages
  //         .map(([language, count]) => `${language}(${count})`)
  //         .join(', ')}`
  //     );
  //   });
  // }
  prettyPrintDiffLog(countObj.differenceLog);
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
    prettyPrintCategory('entities', entities);
    prettyPrintCategory('pages', pages);
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
