import 'isomorphic-fetch';
import backend from 'fetch-mock';
import { attachmentsPath, setupTestUploadedPaths } from 'api/files';
import { testingEnvironment } from 'api/utils/testingEnvironment';
// eslint-disable-next-line node/no-restricted-import
import { tenants } from 'api/tenants';
// eslint-disable-next-line node/no-restricted-import
import { readFile, writeFile } from 'fs/promises';
import JSONRequest from 'shared/JSONRequest';
import { Readable } from 'stream';
import { convertToPDFService, MimeTypeNotSupportedForConversion } from '../convertToPdfService';

describe('ConvertToPDFService', () => {
  const serviceURL = 'http://service.uwazi.io/';
  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ label: 'English', key: 'en' }] }],
    });
    await setupTestUploadedPaths();
    await writeFile(attachmentsPath('filename.txt'), 'data');
  });

  afterEach(() => backend.restore());
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('upload', () => {
    it('should upload the file to the convert service', async () => {
      const expectedFile = await readFile(attachmentsPath('filename.txt'));
      jest.spyOn(JSONRequest, 'uploadFile').mockResolvedValue({});

      await convertToPDFService.upload(
        { filename: 'filename.txt', type: 'attachment' },
        serviceURL
      );

      expect(JSONRequest.uploadFile).toHaveBeenCalledWith(
        `${serviceURL}upload/${tenants.current().name}`,
        'filename.txt',
        expectedFile
      );
    });
  });

  describe('when mimetype is not supported', () => {
    it('should throw a MimeTypeNotSupportedForConversion error', async () => {
      jest.spyOn(JSONRequest, 'uploadFile').mockRejectedValue({
        response: { status: 422, body: { detail: { code: 'FileNotSupported' } } },
      });
      await expect(
        convertToPDFService.upload({ filename: 'filename.txt', type: 'attachment' }, serviceURL)
      ).rejects.toThrowError(MimeTypeNotSupportedForConversion);
    });
  });

  describe('on upload error', () => {
    it('should throw an error', async () => {
      jest.spyOn(JSONRequest, 'uploadFile').mockRejectedValue(new Error('error'));
      await expect(
        convertToPDFService.upload({ filename: 'filename.txt', type: 'attachment' }, serviceURL)
      ).rejects.toThrow();
    });
  });

  describe('download', () => {
    it('should download file and return readable', async () => {
      const file = new Readable();

      // @ts-ignore
      const fileResponse = new Response(file, {
        headers: { 'Content-Type': 'application/octet-stream' },
      });

      backend.get(url => url === 'http://service:5060/file', fileResponse);

      const downloadedFile = await convertToPDFService.download(
        new URL('http://service:5060/file')
      );
      expect(downloadedFile).toBe(file);
    });
  });
});
