import { models } from 'api/odm';
import { model as updateLog } from 'api/updateLog';
import syncModel from './syncModel';
import request from 'shared/JSONRequest';

const oneSecond = 1000;

export default {
  async syncronize() {
    const [{ lastSync }] = await syncModel.find();
    const lastChanges = await updateLog.find({ timestamp: { $gt: lastSync - oneSecond } }, null, { sort: { timestamp: 1 } });

    for (const change of lastChanges) {
      const data = await models[change.namespace].getById(change.mongoId);
      await request.post('url', { namespace: change.namespace, data });
    }
  }
};
