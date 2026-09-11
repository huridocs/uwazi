import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { IXExtractorsDataSource } from '../domain/IXExtractorsDataSource.js';
import { MongoIXExtractorsDataSource } from './MongoIXExtractorsDataSource.js';
import { PostgresIXExtractorsDataSource } from './PostgresIXExtractorsDataSource.js';

/**
 * `default()` stays on Mongo until every IX factory switches on `postgresCore` at once: a tenant
 * must never see IX split across the two stores. `mongo()` and `postgres()` build each backend
 * explicitly, which is what the contract specs use.
 */
class IXExtractorsDAOFactory {
  static default(): IXExtractorsDataSource {
    return IXExtractorsDAOFactory.mongo();
  }

  static mongo(): IXExtractorsDataSource {
    return new MongoIXExtractorsDataSource({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.mongo(),
    });
  }

  static postgres(): IXExtractorsDataSource {
    return new PostgresIXExtractorsDataSource({
      tenantId: ExecutionContext.currentTenant.name,
      pgTransactionManager: ExecutionContext.getStore()
        ? ExecutionContext.postgresTransactionManager
        : PostgresTransactionManagerFactory.default(),
      mongoDb: getConnection(),
    });
  }
}

export { IXExtractorsDAOFactory };
