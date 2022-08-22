import urljoin from 'url-join';

import request from 'shared/JSONRequest';
import { storage } from 'api/files';
import { DataType } from 'api/odm';
import { UpdateLog } from 'api/updatelogs';
import { FileType } from 'shared/types/fileType';

const uploadFile = async (
  url: string,
  filename: string,
  cookie: string,
  type: FileType['type'] = 'document'
) => {
  let apiEndpoint = 'api/sync/upload';
  if (type === 'custom') {
    apiEndpoint = 'api/sync/upload/custom';
  }

  const file = await storage.fileContents(filename, type);
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
      await uploadFile(url, data.filename, cookie, data.type);
    }
  },
};
