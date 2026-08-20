import { Db } from 'mongodb';

import testingDB, { DBFixture } from '#api/utils/testing_db.js';
import migration from '../index.js';
import { orphanedDataFixture, noLanguagesFixture } from './fixtures.js';

let db: Db | null;

const initTest = async (fixture: DBFixture) => {
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

describe('migration remove-orphaned-language-entities', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(205);
  });

  describe('when there are entities in a language that is not installed', () => {
    beforeAll(async () => {
      await initTest(orphanedDataFixture);
    });

    it('should remove entities whose language is not installed', async () => {
      const zhEntities = await db!.collection('entities').find({ language: 'zh' }).toArray();
      expect(zhEntities).toHaveLength(0);
    });

    it('should keep entities in installed languages', async () => {
      const kept = await db!.collection('entities').find({ sharedId: 'entity1' }).toArray();
      expect(kept.map(e => e.language).sort()).toEqual(['en', 'es']);
    });

    it('should request a reindex because entities were removed', () => {
      expect(migration.reindex).toBe(true);
    });

    it('should not touch the settings', async () => {
      const settings = await db!.collection('settings').find().toArray();
      expect(settings[0].languages.map((l: any) => l.key)).toEqual(['en', 'es']);
    });
  });

  describe('when no languages are configured in settings', () => {
    beforeAll(async () => {
      await initTest(noLanguagesFixture);
    });

    it('should not delete anything (safety guard against mass deletion)', async () => {
      const entities = await db!.collection('entities').find().toArray();
      expect(entities).toHaveLength(2);
    });

    it('should not request a reindex', () => {
      expect(migration.reindex).toBe(false);
    });
  });
});
