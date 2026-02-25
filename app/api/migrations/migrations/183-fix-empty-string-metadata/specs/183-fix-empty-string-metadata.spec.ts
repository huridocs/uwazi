import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Entity } from '../types';
import { fixtures, correctFixtures, correctEntities } from './fixtures';

let db: Db | null;

const initTest = async (fixture: typeof fixtures) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;

  await migration.up(db);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration fix-empty-string-metadata', () => {
  it('should have delta 183', () => {
    expect(migration.delta).toBe(183);
  });

  describe('on a correct database', () => {
    beforeAll(async () => {
      await initTest(correctFixtures);
    });

    it('should not modify any entities', async () => {
      const entities = await db!.collection<Entity>('entities').find().toArray();
      expect(entities).toEqual(correctFixtures.entities);
    });

    it('should not signal a reindex', () => {
      expect(migration.reindex).toBe(false);
    });
  });

  describe('on a faulty database', () => {
    beforeAll(async () => {
      await initTest(fixtures);
    });

    it('should not modify correct entities', async () => {
      const dbEntities = await db!
        .collection<Entity>('entities')
        .find({ _id: { $in: correctEntities.map(e => e._id) } })
        .toArray();

      expect(dbEntities).toEqual(correctEntities);
    });

    it.each([
      {
        sharedId: 'all_empty_string_sharedId',
        description: 'all properties have empty-string values',
        expectedMetadata: [
          { text: [], select: [], relationship: [] },
          { text: [], select: [], relationship: [] },
        ],
      },
      {
        sharedId: 'single_empty_string_sharedId',
        description: 'only one property has an empty-string value',
        expectedMetadata: [
          {
            text: [{ value: 'hello' }],
            select: [],
            relationship: [],
          },
        ],
      },
    ])('should fix case: $description', async ({ sharedId, expectedMetadata }) => {
      const entities = await db!.collection<Entity>('entities').find({ sharedId }).toArray();
      const metadata = entities.map(e => e.metadata);
      expect(metadata).toEqual(expectedMetadata);
    });

    it('should signal a reindex', () => {
      expect(migration.reindex).toBe(true);
    });
  });
});
