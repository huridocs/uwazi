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
      'settings.get': jest.spyOn(settings, 'get').mockResolvedValue({
        features: {
          ocr: {
            url: 'serviceUrl',
          },
        },
      }),
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
}

describe('OcrManager', () => {
  let tenantName: string;

  beforeAll(async () => {
    await testingEnvironment.setUp(FIXTURES);
    tenantName = tenants.current().name;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('on success', () => {
    let mocks: Mocks;

    beforeAll(async () => {
      mocks = new Mocks();

      const ocrManager = new OcrManager();

      const [sourceFile] = await files.get({ _id: fixturesFactory.id('sourceFile') });
      await ocrManager.addToQueue(sourceFile);
    });

    afterAll(async () => {
      mocks.release();
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
        await mocks.taskManagerMock.trigger({
          tenant: tenantName,
          task: 'ocr_results',
          file_url: 'protocol://link/to/result/file',
          params: { filename: 'sourceFileName.pdf', language: 'en' },
          success: true,
        });
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
    it('an ocr model is already in queue', () => {
      fail('TODO')
    });
  });
});
