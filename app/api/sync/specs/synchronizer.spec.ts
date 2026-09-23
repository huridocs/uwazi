/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import request from '#shared/JSONRequest.js';
import { storage } from '#api/files/index.js';
import { UpdateLog } from '#api/updatelogs/index.js';
import { synchronizer } from '../synchronizer.js';

const destUrl = 'https://dest.example/';
const cookie = 'session=abc';

const filesChange = {
  namespace: 'files',
  mongoId: new ObjectId(),
  timestamp: 1,
  deleted: false,
} as UpdateLog;

describe('synchronizer.syncData', () => {
  let postSpy: jest.SpyInstance;
  let uploadSpy: jest.SpyInstance;
  let fileContentsSpy: jest.SpyInstance;

  beforeEach(() => {
    postSpy = jest.spyOn(request, 'post').mockResolvedValue({} as never);
    uploadSpy = jest.spyOn(request, 'uploadFile').mockResolvedValue({} as never);
    fileContentsSpy = jest
      .spyOn(storage, 'fileContents')
      .mockResolvedValue(Buffer.from('blob') as never);
  });

  afterEach(() => {
    postSpy.mockRestore();
    uploadSpy.mockRestore();
    fileContentsSpy.mockRestore();
  });

  it('should POST the files row and upload the blob when there is no url', async () => {
    const data = {
      _id: filesChange.mongoId,
      filename: '1750000000000abc.pdf',
      type: 'attachment',
    };

    await synchronizer.syncData({ url: destUrl, change: filesChange, data, cookie }, 'post');

    expect(postSpy).toHaveBeenCalledWith(
      'https://dest.example/api/sync',
      { namespace: 'files', data },
      { cookie }
    );
    expect(fileContentsSpy).toHaveBeenCalledWith('1750000000000abc.pdf', 'attachment');
    expect(uploadSpy).toHaveBeenCalled();
  });

  it('should POST the files row and not read storage when url is set', async () => {
    const data = {
      _id: filesChange.mongoId,
      filename: 'article title',
      originalname: 'article title',
      type: 'attachment',
      url: 'https://example.com/article',
    };

    await synchronizer.syncData({ url: destUrl, change: filesChange, data, cookie }, 'post');

    expect(postSpy).toHaveBeenCalledWith(
      'https://dest.example/api/sync',
      { namespace: 'files', data },
      { cookie }
    );
    expect(fileContentsSpy).not.toHaveBeenCalled();
    expect(uploadSpy).not.toHaveBeenCalled();
  });
});
