import { PostgresUnrestrictedEntitiesQuery } from '../postgresql/entity/PostgresUnrestrictedEntitiesQuery.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresFilesDAO } from '../postgresql/files/PostgresFilesDAO.js';

class PostgresUnrestrictedEntitiesQueryFactory {
  static isEnabled(): boolean {
    return Boolean(ExecutionContext.currentTenant.featureFlags?.postgresEntities);
  }

  static default(): PostgresUnrestrictedEntitiesQuery {
    const tenant = ExecutionContext.currentTenant;
    const pgTransactionManager = ExecutionContext.postgresTransactionManager;
    const filesDAO = FilesDAOFactory.default() as any as PostgresFilesDAO;

    if (!tenant.featureFlags?.postgresFiles) {
      throw new Error(
        'PostgresUnrestrictedEntitiesQuery only works along with PostgresFilesDAO, please enable postgresFiles feature flag.'
      );
    }

    return new PostgresUnrestrictedEntitiesQuery({
      tenantId: tenant.name,
      pgTransactionManager,
      filesDAO,
    });
  }
}

export { PostgresUnrestrictedEntitiesQueryFactory };
