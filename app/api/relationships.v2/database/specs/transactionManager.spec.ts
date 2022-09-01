import { TransactionManager } from 'api/relationships.v2/services/TransactionManager';
import { getIdMapper } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { getClient } from '../getConnectionForCurrentTenant';
import { MongoTransactionManager } from '../MongoTransactionManager';

const ids = getIdMapper();

const fixtures = {
  collection1: [{ _id: ids('doc1') }],
  collection2: [{ _id: ids('doc2') }],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('When every operation goes well', () => {
  let transactionResult: any;
  beforeEach(async () => {
    const transactionManager = new MongoTransactionManager(getClient());
    transactionResult = await transactionManager.run(async session => {
      await testingDB.mongodb
        ?.collection('collection1')
        .insertOne({ _id: ids('doc3') }, { session });
      await testingDB.mongodb
        ?.collection('collection1')
        .updateOne({ _id: ids('doc1') }, { $set: { updated: true } }, { session });
      await testingDB.mongodb
        ?.collection('collection2')
        .deleteOne({ _id: ids('doc2') }, { session });
      const result = await testingDB
        .mongodb!.collection('collection1')
        .find({ _id: ids('doc1') }, { session })
        .toArray();

      return result;
    });
  });

  it('should be reflected in all of the collections affected', async () => {
    const col1 = await testingDB.mongodb?.collection('collection1').find({}).toArray();
    const col2 = await testingDB.mongodb?.collection('collection2').find({}).toArray();

    expect(col1).toEqual([{ _id: ids('doc1'), updated: true }, { _id: ids('doc3') }]);

    expect(col2).toEqual([]);
  });

  it('should return what the callback returned', async () => {
    expect(transactionResult).toEqual([{ _id: ids('doc1'), updated: true }]);
  });
});

describe('When one operation fails', () => {
  it('should not write any changes to the database and re-throw the error', async () => {
    const transactionManager: TransactionManager = new MongoTransactionManager(getClient());
    const error = new Error('Simulated error');
    try {
      await transactionManager.run(async session => {
        await testingDB.mongodb
          ?.collection('collection1')
          .insertOne({ _id: ids('doc3') }, { session });
        await testingDB.mongodb
          ?.collection('collection1')
          .updateOne({ _id: ids('doc1') }, { $set: { updated: true } }, { session });
        throw error; // Mimics error thrown mid-execution
        // eslint-disable-next-line no-unreachable
        await testingDB.mongodb
          ?.collection('collection2')
          .deleteOne({ _id: ids('doc2') }, { session });
      });
    } catch (e) {
      expect(e).toBe(error);
    }

    const col1 = await testingDB.mongodb?.collection('collection1').find({}).toArray();
    const col2 = await testingDB.mongodb?.collection('collection2').find({}).toArray();

    expect(col1).toEqual(fixtures.collection1);

    expect(col2).toEqual(fixtures.collection2);
  });
});
