import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSettingsDocumentQueryService } from '../mongodb/MongoSettingsDocumentQueryService.js';
import { PostgresSettingsDocumentQueryService } from '../postgresql/settings/PostgresSettingsDocumentQueryService.js';
import type { SettingsDocumentQueryService } from '../settings/SettingsDocumentQueryService.js';

class SettingsDocumentQueryServiceFactory {
  static default(): SettingsDocumentQueryService {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresSettingsDocumentQueryService({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoSettingsDocumentQueryService({ db: getConnection() });
  }
}

export { SettingsDocumentQueryServiceFactory };
