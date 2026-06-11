import { Db } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { EntityAccessPolicy } from '#api/core/domain/entityAccessPolicy/EntityAccessPolicy.js';
import { EntityAccessPolicyNotFoundError } from '#api/core/domain/entityAccessPolicy/errors.js';
import { EntityAccessPolicyDataSource } from '#api/core/application/contracts/EntityAccessPolicyDataSource.js';
import { EntityAccessPolicyDBO } from './EntityAccessPolicyDBO.js';
import { EntityAccessPolicyMapper } from './EntityAccessPolicyMapper.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { search } from '#api/search/search.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
  searchV1: typeof search;
};

class MongoEntityAccessPolicyDataSource
  extends MongoDataSource<EntityAccessPolicyDBO>
  implements EntityAccessPolicyDataSource
{
  protected collectionName = 'entities';

  private readonly searchV1: typeof search;

  private readonly updatedSharedIds = new Set<string>();

  constructor({ db, transactionManager, searchV1 }: Deps) {
    super(db, transactionManager);
    this.searchV1 = searchV1;

    transactionManager.onCommitted(async () => {
      if (this.updatedSharedIds.size === 0) return;
      const sharedIds = Array.from(this.updatedSharedIds);
      this.updatedSharedIds.clear();
      await this.searchV1.indexEntities({ sharedId: { $in: sharedIds } });
    });
  }

  async create(policy: EntityAccessPolicy): Promise<void> {
    await this.persist(policy, false);
  }

  async bulkCreate(policies: EntityAccessPolicy[]): Promise<void> {
    await this.bulkPersist(policies, false);
  }

  async update(policy: EntityAccessPolicy): Promise<void> {
    await this.persist(policy);
  }

  async bulkUpdate(policies: EntityAccessPolicy[]): Promise<void> {
    await this.bulkPersist(policies);
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

  private async persist(policy: EntityAccessPolicy, shouldIndex = true): Promise<void> {
    const { permissions, published } = EntityAccessPolicyMapper.toDBO(policy);

    await this.getCollection<EntityAccessPolicyDBO>().updateMany(
      { sharedId: policy.sharedId },
      { $set: { permissions, published } }
    );

    if (shouldIndex) {
      this.updatedSharedIds.add(policy.sharedId);
    }
  }

  private async bulkPersist(policies: EntityAccessPolicy[], shouldIndex = true): Promise<void> {
    if (policies.length === 0) return;

    const ops = policies.map(policy => {
      const { permissions, published } = EntityAccessPolicyMapper.toDBO(policy);
      return {
        updateMany: {
          filter: { sharedId: policy.sharedId },
          update: { $set: { permissions, published } },
        },
      };
    });

    await this.getCollection<EntityAccessPolicyDBO>().bulkWrite(ops);

    if (shouldIndex) {
      policies.forEach(policy => this.updatedSharedIds.add(policy.sharedId));
    }
  }
}

export { MongoEntityAccessPolicyDataSource };
export type { Deps as MongoEntityAccessPolicyDataSourceDeps };
