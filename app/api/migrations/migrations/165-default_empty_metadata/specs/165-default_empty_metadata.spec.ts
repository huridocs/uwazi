import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Entity, Fixture } from '../types';
import { fixtures, correctFixtures } from './fixtures';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;
  migration.batchSize = 4;

  await migration.up(db);
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration test', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(165);
  });

  describe('on a correct database', () => {
    beforeAll(async () => {
      await initTest(correctFixtures);
    });

    it('should do nothing', async () => {
      const entities = await db!.collection<Entity>('entities').find().toArray();
      expect(entities).toEqual(correctFixtures.entities);
    });

    it('should not signal a reindex', async () => {
      expect(migration.reindex).toBe(false);
    });
  });

  describe('on a faulty database', () => {
    beforeAll(async () => {
      await initTest(fixtures);
    });

    const correctEmptyMetadata = {
      text: [],
      select: [],
      relationship: [],
    };

    const expectedCorrectMetadata = [correctEmptyMetadata, correctEmptyMetadata];

    it('should not modify correct entities', async () => {
      const entities = await db!
        .collection<Entity>('entities')
        .find({ sharedId: 'correct_entity_sharedId' })
        .toArray();
      expect(entities).toEqual(correctFixtures.entities);
    });

    it.each([
      {
        title: 'entity_without_metadata',
        expectedMetadata: expectedCorrectMetadata,
      },
      {
        title: 'entity_with_undefined_metadata',
        expectedMetadata: expectedCorrectMetadata,
      },
      {
        title: 'entity_with_null_metadata',
        expectedMetadata: expectedCorrectMetadata,
      },
      {
        title: 'entity_with_empty_metadata',
        expectedMetadata: expectedCorrectMetadata,
      },
      {
        title: 'entity_with_undefined_metadata_properties',
        expectedMetadata: expectedCorrectMetadata,
      },
      {
        title: 'entity_with_null_metadata_properties',
        expectedMetadata: expectedCorrectMetadata,
      },
      {
        title: 'entity_with_empty_metadata_properties',
        expectedMetadata: expectedCorrectMetadata,
      },
      {
        title: 'entity_with_assymetric_metadata',
        expectedMetadata: [
          {
            text: [],
            select: [],
            relationship: [],
          },
          {
            text: [],
            select: [],
            relationship: [],
          },
        ],
      },
      {
        title: 'other_template',
        expectedMetadata: [
          {
            text: [],
            select: [],
          },
          {
            text: [],
            select: [],
          },
        ],
      },
    ])('should fix case: $title', async ({ title, expectedMetadata }) => {
      const sharedId = `${title}_sharedId`;
      const entities = await db!.collection<Entity>('entities').find({ sharedId }).toArray();
      const metadata = entities.map(e => e.metadata);
      expect(metadata).toEqual(expectedMetadata);
    });

    it('should signal a reindex', async () => {
      expect(migration.reindex).toBe(true);
    });
  });
});
