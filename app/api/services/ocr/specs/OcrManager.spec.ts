import fetchMock from 'fetch-mock';

import * as filesApi from 'api/files/filesystem';
import * as processDocumentApi from 'api/files/processDocument';
import settings from 'api/settings/settings';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import { FileType } from 'shared/types/fileType';
import { OcrManager } from '../OcrManager';
import { OcrModel, OcrStatus } from '../ocrModel';
import { TaskManager } from '../../tasksmanager/TaskManager';
import { mockTaskManagerImpl } from '../../tasksmanager/specs/TaskManagerImplementationMocker';

import entities from 'api/entities';
import { files } from 'api/files';
import { tenants } from 'api/tenants/tenantContext';
import { testingEnvironment } from 'api/utils/testingEnvironment';

jest.mock('api/services/tasksmanager/TaskManager.ts');

const fixturesFactory = getFixturesFactory();

const FIXTURES = {
  entities: [
    fixturesFactory.entity('parentEntity'),
    fixturesFactory.entity('parentForExistingRecord'),
  ],
  files: [
    fixturesFactory.file('sourceFile', 'parentEntity', 'document', 'sourceFileName.pdf', 'en'),
    fixturesFactory.file(
      'resultForExistingRecord',
      'parentForExistingRecord',
      'document',
      'ocr_existingFileName.pdf',
      'en'
    ),
    fixturesFactory.file(
      'sourceForExistingRecord',
      'parentForExistingRecord',
      'attachment',
      'existingFileName.pdf',
      'en'
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

describe('OcrManager', () => {
  let tenantName: string;

  beforeAll(async () => {
    // await db.clearAllAndLoad(FIXTURES);
    await testingEnvironment.setUp(FIXTURES);
    tenantName = tenants.current().name;
  });

  afterAll(async () => {
    // await db.disconnect();
    await testingEnvironment.tearDown();
  });

  describe('when creating a new task', () => {
    let mocks: { [k: string]: jest.SpyInstance };
    let taskManagerMock: Partial<TaskManager>;
    let taskManagerTrigger: Function;

    beforeAll(async () => {
      mocks = {
        'filesApi.uploadsPath': jest.spyOn(filesApi, 'uploadsPath').mockReturnValue('file_path'),
        'filesApi.readFile': jest
          .spyOn(filesApi, 'readFile')
          .mockResolvedValue(Buffer.from('file_content')),
        'filesApi.fileFromReadStream': jest
          .spyOn(filesApi, 'fileFromReadStream')
          .mockResolvedValue(''),
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

      ({ mock: taskManagerMock, trigger: taskManagerTrigger } = mockTaskManagerImpl(
        TaskManager as jest.Mock<TaskManager>
      ));

      fetchMock.mock('*', { body: 'resultFileContent' });

      const ocrManager = new OcrManager();

      const ents = await entities.get({});
      const sourceFile = (await files.get({ _id: fixturesFactory.id('sourceFile') }))[0];
      // console.log(ents);
      // console.log(sourceFile);

      await ocrManager.addToQueue(sourceFile);
    });

    afterAll(async () => {
      Object.values(mocks).forEach(m => m.mockRestore());
      fetchMock.restore();
    });

    it('should upload the material', () => {
      expect(request.uploadFile).toHaveBeenCalledWith(
        `serviceUrl/upload/${tenantName}`,
        'sourceFileName.pdf',
        Buffer.from('file_content')
      );
    });

    it('should dispatch a job to the TaskManager', () => {
      expect(taskManagerMock.startTask).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: tenantName,
          params: { filename: 'sourceFileName.pdf' },
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
        language: 'en',
      });
      expect(lastRecord).toHaveProperty('autoexpire');
      expect(lastRecord).not.toHaveProperty('resultFile');
    });

    describe('when there are results', () => {
      beforeAll(() => {
        taskManagerTrigger({
          tenant: tenantName,
          task: 'ocr_results',
          file_url: 'protocol://link/to/result/file',
          params: { filename: 'sourceFileName.pdf', language: 'en' },
          success: true,
        });
      });

      it('should download', () => {
        expect(fetchMock.lastUrl()).toBe('protocol://link/to/result/file');
      });

      it('should save the file with "ocr_" prepended to filename', () => {
        expect(filesApi.fileFromReadStream).toHaveBeenCalledWith(
          'ocr_sourceFileName.pdf',
          'resultFileContent'
        );
      });

      it('move the original file to the attachments, add new file as main file on entity', () => {
        fail('WIP');
      });

      it('should update the job status', () => {
        fail('TODO: this is failing on purpose. Needs work.');
        // expect(OcrModel.save).toHaveBeenCalledWith({
        //   language: 'en',
        //   file: 'someId',
        //   status: OcrStatus.READY,
        // });
      });

      it.todo('should update the job status on error');
    });
  });

  describe('when requesting the status of a file', () => {
    it('should find the record in the database', async () => {
      const existingSourceFile = (
        await files.get({ _id: fixturesFactory.id('sourceForExistingRecord') })
      )[0];

      const ocrManager = new OcrManager();
      const status = await ocrManager.getStatus(existingSourceFile);
      expect(status).toBe(OcrStatus.READY);
    });
  });
});
