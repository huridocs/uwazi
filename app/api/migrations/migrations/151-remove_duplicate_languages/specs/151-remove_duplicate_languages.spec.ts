import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import { settingsOnlyDuplication, defaultLanguageDuplication, allCases } from './fixtures';
import migration from '../index';
import { Fixture } from '../types';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;
  await migration.up(db);
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
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

  describe('when there are duplications', () => {
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
  });
});
