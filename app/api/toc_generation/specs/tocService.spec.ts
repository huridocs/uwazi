import { files, storage } from 'api/files';
import { errorLog } from 'api/log';
import { tenants } from 'api/tenants';
import { testingDB } from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import { Logger } from 'winston';
import { tocService } from '../tocService';
import { fixtures } from './fixtures';

describe('tocService', () => {
  let requestMock: jest.SpyInstance;

  beforeAll(async () => {
    jest.spyOn(errorLog, 'error').mockImplementation(() => ({}) as Logger);
    requestMock = jest.spyOn(request, 'uploadFile');
    await testingDB.connect({ defaultTenant: false });
    tenants.add({ name: 'tenant1', dbName: 'tenant1', indexName: 'tenant1' });
    tenants.add({ name: 'tenant2', dbName: 'tenant2', indexName: 'tenant2' });
  });

  beforeEach(async () => {
    await testingDB.setupFixturesAndContext(
      { ...fixtures, settings: [{ features: { tocGeneration: { url: 'url' } } }] },
      undefined,
      'tenant1'
    );
    jest.spyOn(storage, 'fileContents').mockReturnValue(Promise.resolve(Buffer.from('content')));
    await testingDB.setupFixturesAndContext(fixtures, undefined, 'tenant2');
    testingDB.UserInContextMockFactory.restore();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('running on all tenants', () => {
    beforeAll(() => {
      requestMock.mockImplementation(async (_url, filename) => {
        if (filename === 'pdf1.pdf') {
          return Promise.resolve({ text: JSON.stringify([{ label: 'section1 pdf1' }]) });
        }
        if (filename === 'pdf3.pdf') {
          return Promise.resolve({ text: JSON.stringify([{ label: 'section1 pdf3' }]) });
        }
        if (filename === 'pdf5.pdf') {
          return Promise.resolve({ text: JSON.stringify([{ label: 'section1 pdf5' }]) });
        }
        throw new Error(`this file is not supposed to be sent for toc generation ${filename}`);
      });
    });

    it('should use the service url configured', async () => {
      await tocService.processAllTenants();
      await tenants.run(async () => {
        expect(requestMock).toHaveBeenCalledWith('url', 'pdf1.pdf', Buffer.from('content'));
      }, 'tenant1');
    });

    it('should not fail when there is no more to process', async () => {
      await tocService.processAllTenants();
      await tocService.processAllTenants();
      await tocService.processAllTenants();
      await expect(tocService.processAllTenants()).resolves.not.toThrow();
    });

    it('should send the next pdfFile and save toc generated', async () => {
      await tocService.processAllTenants();
      await tocService.processAllTenants();
      await tocService.processAllTenants();

      await tenants.run(async () => {
        let [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).toEqual([{ label: 'section1 pdf1' }]);
        expect(fileProcessed.generatedToc).toEqual(true);

        [fileProcessed] = await files.get({ filename: 'pdf3.pdf' });
        expect(fileProcessed.toc).toEqual([{ label: 'section1 pdf3' }]);
        expect(fileProcessed.generatedToc).toEqual(true);
      }, 'tenant1');

      await tenants.run(async () => {
        let [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).not.toBeDefined();
        expect(fileProcessed.generatedToc).not.toBeDefined();

        [fileProcessed] = await files.get({ filename: 'pdf3.pdf' });
        expect(fileProcessed.toc).toEqual([]);
        expect(fileProcessed.generatedToc).not.toBeDefined();
      }, 'tenant2');
    });
  });

  describe('error handling', () => {
    it('should save a fake TOC when generated one is empty', async () => {
      requestMock.mockImplementation(async () => Promise.resolve({ text: JSON.stringify([]) }));
      await tocService.processAllTenants();
      await tenants.run(async () => {
        const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).toEqual([
          {
            selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
            label: 'ERROR: Toc was generated empty',
            indentation: 0,
          },
        ]);
        expect(fileProcessed.generatedToc).toEqual(true);
      }, 'tenant1');
    });

    it('should save a fake toc when there is an error', async () => {
      requestMock.mockImplementation(async () => {
        throw new Error('request error');
      });
      await tocService.processAllTenants();

      await tenants.run(async () => {
        const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).toEqual([
          {
            selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
            label: 'ERROR: Toc generation throwed an error',
            indentation: 0,
          },
          {
            selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
            label: 'request error',
            indentation: 0,
          },
        ]);
        expect(fileProcessed.generatedToc).toEqual(true);
      }, 'tenant1');
    });

    it('should not save anything when the error is ECONNREFUSED', async () => {
      requestMock.mockImplementation(async () => {
        // eslint-disable-next-line no-throw-literal
        throw { code: 'ECONNREFUSED' };
      });
      await tocService.processAllTenants();

      await tenants.run(async () => {
        const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).not.toBeDefined();
        expect(fileProcessed.generatedToc).not.toBeDefined();
      }, 'tenant1');
    });
  });
});
