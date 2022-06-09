import 'api/entities';

import urljoin from 'url-join';

import { prettifyError } from 'api/utils/handleError';
import { errorLog } from 'api/log';
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

const getConfigs = (syncSettings: SettingsSyncSchema | SettingsSyncSchema[]) =>
  Array.isArray(syncSettings) ? syncSettings : [syncSettings];

class InvalidSyncConfig extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSyncConfig';
  }
}

export const syncWorker = {
  cookies: {} as { [k: string]: string },

  async catchSyncErrors(error: any, config: SettingsSyncSchema) {
    if (error.status === 401) {
      await this.login(config);
    } else {
      throw error;
    }
  },

  async syncronize(syncSettings: SettingsSyncSchema | SettingsSyncSchema[]) {
    // eslint-disable-next-line no-restricted-syntax
    for await (const config of getConfigs(syncSettings)) {
      try {
        await this.syncronizeConfig(config);
      } catch (error) {
        await this.catchSyncErrors(error, config);
      }
    }
  },

  async syncronizeConfig(config: SettingsSyncSchema) {
    if (!config.name) throw new InvalidSyncConfig('Name is not defined on sync config');
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
          { url: config.url, change, data: shouldSync.data, cookie: this.cookies[config.name] },
          'post',
          syncConfig.lastSync
        );
      }
      await updateSyncs(config.name, change.timestamp);
    }
  },

  async login({ url, username, password, name }: SettingsSyncSchema) {
    if (!name) throw new InvalidSyncConfig('name is not defined on sync config');
    if (!url) throw new InvalidSyncConfig('url is not defined on sync config');

    try {
      const response = await request.post(urljoin(url, 'api/login'), { username, password });
      if (!response.cookie) throw new InvalidSyncConfig('no cookie returned after a login try');
      this.cookies[name] = response.cookie;
    } catch (e) {
      errorLog.error(prettifyError(e).prettyMessage);
    }
  },
};
