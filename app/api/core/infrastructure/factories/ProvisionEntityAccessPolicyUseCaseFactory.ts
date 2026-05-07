import {
  ProvisionEntityAccessPolicy,
  ProvisionEntityAccessPolicyDeps,
} from '#api/core/application/ProvisionEntityAccessPolicy.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityAccessPolicyDataSourceFactory } from './EntityAccessPolicyDataSourceFactory.js';

class ProvisionEntityAccessPolicyUseCaseFactory {
  static default(overrides?: Partial<ProvisionEntityAccessPolicyDeps>) {
    const { tenant, actor, transactionManager } = ExecutionContext;

    return new ProvisionEntityAccessPolicy(
      {
        entityAccessPolicyDS: EntityAccessPolicyDataSourceFactory.default(),
        transactionManager,
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { ProvisionEntityAccessPolicyUseCaseFactory };
