/* eslint-disable max-statements */
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoThesauriDataSourceV2 } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDataSourceV2';
import {
  getConnection,
  getSharedConnection,
} from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { ThesaurusDBO } from 'api/core/infrastructure/mongodb/thesauri/ThesaurusDBO';
import { ObjectId } from 'mongodb';
import { UserSchema } from 'shared/types/userType';
import { ThesaurusNotFoundError } from 'api/core/domain/thesaurus/errors';
import { JobDBO } from 'api/core/libs/queue/infrastructure/MongoQueueAdapter';
import { TestUtils } from 'api/common.v2/utils/Test';
import { Result } from 'api/core/libs/Result';
import { MongoThesaurusMapper } from 'api/core/infrastructure/mongodb/thesauri/MongoThesaurusMapper';
import { UpdateThesaurusUseCase } from '../UpdateThesaurus';
import { ThesaurusTranslationService } from '../thesaurusTranslationService/ThesaurusTranslationService';
import { ThesauriDataSource } from '../contracts/ThesauriDataSource';
import { factory, fixtures } from './UpdateThesaurusFixtures';

type CreateSutProps = {
  thesauriDS?: ThesauriDataSource;
  thesaurusTranslationService?: ThesaurusTranslationService;
  jobsDispatcher?: JobsDispatcher;
};

const createSut = (props?: CreateSutProps) => {
  const tenant = tenants.current();
  const actor: UserSchema = {
    _id: factory.id('user1'),
    username: 'username',
    email: 'email@email.com',
    role: 'admin',
  };

  const transactionManager = TransactionManagerFactory.default();
  const jobsDispatcher =
    props?.jobsDispatcher ?? DefaultDispatcher(tenant.name, transactionManager);

  const thesauriDS =
    props?.thesauriDS ?? new MongoThesauriDataSourceV2(getConnection(), transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const translationsDS = DefaultTranslationsDataSource(transactionManager);
  const thesaurusTranslationService =
    props?.thesaurusTranslationService ??
    new ThesaurusTranslationService({
      settingsDS,
      translationsDS,
    });

  const sut = new UpdateThesaurusUseCase(
    {
      thesauriDS,
      thesaurusTranslationService,
      jobsDispatcher,
      transactionManager,
    },
    { tenant, actor }
  );

  return { sut };
};

describe('UpdateThesaurusUseCase', () => {
  const getJobs = async () => getSharedConnection().collection('jobs').find().toArray();
  const getThesaurusById = async (_id: ObjectId) =>
    testingEnvironment.db!.getCollection('dictionaries')!.findOne({
      _id,
    }) as Promise<ThesaurusDBO>;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await getSharedConnection().collection('jobs').deleteMany({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should update thesaurus', async () => {
    const { sut } = createSut();

    const before = await getThesaurusById(factory.id('countries'));

    await sut.execute({
      id: before._id.toString(),
      name: 'Updated Countries',
      values: [
        { ...before.values[0], label: 'USA Updated' },
        { label: 'Brazil Created' },
        {
          ...before.values[2],
          label: 'Europe Updated',
          values: [before.values[2].values![0], { label: 'France Created' }],
        },
      ],
    });

    const jobs = await getJobs();
    const after = await getThesaurusById(factory.id('countries'));
    const translations = await testingEnvironment.db.getAllFrom('translationsV2');

    expect(after).toEqual({
      _id: before._id,
      name: 'Updated Countries',
      values: [
        { id: before.values[0].id, label: 'USA Updated' },
        { id: expect.any(String), label: 'Brazil Created' },
        {
          id: before.values[2].id,
          label: 'Europe Updated',
          values: [
            { id: before.values[2].values![0].id, label: 'France' },
            { id: expect.any(String), label: 'France Created' },
          ],
        },
      ],
    });

    expect(translations).toEqual([
      {
        _id: expect.any(ObjectId),
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
        key: 'Updated Countries',
        language: 'en',
        value: 'Updated Countries',
      },
      {
        _id: expect.any(ObjectId),
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
        key: 'USA Updated',
        language: 'en',
        value: 'USA Updated',
      },
      {
        _id: expect.any(ObjectId),
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
        key: 'Europe Updated',
        language: 'en',
        value: 'Europe Updated',
      },
      {
        _id: expect.any(ObjectId),
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
        key: 'France',
        language: 'en',
        value: 'France',
      },
      {
        _id: expect.any(ObjectId),
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
        key: 'Updated Countries',
        language: 'es',
        value: 'Countries ES',
      },
      {
        _id: expect.any(ObjectId),
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
        key: 'USA Updated',
        language: 'es',
        value: 'USA ES',
      },
      {
        _id: expect.any(ObjectId),
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
        key: 'Europe Updated',
        language: 'es',
        value: 'Europe ES',
      },
      {
        _id: expect.any(ObjectId),
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
        key: 'France',
        language: 'es',
        value: 'France ES',
      },
      {
        _id: expect.any(ObjectId),
        key: 'Brazil Created',
        value: 'Brazil Created',
        language: 'en',
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
      },
      {
        _id: expect.any(ObjectId),
        key: 'France Created',
        value: 'France Created',
        language: 'en',
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
      },
      {
        _id: expect.any(ObjectId),
        key: 'Brazil Created',
        value: 'Brazil Created',
        language: 'es',
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
      },
      {
        _id: expect.any(ObjectId),
        key: 'France Created',
        value: 'France Created',
        language: 'es',
        context: {
          type: 'Thesaurus',
          label: 'Updated Countries',
          id: before._id.toString(),
        },
      },
    ]);

    expect(jobs.length).toBe(1);
    expect(jobs).toMatchObject([
      {
        _id: expect.any(ObjectId),
        name: 'DenormalizeThesaurusEntitiesHandler',
        params: {
          tenantName: tenants.current().name,
          thesaurusId: before._id.toString(),
          userId: factory.id('user1').toString(),
        },
      },
    ]);
  });

  it('should throw when thesaurus does not exists', async () => {
    const { sut } = createSut();

    await expect(
      sut.execute({
        id: new ObjectId().toString(),
        name: 'Updated Countries',
        values: [],
      })
    ).rejects.toThrow(ThesaurusNotFoundError);
  });

  it('should delete and re-dispatch denormalization jobs for the updated thesaurus', async () => {
    await getSharedConnection()
      .collection<JobDBO>('jobs')
      .insertMany([
        {
          _id: factory.id('job_1'),
          namespace: tenants.current().name,
          name: 'DenormalizeThesaurusEntitiesHandler',
          lockedUntil: Date.now() + 100000,
          params: {
            thesaurusId: factory.id('countries').toString(),
            tenantName: tenants.current().name,
            userId: factory.id('user1').toString(),
          },
          createdAt: Date.now(),
          failed: false,
          queue: 'default',
          retryCount: 0,
          options: {
            lockWindow: 30000,
            maxRetries: 2,
          },
        },
        {
          _id: factory.id('job_2'),
          name: 'DenormalizeThesaurusEntitiesHandler',
          lockedUntil: 0,
          params: {
            thesaurusId: factory.id('countries').toString(),
            tenantName: tenants.current().name,
            userId: factory.id('user1').toString(),
          },
          createdAt: Date.now(),
          failed: false,
          namespace: tenants.current().name,
          queue: 'default',
          retryCount: 0,
          options: {
            lockWindow: 30000,
            maxRetries: 3,
          },
        },
        {
          _id: factory.id('job_3'),
          namespace: 'tenant_1',
          name: 'DenormalizeThesaurusEntitiesHandler',
          params: {
            thesaurusId: factory.id('countries').toString(),
            tenantName: 'tenant_1',
            userId: 'userId',
          },
          createdAt: Date.now(),
          failed: false,
          lockedUntil: 0,
          queue: 'default',
          retryCount: 0,
          options: {
            lockWindow: 30000,
            maxRetries: 3,
          },
        },
      ]);

    const { sut } = createSut();

    await sut.execute({
      id: factory.id('countries').toString(),
      name: 'Updated Countries',
      values: [],
    });

    const jobs = await getJobs();

    expect(jobs).toHaveLength(3);

    expect(jobs).toEqual(
      TestUtils.arrayIncludesObjects([
        { _id: factory.id('job_1') },
        { _id: factory.id('job_3') },
        {
          name: 'DenormalizeThesaurusEntitiesHandler',
          params: expect.objectContaining({
            thesaurusId: factory.id('countries').toString(),
            tenantName: tenants.current().name,
          }),
        },
      ])
    );
  });

  it('should revert when thesaurus update fails', async () => {
    const thesaurus = await new MongoThesauriDataSourceV2(
      getConnection(),
      TransactionManagerFactory.default()
    )
      .getById(factory.id('countries').toString())
      .then(r => r.getDataOrThrow());

    const thesauriDS = TestUtils.mockClass<ThesauriDataSource>({
      getById: jest.fn().mockResolvedValue({
        getDataOrThrow: jest.fn().mockReturnValue(thesaurus),
      }),
      update: jest.fn().mockRejectedValue(new Error('update error')),
    });

    const { sut } = createSut({ thesauriDS });

    const thesaurusBefore = await getThesaurusById(factory.id('countries'));
    const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
    const jobsBefore = await getJobs();

    await expect(
      sut.execute({
        id: factory.id('countries').toString(),
        name: 'Updated Countries',
        values: [],
      })
    ).rejects.toThrow('update error');

    const thesaurusAfter = await getThesaurusById(factory.id('countries'));
    const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
    const jobsAfter = await getJobs();

    expect(thesaurusAfter).toEqual(thesaurusBefore);
    expect(translationsAfter).toEqual(translationsBefore);
    expect(jobsAfter).toEqual(jobsBefore);
  });

  it('should revert when translations update fails', async () => {
    const thesaurusTranslationService = TestUtils.mockClass<ThesaurusTranslationService>({
      update: jest.fn().mockRejectedValue(new Error('translation update error')),
    });

    const { sut } = createSut({ thesaurusTranslationService });

    const thesaurusBefore = await getThesaurusById(factory.id('countries'));
    const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
    const jobsBefore = await getJobs();

    await expect(
      sut.execute({
        id: factory.id('countries').toString(),
        name: 'Updated Countries',
        values: [],
      })
    ).rejects.toThrow('translation update error');

    const thesaurusAfter = await getThesaurusById(factory.id('countries'));
    const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
    const jobsAfter = await getJobs();

    expect(thesaurusAfter).toEqual(thesaurusBefore);
    expect(translationsAfter).toEqual(translationsBefore);
    expect(jobsAfter).toEqual(jobsBefore);
  });

  it('should revert when delete of jobs fails', async () => {
    const jobsDispatcher = TestUtils.mockClass<JobsDispatcher>({
      deleteByParams: jest.fn().mockRejectedValue(new Error('delete jobs error')),
    });

    const { sut } = createSut({ jobsDispatcher });

    const thesaurusBefore = await getThesaurusById(factory.id('countries'));
    const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
    const jobsBefore = await getJobs();

    await expect(
      sut.execute({
        id: factory.id('countries').toString(),
        name: 'Updated Countries',
        values: [],
      })
    ).rejects.toThrow('delete jobs error');

    const thesaurusAfter = await getThesaurusById(factory.id('countries'));
    const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
    const jobsAfter = await getJobs();

    expect(thesaurusAfter).toEqual(thesaurusBefore);
    expect(translationsAfter).toEqual(translationsBefore);
    expect(jobsAfter).toEqual(jobsBefore);
  });

  it('should revert when dispatching of jobs fails', async () => {
    const jobsDispatcher = TestUtils.mockClass<JobsDispatcher>({
      deleteByParams: jest.fn().mockResolvedValue(undefined),
      dispatch: jest.fn().mockRejectedValue(new Error('dispatch jobs error')),
    });

    const { sut } = createSut({ jobsDispatcher });

    const thesaurusBefore = await getThesaurusById(factory.id('countries'));
    const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
    const jobsBefore = await getJobs();

    await expect(
      sut.execute({
        id: factory.id('countries').toString(),
        name: 'Updated Countries',
        values: [],
      })
    ).rejects.toThrow('dispatch jobs error');

    const thesaurusAfter = await getThesaurusById(factory.id('countries'));
    const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
    const jobsAfter = await getJobs();

    expect(thesaurusAfter).toEqual(thesaurusBefore);
    expect(translationsAfter).toEqual(translationsBefore);
    expect(jobsAfter).toEqual(jobsBefore);
  });

  it('should do nothing when no changes are made', async () => {
    const existing = await getThesaurusById(factory.id('countries'));

    const thesauriDS = TestUtils.mockClass<ThesauriDataSource>({
      getById: jest.fn().mockResolvedValue(Result.ok(MongoThesaurusMapper.toDomain(existing))),
      update: jest.fn().mockResolvedValue(undefined),
    });

    const thesaurusTranslationService = TestUtils.mockClass<ThesaurusTranslationService>({
      update: jest.fn().mockResolvedValue(undefined),
    });

    const jobsDispatcher = TestUtils.mockClass<JobsDispatcher>({
      deleteByParams: jest.fn().mockResolvedValue(undefined),
      dispatch: jest.fn().mockResolvedValue(undefined),
    });

    const { sut } = createSut({ thesauriDS, thesaurusTranslationService, jobsDispatcher });

    await sut.execute({
      id: existing._id.toString(),
      name: existing.name,
      values: existing.values,
    });

    expect(thesauriDS.update).not.toHaveBeenCalled();
    expect(thesaurusTranslationService.update).not.toHaveBeenCalled();
    expect(jobsDispatcher.deleteByParams).not.toHaveBeenCalled();
    expect(jobsDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
