import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { fixtures, ids, noReindexFixtures } from './fixtures';
import { EntitySchema } from '../types';

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

let db: Db;

const expectedForUnchanged = [
  {
    unrelated_text_prop: ['unrelated_text_prop'],
    unrelated_numeric_prop: [1],
  },
  {
    relationship_typed_target: ['source_1'],
  },
  {
    relationship_untyped_target: ['source_2', 'source_3'],
  },
  {
    relationship_typed_target: ['source_1', 'source_2'],
    relationship_untyped_target: ['source_3'],
  },
];

const getValues = async () => {
  const entities = await db
    .collection<EntitySchema>('entities')
    .find({ template: { $ne: ids.sourceTemplate } })
    .toArray();
  const values = entities.map(e =>
    Object.fromEntries(
      Object.entries(e.metadata || {}).map(([k, arr]) => [k, (arr || []).map(v => v.value)])
    )
  );
  return values;
};

describe('migration remove_inconsistent_relationships_metadata', () => {
  describe('when changes need to be made', () => {
    beforeAll(async () => {
      await testingDB.setupFixturesAndContext(fixtures);
      db = testingDB.mongodb!;
      migration.reindex = false;
      migration.batchSize = 4;
      await migration.up(db);
    });

    it('should have a delta number', () => {
      expect(migration.delta).toBe(166);
    });

    it('should remove metadata values without related entities', async () => {
      const values = await getValues();
      expect(values).toMatchObject([
        ...expectedForUnchanged,
        {
          relationship_typed_target: ['source_2'],
        },
        {
          relationship_untyped_target: [],
        },
        {
          relationship_typed_target: ['source_1', 'source_2'],
          relationship_untyped_target: ['source_1', 'source_2', 'source_3'],
        },
      ]);
    });

    it('should signal reindex', async () => {
      expect(migration.reindex).toBe(true);
    });
  });

  describe('when no changes need to be made', () => {
    beforeAll(async () => {
      await testingDB.setupFixturesAndContext(noReindexFixtures);
      db = testingDB.mongodb!;
      migration.reindex = false;
      await migration.up(db);
    });

    it('should not remove anything', async () => {
      const values = await getValues();
      expect(values).toMatchObject(expectedForUnchanged);
    });

    it('should not signal reindex', async () => {
      expect(migration.reindex).toBe(false);
    });
  });
});

afterAll(async () => {
  await testingDB.tearDown();
});
