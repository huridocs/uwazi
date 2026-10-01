import type { Db } from 'mongodb';
import type {
  TenantPatch,
  TenantRecord,
  TenantsDataSource,
} from '../application/contracts/TenantsDataSource.js';
import { isGroup, mergeFlags, mergeGroup } from './applyTenantPatch.js';

type Update = { $set: Record<string, unknown>; $unset: Record<string, ''> };

type Group = Record<string, unknown>;

type Merge = { path: string; stored: unknown; patch: Group; nested: boolean };

/**
 * Merges a patch into the object stored at `path` through dotted paths, so the keys not sent are
 * left alone. Mongo cannot write a dotted path into a stored value that is not an object (a flag
 * group saved as `true`, a `null`), so such a value is replaced by the merged object instead.
 * `nested` merges one level deeper, as feature flag groups do.
 */
const mergeAt = ({ path, stored, patch, nested }: Merge, update: Update) => {
  if (stored !== undefined && !isGroup(stored)) {
    update.$set[path] = nested ? mergeFlags(undefined, patch) : mergeGroup(undefined, patch);
    return;
  }

  Object.entries(patch).forEach(([key, value]) => {
    const keyPath = `${path}.${key}`;

    if (value === null) {
      update.$unset[keyPath] = '';
    } else if (nested && isGroup(value)) {
      mergeAt({ path: keyPath, stored: stored?.[key], patch: value, nested: false }, update);
    } else if (value !== undefined) {
      update.$set[keyPath] = value;
    }
  });
};

const toUpdate = (patch: TenantPatch, stored: TenantRecord | undefined): Update => {
  const update: Update = { $set: {}, $unset: {} };

  Object.entries(patch).forEach(([field, value]) => {
    if (field === 'featureFlags' && isGroup(value)) {
      mergeAt({ path: field, stored: stored?.featureFlags, patch: value, nested: true }, update);
    } else if (field === 'metadata' && isGroup(value)) {
      mergeAt({ path: field, stored: stored?.metadata, patch: value, nested: false }, update);
    } else if (value === null) {
      update.$unset[field] = '';
    } else if (value !== undefined) {
      update.$set[field] = value;
    }
  });

  return update;
};

class MongoTenantsDataSource implements TenantsDataSource {
  /**
   * The database is resolved per call, not captured: a long lived data source would otherwise
   * keep querying a client that has since been closed and reopened.
   */
  constructor(private readonly db: () => Db) {}

  async all(): Promise<TenantRecord[]> {
    return this.collection()
      .find({}, { projection: { _id: 0 }, sort: { name: 1 } })
      .toArray();
  }

  async getByName(name: string): Promise<TenantRecord | undefined> {
    return (await this.collection().findOne({ name }, { projection: { _id: 0 } })) ?? undefined;
  }

  async upsert(name: string, patch: TenantPatch): Promise<TenantRecord> {
    const { $set, $unset } = toUpdate(patch, await this.getByName(name));
    const update = {
      ...(Object.keys($set).length ? { $set } : {}),
      ...(Object.keys($unset).length ? { $unset } : {}),
    };

    await this.collection().updateOne(
      { name },
      Object.keys(update).length ? update : { $setOnInsert: { name } },
      { upsert: true }
    );

    return (await this.getByName(name)) as TenantRecord;
  }

  async delete(name: string): Promise<boolean> {
    const { deletedCount } = await this.collection().deleteOne({ name });
    return deletedCount > 0;
  }

  private collection() {
    return this.db().collection<TenantRecord>('tenants');
  }
}

export { MongoTenantsDataSource };
