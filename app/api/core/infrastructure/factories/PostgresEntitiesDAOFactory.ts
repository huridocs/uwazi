import { PostgresEntitiesDAO } from '../postgresql/entity/PostgresEntitiesDAO.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresFilesDAO } from '../postgresql/files/PostgresFilesDAO.js';

class PostgresEntitiesDAOFactory {
  static default(): PostgresEntitiesDAO {
    const tenant = ExecutionContext.currentTenant;
    const pgTransactionManager = ExecutionContext.postgresTransactionManager;
    const filesDAO = FilesDAOFactory.default() as any as PostgresFilesDAO;

    if (!tenant.featureFlags?.postgresFiles) {
      throw new Error(
        'PostgresEntitiesDAO only works along with PostgresFilesDAO, please enable postgresFiles feature flag.'
      );
    }

    return new PostgresEntitiesDAO({
      tenantId: tenant.name,
      pgTransactionManager,
      filesDAO,
    });
  }
}

export { PostgresEntitiesDAOFactory };
