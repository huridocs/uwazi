import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoThesauriDAO } from '../mongodb/thesauri/MongoThesauriDAO.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { PostgresThesauriDAO } from '../postgresql/thesaurus/PostgresThesauriDAO.js';
import { PostgresConnectionFactory } from './PostgresConnectionFactory.js';

class ThesauriDAOFactory {
  static default(): MongoThesauriDAO | PostgresThesauriDAO {
    const tenant = ExecutionContext.tenant;

    if (tenant.featureFlags?.postgresThesauri) {
      return new PostgresThesauriDAO({
        connection: PostgresConnectionFactory.connectionConfig(),
        tenantId: tenant.name,
      });
    }

    return new MongoThesauriDAO({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager as MongoTransactionManager,
    });
  }
}

export { ThesauriDAOFactory };
