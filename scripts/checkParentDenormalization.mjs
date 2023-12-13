/* eslint-disable max-statements */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/*
Run this script simply with node, from the project root folder: node ./scripts/checkParentDenormalization.mjs
Depending on the state of the database, the output may be long, it is useful to pipe it to a file.
*/
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

const printResult = results => {
  const filtered = results.filter(
    r => r.entitiesWithoutTemplate > 0 || r.entitiesWithMissingParentDenormalization > 0
  );
  println(JSON.stringify(filtered, null, 2));
};

const countEntitiesWithoutTemplate = async db => {
  const entitiesCollection = db.collection('entities');
  const count = await entitiesCollection.countDocuments({ template: null });
  return count;
};

const isSelect = property => property.type === 'select' || property.type === 'multiselect';

const getPropertyThesaurusMap = async db => {
  const templateCollection = db.collection('templates');
  const allTemplates = await templateCollection.find({}).toArray();
  const selectProperties = _.flatMap(allTemplates, t => t.properties.filter(isSelect));
  const thesaurusByProperty = {};
  selectProperties.forEach(property => {
    thesaurusByProperty[property.name] = property.content;
  });
  return thesaurusByProperty;
};

const getParentInfo = async db => {
  const thesaurusCollection = db.collection('dictionaries');
  const thesauri = await thesaurusCollection.find({}).toArray();
  const parentInfo = Object.fromEntries(
    Object.entries(_.keyBy(thesauri, '_id')).map(([id, thesaurus]) => {
      const info = {
        hasParent: new Set(),
      };
      thesaurus.values.forEach(value => {
        if (value.values) {
          value.values.forEach(child => {
            info.hasParent.add(child.id);
          });
        }
      });
      return [id, info];
    })
  );
  return parentInfo;
};

const shouldHaveParent = (value, propertyName, thesaurusByProperty, parentInfo) => {
  const thesaurusId = thesaurusByProperty[propertyName];
  if (!thesaurusId) {
    return false;
  }
  const info = parentInfo[thesaurusId];
  return info.hasParent.has(value.value);
};

const countMissingParentDenormalization = async db => {
  const thesaurusByProperty = await getPropertyThesaurusMap(db);
  const parentInfo = await getParentInfo(db);

  const entitiesCollection = db.collection('entities');
  const entityCursor = entitiesCollection.find({});

  let count = 0;
  while (await entityCursor.hasNext()) {
    const entity = (await entityCursor.next()) || {};
    const metadata = Object.entries(entity.metadata || {});
    let correct = true;
    for (let i = 0; i < metadata.length; i += 1) {
      const [propertyName, propertyValues] = metadata[i];
      if (!(propertyName in thesaurusByProperty)) continue;
      for (let j = 0; j < propertyValues.length; j += 1) {
        const value = propertyValues[j];
        if (
          shouldHaveParent(value, propertyName, thesaurusByProperty, parentInfo) &&
          !value.parent
        ) {
          correct = false;
          break;
        }
      }
      if (!correct) {
        count += 1;
        break;
      }
    }
  }

  return count;
};

async function handleTenant(tenants, i, client) {
  const tenant = tenants[i];
  const db = client.db(tenant.dbName);
  const tenantResult = {};
  tenantResult.tenant = tenant;
  tenantResult.entitiesWithoutTemplate = await countEntitiesWithoutTemplate(db);
  tenantResult.entitiesWithMissingParentDenormalization =
    await countMissingParentDenormalization(db);
  return tenantResult;
}

async function main() {
  const client = await getClient();
  const tenants = await getTenants(client);

  const results = [];

  for (let i = 0; i < tenants.length; i += 1) {
    const tenantResult = await handleTenant(tenants, i, client);
    results.push(tenantResult);
  }

  printResult(results);
  println('Done!');

  await client.close();
}

main();
