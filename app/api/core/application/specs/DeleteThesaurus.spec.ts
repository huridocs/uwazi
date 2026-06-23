import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDataSource.js';
import { MongoTemplatesDAO } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDAO.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { User } from '#api/users.v2/model/User.js';
import { DeleteThesaurusUseCase } from '../DeleteThesaurus.js';
import { ThesaurusNotFoundError, ThesaurusInUseError } from '#api/core/domain/thesaurus/errors.js';
import { factory } from './UpdateThesaurusFixtures.js';
import type { DBFixture } from '#api/utils/testing_db.js';

const countriesId = factory.id('countries');
const fruitsId = factory.id('fruits');

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  translationsV2: [
    {
      _id: new ObjectId(),
      context: { type: 'Thesaurus', label: 'Countries', id: countriesId.toString() },
      key: 'Countries',
      language: 'en',
      value: 'Countries',
    },
    {
      _id: new ObjectId(),
      context: { type: 'Thesaurus', label: 'Countries', id: countriesId.toString() },
      key: 'USA',
      language: 'en',
      value: 'USA',
    },
    {
      _id: new ObjectId(),
      context: { type: 'Thesaurus', label: 'Fruits', id: fruitsId.toString() },
      key: 'Fruits',
      language: 'en',
      value: 'Fruits',
    },
    {
      _id: new ObjectId(),
      context: { type: 'Thesaurus', label: 'Fruits', id: fruitsId.toString() },
      key: 'Apple',
      language: 'en',
      value: 'Apple',
    },
  ],
  dictionaries: [
    {
      _id: countriesId,
      name: 'Countries',
      values: [
        { id: randomUUID(), label: 'USA' },
        { id: randomUUID(), label: 'Canada' },
      ],
    },
    {
      _id: fruitsId,
      name: 'Fruits',
      values: [
        { id: randomUUID(), label: 'Apple' },
        { id: randomUUID(), label: 'Banana' },
      ],
    },
  ],
  templates: [
    {
      _id: factory.id('template_using_countries'),
      name: 'Template with Countries',
      properties: [
        {
          type: 'select',
          content: countriesId.toString(),
          name: 'country',
          label: 'Country',
        },
      ],
    },
  ],
};

type TestConfig = {
  name: string;
  postgresThesauri: boolean;
  getThesauri: () => Promise<Record<string, unknown>[]>;
};

const testConfigs: TestConfig[] = [
  {
    name: 'Mongo',
    postgresThesauri: false,
    getThesauri: async () => testingEnvironment.db.getAllFrom('dictionaries'),
  },
  {
    name: 'Postgres',
    postgresThesauri: true,
    getThesauri: async () =>
      testingEnvironment.pg
        .getAllFrom('thesauri')
        .then(rows => rows.map(({ tenant_id: _, ...rest }) => rest)),
  },
];

describe('DeleteThesaurusUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresThesauri, getThesauri }) => {
    const createSut = () =>
      testingEnvironment.runWithContext(
        () => {
          const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

          const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
          const translationsDS = DefaultTranslationsDataSource(transactionManager);
          const templatesDS = new MongoTemplatesDataSource({
            db: getConnection(),
            transactionManager,
            dao: new MongoTemplatesDAO({ db: getConnection(), transactionManager }),
          });

          const sut = new DeleteThesaurusUseCase(
            {
              thesauriDS,
              translationsDS,
              templatesDS,
              transactionManager,
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
      await testingEnvironment.setFixtures(fixtures);
    });

    it('should delete a thesaurus that is not referenced by any template', async () => {
      const { sut } = createSut();

      const thesauri = await getThesauri();
      const existing = thesauri.find((t: any) => t.name === 'Fruits')! as any;

      await sut.execute({ thesaurusId: existing._id.toString() });

      const after = await getThesauri();
      expect(after.find((t: any) => t.name === 'Fruits')).toBeUndefined();
      expect(after.find((t: any) => t.name === 'Countries')).toBeDefined();
    });

    it('should throw when thesaurus does not exist', async () => {
      const { sut } = createSut();

      await expect(sut.execute({ thesaurusId: new ObjectId().toString() })).rejects.toThrow(
        ThesaurusNotFoundError
      );
    });

    it('should throw when thesaurus is referenced by a template', async () => {
      const { sut } = createSut();

      const thesauri = await getThesauri();
      const existing = thesauri.find((t: any) => t.name === 'Countries')! as any;

      await expect(sut.execute({ thesaurusId: existing._id.toString() })).rejects.toThrow(
        ThesaurusInUseError
      );
    });

    it('should delete translations context when deleting a thesaurus', async () => {
      const { sut } = createSut();

      const thesauri = await getThesauri();
      const existing = thesauri.find((t: any) => t.name === 'Fruits')! as any;

      const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
      expect(
        translationsBefore.filter((t: any) => t.context.id === existing._id.toString())
      ).toHaveLength(2);

      await sut.execute({ thesaurusId: existing._id.toString() });

      const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');
      expect(
        translationsAfter.filter((t: any) => t.context.id === existing._id.toString())
      ).toHaveLength(0);
    });
  });
});
