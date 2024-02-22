import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Entity, Fixture, Metadata } from '../types';
import { fixtures, unchangedFixtures } from './fixtures';

let db: Db | null;

let metadata: Metadata[] = [];

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;
  migration.batchSize = 2;
  await migration.up(db);
  metadata = (await db.collection<Entity>('entities').find().toArray()).map(e => e.metadata || {});
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration test', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(161);
  });

  describe('if there is nothing to migrate', () => {
    beforeAll(async () => {
      await initTest(unchangedFixtures);
    });

    it('should not change the entities', async () => {
      expect(metadata).toEqual([
        {
          text_property: [{ value: 'A', label: 'A' }],
        },
      ]);
    });

    it('should not signal reindex', async () => {
      expect(migration.reindex).toBe(false);
    });
  });
});
