import { ObjectId } from 'mongodb';
import { MongoDataSource } from '../mongodb/common/MongoDataSource.js';
import { TenantRouting, TenantRoutingDataSource } from './TenantRoutingDataSource.js';

type TenantRoutingDocument = { _id: ObjectId } & TenantRouting;

class MongoTenantRoutingDataSource
  extends MongoDataSource<TenantRoutingDocument>
  implements TenantRoutingDataSource
{
  protected collectionName = 'tenantRoutings';

  async findRoute(tenantId: string, aliasName: string): Promise<string | null> {
    const doc = await this.getCollection().findOne({ tenantId, aliasName });
    return doc?.resolvedAlias ?? null;
  }

  async upsertRoute(record: Omit<TenantRouting, 'assignedAt'>): Promise<void> {
    const { tenantId, aliasName, resolvedAlias, groupName } = record;
    await this.getCollection().updateOne(
      { tenantId, aliasName },
      { $set: { resolvedAlias, groupName }, $setOnInsert: { assignedAt: new Date() } },
      { upsert: true }
    );
  }

  async deleteRoute(tenantId: string, aliasName: string): Promise<void> {
    await this.getCollection().deleteOne({ tenantId, aliasName });
  }
}

export { MongoTenantRoutingDataSource };
export type { TenantRoutingDocument };
