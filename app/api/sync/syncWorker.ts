import 'api/entities';
import urljoin from 'url-join';
import request from 'shared/JSONRequest';
import { SettingsSyncSchema } from 'shared/types/settingsType';
import { tenants } from 'api/tenants';
import settings from 'api/settings';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { synchronizer } from './synchronizer';
import { createSyncConfig } from './syncConfig';
import syncsModel from './syncsModel';

const updateSyncs = async (name: string, lastSync: number) =>
  syncsModel._updateMany({ name }, { $set: { lastSync } }, {});

async function createSyncIfNotExists(config: SettingsSyncSchema) {
  const syncs = await syncsModel.find({ name: config.name });
  if (syncs.length === 0) {
    await syncsModel.create({ lastSync: 0, name: config.name });
  }
}

class InvalidSyncConfig extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSyncConfig';
  }
}

export interface SyncConfig {
  url: string;
  active?: boolean;
  username: string;
  password: string;
  name: string;
  config: {
    templates?: {
      [k: string]: {
        properties: string[];
        filter?: string;
      };
    };
    relationtypes?: string[];
  };
}

const validateConfig = (config: SettingsSyncSchema) => {
  if (!config.name) throw new InvalidSyncConfig('Name is not defined on sync config');
  if (!config.url) throw new InvalidSyncConfig('url is not defined on sync config');
  if (!config.config) throw new InvalidSyncConfig('config is not defined on sync config');
  return config as SyncConfig;
};

export const syncWorker = {
  UPDATE_LOG_FIRST_BATCH_LIMIT: 50,

  async runAllTenants() {
    return Object.keys(tenants.tenants).reduce(async (previous, tenantName) => {
      await previous;
      return tenants.run(async () => {
        permissionsContext.setCommandContext();
        const { sync } = await settings.get({}, 'sync');
        if (sync) {
          await this.syncronize(sync);
        }
      }, tenantName);
    }, Promise.resolve());
  },

  async syncronize(syncSettings: SettingsSyncSchema[]) {
    await syncSettings.reduce(async (previousSync, config) => {
      await previousSync;
      const syncConfig = validateConfig(config);
      if (syncConfig.active) {
        const cookie = await this.login(syncConfig);
        await this.syncronizeConfig(syncConfig, cookie);
      }
    }, Promise.resolve());
  },

  async syncronizeConfig(config: SyncConfig, cookie: string) {
    await createSyncIfNotExists(config);

    const syncConfig = await createSyncConfig(
      config,
      config.name,
      this.UPDATE_LOG_FIRST_BATCH_LIMIT
    );

    await (
      await syncConfig.lastChanges()
    ).reduce(async (previousChange, change) => {
      await previousChange;
      console.log('syncing change', change);
      const shouldSync: { skip?: boolean; data?: any } = await syncConfig.shouldSync(change);
      console.log('shouldSync', shouldSync);
      if (shouldSync.skip) {
        await synchronizer.syncDelete(change, config.url, cookie);
      }

      if (shouldSync.data) {
        await synchronizer.syncData(
          {
            url: config.url,
            change,
            data: shouldSync.data,
            cookie,
          },
          'post'
        );
      }
      await updateSyncs(config.name, change.timestamp);
    }, Promise.resolve());
  },

  async login({ url, username, password }: SyncConfig) {
    const response = await request.post(urljoin(url, 'api/login'), { username, password });

    return response.cookie || '';
  },
};
