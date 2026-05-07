import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { EntityAccessPolicyDataSource } from '#api/core/application/contracts/EntityAccessPolicyDataSource.js';
import {
  MongoEntityAccessPolicyDataSource,
  MongoEntityAccessPolicyDataSourceDeps,
} from '../mongodb/entityAccessPolicy/MongoEntityAccessPolicyDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityIndexerServiceFactory } from './EntityIndexerServiceFactory.js';

export class EntityAccessPolicyDataSourceFactory {
  static default(
    overrides?: Partial<MongoEntityAccessPolicyDataSourceDeps>
  ): EntityAccessPolicyDataSource {
    const db = getConnection();
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const entityIndexerService = EntityIndexerServiceFactory.default();

    return new MongoEntityAccessPolicyDataSource({
      db,
      transactionManager,
      entityIndexerService,
      ...overrides,
    });
  }
}
