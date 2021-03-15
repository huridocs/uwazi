import { testingDB } from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import { files } from 'api/files';
import { elasticTesting } from 'api/utils/elastic_testing';
import errorLog from 'api/log/errorLog';
import { fixtures } from './fixtures';
import { tocService } from '../tocService';

describe('tocService', () => {
  const service = tocService('url');

  let requestMock: jest.SpyInstance;

  beforeEach(async () => {
    spyOn(errorLog, 'error');
    requestMock = jest.spyOn(request, 'uploadFile');
    requestMock.mockImplementation(async (url, filename) => {
      expect(url).toBe('url');
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

    const elasticIndex = 'toc.service.index';
    await testingDB.clearAllAndLoad(fixtures, elasticIndex);
    await elasticTesting.resetIndex();
    await elasticTesting.refresh();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should not fail when there is no more to process', async () => {
    await service.processNext();
    await service.processNext();
    await expect(service.processNext()).resolves.not.toThrow();
  });

  it('should send the next pdfFile and save toc generated', async () => {
    await service.processNext();
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
      expect.objectContaining({
        title: 'pdf5entity',
        generatedToc: true,
        language: 'es',
      }),
      expect.objectContaining({
        title: 'pdf5entity',
        generatedToc: true,
        language: 'en',
      }),
    ]);
  });

  describe('error handling', () => {
    it('should save a fake TOC when generated one is empty', async () => {
      requestMock.mockImplementation(async () => Promise.resolve({ text: JSON.stringify([]) }));
      await service.processNext();

      const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
      expect(fileProcessed.toc).toEqual([
        {
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
          label: 'ERROR: Toc was generated empty',
          indentation: 0,
        },
      ]);
      expect(fileProcessed.generatedToc).toEqual(true);

      await elasticTesting.refresh();
      const entitiesIndexed = await elasticTesting.getIndexedEntities();
      expect(entitiesIndexed).toEqual([
        expect.objectContaining({ title: 'pdf1entity', generatedToc: true }),
      ]);
    });

    it('should save a fake toc when there is an error', async () => {
      requestMock.mockImplementation(async () => {
        throw new Error('request error');
      });
      await service.processNext();

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

      await elasticTesting.refresh();
      const entitiesIndexed = await elasticTesting.getIndexedEntities();
      expect(entitiesIndexed).toEqual([
        expect.objectContaining({ title: 'pdf1entity', generatedToc: true }),
      ]);
    });

    it('should not save anything when the error is ECONNREFUSED', async () => {
      requestMock.mockImplementation(async () => {
        // eslint-disable-next-line no-throw-literal
        throw { code: 'ECONNREFUSED' };
      });
      await service.processNext();

      const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
      expect(fileProcessed.toc).not.toBeDefined();
      expect(fileProcessed.generatedToc).not.toBeDefined();

      await elasticTesting.refresh();
      const entitiesIndexed = await elasticTesting.getIndexedEntities();
      expect(entitiesIndexed).toEqual([]);
    });
  });
});
