/* eslint-disable max-lines */
import { config } from 'api/config';
import { EntitySchema } from 'api/migrations/migrations/143-parse-numeric-fields/types';
import { DB, models } from 'api/odm';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { Tenant } from 'api/tenants/tenantContext';
import { Db } from 'mongodb';
import { FileType } from 'shared/types/fileType';
import templates from '../../app/api/templates';
import { getFixturesFactory } from '../../app/api/utils/fixturesFactory';
import testingDB, { DBFixture } from '../../app/api/utils/testing_db';
import { elasticTesting } from 'api/utils/elastic_testing';

// const testing_db_name = 'templates_save_perf';
// @ts-ignore
const tenant: Tenant = {
  name: 'default',
  dbName: 'templates_save_perf',
  indexName: 'templates_save_perf',
};

const formatMemory = function (bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
};

const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    rss: usage.rss,
  };
};

const forceGC = async () => {
  if (global.gc) {
    // Run GC multiple times to ensure better cleanup
    for (let i = 0; i < 5; i++) {
      global.gc();
      // Small delay to allow GC to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

const getMeasurements = async (
  callback: () => Promise<void>,
  featureFlag: boolean = false
): Promise<{ perf: number; memoryDelta: ReturnType<typeof getMemoryUsage> }> => {
  await forceGC();

  // Get baseline
  const memBefore = getMemoryUsage();

  // Setup tenant
  tenants.add({
    ...tenant,
    featureFlags: { templatesDenormalizationPerfImprovements: featureFlag }
  });

  const start = performance.now();
  await callback();
  const perf = performance.now() - start;

  // Force GC before measuring final memory
  await forceGC();
  const memAfter = getMemoryUsage();

  return {
    perf,
    memoryDelta: {
      heapUsed: memAfter.heapUsed - memBefore.heapUsed,
      heapTotal: memAfter.heapTotal - memBefore.heapTotal,
      rss: memAfter.rss - memBefore.rss,
    },
  };
};

const compareRuns = async (
  callback: () => Promise<void>,
  patchedCallback: () => Promise<void>,
  beforeEachCallback: () => Promise<void> = async () => {}
): Promise<void> => {
  // Normal run
  await beforeEachCallback();
  const normal = await getMeasurements(callback);

  // Patched run
  await beforeEachCallback();
  const patched = await getMeasurements(patchedCallback, true);

  // Calculate diffs
  const timeDiff = patched.perf - normal.perf;
  const timePercentageDiff = ((patched.perf - normal.perf) / normal.perf) * 100;

  const heapUsedDiff = patched.memoryDelta.heapUsed - normal.memoryDelta.heapUsed;
  const heapTotalDiff = patched.memoryDelta.heapTotal - normal.memoryDelta.heapTotal;
  const rssDiff = patched.memoryDelta.rss - normal.memoryDelta.rss;

  // Color coding
  const timeColor = timeDiff > 0 ? '\x1b[31m' : '\x1b[32m'; // Red if slower, green if faster
  const memColor = heapUsedDiff > 0 ? '\x1b[31m' : '\x1b[32m'; // Red if more memory, green if less

  console.log(
    `normal: ${normal.perf.toFixed(2)}ms, patched: ${patched.perf.toFixed(2)}ms, diff: ${timeColor}${timeDiff.toFixed(2)}ms (${timePercentageDiff.toFixed(2)}%)\x1b[0m`
  );

  // Calculate memory percentage diffs based on absolute values
  const baselineMemory = process.memoryUsage();

  const heapUsedPercentageDiff = ((heapUsedDiff / baselineMemory.heapUsed) * 100).toFixed(2);
  const heapTotalPercentageDiff = ((heapTotalDiff / baselineMemory.heapTotal) * 100).toFixed(2);
  const rssPercentageDiff = ((rssDiff / baselineMemory.rss) * 100).toFixed(2);

  console.log(
    `  Heap Used: ${memColor}${formatMemory(heapUsedDiff)} (${heapUsedPercentageDiff}%)\x1b[0m, Heap Total: ${memColor}${formatMemory(heapTotalDiff)} (${heapTotalPercentageDiff}%)\x1b[0m, RSS: ${memColor}${formatMemory(rssDiff)} (${rssPercentageDiff}%)\x1b[0m`
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

const fullText = {
  1: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse non ultricies neque. Aliquam erat volutpat. Etiam mi dolor, porttitor quis arcu id, porttitor posuere eros. Aliquam ultrices diam orci, auctor elementum neque suscipit eu. Praesent scelerisque felis eu convallis commodo. Praesent suscipit est tortor. Aenean in ipsum a lectus euismod vulputate at a lectus. Ut et mattis tellus, non luctus mauris. Proin a mollis sapien. In ultricies, nunc venenatis placerat blandit, libero dui consequat dolor, et aliquet sem augue quis lectus. Praesent mollis facilisis nunc, vitae interdum turpis blandit eget. Quisque ut lacus interdum, porttitor sapien vitae, euismod eros. Nulla facilisi. Sed eget neque mi.',
};

const generateConnectedEntities = async (number: number) => {
  const _entities: EntitySchema[][] = [];
  const files: FileType[] = [];
  const connections: any[] = [];
  for (let i = 0; i < number; i += 1) {
    const hub = f.id(`hub${i}`);
    const hub1 = f.id(`hub1_${i}`);
    _entities.push(
      f.entityInMultipleLanguages(['en', 'es', 'pt'], `template1.entity${i}`, 'template1', {
        text_property: [f.metadataValue(`text value ${i}`)],
      })
    );
    _entities.push(
      f.entityInMultipleLanguages(['en', 'es', 'pt'], `template2.entity${i}`, 'template2', {
        rel1: [f.metadataValue(`template1.entity${i}`)],
        text_1: [f.metadataValue(`template1.text_1${i}`)],
        text_2: [f.metadataValue(`template1.text_2${i}`)],
        text_3: [f.metadataValue(`template1.text_3${i}`)],
      })
    );

    files.push(
      f.file(`entity1.file${i}`, { entity: `template1.entity${i}`, type: 'document', fullText })
    );
    files.push(
      f.file(`entity2.file${i}`, { entity: `template2.entity${i}`, type: 'document', fullText })
    );

    connections.push({
      _id: testingDB.id(),
      entity: `template1.entity${i}`,
      template: f.idString('rel1'),
      hub: hub,
    });
    connections.push({
      _id: testingDB.id(),
      entity: `template2.entity${i}`,
      template: f.idString('rel1'),
      hub: hub,
    });

    connections.push({
      _id: testingDB.id(),
      entity: `template2.entity${i}`,
      template: f.idString('rel2'),
      hub: hub1,
    });

    for (let j = 0; j < 10; j += 1) {
      _entities.push(
        f.entityInMultipleLanguages(['en', 'es', 'pt'], `template3.entity${i}_${j}`, 'template3', {
          rel2: [f.metadataValue(`template2.entity${i}`)],
        })
      );

      files.push(
        f.file(`entity1.file${i}_${j}`, {
          entity: `template3.entity${i}_${j}`,
          type: 'document',
          fullText,
        })
      );

      connections.push({
        _id: testingDB.id(),
        entity: `template3.entity${i}_${j}`,
        hub: hub1,
        template: f.idString('rel2'),
      });
    }
  }

  const translations = [];
  for (let t = 0; t < 1000; t += 1) {
    translations.push({
      _id: f.id(`translations${t}`),
      language: 'en' as const,
      key: `translations${t}.key`,
      value: `translations${t}.value`,
      context: { type: 'Uwazi UI' as const, label: 'Performance testing', id: 'Testing' },
    });
  }

  return { connections, entities: _entities.flat(), files, translations };
};

const f = getFixturesFactory();

async function runTest(numberOfEntities: number) {
  console.log(
    `Changing template relationship prop inheritedProp test (multilingual, mixed hubs with files, ${numberOfEntities} entities )...`
  );

  const template1 = f.template('template1', [f.property('text_property')]);
  const template2 = f.template('template2', [
    f.relationshipProp('rel1', 'template1'),
    f.property('thesauri1', 'select', { content: f.idString('thesauri1') }),
    f.property('thesauri2', 'select', { content: f.idString('thesauri2') }),
    f.property('text_1'),
    f.property('text_2'),
    f.property('text_3'),
  ]);
  const template3 = f.template('template3', [
    f.relationshipProp('rel2', 'template2', { relationType: f.idString('rel2') }),
  ]);

  const setFixtures = async () => {
    const fixtures = await generateConnectedEntities(numberOfEntities);

    await fixturer.clearAllAndLoad(DB.mongodb_Db(tenant.dbName), {
      templates: [template1, template2, template3],
      relationtypes: [f.relationType('rel1'), f.relationType('rel2')],
      entities: fixtures.entities,
      connections: fixtures.connections,
      files: fixtures.files,
      translationsV2: fixtures.translations,
      migrations: [{ delta: 172 }],
      dictionaries: [
        f.thesauri('thesauri1', ['thesauri1', 'thesauri2', 'thesauri3', 'thesauri4', 'thesauri5']),
        f.thesauri('thesauri2', [
          'thesauri2.1',
          'thesauri2.2',
          'thesauri2.3',
          'thesauri2.4',
          'thesauri2.5',
        ]),
        f.thesauri('thesauri3', [
          'thesauri3.1',
          'thesauri3.2',
          'thesauri3.3',
          'thesauri3.4',
          'thesauri3.5',
        ]),
      ],
      users: [
        {
          _id: f.id('admin_user'),
          username: 'admin',
          role: 'admin',
          email: 'admin@uwazitesting.com',
        },
      ],
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
    await elasticTesting.resetIndex();
  };

  // await setFixtures();

  await compareRuns(
    async () => {
      await templates.save(
        {
          ...template2,
          properties: [
            ...template2.properties.filter(p => p.name !== 'rel1'),
            {
              ...template2.properties[0],
              inherit: { property: f.idString('text_property') },
            },
          ],
        },
        'en'
      );
    },
    async () => {
      await new Promise<void>((resolve, reject) => {
        templates.save(
          {
            ...template2,
            properties: [
              ...template2.properties.filter(p => p.name !== 'rel1'),
              {
                ...template2.properties[0],
                inherit: { property: f.idString('text_property') },
              },
            ],
          },
          'en',
          true,
          false,
          async error => {
            if (error) {
              reject(error);
            }
            resolve();
          }
        );
      });
    },
    setFixtures
  );
}
async function run() {
  process.env.NODE_ENV = 'test';
  await DB.connect(config.DBHOST, config.DBAUTH);
  try {
    console.log('Starting performance tests...');
    console.log('');

    tenants.add(tenant);

    // @ts-ignore
    await tenants.run(async () => {
      permissionsContext.setUserInContext({
        _id: f.id('admin_user'),
        role: 'admin',
        username: 'admin',
        email: 'admin@uwazitesting.com',
      });
      // permissionsContext.setCommandContext();
      await runTest(10);
      await runTest(300);
      await runTest(600);
      await runTest(2000);
    }, tenant.name);

    console.log('Tests completed successfully.');
  } catch (error) {
    console.error('Error running performance tests:', error);
  } finally {
    await DB.disconnect();
    process.exit(0);
  }
}

run();
