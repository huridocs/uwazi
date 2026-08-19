import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { User } from '#api/users.v2/model/User.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntitiesSyncHandler } from './MongoEntitiesSyncHandler.js';
import { PostgresEntitiesSyncHandler } from './PostgresEntitiesSyncHandler.js';

export class EntitiesSyncHandlerFactory {
  static default(): MongoEntitiesSyncHandler | PostgresEntitiesSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresEntities) {
      const user = ExecutionContext.actor ?? User.createFrom(null);
      return new PostgresEntitiesSyncHandler({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        accessContext: AccessContext.forActor(user),
      });
    }

    return new MongoEntitiesSyncHandler();
  }
}
