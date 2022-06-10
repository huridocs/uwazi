import 'api/entities';
import urljoin from 'url-join';
import request from 'shared/JSONRequest';
import { SettingsSyncSchema } from 'shared/types/settingsType';
import synchronizer from './synchronizer';
import createSyncConfig from './syncConfig';
import syncsModel from './syncsModel';

const updateSyncs = async (name: string, lastSync: number) =>
  syncsModel._updateMany({ name }, { $set: { lastSync } }, {});

async function createSyncIfNotExists(config: SettingsSyncSchema) {
  const syncs = await syncsModel.find({ name: config.name });
  if (syncs.length === 0) {
    await syncsModel.create({ lastSync: 0, name: config.name });
  }
}

const ensureArray = (syncSettings: SettingsSyncSchema | SettingsSyncSchema[]) =>
  Array.isArray(syncSettings) ? syncSettings : [syncSettings];

class InvalidSyncConfig extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSyncConfig';
  }
}

type SyncConfig = SettingsSyncSchema & { url: string; name: string };

const validateConfig = (config: SettingsSyncSchema) => {
  if (!config.name) throw new InvalidSyncConfig('Name is not defined on sync config');
  if (!config.url) throw new InvalidSyncConfig('url is not defined on sync config');
  return config as SyncConfig;
};

export const syncWorker = {
  cookies: {} as { [k: string]: string },

  async catchSyncErrors(error: any, config: SyncConfig) {
    if (error.status === 401) {
      await this.login(config);
    } else {
      throw error;
    }
  },

  async syncronize(syncSettings: SettingsSyncSchema | SettingsSyncSchema[]) {
    // eslint-disable-next-line no-restricted-syntax
    for await (const config of ensureArray(syncSettings)) {
      const syncConfig = validateConfig(config);
      try {
        await this.syncronizeConfig(syncConfig);
      } catch (error) {
        await this.catchSyncErrors(error, syncConfig);
      }
    }
  },

  async syncronizeConfig(config: SyncConfig) {
    await createSyncIfNotExists(config);

    const syncConfig = await createSyncConfig(config, config.name);

    // eslint-disable-next-line no-restricted-syntax
    for await (const change of await syncConfig.lastChanges()) {
      const shouldSync: { skip?: boolean; data?: any } = await syncConfig.shouldSync(change);
      if (shouldSync.skip) {
        await synchronizer.syncDelete(change, config.url, this.cookies[config.name]);
      }

      if (shouldSync.data) {
        await synchronizer.syncData(
          {
            url: config.url,
            change,
            data: shouldSync.data,
            cookie: this.cookies[config.name],
          },
          'post',
          syncConfig.lastSync
        );
      }
      await updateSyncs(config.name, change.timestamp);
    }
  },

  async login({ url, username, password, name }: SyncConfig) {
    const response = await request.post(urljoin(url, 'api/login'), { username, password });
    this.cookies[name] = response.cookie || '';
  },
};
