import { AbstractUseCase } from '../libs/UseCase.js';
import { EntityAccessPolicyDataSource } from './contracts/EntityAccessPolicyDataSource.js';
import { InsufficientPermissionsToPublishError } from './errors.js';
import { AccessGrantProps } from '../domain/entityAccessPolicy/AccessGrant.js';

type Input = {
  sharedIds: string[];
  grants: AccessGrantProps[];
  isPublic: boolean | undefined;
};

type Output = void;

type Deps = {
  entityAccessPolicyDS: EntityAccessPolicyDataSource;
};

class BulkGrantEntityPermissions extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { sharedIds, grants, isPublic } = input;

    const policies = await this.deps.entityAccessPolicyDS.getBySharedIds(sharedIds);

    for (const policy of policies) {
      if (
        isPublic !== undefined &&
        isPublic !== policy.isPublic &&
        !this.getActor().isPrivileged()
      ) {
        throw new InsufficientPermissionsToPublishError();
      }

      if (isPublic !== undefined) {
        policy.setPublic(isPublic);
      }

      policy.mergeGrants(grants);
    }

    await this.transactionManager.run(async () =>
      this.deps.entityAccessPolicyDS.bulkUpdate(policies)
    );
  }
}

export { BulkGrantEntityPermissions };
export type { Input as BulkGrantEntityPermissionsInput, Deps as BulkGrantEntityPermissionsDeps };
