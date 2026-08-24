import { Db } from 'mongodb';
import { EntityAccessPolicyDataSource } from '#api/core/application/contracts/EntityAccessPolicyDataSource.js';
import { EntityAccessPolicy } from '#api/core/domain/entityAccessPolicy/EntityAccessPolicy.js';
import { EntityAccessPolicyNotFoundError } from '#api/core/domain/entityAccessPolicy/errors.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { search } from '#api/search/index.js';
import { EntityAccessPolicyMapper } from '#api/core/infrastructure/mongodb/entityAccessPolicy/EntityAccessPolicyMapper.js';
import { PermissionDBO } from '#api/core/infrastructure/mongodb/entityAccessPolicy/EntityAccessPolicyDBO.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresPermissionEnforcedTable } from '../common/PostgresPermissionEnforcedTable.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager.js';

type EntityAccessPolicyRow = {
  sharedId: string;
  published: boolean;
  permissions: { refId: string; type: string; level: string }[];
};

type Deps = PostgresDataSourceDeps & {
  transactionManager: MongoTransactionManager;
  mongoDb: Db;
};

class PostgresEntityAccessPolicyDataSource
  extends PostgresDataSource<EntityAccessPolicyRow>
  implements EntityAccessPolicyDataSource
{
  private transactionManager: MongoTransactionManager;

  private permissionTable: PostgresPermissionEnforcedTable<EntityAccessPolicyRow>;

  private updatedSharedIds = new Set<string>();

  constructor(deps: Deps) {
    super('entities', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'entities' },
    });

    this.transactionManager = deps.transactionManager;

    this.permissionTable = PostgresPermissionEnforcedTable.for<EntityAccessPolicyRow>({
      tableName: 'entities',
      tenantId: deps.tenantId,
      transactionManager: deps.pgTransactionManager,
      accessContext: AccessContext.system(),
    });

    this.transactionManager.onCommitted(async () => {
      if (this.updatedSharedIds.size === 0) return;
      const sharedIds = Array.from(this.updatedSharedIds);
      this.updatedSharedIds.clear();
      await search.indexEntities({ sharedId: { $in: sharedIds } });
    });
  }

  protected override get table(): PostgresTable<EntityAccessPolicyRow> {
    return this.permissionTable;
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
    const row = await this.permissionTable
      .select(['sharedId', 'permissions', 'published'])
      .where({ sharedId })
      .first();

    if (!row) {
      return Result.fail(new EntityAccessPolicyNotFoundError(sharedId));
    }

    return Result.ok(this.toDomain(row));
  }

  async getBySharedIds(sharedIds: string[]): Promise<EntityAccessPolicy[]> {
    if (sharedIds.length === 0) return [];

    const rows = await this.permissionTable
      .select(['sharedId', 'permissions', 'published'])
      .whereIn('sharedId', sharedIds)
      .all();

    // One row per language exists in the table — deduplicate by sharedId.
    const seen = new Set<string>();
    const unique = rows.filter(row => {
      if (seen.has(row.sharedId)) return false;
      seen.add(row.sharedId);
      return true;
    });

    return unique.map(row => this.toDomain(row));
  }

  private toDomain(row: EntityAccessPolicyRow): EntityAccessPolicy {
    return EntityAccessPolicyMapper.toDomain({
      sharedId: row.sharedId,
      published: row.published,
      permissions: row.permissions as PermissionDBO[],
    });
  }

  private async persist(policy: EntityAccessPolicy, shouldIndex = true): Promise<void> {
    const { permissions, published } = EntityAccessPolicyMapper.toDBO(policy);

    await this.permissionTable
      .where({ sharedId: policy.sharedId })
      .update({ permissions, published });

    if (shouldIndex) {
      this.updatedSharedIds.add(policy.sharedId);
    }
  }

  private async bulkPersist(policies: EntityAccessPolicy[], shouldIndex = true): Promise<void> {
    if (policies.length === 0) return;

    for (const policy of policies) {
      const { permissions, published } = EntityAccessPolicyMapper.toDBO(policy);
      // eslint-disable-next-line no-await-in-loop
      await this.permissionTable
        .where({ sharedId: policy.sharedId })
        .update({ permissions, published });
    }

    if (shouldIndex) {
      policies.forEach(policy => this.updatedSharedIds.add(policy.sharedId));
    }
  }
}

export { PostgresEntityAccessPolicyDataSource };
