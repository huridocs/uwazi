import { Db } from 'mongodb';

import testingDB, { DBFixture } from '#api/utils/testing_db';
import migration from '../index.js';
import { Entity } from '../types.js';
import { fixtures, correctFixtures, correctEntities } from './fixtures.js';

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
          { text: [], select: [], relationship: [], daterange: [] },
          { text: [], select: [], relationship: [], daterange: [] },
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
            daterange: [],
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
            daterange: [],
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
            daterange: [],
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
            daterange: [],
          },
        ],
      },
      {
        sharedId: 'daterange_missing_from_sharedId',
        description: 'daterange entry with absent from is normalized to { from: null, to: 12345 }',
        expectedMetadata: [
          {
            text: [],
            select: [],
            relationship: [],
            daterange: [{ value: { from: null, to: 12345 } }],
          },
        ],
      },
      {
        sharedId: 'daterange_missing_to_sharedId',
        description: 'daterange entry with absent to is normalized to { from: 12345, to: null }',
        expectedMetadata: [
          {
            text: [],
            select: [],
            relationship: [],
            daterange: [{ value: { from: 12345, to: null } }],
          },
        ],
      },
      {
        sharedId: 'daterange_missing_both_sharedId',
        description: 'daterange entry with both from and to absent is removed',
        expectedMetadata: [
          {
            text: [],
            select: [],
            relationship: [],
            daterange: [],
          },
        ],
      },
      {
        sharedId: 'daterange_mixed_sharedId',
        description:
          'daterange: valid entry kept, missing-from normalized, both-absent entry removed',
        expectedMetadata: [
          {
            text: [],
            select: [],
            relationship: [],
            daterange: [{ value: { from: 1000, to: 2000 } }, { value: { from: null, to: 12345 } }],
          },
        ],
      },
      {
        sharedId: 'mixed_valid_and_empty_sharedId',
        description: 'mixed valid and empty-string entries: empty entries removed, valid kept',
        expectedMetadata: [
          {
            text: [{ value: 'hello' }, { value: 'world' }],
            select: [
              { value: 'valid_id_1', label: 'Valid Option 1' },
              { value: 'valid_id_2', label: 'Valid Option 2 (nested)' },
            ],
            relationship: [{ value: 'other_sharedId', label: 'Other' }],
            daterange: [],
          },
        ],
      },
    ])('should fix case: $description', async ({ sharedId, expectedMetadata }) => {
      const entities = await db!.collection<Entity>('entities').find({ sharedId }).toArray();
      const metadata = entities.map(e => e.metadata);
      expect(metadata).toEqual(expectedMetadata);
    });

    it('should not modify entity with metadata: null', async () => {
      const entities = await db!
        .collection<Entity>('entities')
        .find({ sharedId: 'null_metadata_sharedId' })
        .toArray();
      expect(entities).toHaveLength(1);
      expect(entities[0].metadata).toBeNull();
    });

    it('should not modify entity with a non-array metadata property value', async () => {
      const entities = await db!
        .collection<Entity>('entities')
        .find({ sharedId: 'non_array_metadata_prop_sharedId' })
        .toArray();
      expect(entities).toHaveLength(1);
      expect(entities[0].metadata).toEqual({
        text: 'not_an_array',
        select: [],
        relationship: [],
        daterange: [],
      });
    });

    it('should not touch non-select properties even if value looks like a ghost ref', async () => {
      const entities = await db!
        .collection<Entity>('entities')
        .find({ sharedId: 'non_select_ghost_sharedId' })
        .toArray();
      expect(entities.map(e => e.metadata)).toEqual([
        { text: [{ value: 'ghost_id' }], select: [], relationship: [], daterange: [] },
      ]);
    });

    it('should signal a reindex', () => {
      expect(migration.reindex).toBe(true);
    });
  });
});
