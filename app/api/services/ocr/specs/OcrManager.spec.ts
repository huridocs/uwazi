/* eslint-disable max-statements */
/* eslint-disable max-lines */
import fetchMock from 'fetch-mock';
import { files, storage } from 'api/files';
import * as filesApi from 'api/files/filesystem';
import * as processDocumentApi from 'api/files/processDocument';
import { tenants } from 'api/tenants/tenantContext';
import settings from 'api/settings/settings';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { Readable } from 'stream';
import request from 'shared/JSONRequest';
import * as sockets from 'api/socketio/setupSockets';
import * as handleError from 'api/utils/handleError';
import { getOcrStatus, OcrManager } from '../OcrManager';
import { OcrModel, OcrStatus } from '../ocrModel';
import { ResultsMessage, TaskManager } from '../../tasksmanager/TaskManager';
import { mockTaskManagerImpl } from '../../tasksmanager/specs/TaskManagerImplementationMocker';
import { fixtures, fixturesFactory } from './fixtures/fixtures';
import { cleanupRecordsOfFiles } from '../ocrRecords';

jest.mock('api/services/tasksmanager/TaskManager.ts');

class Mocks {
  jestMocks: { [k: string]: jest.SpyInstance };

  taskManagerMock: {
    mock: Partial<TaskManager>;
    trigger: (m: ResultsMessage) => Promise<void>;
  };

  constructor() {
    this.jestMocks = {
      'storage.fileContents': jest
        .spyOn(storage, 'fileContents')
        .mockResolvedValue(Buffer.from('file_content')),
      'storage.storeFile': jest.spyOn(storage, 'storeFile').mockResolvedValue(),
      'filesApi.generateFileName': jest
        .spyOn(filesApi, 'generateFileName')
        .mockReturnValue('generatedUwaziFilename'),
      'request.uploadFile': jest.spyOn(request, 'uploadFile').mockReturnValue(Promise.resolve()),
      'processDocumentApi.processDocument': jest
        .spyOn(processDocumentApi, 'processDocument')
        .mockResolvedValue({
          _id: fixturesFactory.id('resultFile'),
          originalname: 'ocr_sourceFileName.pdf',
          entity: 'parentEntity',
          filename: 'generatedfilename.pdf',
          mimetype: 'pdf',
          size: 42,
          language: 'en',
          type: 'document',
        }),
      'date.now': jest.spyOn(Date, 'now').mockReturnValue(1000),
      'sockets.emitToTenant': jest.spyOn(sockets, 'emitToTenant').mockImplementation(() => {}),
      'handleError.handleError': jest
        .spyOn(handleError, 'handleError')
        .mockImplementation(() => {}),
    };

    this.taskManagerMock = mockTaskManagerImpl(TaskManager as jest.Mock<TaskManager>);

    fetchMock.mock('end:/info', '{ "supported_languages": ["en", "es"] }');

    fetchMock.mock(
      'protocol://link/to/result/file',
      //@ts-ignore
      new Response(Readable.from(Buffer.from('resultFileContent')), {
        headers: { 'Content-Type': 'some/mimetype' },
        size: 17,
      })
    );
  }

  release() {
    Object.values(this.jestMocks).forEach(m => m.mockRestore());
    fetchMock.restore();
  }

  clearJestMocks() {
    Object.values(this.jestMocks).forEach(m => m.mockClear());
  }
}

describe('OcrManager', () => {
  let tenantName: string;
  let mockedMessageFromRedis: ResultsMessage;
  let ocrManager: OcrManager;
  let mocks: Mocks;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    tenantName = tenants.current().name;
    mocks = new Mocks();
    mockedMessageFromRedis = {
      tenant: tenantName,
      task: 'ocr_results',
      file_url: 'protocol://link/to/result/file',
      params: { filename: 'sourceFileName.pdf', language: 'en' },
      success: true,
    };

    ocrManager = new OcrManager();
    ocrManager.start();
  });

  beforeEach(() => {
    mocks.jestMocks['storage.fileContents'] = jest
      .spyOn(storage, 'fileContents')
      .mockResolvedValue(Buffer.from('file_content'));
  });

  afterAll(async () => {
    mocks.release();
    await testingEnvironment.tearDown();
  });

  describe('on success', () => {
    beforeAll(async () => {
      const [sourceFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });
      await ocrManager.addToQueue(sourceFile);
      await storage.removeFile('generatedUwaziFilename', 'document');
    });

    describe('when creating a new task', () => {
      it('should upload the material', () => {
        expect(request.uploadFile).toHaveBeenCalledWith(
          `serviceUrl/upload/${tenantName}`,
          'sourceFileName.pdf',
          Buffer.from('file_content')
        );
      });

      it('should dispatch a job to the TaskManager', () => {
        const mock = jest.spyOn(ocrManager.ocrTaskManager, 'startTask');
        expect(mock).toHaveBeenCalledWith(
          expect.objectContaining({
            tenant: tenantName,
            params: { filename: 'sourceFileName.pdf', language: 'en' },
            task: 'ocr',
          })
        );
      });

      it('should add a record to the DB', async () => {
        const records = await OcrModel.get({});
        expect(records).toHaveLength(4);
        const lastRecord = records[records.length - 1];
        expect(lastRecord).toMatchObject({
          status: OcrStatus.PROCESSING,
          sourceFile: fixturesFactory.id('sourceFile'),
          language: 'eng',
          lastUpdated: 1000,
        });
        expect(lastRecord).not.toHaveProperty('resultFile');
      });
    });

    describe('when there are results', () => {
      beforeAll(async () => {
        mocks.jestMocks['date.now'].mockReturnValue(1001);
        mocks.jestMocks['storage.storeFile'].mockRestore();
        await filesApi.deleteFile('/tmp/generatedUwaziFilename');
        await mocks.taskManagerMock.trigger(mockedMessageFromRedis);
      });

      it('should download the results', () => {
        expect(fetchMock.lastUrl()).toBe('protocol://link/to/result/file');
      });

      it('should save the file with a generated filename', async () => {
        expect(filesApi.generateFileName).toHaveBeenCalled();
        mocks.jestMocks['storage.fileContents'].mockRestore();
        expect((await storage.fileContents('generatedUwaziFilename', 'document')).toString()).toBe(
          'resultFileContent'
        );
      });

      it('should run the file processing and tmp file should exist', async () => {
        expect(await filesApi.fileExistsOnPath('/tmp/generatedUwaziFilename'));
        expect(processDocumentApi.processDocument).toHaveBeenCalledWith(
          'parentEntity',
          expect.objectContaining({
            destination: '/tmp',
            filename: 'generatedUwaziFilename',
            language: 'eng',
            mimetype: 'some/mimetype',
            originalname: 'ocr_sourceFileOriginalName.pdf',
            type: 'document',
          }),
          false
        );
      });

      it('should move the original file to the attachments', async () => {
        const [file] = await files.get({ _id: fixturesFactory.id('sourceFile') });
        expect(file.type).toBe('attachment');
      });

      it('should update the job status', async () => {
        const matchingRecords = await OcrModel.get({
          sourceFile: fixturesFactory.id('sourceFile'),
        });
        expect(matchingRecords).toHaveLength(1);
        const [record] = matchingRecords;
        expect(record).toMatchObject({
          status: 'withOCR',
          sourceFile: fixturesFactory.id('sourceFile'),
          language: 'eng',
          resultFile: fixturesFactory.id('resultFile'),
          lastUpdated: 1001,
        });
      });

      it('should emit through the sockets', async () => {
        const [file] = await files.get({ _id: fixturesFactory.id('sourceFile') });
        expect(sockets.emitToTenant).toHaveBeenCalledWith(
          tenantName,
          'ocr:ready',
          file._id.toHexString()
        );
      });
    });

    it('should find the record in the database when requesting the status of a file', async () => {
      const [existingSourceFile] = await files.get({
        _id: fixturesFactory.id('sourceForExistingRecord'),
      });
      const status = await getOcrStatus(existingSourceFile);
      expect(status).toEqual({ status: OcrStatus.READY, lastUpdated: 1000 });
    });
  });

  describe('on validation', () => {
    it('should throw an error when enqueueing if the file is not a document', async () => {
      const [attachmentFile] = await files.get({ _id: fixturesFactory.id('unrelatedAttachment') });

      try {
        await ocrManager.addToQueue(attachmentFile);
        fail('Should throw.');
      } catch (err) {
        expect(err).toMatchObject({
          message: 'The file is not a document.',
          code: 400,
        });
      }
    });

    it('should throw an error when file is not a document and does not have ocr record when getting status', async () => {
      const [attachmentFile] = await files.get({ _id: fixturesFactory.id('unrelatedAttachment') });

      try {
        await getOcrStatus(attachmentFile);
        fail('Should throw.');
      } catch (err) {
        expect(err).toMatchObject({
          message: 'The file is not a document.',
          code: 400,
        });
      }
    });

    it('should throw an error when an ocr model is already in queue', async () => {
      await OcrModel.delete({ sourceFile: fixturesFactory.id('sourceFile') });

      await files.save({ _id: fixturesFactory.id('sourceFile'), type: 'document' });

      const [sourceFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });

      await ocrManager.addToQueue(sourceFile);
      await expect(ocrManager.addToQueue(sourceFile)).rejects.toThrow('already in the queue');
    });

    it('should throw an error when settings are missing from the database', async () => {
      const oldSettings = await settings.get();
      await settings.save({ features: {} });

      const [sourceFile] = await files.get({ _id: fixturesFactory.id('erroringSourceFile') });

      await expect(ocrManager.addToQueue(sourceFile)).rejects.toThrow(
        'Ocr settings are missing from the database'
      );

      await settings.save(oldSettings);
    });

    it('should throw an error when language is not supported', async () => {
      const [sourceFile] = await files.get({ _id: fixturesFactory.id('erroringSourceFile') });
      await expect(ocrManager.addToQueue(sourceFile)).rejects.toThrow('Language not supported');
    });

    it('should do nothing when record is missing', async () => {
      await OcrModel.delete({ sourceFile: fixturesFactory.id('sourceFile') });
      mocks.clearJestMocks();
      mocks.jestMocks['storage.storeFile'] = jest.spyOn(storage, 'storeFile').mockResolvedValue();

      await mocks.taskManagerMock.trigger(mockedMessageFromRedis);

      const records = await OcrModel.get({});
      expect(records).toHaveLength(3);
      expect(storage.storeFile).not.toHaveBeenCalled();
      expect(processDocumentApi.processDocument).not.toHaveBeenCalled();
    });
  });

  describe('on error', () => {
    it('should record error in db if service response is not a success', async () => {
      mocks.jestMocks['date.now'].mockReturnValue(1002);
      await OcrModel.delete({ sourceFile: fixturesFactory.id('sourceFile') });

      const [sourceFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });
      await ocrManager.addToQueue(sourceFile);
      await mocks.taskManagerMock.trigger({
        ...mockedMessageFromRedis,
        success: false,
        error_message: 'some error message',
      });

      const matchingRecords = await OcrModel.get({
        sourceFile: fixturesFactory.id('sourceFile'),
      });
      expect(matchingRecords).toHaveLength(1);
      const [record] = matchingRecords;
      expect(record).toMatchObject({
        status: 'cannotProcess',
        sourceFile: fixturesFactory.id('sourceFile'),
        language: 'eng',
        lastUpdated: 1002,
      });
      expect(sockets.emitToTenant).toHaveBeenCalledWith(
        tenantName,
        'ocr:error',
        sourceFile._id.toHexString()
      );
    });

    it('should catch an unexpected error while processing the response and log it', async () => {
      const error = new Error('some error');
      jest.spyOn(files, 'get').mockReturnValueOnce(Promise.reject(error));
      await mocks.taskManagerMock.trigger(mockedMessageFromRedis);
      expect(handleError.handleError).toHaveBeenCalledWith(error);
    });
  });

  describe('on cleanup', () => {
    it('should modify record source to null when source is deleted', async () => {
      const filesToCleanup = await files.get({
        $or: [
          { _id: fixturesFactory.id('sourceToDelete') },
          { _id: fixturesFactory.id('sourceToDelete2') },
        ],
      });
      let records = await OcrModel.get({ sourceFile: { $in: filesToCleanup.map(f => f._id) } });
      await cleanupRecordsOfFiles(filesToCleanup.map(f => f._id));
      records = await OcrModel.get({ _id: { $in: records.map(r => r._id) } });
      expect(records[0].sourceFile).toBeNull();
      expect(records[1].sourceFile).toBeNull();
    });

    it(' should delete record when result is deleted', async () => {
      const filesToCleanup = await files.get({
        $or: [
          { _id: fixturesFactory.id('resultToDelete') },
          { _id: fixturesFactory.id('resultToDelete2') },
        ],
      });
      let records = await OcrModel.get({ sourceFile: { $in: filesToCleanup.map(f => f._id) } });
      await cleanupRecordsOfFiles(filesToCleanup.map(f => f._id));
      records = await OcrModel.get({ _id: { $in: records.map(r => r._id) } });
      expect(records).toHaveLength(0);
    });
  });
});
