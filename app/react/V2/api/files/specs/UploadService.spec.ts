/**
 * @jest-environment jsdom
 */
import superagent from 'superagent';
import { UploadService } from '../UploadService';

const file1 = new File(['File 1 contents'], 'file1.txt', {
  type: 'text/plain',
});
const file2 = new File(['File 2 contents'], 'file2.txt', {
  type: 'text/plain',
});

describe('Upload service', () => {
  const uploadService = new UploadService('attachment');

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  const mockSuperAgent = () => {
    const mockUpload = superagent.post('api/files');
    spyOn(mockUpload, 'field').and.returnValue(mockUpload);
    spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
    spyOn(superagent, 'post').and.returnValue(mockUpload);
    return mockUpload;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload files', async () => {
    const mock = mockSuperAgent();
    await uploadService.upload([file1, file2]);
    expect(mock.field).toHaveBeenNthCalledWith(1, 'originalname', 'file1.txt');
    expect(mock.attach).toHaveBeenNthCalledWith(1, 'file', file1);
    expect(mock.field).toHaveBeenNthCalledWith(2, 'originalname', 'file2.txt');
    expect(mock.attach).toHaveBeenNthCalledWith(2, 'file', file2);
    expect(uploadService.getFilesInQueue()).toMatchObject([]);
  });

  it('should add files to the queue when calling multiple times', async () => {
    const mock = mockSuperAgent();
    await Promise.all([uploadService.upload([file2]), uploadService.upload([file1])]);
    expect(mock.field).toHaveBeenNthCalledWith(1, 'originalname', 'file2.txt');
    expect(mock.attach).toHaveBeenNthCalledWith(1, 'file', file2);
    expect(mock.field).toHaveBeenNthCalledWith(2, 'originalname', 'file1.txt');
    expect(mock.attach).toHaveBeenNthCalledWith(2, 'file', file1);
    expect(uploadService.getFilesInQueue()).toMatchObject([]);
  });

  it('should get the files that are in the queue', async () => {
    // eslint-disable-next-line no-void
    void mockSuperAgent();
    const uploadPromise = uploadService.upload([file1, file2, file1]);
    const getQueue = () => uploadService.getFilesInQueue();
    const getIsUploading = () => uploadService.isUploading();
    expect(getQueue()).toEqual(expect.arrayContaining([file2, file1]));
    expect(getIsUploading()).toBe(true);
    await uploadPromise;
    expect(getQueue()).toEqual(expect.arrayContaining([]));
    expect(getIsUploading()).toBe(false);
  });

  it('should abort', async () => {
    const mock = mockSuperAgent();
    uploadService.abort();
    await uploadService.upload([file1]);
    expect(mock.field).not.toHaveBeenCalled();
  });

  it('should be able to start uploading again after aborting', async () => {
    const mock = mockSuperAgent();
    uploadService.abort();
    await uploadService.upload([file1]);
    expect(mock.field).not.toHaveBeenCalled();
    await uploadService.upload([file1]);
    expect(mock.field).toHaveBeenNthCalledWith(1, 'originalname', 'file1.txt');
    expect(mock.attach).toHaveBeenNthCalledWith(1, 'file', file1);
  });
});
