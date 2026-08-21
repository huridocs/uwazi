import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { EntitiesDAOFactory } from './EntitiesDAOFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

class MongoRelationshipsV1DataSourceFactory {
  static default() {
    const transactionManager = ExecutionContext.getStore()
      ? ExecutionContext.transactionManager
      : TransactionManagerFactory.default();

    return new MongoRelationshipsV1DataSource(
      getConnection(),
      transactionManager,
      EntitiesDAOFactory.default()
    );
  }
}

export { MongoRelationshipsV1DataSourceFactory };
