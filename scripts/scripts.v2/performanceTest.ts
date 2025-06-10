/* eslint-disable max-lines */
import { DB, models } from 'api/odm';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { appContext } from 'api/utils/AppContext';
import config from 'app/config';
import { Db } from 'mongodb';
import templates from '../../app/api/templates';
import { getFixturesFactory } from '../../app/api/utils/fixturesFactory';
import testingDB, { DBFixture } from '../../app/api/utils/testing_db';

const testing_db_name = 'templates_save_perf';

const compareRuns = async (callback, patchedCallback) => {
  let start = performance.now();
  appContext.set('use_patched', false);
  await callback();
  const normalPerf = performance.now() - start;
  start = performance.now();
  appContext.set('use_patched', true);
  await patchedCallback();
  const patchedPerf = performance.now() - start;
  console.log(
    `normal: ${normalPerf.toFixed(2)}, patched: ${patchedPerf.toFixed(2)}, diff: ${(normalPerf - patchedPerf).toFixed(2)}`
  );
};

const fixturer = {
  async clear(db: Db, _collections: string[] | undefined = undefined): Promise<void> {
    const collections: string[] =
      _collections || (await db.listCollections().toArray()).map(c => c.name);

    await Promise.all(
      collections.map(async c => {
        await db.collection(c).deleteMany({});
      })
    );
  },

  async clearAllAndLoad(db: Db, fixtures: DBFixture) {
    fixtures.updatelogs = fixtures.updatelogs || [];
    const existingCollections = new Set((await db.listCollections().toArray()).map(c => c.name));
    const expectedCollectons = Object.keys(models).concat(Object.keys(fixtures));
    const missingCollections = Array.from(
      new Set(expectedCollectons.filter(name => !existingCollections.has(name)))
    );
    await this.clear(db);
    await Promise.all(missingCollections.map(async collname => db.createCollection(collname)));
    await Promise.all(
      Object.keys(fixtures).map(async collectionName => {
        if (fixtures[collectionName].length) {
          await db.collection(collectionName).insertMany(fixtures[collectionName]);
        }
      })
    );
  },
};
const factory = getFixturesFactory();

const generateTemplate = () => {
  return factory.template('test performance', [
    { _id: testingDB.id(), label: 'Field 1', type: 'text', name: 'field1' },
    { _id: testingDB.id(), label: 'Field 2', type: 'text', name: 'field2' },
    { _id: testingDB.id(), label: 'Field 3', type: 'text', name: 'field3' },
    { _id: testingDB.id(), label: 'Field 4', type: 'text', name: 'field4' },
    { _id: testingDB.id(), label: 'Field 5', type: 'text', name: 'field5' },
  ]);
};

const generateEntity = (template, num: number, languages = ['en']) =>
  factory.entityInMultipleLanguages(languages, `Entity ${num}`, template, {
    field1: [{ value: `Value 1 for entity ${num}` }],
    field2: [{ value: `Value 2 for entity ${num}` }],
    field3: [{ value: `Value 3 for entity ${num}` }],
    field4: [{ value: `Value 4 for entity ${num}` }],
    field5: [{ value: `Value 5 for entity ${num}` }],
  });

const generateEntities = (template, count, languages = ['en']) => {
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(generateEntity(template, i, languages));
  }
  return result.flat();
};

async function onlyTextProperties() {
  console.log('Running text properties performance test...');
  const template = generateTemplate();

  await fixturer.clearAllAndLoad(DB.mongodb_Db(testing_db_name), {
    templates: [template],
    entities: generateEntities('test performance', 1000),
    settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  });

  // Instrument both templates and entities objects
  // instrumentObject(templates, 'templates');
  // instrumentObject(entities, 'entities');
  // instrumentObject(templatesModel, 'templatesModel');
  // instrumentObject(entitiesModel, 'entitiesModel');

  await compareRuns(
    async () => {
      await templates.save(template, 'en');
    },
    async () => {
      await templates.save(template, 'en');
    }
  );
  // console.info(printPerformanceStats());
}

async function onlyTextPropertiesMultipleLanguages() {
  console.log('Running text properties performance test...');
  const template = generateTemplate();

  await fixturer.clearAllAndLoad(DB.mongodb_Db(testing_db_name), {
    templates: [template],
    entities: generateEntities('test performance', 1000, ['en', 'es', 'pt']),
    settings: [
      {
        languages: [
          { key: 'en', label: 'English', default: true },
          { key: 'es', label: 'Spanish' },
          { key: 'pt', label: 'Portuguese' },
        ],
      },
    ],
  });

  await compareRuns(
    async () => {
      await templates.save(template, 'en');
    },
    async () => {
      await templates.save(template, 'en');
    }
  );
}

async function allEntitiesSameHub() {
  console.log('Running relationships performance test...');
  const template1 = factory.template('template1');
  const template2 = factory.template('template2', [factory.relationshipProp('rel1', 'template1')]);
  const hub1 = testingDB.id();

  const entitiesFixtures = [];
  const connections = [];
  for (let i = 0; i < 500; i += 1) {
    entitiesFixtures.push(factory.entity(`template1.entity${i}`, 'template1'));
    entitiesFixtures.push(
      factory.entity(`template2.entity${i}`, 'template2', {
        rel1: [factory.metadataValue(`template1.entity${i}`)],
      })
    );
    connections.push({
      _id: testingDB.id(),
      entity: `template1.entity${i}`,
      template: factory.idString('rel1'),
      hub: hub1,
    });
    connections.push({
      _id: testingDB.id(),
      entity: `template2.entity${i}`,
      hub: hub1,
    });
  }

  await fixturer.clearAllAndLoad(DB.mongodb_Db(testing_db_name), {
    templates: [template1, template2],
    relationtypes: [factory.relationType('rel1')],
    entities: entitiesFixtures,
    connections,
    settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  });

  // Instrument objects for performance monitoring
  // instrumentObject(templates, 'templates');
  // instrumentObject(templatesModel, 'templatesModel');
  // instrumentObject(entitiesModel, 'entitiesModel');
  // instrumentObject(search, 'search');

  await compareRuns(
    async () => {
      template2.properties[0].label = 'rel1 renamed';
      await templates.save(template2, 'en');
    },
    async () => {
      template2.properties[0].label = 'rel1 re renamed';
      await templates.save(template2, 'en');
    }
  );

  // console.info(printPerformanceStats());
}

async function allEntitiesSameHubMultiLanguage() {
  console.log('Running relationships performance test...');
  const template1 = factory.template('template1');
  const template2 = factory.template('template2', [factory.relationshipProp('rel1', 'template1')]);
  const hub1 = testingDB.id();

  const entitiesFixtures = [];
  const connections = [];
  for (let i = 0; i < 500; i += 1) {
    entitiesFixtures.push(factory.entityInMultipleLanguages(['en', 'es', 'pt'],`template1.entity${i}`, 'template1'));
    entitiesFixtures.push(
      factory.entityInMultipleLanguages(['en', 'es', 'pt'],`template2.entity${i}`, 'template2', {
        rel1: [factory.metadataValue(`template1.entity${i}`)],
      })
    );
    connections.push({
      _id: testingDB.id(),
      entity: `template1.entity${i}`,
      template: factory.idString('rel1'),
      hub: hub1,
    });
    connections.push({
      _id: testingDB.id(),
      entity: `template2.entity${i}`,
      hub: hub1,
    });
  }

  await fixturer.clearAllAndLoad(DB.mongodb_Db(testing_db_name), {
    templates: [template1, template2],
    relationtypes: [factory.relationType('rel1')],
    entities: entitiesFixtures.flat(),
    connections,
    settings: [
      {
        languages: [
          { key: 'en', label: 'English', default: true },
          { key: 'es', label: 'Spanish' },
          { key: 'pt', label: 'Portuguese' },
        ],
      },
    ],
  });

  // Instrument objects for performance monitoring
  // instrumentObject(templates, 'templates');
  // instrumentObject(templatesModel, 'templatesModel');
  // instrumentObject(entitiesModel, 'entitiesModel');
  // instrumentObject(search, 'search');

  await compareRuns(
    async () => {
      template2.properties[0].label = 'rel1 renamed';
      await templates.save(template2, 'en');
    },
    async () => {
      template2.properties[0].label = 'rel1 re renamed';
      await templates.save(template2, 'en');
    }
  );

  // console.info(printPerformanceStats());
}

async function main() {
  await DB.connect(config.DBHOST, config.DBAUTH);
  try {
    console.log('Starting performance tests...');

    tenants.add({ name: testing_db_name, dbName: testing_db_name });

    await tenants.run(async () => {
      permissionsContext.setCommandContext();
      await onlyTextProperties();
      await onlyTextPropertiesMultipleLanguages();
      await allEntitiesSameHub();
      await allEntitiesSameHubMultiLanguage();
    }, testing_db_name);

    console.log('Tests completed successfully.');
  } catch (error) {
    console.error('Error running performance tests:', error);
  } finally {
    await DB.disconnect();
    process.exit(0);
  }
}

// Run the script
main();
