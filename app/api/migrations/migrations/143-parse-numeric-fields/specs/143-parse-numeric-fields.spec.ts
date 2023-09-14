import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { fixtures } from './fixtures';

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

  it('should parse all the numbers stored as strings', async () => {
    await migration.up(testingDB.mongodb!);

    expect(
      await testingDB.mongodb
        ?.collection('entities')
        .find({}, { sort: { _id: 1 } })
        .toArray()
    ).toMatchObject([
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
    ]);
  });
});
