/* eslint-disable max-lines */
import { config } from 'api/config';
import { DB, models } from 'api/odm';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { Db } from 'mongodb';
import templates from '../../app/api/templates';
import { getFixturesFactory } from '../../app/api/utils/fixturesFactory';
import testingDB, { DBFixture } from '../../app/api/utils/testing_db';

const testing_db_name = 'templates_save_perf';

const compareRuns = async (
  callback: () => Promise<void>,
  patchedCallback: () => Promise<void>
): Promise<void> => {
  let start = performance.now();
  tenants.add({ name: testing_db_name, dbName: testing_db_name });
  await callback();
  const normalPerf = performance.now() - start;
  start = performance.now();
  tenants.add({
    name: testing_db_name,
    dbName: testing_db_name,
    featureFlags: { improvedTemplatesSave: true },
  });
  await patchedCallback();
  const patchedPerf = performance.now() - start;
  const diff = patchedPerf - normalPerf;
  const percentageDiff = ((patchedPerf - normalPerf) / normalPerf) * 100;
  const diffColor = diff > 0 ? '\x1b[31m' : '\x1b[32m'; // Red if negative, green if positive
  console.log(
    `normal: ${normalPerf.toFixed(2)}, patched: ${patchedPerf.toFixed(2)}, diff: ${diffColor}${diff.toFixed(2)} (${percentageDiff.toFixed(2)}%)\x1b[0m`
  );
  console.log('');
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

const generateEntity = (template: string, num: number, languages = ['en']) =>
  factory.entityInMultipleLanguages(languages, `Entity ${num}`, template, {
    field1: [{ value: `Value 1 for entity ${num}` }],
    field2: [{ value: `Value 2 for entity ${num}` }],
    field3: [{ value: `Value 3 for entity ${num}` }],
    field4: [{ value: `Value 4 for entity ${num}` }],
    field5: [{ value: `Value 5 for entity ${num}` }],
  });

const generateEntities = (template: string, count: number, languages = ['en']) => {
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(generateEntity(template, i, languages));
  }
  return result.flat();
};

async function onlyTextProperties(numberOfEntities: number) {
  console.log(`Text properties performance test (${numberOfEntities} entities)... `);
  const template = generateTemplate();

  await fixturer.clearAllAndLoad(DB.mongodb_Db(testing_db_name), {
    templates: [template],
    entities: generateEntities('test performance', numberOfEntities),
    settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
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

async function onlyTextPropertiesMultipleLanguages(numberOfEntities: number) {
  console.log(`Text properties performance test (multilanguage, ${numberOfEntities} entities)...`);
  const template = generateTemplate();

  await fixturer.clearAllAndLoad(DB.mongodb_Db(testing_db_name), {
    templates: [template],
    entities: generateEntities('test performance', numberOfEntities, ['en', 'es', 'pt']),
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

async function allEntitiesSameHub(numberOfEntities: number) {
  console.log(`Changing template prop name test (${numberOfEntities} entities)...`);
  const template1 = factory.template('template1');
  const template2 = factory.template('template2', [factory.relationshipProp('rel1', 'template1')]);
  const hub1 = testingDB.id();

  const entitiesFixtures = [];
  const connections = [];
  for (let i = 0; i < numberOfEntities; i += 1) {
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
}

async function allEntitiesSameHubMultiLanguage(numberOfEntities: number) {
  console.log(`Changing template prop name test (multilanguage ${numberOfEntities} entities)...`);
  const template1 = factory.template('template1');
  const template2 = factory.template('template2', [factory.relationshipProp('rel1', 'template1')]);
  const hub1 = testingDB.id();

  const entitiesFixtures = [];
  const connections = [];
  for (let i = 0; i < numberOfEntities; i += 1) {
    entitiesFixtures.push(
      factory.entityInMultipleLanguages(['en', 'es', 'pt'], `template1.entity${i}`, 'template1')
    );
    entitiesFixtures.push(
      factory.entityInMultipleLanguages(['en', 'es', 'pt'], `template2.entity${i}`, 'template2', {
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
}

async function allEntitiesSameHubChangingInheritedMultilanguage(numberOfEntities: number) {
  console.log(
    `Changing template relationship prop inheritedProp test (multilingual, ${numberOfEntities} entities )...`
  );

  const template1 = factory.template('template1', [factory.property('text property')]);
  const template2 = factory.template('template2', [factory.relationshipProp('rel1', 'template1')]);
  const hub1 = testingDB.id();

  const entitiesFixtures = [];
  const connections = [];
  for (let i = 0; i < numberOfEntities; i += 1) {
    entitiesFixtures.push(
      factory.entityInMultipleLanguages(['en', 'es', 'pt'], `template1.entity${i}`, 'template1')
    );
    entitiesFixtures.push(
      factory.entityInMultipleLanguages(['en', 'es', 'pt'], `template2.entity${i}`, 'template2', {
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

  await compareRuns(
    async () => {
      template2.properties[0].inherit = { property: factory.idString('text property') };
      await templates.save(template2, 'en');
    },
    async () => {
      template2.properties[0].inherit = { type: 'text' };
      await templates.save(template2, 'en');
    }
  );
}

async function run() {
  await DB.connect(config.DBHOST, config.DBAUTH);
  try {
    console.log('Starting performance tests...');
    console.log('');

    tenants.add({ name: testing_db_name, dbName: testing_db_name });

    await tenants.run(async () => {
      permissionsContext.setCommandContext();
      await onlyTextProperties(100);
      await onlyTextProperties(300);
      await onlyTextPropertiesMultipleLanguages(100);
      await onlyTextPropertiesMultipleLanguages(300);
      await allEntitiesSameHub(100);
      await allEntitiesSameHub(300);
      await allEntitiesSameHubMultiLanguage(100);
      await allEntitiesSameHubMultiLanguage(300);
      await allEntitiesSameHubChangingInheritedMultilanguage(100);
      await allEntitiesSameHubChangingInheritedMultilanguage(300);
    }, testing_db_name);

    console.log('Tests completed successfully.');
  } catch (error) {
    console.error('Error running performance tests:', error);
  } finally {
    await DB.disconnect();
    process.exit(0);
  }
}

run();
