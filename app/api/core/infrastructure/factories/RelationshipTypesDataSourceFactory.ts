import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { RelationshipTypesDataSource } from '#api/core/application/contracts/RelationshipTypesDataSource.js';
import { MongoRelationshipTypesDataSource } from '../mongodb/relationshipType/MongoRelationshipTypesDataSource.js';
import { PostgresRelationshipTypesDataSource } from '../postgresql/relationshipType/PostgresRelationshipTypesDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = {
  transactionManager?: TransactionManager;
};

export class RelationshipTypesDataSourceFactory {
  static default(overrides?: Overrides): RelationshipTypesDataSource {
    const db = getConnection();
    // currentTenant falls back to tenants.current() for legacy call sites outside EC
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresRelationshipTypes) {
      return new PostgresRelationshipTypesDataSource({
        tenantId: tenant.name,
        mongoDb: db,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new MongoRelationshipTypesDataSource(db, tm);
  }
}
