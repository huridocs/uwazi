/* eslint-disable max-statements */

import fetchMock from 'fetch-mock';
import { Readable } from 'stream';
import { files, storage } from '#api/files/index.js';
import { tenants } from '#api/tenants/tenantContext.js';
import settings from '#api/settings/settings.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import request from '#shared/JSONRequest.js';
import * as sockets from '#api/socketio/setupSockets.js';
import * as handleError from '#api/utils/handleError.js';
import { getOcrStatus, OcrManager } from '../OcrManager.js';
import { OcrModel, OcrStatus } from '../ocrModel.js';
import { ResultsMessage, TaskManager } from '../../tasksmanager/TaskManager.js';
import { mockTaskManagerImpl } from '../../tasksmanager/specs/TaskManagerImplementationMocker.js';
import { fixtures, fixturesFactory } from './fixtures/fixtures.js';
import { cleanupRecordsOfFiles } from '../ocrRecords.js';

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
      'request.uploadFile': jest.spyOn(request, 'uploadFile').mockReturnValue(Promise.resolve()),
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

  afterEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    mocks.jestMocks['storage.fileContents'] = jest
      .spyOn(storage, 'fileContents')
      .mockResolvedValue(Buffer.from('file_content'));
  });

  afterAll(async () => {
    mocks.release();
    await testingEnvironment.tearDown();
  });

  describe('on success', () => {
    beforeEach(async () => {
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
      beforeEach(async () => {
        mocks.jestMocks['date.now'].mockReturnValue(1001);
        await mocks.taskManagerMock.trigger(mockedMessageFromRedis);
      });

      it('should download the results', () => {
        expect(fetchMock.lastUrl()).toBe('protocol://link/to/result/file');
      });

      it('should create a ProcessingPDF file in database', async () => {
        const resultFiles = await files.get({ entity: 'parentEntity', type: 'document' });
        const ocrResultFile = resultFiles.find(f => f.originalname?.startsWith('ocr_'));
        expect(ocrResultFile).toBeDefined();
        expect(ocrResultFile).toMatchObject({
          type: 'document',
          status: 'processing',
          entity: 'parentEntity',
        });
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

        const resultFiles = await files.get({ entity: 'parentEntity', type: 'document' });
        const ocrResultFile = resultFiles.find(f => f.originalname?.startsWith('ocr_'));
        expect(ocrResultFile).toBeDefined();

        expect(record).toMatchObject({
          status: 'withOCR',
          sourceFile: fixturesFactory.id('sourceFile'),
          language: 'eng',
          lastUpdated: 1001,
        });

        const resultFileId = record.resultFile?.toString();
        expect(resultFileId).toBe(ocrResultFile!._id.toString());
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

      const fileCountBefore = await files.get({});
      await mocks.taskManagerMock.trigger(mockedMessageFromRedis);

      const records = await OcrModel.get({});
      expect(records).toHaveLength(3);

      const fileCountAfter = await files.get({});
      expect(fileCountAfter.length).toBe(fileCountBefore.length);
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

  describe('user context for V2 operations', () => {
    it('should fail gracefully when entity has no user', async () => {
      mocks.jestMocks['date.now'].mockReturnValue(1003);
      await OcrModel.delete({ sourceFile: fixturesFactory.id('sourceFile') });

      const entitiesCollection = testingEnvironment.db.getCollection('entities');
      await entitiesCollection!.updateOne({ sharedId: 'parentEntity' }, { $unset: { user: '' } });

      const [sourceFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });
      await ocrManager.addToQueue(sourceFile);

      await mocks.taskManagerMock.trigger(mockedMessageFromRedis);

      const matchingRecords = await OcrModel.get({
        sourceFile: fixturesFactory.id('sourceFile'),
      });
      expect(matchingRecords).toHaveLength(1);
      expect(matchingRecords[0].status).toBe(OcrStatus.ERROR);

      expect(handleError.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('entity parentEntity has no user'),
        })
      );

      await entitiesCollection!.updateOne(
        { sharedId: 'parentEntity' },
        { $set: { user: fixturesFactory.id('user1') } }
      );
    });

    it('should fail gracefully when entity does not exist', async () => {
      mocks.jestMocks['date.now'].mockReturnValue(1004);
      await OcrModel.delete({ sourceFile: fixturesFactory.id('sourceFile') });

      const [sourceFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });
      await files.save({ _id: sourceFile._id, entity: 'nonExistentEntity' });

      await ocrManager.addToQueue(sourceFile);

      const [updatedFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });
      await mocks.taskManagerMock.trigger({
        ...mockedMessageFromRedis,
        params: { ...mockedMessageFromRedis.params, filename: updatedFile.filename },
      });

      const matchingRecords = await OcrModel.get({
        sourceFile: fixturesFactory.id('sourceFile'),
      });
      expect(matchingRecords).toHaveLength(1);
      expect(matchingRecords[0].status).toBe(OcrStatus.ERROR);

      expect(handleError.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('entity nonExistentEntity not found'),
        })
      );

      await files.save({ _id: sourceFile._id, entity: 'parentEntity' });
    });
  });
});
