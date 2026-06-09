/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import {
  ThesaurusNameAlreadyExistsError,
  ThesaurusNotFoundError,
} from '#api/core/domain/thesaurus/errors.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { tenants } from '#api/tenants/index.js';
import { User } from '#api/users.v2/model/User.js';
import { ThesauriService } from '../ThesauriService.js';
import { UpdateThesaurusUseCase } from '../UpdateThesaurus.js';
import { ThesauriDataSource } from '../contracts/ThesauriDataSource.js';
import { ThesaurusTranslationService } from '../thesaurusTranslationService/ThesaurusTranslationService.js';
import { factory, fixtures } from './UpdateThesaurusFixtures.js';
import type { PGFixture } from '#api/utils/testing_pg.js';

type CreateSutProps = {
  thesauriDS?: ThesauriDataSource;
  thesaurusTranslationService?: ThesaurusTranslationService;
  dispatcher?: Dispatcher;
};

type TestConfig = {
  name: string;
  postgresThesauri: boolean;
  pgFixtures: PGFixture | undefined;
  getThesauri: () => Promise<Record<string, unknown>[]>;
};

const countriesIdHex = factory.id('countries').toHexString();
const fruitsIdHex = factory.id('fruits').toHexString();

const testConfigs: TestConfig[] = [
  {
    name: 'Mongo',
    postgresThesauri: false,
    pgFixtures: undefined,
    getThesauri: async () => testingEnvironment.db.getAllFrom('dictionaries'),
  },
  {
    name: 'Postgres',
    postgresThesauri: true,
    pgFixtures: {
      thesauri: [
        {
          _id: countriesIdHex,
          name: 'Countries',
          values: [
            { id: randomUUID(), label: 'USA' },
            { id: randomUUID(), label: 'Canada' },
            {
              id: randomUUID(),
              label: 'Europe',
              values: [
                { id: randomUUID(), label: 'France' },
                { id: randomUUID(), label: 'Germany' },
              ],
            },
          ],
        },
        {
          _id: fruitsIdHex,
          name: 'Fruits',
          values: [
            { id: randomUUID(), label: 'Apple' },
            { id: randomUUID(), label: 'Banana' },
          ],
        },
      ],
    },
    getThesauri: async () =>
      testingEnvironment.pg
        .getAllFrom('thesauri')
        .then(rows => rows.map(({ tenant_id: _, ...rest }) => rest)),
  },
];

describe('UpdateThesaurusUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresThesauri, pgFixtures, getThesauri }) => {
    const getJobs = async () => testingEnvironment.db.getCollection('jobs')!.find().toArray();

    const createSut = (props?: CreateSutProps) =>
      testingEnvironment.runWithContext(
        () => {
          const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

          const dispatcher =
            props?.dispatcher ?? new DispatcherAdapter(ExecutionContext.jobsDispatcher);

          const thesauriDS =
            props?.thesauriDS ?? ThesauriDataSourceFactory.default({ transactionManager });
          const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
          const translationsDS = DefaultTranslationsDataSource(transactionManager);
          const thesaurusTranslationService =
            props?.thesaurusTranslationService ??
            new ThesaurusTranslationService({
              settingsDS,
              translationsDS,
            });
          const thesauriService = new ThesauriService({
            dispatcher,
            thesauriDS,
            thesaurusTranslationService,
          });

          const sut = new UpdateThesaurusUseCase(
            {
              thesauriDS,
              thesaurusTranslationService,
              dispatcher,
              transactionManager,
              thesauriService,
            },
            { tenant: ExecutionContext.tenant, actor: ExecutionContext.actor }
          );

          return { sut };
        },
        {
          actor: User.createFrom({
            _id: factory.id('user1'),
            username: 'username',
            email: 'email@email.com',
            role: 'admin',
            groups: [],
          }),
          ...(postgresThesauri
            ? {
                tenant: {
                  ...testingTenants.current(),
                  featureFlags: { postgresThesauri: true },
                },
              }
            : {}),
        }
      );

    beforeEach(async () => {
      await testingEnvironment.setFixtures(fixtures, pgFixtures);
      await testingEnvironment.db.getCollection('jobs')!.deleteMany({});
    });

    it('should update thesaurus', async () => {
      const { sut } = createSut();

      const thesauri = await getThesauri();
      const before = thesauri.find((t: any) => t.name === 'Countries')! as any;

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
          { id: 'created_on_the_client', label: 'Created on the client' },
        ],
      });

      const jobs = await getJobs();
      const after = (await getThesauri()).find((t: any) => t.name === 'Updated Countries')!;
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
          { id: 'created_on_the_client', label: 'Created on the client' },
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
          key: 'Created on the client',
          value: 'Created on the client',
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
        {
          _id: expect.any(ObjectId),
          key: 'Created on the client',
          value: 'Created on the client',
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
      await testingEnvironment.db.getCollection('jobs')!.insertMany([
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
      const thesaurus = await testingEnvironment.runWithContext(
        async () => {
          const tm = ExecutionContext.transactionManager as MongoTransactionManager;
          return ThesauriDataSourceFactory.default({ transactionManager: tm })
            .getById(factory.id('countries').toString())
            .then(r => r.getDataOrThrow());
        },
        postgresThesauri
          ? { tenant: { ...testingTenants.current(), featureFlags: { postgresThesauri: true } } }
          : undefined
      );

      const thesauriDS = TestUtils.mockClass<ThesauriDataSource>({
        getById: jest.fn().mockResolvedValue({
          getDataOrThrow: jest.fn().mockReturnValue(thesaurus),
        }),
        exists: jest.fn().mockResolvedValue({ getDataOrThrow: jest.fn() }),
        update: jest.fn().mockRejectedValue(new Error('update error')),
      });

      const { sut } = createSut({ thesauriDS });

      const thesauri = await getThesauri();
      const thesaurusBefore = thesauri.find((t: any) => t.name === 'Countries')!;
      const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
      const jobsBefore = await getJobs();

      await expect(
        sut.execute({
          id: factory.id('countries').toString(),
          name: 'Updated Countries',
          values: [],
        })
      ).rejects.toThrow('update error');

      const thesauriAfter = (await getThesauri()).find((t: any) => t.name === 'Countries')!;
      const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
      const jobsAfter = await getJobs();

      expect(thesauriAfter).toEqual(thesaurusBefore);
      expect(translationsAfter).toEqual(translationsBefore);
      expect(jobsAfter).toEqual(jobsBefore);
    });

    if (!postgresThesauri) {
      it('should revert when translations update fails', async () => {
        const thesaurusTranslationService = TestUtils.mockClass<ThesaurusTranslationService>({
          update: jest.fn().mockRejectedValue(new Error('translation update error')),
        });

        const { sut } = createSut({ thesaurusTranslationService });

        const thesauri = await getThesauri();
        const thesaurusBefore = thesauri.find((t: any) => t.name === 'Countries')!;
        const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
        const jobsBefore = await getJobs();

        await expect(
          sut.execute({
            id: factory.id('countries').toString(),
            name: 'Updated Countries',
            values: [],
          })
        ).rejects.toThrow('translation update error');

        const thesauriAfter = (await getThesauri()).find((t: any) => t.name === 'Countries')!;
        const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
        const jobsAfter = await getJobs();

        expect(thesauriAfter).toEqual(thesaurusBefore);
        expect(translationsAfter).toEqual(translationsBefore);
        expect(jobsAfter).toEqual(jobsBefore);
      });

      it('should revert when delete of jobs fails', async () => {
        const dispatcher = TestUtils.mockClass<Dispatcher>({
          denormalizeThesaurus: jest.fn().mockRejectedValue(new Error('delete jobs error')),
        });

        const { sut } = createSut({ dispatcher });

        const thesauri = await getThesauri();
        const thesaurusBefore = thesauri.find((t: any) => t.name === 'Countries')!;
        const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
        const jobsBefore = await getJobs();

        await expect(
          sut.execute({
            id: factory.id('countries').toString(),
            name: 'Updated Countries',
            values: [],
          })
        ).rejects.toThrow('delete jobs error');

        const thesauriAfter = (await getThesauri()).find((t: any) => t.name === 'Countries')!;
        const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
        const jobsAfter = await getJobs();

        expect(thesauriAfter).toEqual(thesaurusBefore);
        expect(translationsAfter).toEqual(translationsBefore);
        expect(jobsAfter).toEqual(jobsBefore);
      });

      it('should revert when dispatching of jobs fails', async () => {
        const dispatcher = TestUtils.mockClass<Dispatcher>({
          denormalizeThesaurus: jest.fn().mockRejectedValue(new Error('dispatch jobs error')),
        });

        const { sut } = createSut({ dispatcher });

        const thesauri = await getThesauri();
        const thesaurusBefore = thesauri.find((t: any) => t.name === 'Countries')!;
        const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
        const jobsBefore = await getJobs();

        await expect(
          sut.execute({
            id: factory.id('countries').toString(),
            name: 'Updated Countries',
            values: [],
          })
        ).rejects.toThrow('dispatch jobs error');

        const thesauriAfter = (await getThesauri()).find((t: any) => t.name === 'Countries')!;
        const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
        const jobsAfter = await getJobs();

        expect(thesauriAfter).toEqual(thesaurusBefore);
        expect(translationsAfter).toEqual(translationsBefore);
        expect(jobsAfter).toEqual(jobsBefore);
      });
    }

    it('should persist reordered values without triggering translations or denormalization jobs', async () => {
      const { sut } = createSut();
      const thesauri = await getThesauri();
      const existing = thesauri.find((t: any) => t.name === 'Countries')! as any;
      const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');

      const reorderedValues = [
        {
          ...existing.values[2],
          values: [existing.values[2].values![1], existing.values[2].values![0]],
        },
        existing.values[0],
        existing.values[1],
      ];

      await sut.execute({
        id: existing._id.toString(),
        name: existing.name,
        values: reorderedValues,
      });

      const after = (await getThesauri()).find((t: any) => t.name === 'Countries')! as any;
      const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
      const jobs = await getJobs();

      expect(after.values.map((value: any) => value.id)).toEqual(
        reorderedValues.map(value => value.id)
      );
      expect(after.values[0].values!.map((value: any) => value.id)).toEqual(
        reorderedValues[0].values!.map((value: any) => value.id)
      );
      expect(translationsAfter).toEqual(translationsBefore);
      expect(jobs).toHaveLength(0);
    });

    it('should do nothing when no changes are made', async () => {
      const { sut } = createSut();

      const thesauriBefore = await getThesauri();
      const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
      const jobsBefore = await getJobs();

      const existing = thesauriBefore.find((t: any) => t.name === 'Countries')! as any;

      await sut.execute({
        id: existing._id.toString(),
        name: existing.name,
        values: existing.values,
      });

      const thesauriAfter = await getThesauri();
      const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
      const jobsAfter = await getJobs();

      expect(thesauriAfter).toEqual(thesauriBefore);
      expect(translationsAfter).toEqual(translationsBefore);
      expect(jobsAfter).toEqual(jobsBefore);
    });

    it('should not allow updating a thesaurus name to an existing name', async () => {
      const { sut } = createSut();

      const thesauri = await getThesauri();
      const thesaurusBefore = thesauri.find((t: any) => t.name === 'Countries')! as any;
      const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
      const jobsBefore = await getJobs();

      await expect(
        sut.execute({
          id: factory.id('countries').toString(),
          name: 'Fruits',
          values: thesaurusBefore.values,
        })
      ).rejects.toEqual(new ThesaurusNameAlreadyExistsError('Fruits'));

      const thesauriAfter = (await getThesauri()).find((t: any) => t.name === 'Countries')! as any;
      const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
      const jobsAfter = await getJobs();

      expect(thesauriAfter).toEqual(thesaurusBefore);
      expect(translationsAfter).toEqual(translationsBefore);
      expect(jobsAfter).toEqual(jobsBefore);
    });
  });
});
