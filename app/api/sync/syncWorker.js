import { model as updateLog } from 'api/updatelogs';
import { models } from 'api/odm';
import request from 'shared/JSONRequest';
import 'api/entities';
import syncsModel from './syncsModel';

const oneSecond = 1000;

export default {
  async syncronize() {
    const [{ lastSync }] = await syncsModel.find();
    const lastChanges = await updateLog.find({ timestamp: { $gte: lastSync - oneSecond } }, null, { sort: { timestamp: 1 } });

    for (const change of lastChanges) {
      const data = await models[change.namespace].getById(change.mongoId);
      await request.post('url', { namespace: change.namespace, data });
    }

    return 'synced';
  }
};
