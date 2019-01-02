import 'api/entities';

import { models } from 'api/odm';
import { model as updateLog } from 'api/updatelogs';
import request from 'shared/JSONRequest';
import settings from 'api/settings';

import syncsModel from './syncsModel';
import urljoin from 'url-join';
import { FetchError } from 'node-fetch';

const oneSecond = 1000;

const timeout = async interval => new Promise((resolve) => {
  setTimeout(resolve, interval);
});

const syncData = async (url, action, change, data) => {
  await request[action](urljoin(url, 'api/sync'), { namespace: change.namespace, data });
  return syncsModel.updateMany({}, { $set: { lastSync: change.timestamp } });
};

export default {
  stopped: false,

  async syncronize(url) {
    const [{ lastSync }] = await syncsModel.find();
    const lastChanges = await updateLog.find({
      timestamp: {
        $gte: lastSync - oneSecond
      },
      // namespace: {
      //   $nin: ['migrations']
      // }
    }, null, {
      sort: {
        timestamp: 1
      },
      lean: true
    });

    // there is always one ??
    console.log(lastChanges[0]);

    await lastChanges.reduce(async (prev, change) => {
      await prev;
      if (change.deleted) {
        return syncData(url, 'delete', change, { _id: change.mongoId });
      }

      const data = await models[change.namespace].getById(change.mongoId);
      return syncData(url, 'post', change, data);
    }, Promise.resolve());
  },

  async intervalSync(url, interval = 5000) {
    if (this.stopped) {
      return;
    }
    try {
      await this.syncronize(url);
    } catch (e) {
      console.error(e);
      // if (e instanceof Error) {
      //   throw e;
      // }
    }
    await timeout(interval);
    await this.intervalSync(url, interval);
  },

  async start(interval) {
    const { sync } = await settings.get();
    if (sync.active) {
      this.intervalSync(sync.url, interval);
    }
  },

  stop() {
    this.stopped = true;
  }
};
