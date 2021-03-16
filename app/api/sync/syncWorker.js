import 'api/entities';

import urljoin from 'url-join';

import { prettifyError } from 'api/utils/handleError';
import errorLog from 'api/log/errorLog';
import request from 'shared/JSONRequest';
import settings from 'api/settings';
import synchronizer from './synchronizer';
import syncConfig from './syncConfig';
import syncsModel from './syncsModel';

const timeout = async interval =>
  new Promise(resolve => {
    setTimeout(resolve, interval);
  });

const updateSyncs = async (name, lastSync) =>
  syncsModel._updateMany({ name }, { $set: { lastSync } });

export default {
  stopped: false,
  cookies: {},

  async syncronize({ url, name, config: _config, batchSize }) {
    const config = await syncConfig(_config, name);

    const { lastSync } = config;

    const lastChanges = await config.lastChanges(batchSize);

    await lastChanges.reduce(async (prev, change) => {
      await prev;

      if (change.deleted) {
        await synchronizer.syncData({ url, change, data: { _id: change.mongoId } }, 'delete');
        return updateSyncs(name, change.timestamp);
      }

      const { skip, data } = await config.shouldSync(change);

      if (skip) {
        await synchronizer.syncData({ url, change, data: { _id: change.mongoId } }, 'delete');
      }

      if (data) {
        await synchronizer.syncData({ url, change, data }, 'post', lastSync);
      }

      return updateSyncs(name, change.timestamp);
    }, Promise.resolve());
  },

  async intervalSync(config, interval = 5000) {
    if (this.stopped) {
      return;
    }
    try {
      await this.syncronize(config);
    } catch (e) {
      if (e.status === 401) {
        await this.login(config);
      } else {
        errorLog.error(prettifyError(e).prettyMessage);
      }
    }
    await timeout(interval);
    await this.intervalSync(config, interval);
  },

  async login({ url, username, password, name }) {
    try {
      const response = await request.post(urljoin(url, 'api/login'), { username, password });
      this.cookies[name] = response.cookie;
    } catch (e) {
      errorLog.error(prettifyError(e).prettyMessage);
    }
  },

  async start(interval) {
    const { sync } = await settings.get({}, { sync: 1 });
    if (sync) {
      const syncArray = Array.isArray(sync) ? sync : [sync];
      await syncArray.reduce(async (prev, targetConfig) => {
        await prev;
        if (targetConfig.active) {
          const syncs = await syncsModel.find({ name: targetConfig.name });
          if (syncs.length === 0) {
            await syncsModel.create({ lastSync: 0, name: targetConfig.name });
          }
          this.intervalSync(targetConfig, interval);
        }
        return Promise.resolve();
      }, Promise.resolve());
    }
  },

  stop() {
    this.stopped = true;
  },
};
