/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { TestingDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants';
import { elastic, search } from 'api/search';
import { ObjectId } from 'mongodb';
import { BulkDeleteEntityInput, BulkDeleteEntityUseCase } from '../BulkDeleteEntity';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],

  relationtypes: [
    {
      _id: factory.id('relation_type'),
      name: 'relation_type',
      properties: [],
      __v: 0,
    },
  ],

  templates: [
    factory.template('Document A'),
    factory.template('Document B'),
    factory.template('Document C'),
  ],

  entities: [
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'A1',
      'Document A',
      {},
      { title: 'A' },
      {
        en: {
          title: 'Document A1 EN',
        },
        es: {
          title: 'Document A1 ES',
        },
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'A2',
      'Document A',
      {},
      { title: 'A2' },
      {
        en: {
          title: 'Document A2 EN',
        },
        es: {
          title: 'Document A2 ES',
        },
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'B1',
      'Document B',
      {},
      { title: 'B1' },
      {
        en: {
          title: 'Document B1 EN',
        },
        es: {
          title: 'Document B1 ES',
        },
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'C1',
      'Document C',
      {},
      { title: 'C1' },
      {
        en: {
          title: 'Document C1 EN',
        },
        es: {
          title: 'Document C1 ES',
        },
      }
    ),
  ],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const jobsDispatcher = TestingDispatcher(tenants.current().name);

  const sut = new BulkDeleteEntityUseCase({
    search,
    jobsDispatcher,
    idGenerator,
    transactionManager,
  });

  return { sut };
};

describe('BulkDeleteEntityUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'bulk_delete_entity_use_case');
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await testingEnvironment.setElastic('bulk_delete_entity_use_case');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete entities', async () => {
    const { sut } = createSut();

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'B1'],
    };

    await sut.execute(input);

    const elasticResult = await elastic.search({ size: 100 });

    const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
    const jobs = await testingEnvironment.db.getAllFrom('jobs');

    // Should not delete Entities sync.
    expect(entitiesDB.length).toBe(8);

    // Should have created jobs for deletion.
    expect(jobs).toEqual([
      {
        name: 'BatchDeleteEntityJob',
        params: { sharedIds: ['A1', 'A2', 'B1'] },
        queue: 'uwazi_jobs',
        namespace: tenants.current().name,

        _id: expect.any(ObjectId),
        createdAt: expect.any(Number),
        lockedUntil: 0,
        retryCount: 0,
        failed: false,
        options: { lockWindow: 600000, maxRetries: 5 },
      },
    ]);

    // Should deleted on elastic sync.
    expect(elasticResult.body.hits.hits.map(hit => hit._source.sharedId)).toEqual(['C1', 'C1']); // ES and EN
  });

  it('should create jobs in chunks of 100 items', async () => {
    const { sut } = createSut();
    const sharedIds = Array.from({ length: 201 }, (_, i) => `ID_${i + 1}`);

    await testingEnvironment.db
      .getCollection('entities')
      ?.insertMany(
        sharedIds.flatMap(id =>
          factory.entityInMultipleLanguages(['en', 'es'], id, 'Document A')
        ) as any
      );

    const input: BulkDeleteEntityInput = {
      sharedIds,
    };

    await sut.execute(input);
    const jobs = await testingEnvironment.db.getAllFrom('jobs');

    // Should have created jobs for deletion.
    expect(jobs).toEqual([
      expect.objectContaining({
        name: 'BatchDeleteEntityJob',
        params: { sharedIds: sharedIds.slice(0, 100) },
      }),
      expect.objectContaining({
        name: 'BatchDeleteEntityJob',
        params: { sharedIds: sharedIds.slice(100, 200) },
      }),
      expect.objectContaining({
        name: 'BatchDeleteEntityJob',
        params: { sharedIds: sharedIds.slice(200, 201) },
      }),
    ]);
  });

  it('should throw when given empty sharedIds array', async () => {
    const { sut } = createSut();

    const input: BulkDeleteEntityInput = {
      sharedIds: [],
    };

    await expect(sut.execute(input)).rejects.toThrow(
      'You must provide at least one sharedId for bulk deletion'
    );
  });

  it('should throw when given more than 1000 sharedIds', async () => {
    const { sut } = createSut();

    const input: BulkDeleteEntityInput = {
      sharedIds: Array(1001).fill('id'),
    };

    await expect(sut.execute(input)).rejects.toThrow(
      'You must provide at most 1000 sharedIds for bulk deletion'
    );
  });
});
