import 'api/entities';

import urljoin from 'url-join';

import { prettifyError } from 'api/utils/handleError';
import { errorLog } from 'api/log';
import request from 'shared/JSONRequest';
import synchronizer from './synchronizer';
import createSyncConfig from './syncConfig';
import syncsModel from './syncsModel';

const updateSyncs = async (name, lastSync) =>
  syncsModel._updateMany({ name }, { $set: { lastSync } });

export default {
  stopped: false,
  cookies: {},

  async syncronize({ url, name, config: _config, batchSize }) {
    try {
      const configs = Array.isArray(_config) ? _config : [_config];
      // eslint-disable-next-line no-restricted-syntax
      for await (const config of configs) {
        const syncs = await syncsModel.find({ name: config.name });
        if (syncs.length === 0) {
          await syncsModel.create({ lastSync: 0, name: config.name });
        }

        const syncConfig = await createSyncConfig(config, name);
        const { lastSync } = syncConfig;

        const lastChanges = await syncConfig.lastChanges(batchSize);

        await lastChanges.reduce(async (prev, change) => {
          await prev;

          if (change.deleted) {
            await synchronizer.syncData(
              { url, change, data: { _id: change.mongoId }, cookie: this.cookies[name] },
              'delete'
            );
            return updateSyncs(name, change.timestamp);
          }

          const { skip, data } = await syncConfig.shouldSync(change);

          if (skip) {
            await synchronizer.syncData(
              { url, change, data: { _id: change.mongoId }, cookie: this.cookies[name] },
              'delete'
            );
          }

          if (data) {
            await synchronizer.syncData(
              { url, change, data, cookie: this.cookies[name] },
              'post',
              lastSync
            );
          }

          return updateSyncs(name, change.timestamp);
        }, Promise.resolve());
      }
    } catch (e) {
      if (e.status === 401) {
        return this.login(_config);
      }
      throw e;
    }
  },

  async login({ url, username, password, name }) {
    try {
      const response = await request.post(urljoin(url, 'api/login'), { username, password });
      this.cookies[name] = response.cookie;
    } catch (e) {
      errorLog.error(prettifyError(e).prettyMessage);
    }
  },
};
