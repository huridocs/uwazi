import { Collection, Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import { settingsOnlyDuplication, defaultLanguageDuplication, allCases } from './fixtures';
import migration from '../index';
import { Entity, Fixture, Page } from '../types';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;
  await migration.up(db);
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration remove_duplicate_entities', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(151);
  });

  it('should not reindex if entities are not changed', async () => {
    await initTest(settingsOnlyDuplication);
    expect(migration.reindex).toBe(false);
  });

  it('should keep a default version of a duplicated default language', async () => {
    await initTest(defaultLanguageDuplication);
    const settings = await db!.collection('settings').find().toArray();
    expect(settings[0].languages).toEqual([
      {
        label: 'English',
        key: 'en',
        default: true,
      },
      {
        label: 'Spanish',
        key: 'es',
      },
    ]);
  });

  describe('when there are duplications in everything', () => {
    beforeAll(async () => {
      await initTest(allCases);
    });

    it('should reindex', async () => {
      expect(migration.reindex).toBe(true);
    });

    it('should remove duplicated languages from settings', async () => {
      const settings = await db!.collection('settings').find().toArray();
      expect(settings[0].languages).toEqual([
        {
          label: 'English',
          key: 'en',
          default: true,
        },
        {
          label: 'Spanish',
          key: 'es',
        },
        {
          label: 'French',
          key: 'fr',
        },
      ]);
    });

    describe('in pages', () => {
      let collection: Collection<Page>;

      beforeAll(async () => {
        collection = db!.collection<Page>('pages');
      });

      it.each([
        {
          case: 'keep correct pages',
          sharedId: 'correctPage',
        },
        {
          case: 'handle duplication in non-default languages',
          sharedId: 'nonDefDuplicatePage',
        },
        {
          case: 'handle duplication in the default language',
          sharedId: 'defDuplicatePage',
        },
        {
          case: 'handle multiples in all languages',
          sharedId: 'allMultiplesPage',
        },
      ])('should $case', async ({ sharedId }) => {
        const pages = await collection.find({ sharedId }).toArray();
        const languages = pages.map(p => p.language);
        expect(languages).toEqual(['en', 'es', 'fr']);
      });
    });

    describe('in entities', () => {
      let collection: Collection<Entity>;

      beforeAll(async () => {
        collection = db!.collection<Entity>('entities');
      });

      it.each([
        {
          case: 'keep correct pages',
          sharedId: 'correctEntity',
        },
        {
          case: 'handle duplication in non-default languages',
          sharedId: 'nonDefDuplicateEntity',
        },
        {
          case: 'handle duplication in the default language',
          sharedId: 'defDuplicateEntity',
        },
        {
          case: 'handle multiples in all languages',
          sharedId: 'allMultiplesEntity',
        },
      ])('should $case', async ({ sharedId }) => {
        const entities = await collection.find({ sharedId }).toArray();
        const languages = entities.map(p => p.language);
        expect(languages).toEqual(['en', 'es', 'fr']);
      });
    });
  });
});
