import 'api/entities';

import urljoin from 'url-join';

import { models } from 'api/odm';
import { prettifyError } from 'api/utils/handleError';
import { model as updateLog } from 'api/updatelogs';
import errorLog from 'api/log/errorLog';
import request from 'shared/JSONRequest';
import settings from 'api/settings';

import syncsModel from './syncsModel';

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

  async syncronize({ url, config }) {
    const [{ lastSync }] = await syncsModel.find();
    const lastChanges = await updateLog.find({
      timestamp: {
        $gte: lastSync - oneSecond
      },
      namespace: {
        $nin: ['migrations']
      }
    }, null, {
      sort: {
        timestamp: 1
      },
      lean: true
    });

    // there is always one ??
    // console.log(lastChanges[0]);

    await lastChanges.reduce(async (prev, change) => {
      await prev;
      if (change.deleted) {
        return syncData(url, 'delete', change, { _id: change.mongoId });
      }

      const templatesConfig = config.templates || {};

      if (change.namespace === 'templates' && !templatesConfig[change.mongoId.toString()]) {
        return Promise.resolve();
      }

      const data = await models[change.namespace].getById(change.mongoId);

      if (change.namespace === 'entities' && !Object.keys(templatesConfig).includes(data.template.toString())) {
        return Promise.resolve();
      }


      if (change.namespace === 'templates' && data.properties) {
        data.properties = data.properties.filter(property => templatesConfig[data._id.toString()].includes(property._id.toString()));
      }

      if (change.namespace === 'entities' && data.metadata) {
        const templateData = await models.templates.getById(data.template);

        const validPropertyNames = templateData.properties.reduce((memo, property) => {
          if (templatesConfig[templateData._id.toString()].includes(property._id.toString())) {
            memo.push(property.name);
          }
          return memo;
        }, []);

        data.metadata = Object.keys(data.metadata).reduce((_memo, propertyName) => {
          const memo = _memo;
          if (validPropertyNames.includes(propertyName)) {
            memo[propertyName] = data.metadata[propertyName];
          }
          return memo;
        }, {});
      }

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
      if (e.status === 401) {
        await this.login(url, 'admin', 'admin');
      } else {
        errorLog.error(prettifyError(e).prettyMessage);
      }
    }
    await timeout(interval);
    await this.intervalSync(url, interval);
  },

  async login(url, username, password) {
    try {
      const response = await request.post(urljoin(url, 'api/login'), { username, password });
      request.cookie(response.cookie);
    } catch (e) {
      errorLog.error(prettifyError(e).prettyMessage);
    }
  },

  async start(interval) {
    const { sync } = await settings.get();
    if (sync && sync.active) {
      this.intervalSync(sync.url, interval);
    }
  },

  stop() {
    this.stopped = true;
  }
};
