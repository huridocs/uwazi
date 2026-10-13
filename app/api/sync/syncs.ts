import { postgresSyncs } from '#api/core/infrastructure/postgresql/sync/PostgresSyncs.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import syncsModel from './syncsModel.js';

const postgresCoreEnabled = () =>
  Boolean(ExecutionContext.currentTenant.featureFlags?.postgresCore);

type SyncCursor = {
  lastSyncs: Record<string, number>;
  consecutiveFailures: number;
};

const cursorOf = (
  doc: {
    lastSyncs?: Record<string, number>;
    consecutiveFailures?: number;
  } | null
): SyncCursor | null => {
  if (!doc) return null;
  return {
    lastSyncs: doc.lastSyncs ?? {},
    consecutiveFailures: doc.consecutiveFailures ?? 0,
  };
};

const syncs = {
  async ensure(name: string): Promise<void> {
    if (postgresCoreEnabled()) return postgresSyncs.ensure(name);
    const existing = await syncsModel.find({ name });
    if (existing.length === 0) {
      await syncsModel.create([{ lastSyncs: {}, name, consecutiveFailures: 0 }]);
    }
  },

  async read(name: string): Promise<SyncCursor | null> {
    if (postgresCoreEnabled()) return postgresSyncs.read(name);
    const [doc] = await syncsModel.find({ name });
    return cursorOf(doc ?? null);
  },

  async setNamespaceTimestamp(name: string, namespace: string, timestamp: number): Promise<void> {
    if (postgresCoreEnabled())
      return postgresSyncs.setNamespaceTimestamp(name, namespace, timestamp);
    await syncsModel._updateMany({ name }, { $set: { [`lastSyncs.${namespace}`]: timestamp } }, {});
  },

  async resetConsecutiveFailures(name: string): Promise<void> {
    if (postgresCoreEnabled()) return postgresSyncs.resetConsecutiveFailures(name);
    await syncsModel._updateMany({ name }, { $set: { consecutiveFailures: 0 } }, {});
  },

  async recordFailure(name: string): Promise<number> {
    if (postgresCoreEnabled()) return postgresSyncs.recordFailure(name);
    const updated = await syncsModel.findOneAndUpdate(
      { name },
      {
        $inc: { consecutiveFailures: 1 },
        $setOnInsert: { lastSyncs: {}, name },
      },
      { upsert: true, new: true, lean: true }
    );
    return updated?.consecutiveFailures ?? 0;
  },
};

export { syncs };
export type { SyncCursor };
