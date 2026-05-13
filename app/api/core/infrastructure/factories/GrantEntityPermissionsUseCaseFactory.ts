import {
  GrantEntityPermissions,
  GrantEntityPermissionsDeps,
} from '#api/core/application/GrantEntityPermissions.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityAccessPolicyDataSourceFactory } from './EntityAccessPolicyDataSourceFactory.js';

class GrantEntityPermissionsUseCaseFactory {
  static default(overrides?: Partial<GrantEntityPermissionsDeps>) {
    const { tenant, actor, transactionManager } = ExecutionContext;

    return new GrantEntityPermissions(
      {
        entityAccessPolicyDS: EntityAccessPolicyDataSourceFactory.default(),
        transactionManager,
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { GrantEntityPermissionsUseCaseFactory };
