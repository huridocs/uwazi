import { ObjectId } from 'mongodb';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { ThesaurusNameAlreadyExistsError } from '#api/core/domain/thesaurus/errors.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { ThesauriDataSource } from '../contracts/ThesauriDataSource.js';
import { CreateThesaurusUseCase } from '../CreateThesaurus.js';
import { ThesauriService } from '../ThesauriService.js';
import { ThesaurusTranslationService } from '../thesaurusTranslationService/ThesaurusTranslationService.js';

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

  translationsV2: [],

  dictionaries: [
    factory.thesauri('Fruits', [
      ['apple_id', 'Apple'],
      ['banana_id', 'Banana'],
      ['orange_id', 'Orange'],
    ]),
  ],

  templates: [],

  entities: [],
};

type TestConfig = {
  name: string;
  postgresCore: boolean;
  getThesauri: () => Promise<Record<string, unknown>[]>;
  getTranslations: () => Promise<any[]>;
  thesaurusIdMatcher: unknown;
};

const mapTranslationRow = ({
  tenant_id: _,
  context_id,
  context_type,
  context_label,
  ...rest
}: any) => ({
  ...rest,
  _id: new ObjectId(rest._id),
  context: { id: context_id, type: context_type, label: context_label },
});

const testConfigs: TestConfig[] = [
  {
    name: 'Mongo',
    postgresCore: false,
    getThesauri: async () => testingEnvironment.db.getAllFrom('dictionaries'),
    getTranslations: async () => testingEnvironment.db.getAllFrom('translationsV2'),
    thesaurusIdMatcher: expect.any(ObjectId),
  },
  {
    name: 'Postgres',
    postgresCore: true,
    getThesauri: async () =>
      testingEnvironment.pg
        .getAllFrom('thesauri')
        .then(rows => rows.map(({ tenant_id: _, ...rest }) => rest)),
    getTranslations: async () =>
      testingEnvironment.pg
        .getAllFrom<any>('translations')
        .then(rows => rows.map(mapTranslationRow)),
    thesaurusIdMatcher: expect.any(String),
  },
];

type CreateProps = {
  thesauriDS?: ThesauriDataSource;
  thesaurusTranslationService?: ThesaurusTranslationService;
};

describe('CreateThesaurusUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { elasticIndex: true, postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)(
    '$name',
    ({ postgresCore, getThesauri, getTranslations, thesaurusIdMatcher }) => {
      const createSut = (props?: CreateProps) =>
        testingEnvironment.runWithContext(
          () => {
            const transactionManager =
              ExecutionContext.transactionManager as MongoTransactionManager;

            const thesauriDS =
              props?.thesauriDS ?? ThesauriDataSourceFactory.default({ transactionManager });
            const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
            const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
            const thesaurusTranslationService =
              props?.thesaurusTranslationService ??
              new ThesaurusTranslationService({
                settingsDS,
                translationsDS,
              });

            const thesauriService = new ThesauriService({
              thesauriDS,
              thesaurusTranslationService,
              dispatcher: new DispatcherAdapter(ExecutionContext.jobsDispatcher),
            });

            const sut = new CreateThesaurusUseCase({
              transactionManager,
              thesauriService,
            });

            return { sut };
          },
          postgresCore
            ? { tenant: { ...testingTenants.current(), featureFlags: { postgresCore: true } } }
            : undefined
        );

      beforeEach(async () => testingEnvironment.setFixtures(fixtures));

      it('should create a new thesaurus', async () => {
        const { sut } = createSut();

        await sut.execute({
          name: 'Vegetables',
          values: [{ label: 'Carrot' }, { label: 'Broccoli' }],
        });

        const thesauri = await getThesauri();

        expect(thesauri).toHaveLength(2);
        expect(thesauri[1]).toEqual({
          _id: thesaurusIdMatcher,
          name: 'Vegetables',
          values: [
            { id: expect.any(String), label: 'Carrot' },
            { id: expect.any(String), label: 'Broccoli' },
          ],
        });
      });

      it('should create translations for the new thesaurus', async () => {
        const { sut } = createSut();

        const output = await sut.execute({
          name: 'Vehicles',
          values: [{ label: 'Car' }, { label: 'Bike' }],
        });

        const translations = await getTranslations();

        expect(translations).toEqual(
          TestUtils.arrayIncludesObjects([
            {
              _id: expect.any(ObjectId),
              key: 'Vehicles',
              value: 'Vehicles',
              language: 'en',
              context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
            },
            {
              _id: expect.any(ObjectId),
              key: 'Car',
              value: 'Car',
              language: 'en',
              context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
            },
            {
              _id: expect.any(ObjectId),
              key: 'Bike',
              value: 'Bike',
              language: 'en',
              context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
            },
            {
              _id: expect.any(ObjectId),
              key: 'Vehicles',
              value: 'Vehicles',
              language: 'es',
              context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
            },
            {
              _id: expect.any(ObjectId),
              key: 'Car',
              value: 'Car',
              language: 'es',
              context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
            },
            {
              _id: expect.any(ObjectId),
              key: 'Bike',
              value: 'Bike',
              language: 'es',
              context: { type: 'Thesaurus', label: 'Vehicles', id: output.id },
            },
          ])
        );
      });

      it('should revert when creating the thesaurus fails', async () => {
        const thesauriDS = TestUtils.mockClass<ThesauriDataSource>({
          create: jest.fn().mockRejectedValue(new Error('Creation failed')),
          exists: jest.fn().mockResolvedValue({ getDataOrThrow: jest.fn() }),
        });

        const { sut } = createSut({ thesauriDS });

        const before = await getTranslations();

        await expect(
          sut.execute({
            name: 'Animals',
            values: [{ label: 'Dog' }, { label: 'Cat' }],
          })
        ).rejects.toThrowError('Creation failed');

        const after = await getTranslations();

        expect(after).toEqual(before);
      });

      if (!postgresCore) {
        it('should revert when creating the translations fails', async () => {
          const thesaurusTranslationService = TestUtils.mockClass<ThesaurusTranslationService>({
            create: jest.fn().mockRejectedValue(new Error('Creation failed')),
          });

          const { sut } = createSut({ thesaurusTranslationService });

          const before = await getThesauri();

          await expect(
            sut.execute({
              name: 'Animals',
              values: [{ label: 'Dog' }, { label: 'Cat' }],
            })
          ).rejects.toThrowError('Creation failed');

          const after = await getThesauri();

          expect(after).toEqual(before);
        });
      }

      if (postgresCore) {
        /**
         * With the Postgres datasource, thesaurus writes go directly to PG with no
         * cross-database atomicity. If the Mongo transaction (which handles translations)
         * rolls back, the PG write is already committed and is NOT reverted.
         * This is a known, intentional trade-off during the Mongo→Postgres migration.
         * Once all datasources are on Postgres, a PostgresTransactionManager will restore
         * proper transactional boundaries.
         */
        it('should NOT revert the PG write when the Mongo transaction rolls back', async () => {
          const thesaurusTranslationService = TestUtils.mockClass<ThesaurusTranslationService>({
            create: jest.fn().mockRejectedValue(new Error('Creation failed')),
          });

          const { sut } = createSut({ thesaurusTranslationService });

          await expect(
            sut.execute({
              name: 'Animals',
              values: [{ label: 'Dog' }, { label: 'Cat' }],
            })
          ).rejects.toThrowError('Creation failed');

          const thesauri = await getThesauri();
          expect(thesauri.some(t => t.name === 'Animals')).toBe(true);
        });
      }

      it('should not allow creating a thesaurus with an existing name', async () => {
        const { sut } = createSut();

        const before = await getThesauri();

        await expect(
          sut.execute({
            name: 'Fruits',
            values: [{ label: 'Strawberry' }],
          })
        ).rejects.toEqual(new ThesaurusNameAlreadyExistsError('Fruits'));

        const after = await getThesauri();

        expect(after).toEqual(before);
      });
    }
  );
});
