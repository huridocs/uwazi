import { EntityAccessPolicyDataSource } from './contracts/EntityAccessPolicyDataSource.js';
import { EntityAccessPolicy } from '../domain/entityAccessPolicy/EntityAccessPolicy.js';
import { AbstractUseCase } from '../libs/UseCase.js';

type Input = {
  sharedId: string;
  creatorId: string;
};

type Deps = {
  entityAccessPolicyDS: EntityAccessPolicyDataSource;
};

class ProvisionEntityAccessPolicy extends AbstractUseCase<Input, void, Deps> {
  async execute({ sharedId, creatorId }: Input): Promise<void> {
    const policy = EntityAccessPolicy.createForNewEntity(sharedId, creatorId);

    await this.transactionManager.run(async () => this.deps.entityAccessPolicyDS.create(policy));
  }
}

export { ProvisionEntityAccessPolicy };
export type { Deps as ProvisionEntityAccessPolicyDeps };
