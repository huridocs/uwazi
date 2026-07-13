import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoThesauriDAO } from '../mongodb/thesauri/MongoThesauriDAO.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { PostgresThesauriDAO } from '../postgresql/thesaurus/PostgresThesauriDAO.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';
import { PostgresTransactionManager } from '../postgresql/common/PostgresTransactionManager.js';

class ThesauriDAOFactory {
  static default(): MongoThesauriDAO | PostgresThesauriDAO {
    const { tenant } = ExecutionContext;

    if (tenant.featureFlags?.postgresThesauri) {
      const pgTM = ExecutionContext.postgresTransactionManager as PostgresTransactionManager;

      return new PostgresThesauriDAO({
        tenantId: tenant.name,
        pgTransactionManager: pgTM,
      });
    }

    return new MongoThesauriDAO({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager as MongoTransactionManager,
    });
  }
}

export { ThesauriDAOFactory };
