/* eslint-disable camelcase */
import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { SyncHandler } from './SyncHandler.js';

const toObjectId = (value: unknown): ObjectId | undefined => {
  if (value === undefined || value === null) return undefined;
  if (value instanceof ObjectId) return value;
  if (typeof value === 'string') return new ObjectId(value);
  return value as ObjectId;
};

const normalize = (doc: Partial<EntityDBO>): Record<string, unknown> => {
  const { _id, tenant_id, template, user, ...rest } = doc as EntityDBO & {
    tenant_id?: string;
  };
  return { ...rest, template: toObjectId(template), user: toObjectId(user) };
};

export class MongoEntitiesSyncHandler
  extends MongoDataSource<EntityDBO>
  implements SyncHandler<EntityDBO>
{
  protected collectionName = 'entities';

  constructor() {
    super(getConnection(), TransactionManagerFactory.default(), { useSyncedCollection: false });
  }

  async getById(id: string): Promise<EntityDBO | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async save(document: Partial<EntityDBO>): Promise<EntityDBO> {
    const { _id: rawId } = document as EntityDBO;
    if (!rawId) {
      throw new Error('MongoEntitiesSyncHandler: document._id is required');
    }
    const id = rawId instanceof ObjectId ? rawId : new ObjectId(rawId as unknown as string);
    const written = { _id: id, ...normalize(document) } as EntityDBO;
    await this.getCollection().replaceOne({ _id: id }, written, {
      upsert: true,
      ignoreUndefined: true,
    });
    // The sync route discards the return, so we mirror the written payload
    // in input order instead of paying a re-fetch round-trip.
    return written;
  }

  async saveMultiple(documents: Partial<EntityDBO>[]): Promise<EntityDBO[]> {
    if (documents.length === 0) {
      return [];
    }

    const ids = documents.map(doc => {
      const rawId = (doc as EntityDBO)._id;
      if (!rawId) {
        throw new Error('MongoEntitiesSyncHandler: document._id is required');
      }
      return rawId instanceof ObjectId ? rawId : new ObjectId(rawId as unknown as string);
    });

    const written = documents.map((doc, i) => ({
      _id: ids[i],
      ...normalize(doc),
    })) as EntityDBO[];

    await this.getCollection().bulkWrite(
      written.map(row => ({
        replaceOne: {
          filter: { _id: row._id },
          replacement: row,
          upsert: true,
        },
      })),
      { ignoreUndefined: true }
    );

    return written;
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().deleteOne({ _id: new ObjectId(id) });
  }
}
