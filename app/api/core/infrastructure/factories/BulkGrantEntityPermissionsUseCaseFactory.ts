import {
  BulkGrantEntityPermissions,
  BulkGrantEntityPermissionsDeps,
} from '#api/core/application/BulkGrantEntityPermissions.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityAccessPolicyDataSourceFactory } from './EntityAccessPolicyDataSourceFactory.js';

class BulkGrantEntityPermissionsUseCaseFactory {
  static default(overrides?: Partial<BulkGrantEntityPermissionsDeps>) {
    const { tenant, actor, transactionManager } = ExecutionContext;

    return new BulkGrantEntityPermissions(
      {
        entityAccessPolicyDS: EntityAccessPolicyDataSourceFactory.default(),
        transactionManager,
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { BulkGrantEntityPermissionsUseCaseFactory };
