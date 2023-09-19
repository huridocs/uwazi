import testingDB from 'api/utils/testing_db';
import { WithId } from 'mongodb';
import migration from '../index';
import { fixtures } from './fixtures';
import { EntitySchema } from '../types';

describe('migration parse-numeric-fields', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(143);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(true);
  });

  describe('when migrating', () => {
    let results: WithId<EntitySchema>[];

    beforeEach(async () => {
      await migration.up(testingDB.mongodb!);

      results = await testingDB.mongodb
        ?.collection<EntitySchema>('entities')
        .find({}, { sort: { _id: 1 } })
        .toArray()!;
    });

    it('should parse all the numbers stored as strings', async () => {
      expect(results).toMatchObject([
        {
          sharedId: 'entityNoTemplate',
        },
        {
          sharedId: 'entity1',
          metadata: {
            numeric_1: [{ value: 0.5 }],
            numeric_2: [{ value: 1.5 }],
            text: [{ value: 'some text' }],
          },
        },
        {
          sharedId: 'entity2',
          metadata: {
            numeric_1: [{ value: 2.5 }],
            numeric_2: [{ value: 3.5 }],
            text: [{ value: 'some text' }],
          },
        },
        {
          sharedId: 'entity3',
          metadata: {
            numeric_3: [{ value: 4.5 }],
          },
        },
        {
          sharedId: 'entity4',
          metadata: {
            numeric_3: [{ value: 5 }],
          },
        },
        {
          sharedId: 'entity5',
          metadata: {},
        },
        {
          sharedId: 'entity6',
          metadata: {
            numeric_1: [{ value: 6.5 }],
          },
        },
        {
          sharedId: 'entity7',
          metadata: {
            numeric_1: [],
          },
        },
      ]);
    });

    it('should remove empty strings', async () => {
      expect(results[5].metadata!.numeric_3).toBe(undefined);
      expect(results[6].metadata!.numeric_2).toBe(undefined);
    });

    it('should skip entities without template', async () => {
      expect(results[0].metadata).toEqual({ numeric_1: [{ value: '4' }] });
    });
  });
});
