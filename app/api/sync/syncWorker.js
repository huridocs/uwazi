import 'api/entities';

import { models } from 'api/odm';
import { model as updateLog } from 'api/updatelogs';
import settings from 'api/settings';
import request from 'shared/JSONRequest';

import syncsModel from './syncsModel';

const oneSecond = 1000;

const timeout = async interval => new Promise((resolve) => {
  setTimeout(resolve, interval);
});

export default {
  stoped: false,

  async syncronize(url) {
    const [{ lastSync }] = await syncsModel.find();
    const lastChanges = await updateLog.find({ timestamp: { $gte: lastSync - oneSecond } }, null, { sort: { timestamp: 1 }, lean: true });

    await lastChanges.reduce(async (prev, change) => {
      await prev;
      if (change.deleted) {
        await request.delete(url, { namespace: change.namespace, data: { _id: change.mongoId } });
      } else {
        const data = await models[change.namespace].getById(change.mongoId);
        await request.post(url, { namespace: change.namespace, data });
      }
    }, Promise.resolve());

    return 'synced';
  },

  async intervalSync(url, interval = 5000) {
    await this.syncronize(url);
    await timeout(interval);
    if (!this.stoped) {
      await this.intervalSync(url, interval);
    }
  },

  async start(interval) {
    const { sync } = await settings.get();
    this.intervalSync(sync.url, interval);
  },

  stop() {
    this.stoped = true;
  }
};
