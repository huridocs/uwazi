import { Db } from 'mongodb';

import testingDB, { DBFixture } from 'api/utils/testing_db';
import migration from '../index';
import { Entity } from '../types';
import { fixtures, correctFixtures, correctEntities } from './fixtures';

let db: Db | null;

const initTest = async (fixture: typeof fixtures) => {
  await testingDB.setupFixturesAndContext(fixture as unknown as DBFixture);
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

describe('migration fix-metadata-integrity', () => {
  it('should have delta 184', () => {
    expect(migration.delta).toBe(184);
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
      {
        sharedId: 'null_value_sharedId',
        description: 'null values are treated as empty',
        expectedMetadata: [
          {
            text: [],
            select: [],
            relationship: [],
          },
        ],
      },
      {
        sharedId: 'ghost_ref_sharedId',
        description: 'select property with only ghost refs becomes []',
        expectedMetadata: [
          {
            text: [{ value: 'some text' }],
            select: [],
            relationship: [],
          },
        ],
      },
      {
        sharedId: 'partial_ghost_ref_sharedId',
        description: 'valid select entries survive, ghost entries are removed',
        expectedMetadata: [
          {
            text: [],
            select: [{ value: 'valid_id_1', label: 'Valid Option 1' }],
            relationship: [],
          },
        ],
      },
    ])('should fix case: $description', async ({ sharedId, expectedMetadata }) => {
      const entities = await db!.collection<Entity>('entities').find({ sharedId }).toArray();
      const metadata = entities.map(e => e.metadata);
      expect(metadata).toEqual(expectedMetadata);
    });

    it('should not touch non-select properties even if value looks like a ghost ref', async () => {
      const entities = await db!
        .collection<Entity>('entities')
        .find({ sharedId: 'non_select_ghost_sharedId' })
        .toArray();
      expect(entities.map(e => e.metadata)).toEqual([
        { text: [{ value: 'ghost_id' }], select: [], relationship: [] },
      ]);
    });

    it('should signal a reindex', () => {
      expect(migration.reindex).toBe(true);
    });
  });
});
