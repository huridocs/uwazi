import 'isomorphic-fetch';
import { attachmentsPath, setupTestUploadedPaths } from 'api/files';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import backend from 'fetch-mock';
// eslint-disable-next-line node/no-restricted-import
import { readFile, writeFile } from 'fs/promises';
import { tenants } from 'api/tenants';
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

  describe('upload', () => {
    it('should upload the file to the convert service', async () => {
      const expectedFile = await readFile(attachmentsPath('filename.txt'));

      backend.post(
        (url, request) =>
          url === `${serviceURL}upload/${tenants.current().name}` &&
          //@ts-ignore
          expectedFile.toString() === request?.body?.get('file'),
        { body: JSON.stringify({ success: true }) }
      );

      await convertToPDFService.upload(
        {
          filename: 'filename.txt',
          type: 'attachment',
        },
        serviceURL
      );
      expect(backend.calls().length).toBe(1);
    });
  });

  describe('when mimetype is not supported', () => {
    it('should throw an error', async () => {
      const expectedFile = await readFile(attachmentsPath('filename.txt'));
      backend.post(
        (url, request) =>
          url === `${serviceURL}upload/${tenants.current().name}` &&
          //@ts-ignore
          expectedFile.toString() === request?.body?.get('file'),
        422
      );

      await expect(
        convertToPDFService.upload(
          {
            filename: 'filename.txt',
            type: 'attachment',
          },
          serviceURL
        )
      ).rejects.toThrowError(MimeTypeNotSupportedForConversion);
    });
  });
});
