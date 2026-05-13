import { AbstractUseCase } from '../libs/UseCase.js';
import { EntityAccessPolicyDataSource } from './contracts/EntityAccessPolicyDataSource.js';
import { InsufficientPermissionsToPublishError } from './errors.js';
import { AccessGrantProps } from '../domain/entityAccessPolicy/AccessGrant.js';

type Input = {
  sharedId: string;
  grants: AccessGrantProps[];
  isPublic: boolean;
};

type Output = void;

type Deps = {
  entityAccessPolicyDS: EntityAccessPolicyDataSource;
};

class GrantEntityPermissions extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { sharedId, grants, isPublic } = input;

    const policy = (await this.deps.entityAccessPolicyDS.getBySharedId(sharedId)).getDataOrThrow();

    if (isPublic !== policy.isPublic && !this.getActor().isPrivileged()) {
      throw new InsufficientPermissionsToPublishError();
    }

    policy.setPublic(isPublic);
    policy.applyGrants(grants);

    await this.transactionManager.run(async () => this.deps.entityAccessPolicyDS.update(policy));
  }
}

export { GrantEntityPermissions };
export type { Input as GrantEntityPermissionsInput, Deps as GrantEntityPermissionsDeps };
