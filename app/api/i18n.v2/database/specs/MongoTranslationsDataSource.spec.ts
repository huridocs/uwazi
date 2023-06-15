import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DuplicatedKeyError } from 'api/common.v2/errors/DuplicatedKeyError';
import { Translation } from 'api/i18n.v2/model/Translation';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { MongoTranslationsDataSource } from '../../database/MongoTranslationsDataSource';
import migration from '../../migrations/index';

const fixtures: DBFixture = {
  translations_v2: [],
  settings: [
    {
      languages: [
        { default: true, label: 'English', key: 'en' },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
  await migration.createIndexes(testingDB.mongodb);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('MongoTranslationsDataSource', () => {
  describe('insert()', () => {
    describe('when trying to insert a duplicated translations', () => {
      it('should throw an error', async () => {
        await testingEnvironment.setUp({
          ...fixtures,
          translations_v2: [
            {
              language: 'en',
              key: 'existing_key',
              value: 'value',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
            {
              language: 'es',
              key: 'existing_key',
              value: 'value',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
          ],
        });
        const transactionManager = DefaultTransactionManager();

        await expect(
          new MongoTranslationsDataSource(
            getConnection(),
            DefaultSettingsDataSource(transactionManager),
            transactionManager
          ).insert([
            new Translation('existing_key', 'valor', 'es', {
              type: 'Entity',
              label: 'Test',
              id: 'test',
            }),
          ])
        ).rejects.toBeInstanceOf(DuplicatedKeyError);
      });
    });

    describe('when any other error happens', () => {
      it('should bubble up the error', async () => {
        const transactionManager = DefaultTransactionManager();
        const db = testingDB.mongodb!;
        jest.spyOn(db, 'collection').mockImplementation(() => {
          throw new Error('db error');
        });
        await expect(
          new MongoTranslationsDataSource(
            db,
            DefaultSettingsDataSource(transactionManager),
            transactionManager
          ).insert([
            new Translation('key', 'valor', 'es', {
              type: 'Entity',
              label: 'Test',
              id: 'test',
            }),
          ])
        ).rejects.toEqual(new Error('db error'));
      });
    });
  });
});
