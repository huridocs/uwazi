import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoEntitiesDataSource } from '#api/core/infrastructure/mongodb/entity/MongoEntitiesDataSource.js';
import { PostgresEntitiesDataSource } from '#api/core/infrastructure/postgresql/entity/PostgresEntitiesDataSource.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { MongoTemplatesDAO } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDAO.js';
import { PostgresTemplatesDAO } from '#api/core/infrastructure/postgresql/template/PostgresTemplatesDAO.js';

type Overrides = {
  transactionManager?: TransactionManager;
  accessContext?: AccessContext;
  templatesDAO?: MongoTemplatesDAO | PostgresTemplatesDAO;
  settingsDataSource?: SettingsDataSource;
};

export class EntitiesDataSourceFactory {
  static default(overrides?: Overrides): EntitiesDataSource {
    const tenant = ExecutionContext.currentTenant;
    const transactionManager = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    const accessContext =
      overrides?.accessContext ??
      (ExecutionContext.actor ? AccessContext.forActor(ExecutionContext.actor) : undefined);

    if (tenant.featureFlags?.postgresEntities) {
      if (!tenant.featureFlags?.postgresFiles) {
        throw new Error(
          'PostgresEntitiesDataSource only works along with PostgresFilesDAO, please enable postgresFiles feature flag.'
        );
      }

      return new PostgresEntitiesDataSource({
        tenantId: tenant.name,
        transactionManager,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        templatesDAO: overrides?.templatesDAO ?? TemplatesDAOFactory.default(),
        settingsDataSource: overrides?.settingsDataSource ?? SettingsDataSourceFactory.default(),
        mongoDb: getConnection(),
        accessContext: accessContext ?? AccessContext.system(),
      });
    }

    return new MongoEntitiesDataSource({
      db: getConnection(),
      transactionManager,
      templatesDAO: overrides?.templatesDAO ?? TemplatesDAOFactory.default(),
      options: accessContext ? { accessContext } : undefined,
    });
  }
}
