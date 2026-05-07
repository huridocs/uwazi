import { EntityAccessPolicy } from '#api/core/domain/entityAccessPolicy/EntityAccessPolicy.js';
import { EntityAccessPolicyNotFoundError } from '#api/core/domain/entityAccessPolicy/errors.js';
import { ResultType } from '#api/core/libs/Result.js';

interface EntityAccessPolicyDataSource {
  create(policy: EntityAccessPolicy): Promise<void>;
  update(policy: EntityAccessPolicy): Promise<void>;
  bulkUpdate(policies: EntityAccessPolicy[]): Promise<void>;
  getBySharedId(
    sharedId: string
  ): Promise<ResultType<EntityAccessPolicy, EntityAccessPolicyNotFoundError>>;
  getBySharedIds(sharedIds: string[]): Promise<EntityAccessPolicy[]>;
}

export type { EntityAccessPolicyDataSource };
