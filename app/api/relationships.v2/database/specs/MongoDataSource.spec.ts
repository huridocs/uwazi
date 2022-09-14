import testingDB from 'api/utils/testing_db';
import { MongoDataSource } from '../MongoDataSource';
import { TransactionContextAlreadySetError } from '../TransactionContextAlreadySetError';

class DummyDataSource extends MongoDataSource {}

describe('when trying to set the transaction context in MongoDataSource', () => {
  it('should throw an error if it already has a context', () => {
    const dataSource = new DummyDataSource(testingDB.mongodb!);
    // @ts-ignore
    dataSource.setTransactionContext({});
    // @ts-ignore
    expect(() => dataSource.setTransactionContext({})).toThrow(TransactionContextAlreadySetError);
  });
});
