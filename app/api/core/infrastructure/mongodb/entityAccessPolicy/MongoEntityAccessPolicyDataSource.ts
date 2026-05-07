import { Db } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { EntityAccessPolicy } from '#api/core/domain/entityAccessPolicy/EntityAccessPolicy.js';
import { EntityAccessPolicyNotFoundError } from '#api/core/domain/entityAccessPolicy/errors.js';
import { EntityAccessPolicyDataSource } from '#api/core/application/contracts/EntityAccessPolicyDataSource.js';
import { EntityIndexerService } from '../../elasticSearch/entities/EntityIndexerService.js';
import { EntityAccessPolicyDBO } from './EntityAccessPolicyDBO.js';
import { EntityAccessPolicyMapper } from './EntityAccessPolicyMapper.js';
import { Result, ResultType } from '#api/core/libs/Result.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
  entityIndexerService: EntityIndexerService;
};

class MongoEntityAccessPolicyDataSource
  extends MongoDataSource<EntityAccessPolicyDBO>
  implements EntityAccessPolicyDataSource
{
  protected collectionName = 'entities';

  private readonly entityIndexerService: EntityIndexerService;

  private readonly mutatedSharedIds = new Set<string>();

  constructor({ db, transactionManager, entityIndexerService }: Deps) {
    super(db, transactionManager);
    this.entityIndexerService = entityIndexerService;

    transactionManager.onCommitted(async () => {
      if (this.mutatedSharedIds.size === 0) return;
      const sharedIds = Array.from(this.mutatedSharedIds);
      this.mutatedSharedIds.clear();
      await this.entityIndexerService.sync(sharedIds);
    });
  }

  async create(policy: EntityAccessPolicy): Promise<void> {
    await this.persist(policy);
  }

  async update(policy: EntityAccessPolicy): Promise<void> {
    await this.persist(policy);
  }

  async bulkUpdate(policies: EntityAccessPolicy[]): Promise<void> {
    for (const policy of policies) {
      // eslint-disable-next-line no-await-in-loop
      await this.persist(policy);
    }
  }

  async getBySharedId(
    sharedId: string
  ): Promise<ResultType<EntityAccessPolicy, EntityAccessPolicyNotFoundError>> {
    const doc = await this.getCollection<EntityAccessPolicyDBO>().findOne(
      { sharedId },
      { projection: { sharedId: 1, permissions: 1, published: 1, _id: 0 } }
    );

    if (!doc) {
      return Result.fail(new EntityAccessPolicyNotFoundError(sharedId));
    }

    return Result.ok(EntityAccessPolicyMapper.toDomain(doc));
  }

  async getBySharedIds(sharedIds: string[]): Promise<EntityAccessPolicy[]> {
    if (sharedIds.length === 0) return [];

    const docs = await this.getCollection<EntityAccessPolicyDBO>()
      .find(
        { sharedId: { $in: sharedIds } },
        { projection: { sharedId: 1, permissions: 1, published: 1, _id: 0 } }
      )
      .toArray();

    // One document per language exists in the collection — deduplicate by sharedId.
    const seen = new Set<string>();
    const unique = docs.filter(d => {
      if (seen.has(d.sharedId)) return false;
      seen.add(d.sharedId);
      return true;
    });

    return unique.map(EntityAccessPolicyMapper.toDomain);
  }

  private async persist(policy: EntityAccessPolicy): Promise<void> {
    const { permissions, published } = EntityAccessPolicyMapper.toDBO(policy);
    await this.getCollection<EntityAccessPolicyDBO>().updateMany(
      { sharedId: policy.sharedId },
      { $set: { permissions, published } }
    );
    this.mutatedSharedIds.add(policy.sharedId);
  }
}

export { MongoEntityAccessPolicyDataSource };
export type { Deps as MongoEntityAccessPolicyDataSourceDeps };
