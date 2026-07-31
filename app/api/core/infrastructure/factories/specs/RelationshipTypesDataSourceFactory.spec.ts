import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { MongoRelationshipTypesDataSource } from '#api/core/infrastructure/mongodb/relationshipType/MongoRelationshipTypesDataSource.js';
import { PostgresRelationshipTypesDataSource } from '#api/core/infrastructure/postgresql/relationshipType/PostgresRelationshipTypesDataSource.js';
import { RelationshipTypesDataSourceFactory } from '../RelationshipTypesDataSourceFactory.js';

describe('RelationshipTypesDataSourceFactory', () => {
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return the mongo data source when postgres flag is off', async () => {
    await testingEnvironment.setUp({ relationtypes: [] });

    const sut = testingEnvironment.runWithContext(() =>
      RelationshipTypesDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      })
    );

    expect(sut).toBeInstanceOf(MongoRelationshipTypesDataSource);
  });

  it('should return the postgres data source when postgres flag is on', async () => {
    await testingEnvironment.setUp({ relationtypes: [] }, { postgres: true });

    const sut = testingEnvironment.runWithContext(
      () => RelationshipTypesDataSourceFactory.default(),
      {
        tenant: {
          ...testingTenants.current(),
          featureFlags: { postgresRelationshipTypes: true },
        },
      }
    );

    expect(sut).toBeInstanceOf(PostgresRelationshipTypesDataSource);
  });
});
