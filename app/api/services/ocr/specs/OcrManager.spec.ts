/* eslint-disable max-lines */
import fetchMock from 'fetch-mock';

import { files } from 'api/files';
import * as filesApi from 'api/files/filesystem';
import * as processDocumentApi from 'api/files/processDocument';
import { tenants } from 'api/tenants/tenantContext';
import settings from 'api/settings/settings';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import request from 'shared/JSONRequest';
import { OcrManager } from '../OcrManager';
import { OcrModel, OcrStatus } from '../ocrModel';
import { ResultsMessage, TaskManager } from '../../tasksmanager/TaskManager';
import { mockTaskManagerImpl } from '../../tasksmanager/specs/TaskManagerImplementationMocker';

jest.mock('api/services/tasksmanager/TaskManager.ts');

const fixturesFactory = getFixturesFactory();

const FIXTURES = {
  entities: [
    fixturesFactory.entity('parentEntity'),
    fixturesFactory.entity('parentForExistingRecord'),
  ],
  files: [
    {
      ...fixturesFactory.file(
        'sourceFile',
        'parentEntity',
        'document',
        'sourceFileName.pdf',
        'eng'
      ),
      originalname: 'sourceFileOriginalName.pdf',
    },
    {
      ...fixturesFactory.file(
        'erroringSourceFile',
        'parentEntity',
        'document',
        'errorSourceFileName.pdf',
        'notALanguage'
      ),
    },
    fixturesFactory.file(
      'resultForExistingRecord',
      'parentForExistingRecord',
      'document',
      'ocr_existingFileName.pdf',
      'eng'
    ),
    fixturesFactory.file(
      'sourceForExistingRecord',
      'parentForExistingRecord',
      'attachment',
      'existingFileName.pdf',
      'eng'
    ),
  ],
  ocr_records: [
    {
      sourceFile: fixturesFactory.id('sourceForExistingRecord'),
      resultFile: fixturesFactory.id('resultForExistingRecord'),
      language: 'en',
      status: OcrStatus.READY,
    },
  ],
  settings: [
    {
      features: {
        ocr: {
          url: 'serviceUrl',
        },
      },
    },
  ],
};

class Mocks {
  jestMocks: { [k: string]: jest.SpyInstance };

  taskManagerMock: {
    mock: Partial<TaskManager>;
    trigger: (m: ResultsMessage) => void;
  };

  constructor() {
    this.jestMocks = {
      'filesApi.uploadsPath': jest.spyOn(filesApi, 'uploadsPath').mockReturnValue('file_path'),
      'filesApi.readFile': jest
        .spyOn(filesApi, 'readFile')
        .mockResolvedValue(Buffer.from('file_content')),
      'filesApi.fileFromReadStream': jest
        .spyOn(filesApi, 'fileFromReadStream')
        .mockResolvedValue(''),
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
    };

    this.taskManagerMock = mockTaskManagerImpl(TaskManager as jest.Mock<TaskManager>);

    fetchMock.mock('end:/info', '{ "supported_languages": ["en", "es"] }');
    fetchMock.mock('protocol://link/to/result/file', {
      body: 'resultFileContent',
      status: 200,
      headers: { 'Content-Type': 'some/mimetype' },
    });
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
  let mocks: Mocks;
  let mockedMessageFromRedis: ResultsMessage;

  beforeAll(async () => {
    await testingEnvironment.setUp(FIXTURES);
    tenantName = tenants.current().name;
    mocks = new Mocks();
    mockedMessageFromRedis = {
      tenant: tenantName,
      task: 'ocr_results',
      file_url: 'protocol://link/to/result/file',
      params: { filename: 'sourceFileName.pdf', language: 'en' },
      success: true,
    };
  });

  afterAll(async () => {
    mocks.release();
    await testingEnvironment.tearDown();
  });

  describe('on success', () => {
    beforeAll(async () => {
      const ocrManager = new OcrManager();
      const [sourceFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });
      await ocrManager.addToQueue(sourceFile);
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
        expect(mocks.taskManagerMock.mock.startTask).toHaveBeenCalledWith(
          expect.objectContaining({
            tenant: tenantName,
            params: { filename: 'sourceFileName.pdf', language: 'en' },
            task: 'ocr',
          })
        );
      });

      it('should add a record to the DB', async () => {
        const records = await OcrModel.get({});
        expect(records).toHaveLength(2);
        const lastRecord = records[1];
        expect(lastRecord).toMatchObject({
          status: OcrStatus.PROCESSING,
          sourceFile: fixturesFactory.id('sourceFile'),
          language: 'eng',
        });
        expect(lastRecord.autoexpire).not.toBe(null);
        expect(lastRecord).not.toHaveProperty('resultFile');
      });
    });

    describe('when there are results', () => {
      beforeAll(async () => {
        await mocks.taskManagerMock.trigger(mockedMessageFromRedis);
      });

      it('should download the results', () => {
        expect(fetchMock.lastUrl()).toBe('protocol://link/to/result/file');
      });

      it('should save the file with a generated filename', () => {
        expect(filesApi.generateFileName).toHaveBeenCalled();
        expect(filesApi.fileFromReadStream).toHaveBeenCalledWith(
          'generatedUwaziFilename',
          'resultFileContent'
        );
      });

      it('should run the file processing', async () => {
        expect(processDocumentApi.processDocument).toHaveBeenCalledWith(
          'parentEntity',
          {
            destination: 'file_path',
            filename: 'generatedUwaziFilename',
            language: 'eng',
            mimetype: 'some/mimetype',
            originalname: 'ocr_sourceFileOriginalName.pdf',
            size: 17,
            type: 'document',
          },
          false
        );
      });

      it('move the original file to the attachments', async () => {
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
          autoexpire: null,
          resultFile: fixturesFactory.id('resultFile'),
        });
      });
    });

    describe('when requesting the status of a file', () => {
      it('should find the record in the database', async () => {
        const [existingSourceFile] = await files.get({
          _id: fixturesFactory.id('sourceForExistingRecord'),
        });

        const ocrManager = new OcrManager();
        const status = await ocrManager.getStatus(existingSourceFile);
        expect(status).toBe(OcrStatus.READY);
      });
    });
  });

  describe('should find error when', () => {
    it('an ocr model is already in queue', async () => {
      const ocrManager = new OcrManager();

      const [sourceFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });

      await expect(ocrManager.addToQueue(sourceFile)).rejects.toThrow('already in the queue');
    });

    it('settings are missing from the database', async () => {
      const oldSettings = await settings.get();
      await settings.save({ features: {} });

      const ocrManager = new OcrManager();

      const [sourceFile] = await files.get({ _id: fixturesFactory.id('erroringSourceFile') });

      await expect(ocrManager.addToQueue(sourceFile)).rejects.toThrow(
        'Ocr settings are missing from the database'
      );

      await settings.save(oldSettings);
    });

    it('language is not supported', async () => {
      const ocrManager = new OcrManager();
      const [sourceFile] = await files.get({ _id: fixturesFactory.id('erroringSourceFile') });
      await expect(ocrManager.addToQueue(sourceFile)).rejects.toThrow('Language not supported');
    });

    it('record is missing, and do nothing', async () => {
      await OcrModel.delete({ sourceFile: fixturesFactory.id('sourceFile') });
      mocks.clearJestMocks();

      await mocks.taskManagerMock.trigger(mockedMessageFromRedis);

      const records = await OcrModel.get({});
      expect(records).toHaveLength(1);
      expect(filesApi.fileFromReadStream).not.toHaveBeenCalled();
      expect(processDocumentApi.processDocument).not.toHaveBeenCalled();
    });

    it('message is not a success, and record error in db', async () => {
      await OcrModel.delete({ sourceFile: fixturesFactory.id('sourceFile') });

      const ocrManager = new OcrManager();
      const [sourceFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });
      await ocrManager.addToQueue(sourceFile);
      await mocks.taskManagerMock.trigger({
        ...mockedMessageFromRedis,
        success: false,
        error: 'some error message',
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
      });
      expect(record.autoexpire).not.toBeNull();
    });
  });
});
