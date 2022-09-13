import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { CountDocument, MongoResultSet } from '../MongoResultSet';

const testDocuments = [
  { _id: new ObjectId(), name: 'doc1' },
  { _id: new ObjectId(), name: 'doc2' },
  { _id: new ObjectId(), name: 'doc3' },
  { _id: new ObjectId(), name: 'doc4' },
  { _id: new ObjectId(), name: 'doc5' },
  { _id: new ObjectId(), name: 'doc6' },
];

const buildCursor = (query?: any) =>
  testingDB.mongodb?.collection<typeof testDocuments[number]>('testDocuments').find(query || {});

const buildAggregationCursor = () =>
  testingDB.mongodb
    ?.collection<typeof testDocuments[number]>('testDocuments')
    .aggregate([{ $match: {} }]);

const buildCountCursor = () =>
  testingDB.mongodb
    ?.collection<typeof testDocuments[number]>('testDocuments')
    .aggregate<CountDocument>([{ $match: {} }, { $count: 'total' }]);

beforeAll(async () => {
  await testingEnvironment.setUp({ testDocuments });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('when built from a $type cursor', () => {
  it('should return all the results and close the cursor', async () => {
    const cursor = buildCursor();
    const resultSet = new MongoResultSet(cursor!, MongoResultSet.NoOpMapper);
    expect(await resultSet.all()).toEqual(testDocuments);
    expect(cursor?.isClosed()).toBe(true);
  });

  it('should use the mapper function', async () => {
    const cursor = buildCursor();
    const resultSet = new MongoResultSet(cursor!, elem => elem.name);
    expect(await resultSet.all()).toEqual(testDocuments.map(elem => elem.name));
  });

  it.each([
    { page: 1, start: 0, end: 4 },
    { page: 2, start: 4, end: 6 },
  ])('should return results page $page and close the cursor', async ({ page, start, end }) => {
    const cursor = buildCursor();
    const resultSet = new MongoResultSet(cursor!, elem => elem.name);
    const result = await resultSet.page(page, 4);
    expect(result.data).toEqual(testDocuments.slice(start, end).map(elem => elem.name));
    expect(result.total).toBe(6);
    expect(cursor?.isClosed()).toBe(true);
  });

  describe('using every(...) to check a predicate against every item', () => {
    it('should return true if it is true for every item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      expect(await resultSet.every(item => item.startsWith('doc'))).toBe(true);
    });

    it('should return true if it is true for every item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      expect(await resultSet.every(item => item.startsWith('doc1'))).toBe(false);
    });

    it('should return false if there are no items', async () => {
      const cursor = buildCursor({ name: 'non-existing' });
      const resultSet = new MongoResultSet(cursor!, elem => elem.name);
      expect(await resultSet.every(item => item.startsWith('doc'))).toBe(false);
    });
  });
});

describe('when built from an aggregation cursor', () => {
  it('should correctly count the result and use the mapper', async () => {
    const cursor = buildAggregationCursor();
    const count = buildCountCursor();
    const resultSet = new MongoResultSet(cursor!, count!, elem => elem.name);
    const result = await resultSet.page(1, 4);
    expect(result.data).toEqual(testDocuments.slice(0, 4).map(elem => elem.name));
    expect(result.total).toBe(6);
    expect(cursor?.isClosed()).toBe(true);
    expect(count?.isClosed()).toBe(true);
  });
});
