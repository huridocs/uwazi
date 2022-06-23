import urljoin from 'url-join';

import request from 'shared/JSONRequest';
import { fs, customUploadsPath, uploadsPath } from 'api/files';
import { DataType } from 'api/odm';
import { UpdateLog } from 'api/updatelogs';

const uploadFile = async (url: string, filename: string, type = 'document', cookie: string) => {
  let pathFunction = uploadsPath;
  let apiEndpoint = 'api/sync/upload';

  if (type === 'custom') {
    pathFunction = customUploadsPath;
    apiEndpoint = 'api/sync/upload/custom';
  }

  const filepath = pathFunction(filename);
  const file = await fs.readFile(filepath);
  return request.uploadFile(urljoin(url, apiEndpoint), filename, file, cookie);
};

export const synchronizer = {
  async syncDelete(change: DataType<UpdateLog>, url: string, cookie: string) {
    await this.syncData(
      {
        url,
        change,
        data: { _id: change.mongoId },
        cookie,
      },
      'delete'
    );
  },

  async syncData(
    {
      url,
      change,
      data,
      cookie,
    }: { url: string; change: DataType<UpdateLog>; data: DataType<any>; cookie: string },
    action: keyof typeof request
  ) {
    await request[action](
      urljoin(url, 'api/sync'),
      { namespace: change.namespace, data },
      { cookie }
    );

    if (change.namespace === 'files' && data.filename) {
      await uploadFile(url, data.filename, data.type, cookie);
    }
  },
};
