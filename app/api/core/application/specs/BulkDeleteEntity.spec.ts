/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { TestingDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants';
import { elastic, search } from 'api/search';
import { TestUtils } from 'api/common.v2/utils/Test';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { EventsBus } from 'api/core/libs/eventsbus';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { EntityDeletedEvent } from 'api/entities/events/EntityDeletedEvent';
import { BulkDeleteEntityUseCase, BulkDeleteEntityUseCaseInput } from '../BulkDeleteEntity';

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

type CreateSutProps = {
  search?: typeof search;
  jobsDispatcher?: JobsDispatcher;
  entitiesDS?: MongoMultiLanguageEntityDataSource;
};

const createSut = (props?: CreateSutProps) => {
  const transactionManager = TransactionManagerFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const jobsDispatcher =
    props?.jobsDispatcher ?? TestingDispatcher(tenants.current().name, transactionManager);
  const searchInstance = props?.search ?? search;
  const entitiesDS =
    props?.entitiesDS ??
    new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);
  const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });

  const sut = new BulkDeleteEntityUseCase({
    search: searchInstance,
    jobsDispatcher,
    idGenerator,
    transactionManager,
    eventBus,
    entitiesDS,
  });

  return { sut, eventBus };
};

describe('BulkDeleteEntityUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'delete_entity_use_case');
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await testingEnvironment.setElastic('delete_entity_use_case');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete entities', async () => {
    const { sut, eventBus } = createSut();

    const input: BulkDeleteEntityUseCaseInput = {
      sharedIds: ['A1', 'B1'],
    };

    await sut.execute(input);

    const elasticResult = await elastic.search();

    const entitiesDB = await testingEnvironment.db.getAllFrom('entities');

    // Should delete all languages.
    expect(entitiesDB.filter(e => input.sharedIds.includes(e.sharedId)).length).toBe(0);
    expect(
      elasticResult.body.hits.hits.filter(hit => input.sharedIds.includes(hit._source.sharedId!))
        .length
    ).toBe(0);

    expect(eventBus.emit).toHaveBeenCalledWith(expect.any(EntityDeletedEvent));
  });

  it('should revert db entity deletion if elastic search deletion fails', async () => {
    const mockSearch = TestUtils.mockClass<typeof search>({
      bulkDeleteBySharedId: jest
        .fn()
        .mockRejectedValue(new Error('Elastic search deletion failed')),
    });

    const { sut } = createSut({ search: mockSearch });

    const input: BulkDeleteEntityUseCaseInput = {
      sharedIds: ['B1'],
    };

    await expect(sut.execute(input)).rejects.toThrow('Elastic search deletion failed');

    const entitiesDB = await testingEnvironment.db.getAllFrom('entities');

    // Should not delete entities since transaction was rolled back.
    expect(entitiesDB.filter(e => input.sharedIds.includes(e.sharedId)).length).toBe(2);
  });

  it('should revert elastic search if db deletion fails', async () => {
    const entitiesDS = new MongoMultiLanguageEntityDataSource(
      getConnection(),
      TransactionManagerFactory.default()
    );
    jest.spyOn(entitiesDS, 'bulkDelete').mockRejectedValue(new Error('Database deletion failed'));

    const { sut } = createSut({ entitiesDS });

    const input: BulkDeleteEntityUseCaseInput = {
      sharedIds: ['C1'],
    };

    await expect(sut.execute(input)).rejects.toThrow('Database deletion failed');

    const elasticResult = await elastic.search();

    // Should still have entity in elastic since transaction was rolled back.
    expect(
      elasticResult.body.hits.hits.filter(hit => input.sharedIds.includes(hit._source.sharedId!))
        .length
    ).toBe(2);
  });

  it('should do nothing if entity does not exist', async () => {
    const { sut, eventBus } = createSut();

    const input: BulkDeleteEntityUseCaseInput = {
      sharedIds: ['nonexistent'],
    };

    await sut.execute(input);

    const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
    const elasticResult = await elastic.search();

    // Should have all original entities.
    expect(entitiesDB.length).toBe(6);
    expect(elasticResult.body.hits.hits.length).toBe(6);

    // Should not emit event.
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  it('should only delete the specified entity and not others', async () => {
    const { sut } = createSut();

    const input: BulkDeleteEntityUseCaseInput = {
      sharedIds: ['A1'],
    };

    await sut.execute(input);

    const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
    const elasticResult = await elastic.search();

    // Should delete only A1.
    expect(entitiesDB.filter(e => e.sharedId === 'B1').length).toBe(2);
    expect(entitiesDB.filter(e => e.sharedId === 'C1').length).toBe(2);

    expect(elasticResult.body.hits.hits.filter(hit => hit._source.sharedId === 'B1').length).toBe(
      2
    );
    expect(elasticResult.body.hits.hits.filter(hit => hit._source.sharedId === 'C1').length).toBe(
      2
    );
  });

  it('should throw when input is invalid', async () => {
    const { sut } = createSut();

    // These should throw validation errors from Zod
    await expect(sut.execute({ sharedId: null } as any)).rejects.toThrow();
    await expect(sut.execute({ sharedId: undefined } as any)).rejects.toThrow();
    await expect(sut.execute({ sharedId: 123 } as any)).rejects.toThrow();
    await expect(sut.execute({ sharedId: [] } as any)).rejects.toThrow();
    await expect(sut.execute({ sharedId: Array(100).fill('id') } as any)).rejects.toThrow();
    await expect(sut.execute({} as any)).rejects.toThrow();
  });
});
