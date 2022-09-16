import ValidationError from 'ajv/dist/runtime/validation_error';
import { ObjectId } from 'mongodb';

import { createDefaultValidator } from 'api/relationships.v2/validation/ajvInstances';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';

import { CountDocument, MongoResultSet } from '../MongoResultSet';

const testDocuments = [
  { _id: new ObjectId(), name: 'doc1' },
  { _id: new ObjectId(), name: 'doc2' },
  { _id: new ObjectId(), name: 'doc3' },
  { _id: new ObjectId(), name: 'doc4' },
  { _id: new ObjectId(), name: 'doc5' },
  { _id: new ObjectId(), name: 'doc6' },
];

const failingDocuments = [{ _id: new ObjectId() }];

const testDocumentSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: { type: 'object' },
    name: { type: 'string' },
  },
  required: ['_id', 'name'],
};
const testDocumentValidator = createDefaultValidator(testDocumentSchema);

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

beforeEach(async () => {
  await testingEnvironment.setUp({ testDocuments });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('when built from a $type cursor', () => {
  describe('next()', () => {
    it('should provide the next item as a normal mongo cursor', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(
        cursor!,
        testDocumentValidator,
        MongoResultSet.NoOpMapper
      );
      let index = 0;
      // eslint-disable-next-line no-await-in-loop
      while (await resultSet.hasNext()) {
        // eslint-disable-next-line no-await-in-loop
        const item = await resultSet.next();
        expect(item).toEqual(testDocuments[index]);
        index += 1;
      }
    });

    it('should validate the result coming from the database', async () => {
      await testingEnvironment.setUp({ testDocuments: failingDocuments });
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(
        cursor!,
        testDocumentValidator,
        MongoResultSet.NoOpMapper
      );
      try {
        await resultSet.next();
        fail('Should throw ValidationError');
      } catch (err) {
        if (!(err instanceof ValidationError)) throw err;
      }
    });
  });

  describe('all()', () => {
    it('should return all the results and close the cursor', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(
        cursor!,
        testDocumentValidator,
        MongoResultSet.NoOpMapper
      );
      expect(await resultSet.all()).toEqual(testDocuments);
      expect(cursor?.isClosed()).toBe(true);
    });

    it('should validate the result coming from the database', async () => {
      await testingEnvironment.setUp({ testDocuments: failingDocuments });
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(
        cursor!,
        testDocumentValidator,
        MongoResultSet.NoOpMapper
      );
      try {
        await resultSet.all();
        fail('Should throw ValidationError');
      } catch (err) {
        if (!(err instanceof ValidationError)) throw err;
      }
    });
  });

  it('should use the mapper function', async () => {
    const cursor = buildCursor();
    const resultSet = new MongoResultSet(cursor!, testDocumentValidator, elem => elem.name);
    expect(await resultSet.all()).toEqual(testDocuments.map(elem => elem.name));
  });

  it.each([
    { page: 1, start: 0, end: 4 },
    { page: 2, start: 4, end: 6 },
  ])('should return results page $page and close the cursor', async ({ page, start, end }) => {
    const cursor = buildCursor();
    const resultSet = new MongoResultSet(cursor!, testDocumentValidator, elem => elem.name);
    const result = await resultSet.page(page, 4);
    expect(result.data).toEqual(testDocuments.slice(start, end).map(elem => elem.name));
    expect(result.total).toBe(6);
    expect(cursor?.isClosed()).toBe(true);
  });

  describe('using every(...) to check a predicate against every item', () => {
    it('should return true if it is true for every item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, testDocumentValidator, elem => elem.name);
      expect(await resultSet.every(item => item.startsWith('doc'))).toBe(true);
    });

    it('should return true if it is true for every item', async () => {
      const cursor = buildCursor();
      const resultSet = new MongoResultSet(cursor!, testDocumentValidator, elem => elem.name);
      expect(await resultSet.every(item => item.startsWith('doc1'))).toBe(false);
    });

    it('should return false if there are no items', async () => {
      const cursor = buildCursor({ name: 'non-existing' });
      const resultSet = new MongoResultSet(cursor!, testDocumentValidator, elem => elem.name);
      expect(await resultSet.every(item => item.startsWith('doc'))).toBe(false);
    });
  });
});

describe('when built from an aggregation cursor', () => {
  it('should correctly count the result and use the mapper', async () => {
    const cursor = buildAggregationCursor();
    const count = buildCountCursor();
    const resultSet = new MongoResultSet(cursor!, testDocumentValidator, count!, elem => elem.name);
    const result = await resultSet.page(1, 4);
    expect(result.data).toEqual(testDocuments.slice(0, 4).map(elem => elem.name));
    expect(result.total).toBe(6);
    expect(cursor?.isClosed()).toBe(true);
    expect(count?.isClosed()).toBe(true);
  });
});
