import { SettingsSyncSchema } from '#shared/types/settingsType.js';
import { model as updateLog } from '#api/updatelogs/index.js';
import syncsModel from './syncsModel.js';

const TEMPLATE_DEPENDENCIES = [
  'settings',
  'entities',
  'files',
  'connections',
  'dictionaries',
  'translationsV2',
  'relationtypes',
];

const COLLECTION_SYNC_ORDER = [
  'settings',
  'translationsV2',
  'dictionaries',
  'relationtypes',
  'templates',
  'files',
  'connections',
  'entities',
];

type SyncConfigForStatus = Pick<SettingsSyncSchema, 'name' | 'active' | 'config'>;

const getApprovedCollections = (config: SettingsSyncSchema['config']) => {
  let collections = Object.keys(config || {});
  if (collections.includes('templates')) {
    collections = collections.concat(TEMPLATE_DEPENDENCIES);
  }
  return COLLECTION_SYNC_ORDER.filter(name => collections.includes(name));
};

type SyncStatus = {
  name: string;
  pendingChanges: number;
  lastSyncs: Record<string, number>;
};

const getPendingForCollections = async (
  collections: string[],
  lastSyncs: Record<string, number>
) => {
  const counts = await Promise.all(
    collections.map(async collection => {
      const lastSync = lastSyncs[collection] || 0;
      return updateLog.countDocuments({
        namespace: collection,
        timestamp: { $gt: lastSync },
      });
    })
  );
  return counts.reduce((total, count) => total + count, 0);
};

const getSyncStatuses = async (syncConfigs: SyncConfigForStatus[] = []): Promise<SyncStatus[]> => {
  const statuses = await Promise.all(
    syncConfigs.map(async config => {
      const [syncState] = await syncsModel.find({ name: config.name });
      const lastSyncs = syncState?.lastSyncs || {};
      const collections = getApprovedCollections(config.config);
      const pendingChanges = config.active
        ? await getPendingForCollections(collections, lastSyncs)
        : 0;

      return {
        name: config.name,
        pendingChanges,
        lastSyncs,
      };
    })
  );

  return statuses;
};

export { getSyncStatuses };
export type { SyncStatus };
