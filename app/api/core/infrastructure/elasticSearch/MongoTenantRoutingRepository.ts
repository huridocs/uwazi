import { ObjectId } from 'mongodb';
import { MongoDataSource } from '../mongodb/common/MongoDataSource';
import { TenantRouting, TenantRoutingRepository } from './TenantRoutingRepository';

type TenantRoutingDocument = { _id: ObjectId } & TenantRouting;

class MongoTenantRoutingRepository
  extends MongoDataSource<TenantRoutingDocument>
  implements TenantRoutingRepository
{
  protected collectionName = 'tenantRoutings';

  async findRoute(tenantId: string, logicalName: string): Promise<string | null> {
    const doc = await this.getCollection().findOne({ tenantId, logicalName });
    return doc?.resolvedAlias ?? null;
  }

  async upsertRoute(record: Omit<TenantRouting, 'assignedAt'>): Promise<void> {
    const { tenantId, logicalName, resolvedAlias, groupName } = record;
    await this.getCollection().updateOne(
      { tenantId, logicalName },
      { $set: { resolvedAlias, groupName }, $setOnInsert: { assignedAt: new Date() } },
      { upsert: true }
    );
  }

  async findTenantsByGroup(groupName: string, logicalName: string): Promise<string[]> {
    const docs = await this.getCollection().find({ groupName, logicalName }).toArray();
    return docs.map(doc => doc.tenantId);
  }

  async deleteRoute(tenantId: string, logicalName: string): Promise<void> {
    await this.getCollection().deleteOne({ tenantId, logicalName });
  }
}

export { MongoTenantRoutingRepository };
export type { TenantRoutingDocument };
