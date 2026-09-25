import type { Db } from 'mongodb';
import type { FeatureFlagsPatch } from '../featureFlags.js';
import type {
  TenantPatch,
  TenantRecord,
  TenantsDataSource,
} from '../application/contracts/TenantsDataSource.js';

type Update = { $set: Record<string, unknown>; $unset: Record<string, ''> };

const isGroup = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** `featureFlags` is merged flag by flag, through dotted paths, so siblings are left alone. */
const flattenFlags = (flags: FeatureFlagsPatch, update: Update) => {
  Object.entries(flags).forEach(([flag, value]) => {
    const path = `featureFlags.${flag}`;

    if (value === null) {
      update.$unset[path] = '';
    } else if (isGroup(value)) {
      Object.entries(value).forEach(([nested, nestedValue]) => {
        if (nestedValue === null) {
          update.$unset[`${path}.${nested}`] = '';
        } else if (nestedValue !== undefined) {
          update.$set[`${path}.${nested}`] = nestedValue;
        }
      });
    } else if (value !== undefined) {
      update.$set[path] = value;
    }
  });
};

const toUpdate = (patch: TenantPatch): Update => {
  const update: Update = { $set: {}, $unset: {} };

  Object.entries(patch).forEach(([field, value]) => {
    if (field === 'featureFlags' && isGroup(value)) {
      flattenFlags(value as FeatureFlagsPatch, update);
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
    const { $set, $unset } = toUpdate(patch);
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
