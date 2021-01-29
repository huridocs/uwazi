import fs from 'fs';
import util from 'util';
import urljoin from 'url-join';

import request from 'shared/JSONRequest';
import { customUploadsPath, uploadsPath } from 'api/files';

const oneSecond = 1000;
const readFile = util.promisify(fs.readFile);

const uploadFile = async (url, filename, type = 'document') => {
  let pathFunction = uploadsPath;
  let apiEndpoint = 'api/sync/upload';

  if (type === 'custom') {
    pathFunction = customUploadsPath;
    apiEndpoint = 'api/sync/upload/custom';
  }

  const filepath = pathFunction(filename);
  const file = await readFile(filepath);
  return request.uploadFile(urljoin(url, apiEndpoint), filename, file);
};

const syncAttachments = async (url, data, lastSync) => {
  if (data.attachments && data.attachments.length) {
    await data.attachments.reduce(async (prev, attachment) => {
      await prev;
      if (attachment.timestamp >= lastSync - oneSecond) {
        await uploadFile(url, attachment.filename);
      }
      return Promise.resolve();
    }, Promise.resolve());
  }
};

const syncronizer = {
  async syncData({ url, change, data }, action, lastSync) {
    await request[action](urljoin(url, 'api/sync'), { namespace: change.namespace, data });
    await syncAttachments(url, data, lastSync);
    if (change.namespace === 'files' && data.filename) {
      await uploadFile(url, data.filename, data.type);
    }
  },
};

export default syncronizer;
