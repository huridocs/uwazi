import { tenants } from '#api/tenants/tenantContext.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoThesauriDAO } from '../mongodb/thesauri/MongoThesauriDAO.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { PostgresThesauriDAO } from '../postgresql/thesaurus/PostgresThesauriDAO.js';
import { PostgresConnectionFactory } from './PostgresConnectionFactory.js';

class ThesauriDAOFactory {
  static default(): MongoThesauriDAO | PostgresThesauriDAO {
    if (tenants.current()?.featureFlags?.postgresThesauri) {
      return new PostgresThesauriDAO({
        pool: PostgresConnectionFactory.default(),
        mongoDb: getConnection(),
      });
    }

    return new MongoThesauriDAO({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager as MongoTransactionManager,
    });
  }
}

export { ThesauriDAOFactory };
