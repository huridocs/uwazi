import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { postgresPreserveSync } from '#api/core/infrastructure/postgresql/preserve/PostgresPreserveSync.js';
import { preserveSyncModel } from './preserveSyncModel.js';

type PreserveCursor = {
  lastImport: string;
};

const preserveSyncs = {
  async read(token: string): Promise<PreserveCursor | null> {
    if (isPostgresCoreActive()) return postgresPreserveSync.read(token);
    const doc = await preserveSyncModel.db.findOne({ token }, {});
    if (typeof doc?.lastImport !== 'string' || doc.lastImport.length === 0) return null;
    return { lastImport: doc.lastImport };
  },

  async save(token: string, lastImport: string): Promise<void> {
    if (isPostgresCoreActive()) return postgresPreserveSync.save(token, lastImport);
    const existing = await preserveSyncModel.db.findOne({ token }, {});
    await preserveSyncModel.save({
      ...(existing ? { _id: existing._id } : {}),
      lastImport,
      token,
    });
  },
};

export { preserveSyncs };
export type { PreserveCursor };
