import fs from 'fs';
import path from 'path';
import util from 'util';
import urljoin from 'url-join';

import request from 'shared/JSONRequest';
import paths from 'api/config/paths';

import syncsModel from './syncsModel';

const oneSecond = 1000;
const readFile = util.promisify(fs.readFile);

const uploadFile = async (url, filename) => {
  const filepath = path.join(paths.uploadedDocuments, filename);
  const file = await readFile(filepath);
  return request.uploadFile(urljoin(url, 'api/sync/upload'), filename, file);
};

const syncFiles = async (url, data, lastSync) => {
  if (data.file && data.file.timestamp >= lastSync - oneSecond) {
    await uploadFile(url, data.file.filename);

    const thumbnailFilename = `${data._id.toString()}.jpg`;
    await uploadFile(url, thumbnailFilename);
  }

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
  async syncData(url, action, change, data, lastSync) {
    await request[action](urljoin(url, 'api/sync'), { namespace: change.namespace, data });
    await syncFiles(url, data, lastSync);
    return syncsModel.updateMany({}, { $set: { lastSync: change.timestamp } });
  },
};

export default syncronizer;
