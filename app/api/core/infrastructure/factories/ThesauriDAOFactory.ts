import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoThesauriDAO } from '../mongodb/thesauri/MongoThesauriDAO.js';
import { PostgresThesauriDAO } from '../postgresql/thesaurus/PostgresThesauriDAO.js';

class ThesauriDAOFactory {
  static default(): MongoThesauriDAO | PostgresThesauriDAO {
    const { tenant } = ExecutionContext;

    if (tenant.featureFlags?.postgresCore) {
      const pgTM = ExecutionContext.postgresTransactionManager;

      return new PostgresThesauriDAO({
        tenantId: tenant.name,
        pgTransactionManager: pgTM,
      });
    }

    return new MongoThesauriDAO({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { ThesauriDAOFactory };
