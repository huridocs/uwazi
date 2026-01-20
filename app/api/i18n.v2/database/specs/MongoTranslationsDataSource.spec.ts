import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { DuplicatedKeyError } from '#api/common.v2/errors/DuplicatedKeyError.js';

import { Translation } from '#api/i18n.v2/model/Translation.js';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import testingDB, { DBFixture } from '#api/utils/testing_db.js';
import { MongoTranslationsDataSource } from '#api/i18n.v2/database/MongoTranslationsDataSource.js';

const fixtures: DBFixture = {
  translationsV2: [],
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

  await testingDB
    .mongodb!.collection('translationsV2')
    .createIndex({ language: 1, key: 1, 'context.id': 1 }, { unique: true });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;

describe('MongoTranslationsDataSource', () => {
  describe('insert()', () => {
    describe('when trying to insert a duplicated translations', () => {
      it('should throw an error', async () => {
        await testingEnvironment.setUp({
          ...fixtures,
          translationsV2: [
            createTranslationDBO('existing_key', 'value', 'en', {
              type: 'Entity',
              label: 'Test',
              id: 'test',
            }),
            createTranslationDBO('existing_key', 'value', 'es', {
              type: 'Entity',
              label: 'Test',
              id: 'test',
            }),
          ],
        });
        const transactionManager = TransactionManagerFactory.default();

        await expect(
          new MongoTranslationsDataSource(getConnection(), transactionManager).insert([
            new Translation('existing_key', 'valor', 'es', {
              type: 'Entity',
              label: 'Test',
              id: 'test',
            }),
          ])
        ).rejects.toBeInstanceOf(DuplicatedKeyError);
      });

      it('should not fail on an empty input', async () => {
        const transactionManager = TransactionManagerFactory.default();
        await expect(
          new MongoTranslationsDataSource(getConnection(), transactionManager).insert([])
        ).resolves.toEqual([]);
      });
    });

    describe('when any other error happens', () => {
      it('should bubble up the error', async () => {
        const transactionManager = TransactionManagerFactory.default();
        const db = testingDB.mongodb!;
        jest.spyOn(db, 'collection').mockImplementation(() => {
          throw new Error('db error');
        });
        await expect(
          new MongoTranslationsDataSource(db, transactionManager).insert([
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
