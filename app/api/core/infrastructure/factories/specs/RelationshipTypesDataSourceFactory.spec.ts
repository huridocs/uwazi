import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoRelationshipTypesDataSource } from '#api/core/infrastructure/mongodb/relationshipType/MongoRelationshipTypesDataSource.js';
import { RelationshipTypesDataSourceFactory } from '../RelationshipTypesDataSourceFactory.js';

describe('RelationshipTypesDataSourceFactory', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({ relationtypes: [] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return the mongo data source implementation', () => {
    const transactionManager = TransactionManagerFactory.default();
    const sut = RelationshipTypesDataSourceFactory.default(transactionManager);

    expect(sut).toBeInstanceOf(MongoRelationshipTypesDataSource);
    expect(typeof sut.getById).toBe('function');
  });
});
