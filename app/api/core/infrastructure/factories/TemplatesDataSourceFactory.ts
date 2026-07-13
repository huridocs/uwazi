import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { PostgresTemplatesDataSource } from '#api/core/infrastructure/postgresql/template/PostgresTemplatesDataSource.js';
import { MongoTemplatesDataSource } from '../mongodb/template/MongoTemplatesDataSource.js';
import { CachedMongoTemplatesDataSource } from '../mongodb/template/CachedMongoTemplatesDataSource.js';
import { MongoTemplatesDAO } from '../mongodb/template/MongoTemplatesDAO.js';
import { PostgresTemplatesDAO } from '#api/core/infrastructure/postgresql/template/PostgresTemplatesDAO.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';
import { PostgresTransactionManager } from '../postgresql/common/PostgresTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TemplatesDAOFactory } from './TemplatesDAOFactory.js';

type Overrides = Partial<
  Omit<ConstructorParameters<typeof MongoTemplatesDataSource>[0], 'transactionManager'>
> & {
  transactionManager?: TransactionManager;
};

function resolvePgTM(): PostgresTransactionManager {
  return ExecutionContext.postgresTransactionManager as PostgresTransactionManager;
}

export class TemplatesDataSourceFactory {
  static default(overrides?: Overrides) {
    const tenant = ExecutionContext.currentTenant;
    const db = getConnection();
    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    const { transactionManager: _ignored, ...restOverrides } = overrides ?? {};

    if (tenant.featureFlags?.postgresTemplates) {
      const dao = TemplatesDAOFactory.default() as PostgresTemplatesDAO;
      return new PostgresTemplatesDataSource({
        tenantId: tenant.name,
        mongoDb: db,
        transactionManager: mongoTM,
        pgTransactionManager: resolvePgTM(),
        dao,
      });
    }

    const dao = TemplatesDAOFactory.default() as MongoTemplatesDAO;
    return new MongoTemplatesDataSource({
      db,
      transactionManager: mongoTM,
      dao,
      ...restOverrides,
    });
  }

  static cached(overrides?: Overrides) {
    const tenant = ExecutionContext.currentTenant;
    const db = getConnection();
    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    const { transactionManager: _ignored, ...restOverrides } = overrides ?? {};

    if (tenant.featureFlags?.postgresTemplates) {
      const dao = TemplatesDAOFactory.default() as PostgresTemplatesDAO;
      return new PostgresTemplatesDataSource({
        tenantId: tenant.name,
        mongoDb: db,
        transactionManager: mongoTM,
        pgTransactionManager: resolvePgTM(),
        dao,
      });
    }

    const dao = TemplatesDAOFactory.default() as MongoTemplatesDAO;
    return new CachedMongoTemplatesDataSource({
      db,
      transactionManager: mongoTM,
      dao,
      ...restOverrides,
    });
  }
}
