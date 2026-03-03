import { Db } from 'mongodb';

import testingDB, { DBFixture } from '#api/utils/testing_db';
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

describe('migration restore-text-markdown-empty-values', () => {
  it('should have delta 185', () => {
    expect(migration.delta).toBe(185);
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
        sharedId: 'both_empty_sharedId',
        description: 'both text and markdown are [] → both become [{ value: "" }]',
        expectedMetadata: [
          { text: [{ value: '' }], markdown: [{ value: '' }], select: [], relationship: [] },
          { text: [{ value: '' }], markdown: [{ value: '' }], select: [], relationship: [] },
        ],
      },
      {
        sharedId: 'only_text_empty_sharedId',
        description: 'only text is [] → text becomes [{ value: "" }], markdown unchanged',
        expectedMetadata: [
          {
            text: [{ value: '' }],
            markdown: [{ value: '# Heading' }],
            select: [],
            relationship: [],
          },
        ],
      },
      {
        sharedId: 'only_markdown_empty_sharedId',
        description: 'only markdown is [] → markdown becomes [{ value: "" }], text unchanged',
        expectedMetadata: [
          {
            text: [{ value: 'hello' }],
            markdown: [{ value: '' }],
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

    it('should not restore [] for non text/markdown properties (select, relationship)', async () => {
      const entities = await db!
        .collection<Entity>('entities')
        .find({ sharedId: 'both_empty_sharedId' })
        .toArray();
      // select and relationship must remain []
      for (const entity of entities) {
        expect(entity.metadata!.select).toEqual([]);
        expect(entity.metadata!.relationship).toEqual([]);
      }
    });

    it('should not modify entity with metadata: null', async () => {
      const entities = await db!
        .collection<Entity>('entities')
        .find({ sharedId: 'null_metadata_sharedId' })
        .toArray();
      expect(entities).toHaveLength(1);
      expect(entities[0].metadata).toBeNull();
    });

    it('should signal a reindex', () => {
      expect(migration.reindex).toBe(true);
    });
  });
});
