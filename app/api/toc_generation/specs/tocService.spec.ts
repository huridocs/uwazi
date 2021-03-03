import { testingDB } from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import { files } from 'api/files';
import { elasticTesting } from 'api/utils/elastic_testing';
import errorLog from 'api/log/errorLog';
import { fixtures } from './fixtures';
import { tocService } from '../tocService';

describe('tocService', () => {
  const service = tocService('url');

  afterAll(async () => {
    await testingDB.disconnect();
  });

  let requestMock: jest.SpyInstance;

  describe('processNext', () => {
    beforeEach(async () => {
      spyOn(errorLog, 'error');
      requestMock = jest.spyOn(request, 'uploadFile');
      requestMock.mockImplementation(async (url, filename) => {
        expect(url).toBe('url');
        if (filename === 'pdf1.pdf') {
          return Promise.resolve([{ label: 'section1 pdf1' }]);
        }
        if (filename === 'pdf3.pdf') {
          return Promise.resolve([{ label: 'section1 pdf3' }]);
        }
        throw new Error(`this file is not supposed to be sent for toc generation ${filename}`);
      });

      const elasticIndex = 'toc.service.index';
      await testingDB.clearAllAndLoad(fixtures, elasticIndex);
      await elasticTesting.resetIndex();
      await elasticTesting.refresh();
    });

    it('should not fail when request fails', async () => {
      requestMock.mockImplementation(async () => {
        throw new Error('request error');
      });
      await expect(service.processNext()).resolves.not.toThrow();
    });

    it('should not fail when there is no more to process', async () => {
      await service.processNext();
      await service.processNext();
      await expect(service.processNext()).resolves.not.toThrow();
    });

    it('should send the next pdfFile and save toc generated', async () => {
      await service.processNext();
      await service.processNext();

      let [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
      expect(fileProcessed.toc).toEqual([{ label: 'section1 pdf1' }]);
      expect(fileProcessed.generatedToc).toEqual(true);

      [fileProcessed] = await files.get({ filename: 'pdf3.pdf' });
      expect(fileProcessed.toc).toEqual([{ label: 'section1 pdf3' }]);
      expect(fileProcessed.generatedToc).toEqual(true);
    });

    it('should reindex the affected entities', async () => {
      await service.processNext();
      await service.processNext();
      await elasticTesting.refresh();

      const entitiesIndexed = await elasticTesting.getIndexedEntities();

      expect(entitiesIndexed).toEqual([
        expect.objectContaining({
          title: 'pdf1entity',
          generatedToc: true,
        }),
        expect.objectContaining({
          title: 'pdf3entity',
          generatedToc: true,
        }),
      ]);
    });
  });
});
