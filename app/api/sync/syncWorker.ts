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

class InvalidSyncConfig extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSyncConfig';
  }
}

const cookies: { [k: string]: string } = {};

export default {
  stopped: false,
  async syncronize(syncSettings: SettingsSyncSchema | SettingsSyncSchema[]) {
    const configs = Array.isArray(syncSettings) ? syncSettings : [syncSettings];
    // eslint-disable-next-line no-restricted-syntax
    for await (const config of configs) {
      if (!config.name) throw new InvalidSyncConfig('Name is not defined on sync config');

      try {
        const syncs = await syncsModel.find({ name: config.name });
        if (syncs.length === 0) {
          await syncsModel.create({ lastSync: 0, name: config.name });
        }

        const syncConfig = await createSyncConfig(config, config.name);
        const { lastSync } = syncConfig;

        const lastChanges = await syncConfig.lastChanges();

        // eslint-disable-next-line no-restricted-syntax
        for await (const change of lastChanges) {
          if (change.deleted) {
            await synchronizer.syncData(
              {
                url: config.url,
                change,
                data: { _id: change.mongoId },
                cookie: cookies[config.name],
              },
              'delete'
            );
            await updateSyncs(config.name, change.timestamp as number);
          } else {
            const { skip, data } = await syncConfig.shouldSync(change);

            if (skip) {
              await synchronizer.syncData(
                {
                  url: config.url,
                  change,
                  data: { _id: change.mongoId },
                  cookie: cookies[config.name],
                },
                'delete'
              );
            }

            if (data) {
              await synchronizer.syncData(
                { url: config.url, change, data, cookie: cookies[config.name] },
                'post',
                lastSync
              );
            }
            await updateSyncs(config.name, change.timestamp);
          }
        }
      } catch (error) {
        if (error.status === 401) {
          return this.login(config);
        }
        throw error;
      }
    }
  },

  async login({ url, username, password, name }: SettingsSyncSchema) {
    try {
      const response = await request.post(urljoin(url, 'api/login'), { username, password });
      cookies[name] = response.cookie;
    } catch (e) {
      errorLog.error(prettifyError(e).prettyMessage);
    }
  },
};
