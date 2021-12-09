import fetchMock from 'fetch-mock';

import * as filesApi from 'api/files/filesystem';
import settings from 'api/settings/settings';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import request from 'shared/JSONRequest';
import { OcrManager } from '../OcrManager';
import { OcrModel, OcrStatus } from '../ocrModel';
import { TaskManager } from '../../tasksmanager/TaskManager';
import { mockTaskManagerImpl } from '../../tasksmanager/specs/TaskManagerImplementationMocker';

jest.mock('api/services/tasksmanager/TaskManager.ts');
const defaultTenantName = 'defaultDB';

describe('OcrManager', () => {
  beforeAll(async () => {
    await testingEnvironment.setTenant();
  });

  describe('when creating a new task', () => {
    let mocks: { [k: string]: jest.SpyInstance };
    let taskManagerMock: Partial<TaskManager>;
    let taskManagerTrigger: Function;

    beforeAll(async () => {
      mocks = {
        'files_api.uploadsPath': jest.spyOn(filesApi, 'uploadsPath').mockReturnValue('file_path'),
        'files_api.readFile': jest
          .spyOn(filesApi, 'readFile')
          .mockResolvedValue(Buffer.from('file_content')),
        'OcrModel.save': jest.spyOn(OcrModel, 'save').mockReturnValue(Promise.resolve() as any),
        'settings.get': jest.spyOn(settings, 'get').mockResolvedValue({
          features: {
            ocr: {
              url: 'serviceUrl',
            },
          },
        }),
        'request.uploadFile': jest.spyOn(request, 'uploadFile').mockReturnValue(Promise.resolve()),
      };

      ({ mock: taskManagerMock, trigger: taskManagerTrigger } = mockTaskManagerImpl(
        TaskManager as jest.Mock<TaskManager>
      ));

      fetchMock.mock('*', 200);

      const ocrManager = new OcrManager();

      await ocrManager.addToQueue({
        filename: 'someFileName',
        language: 'en',
        _id: 'someId',
      });
    });

    afterAll(async () => {
      Object.values(mocks).forEach(m => m.mockRestore());
    });

    it('should upload the material', () => {
      expect(request.uploadFile).toHaveBeenCalledWith(
        'serviceUrl/upload/defaultDB',
        'someFileName',
        Buffer.from('file_content')
      );
    });

    it('should dispatch a job to the TaskManager', () => {
      expect(taskManagerMock.startTask).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: defaultTenantName,
          params: { filename: 'someFileName' },
          task: 'ocr',
        })
      );
    });

    it('should add a record to the DB', () => {
      expect(OcrModel.save).toHaveBeenCalledWith({
        language: 'en',
        file: 'someId',
        status: OcrStatus.PROCESSING,
      });
    });

    describe('when there are results', () => {
      beforeAll(() => {
        taskManagerTrigger({
          tenant: defaultTenantName,
          task: 'ocr_results',
          file_url: 'protocol://link/to/result/file',
          params: { filename: 'someFileName' },
          success: true,
        });
      });

      it('should download the file', () => {
        expect(fetchMock.lastUrl()).toBe('protocol://link/to/result/file');
      });

      it.todo('arrange the files');

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
    it('should read from the database', async () => {
      jest.spyOn(OcrModel, 'get').mockResolvedValue(
        Promise.resolve([
          {
            status: OcrStatus.READY,
          },
        ]) as any
      );

      const ocrManager = new OcrManager();

      const status = await ocrManager.getStatus({
        filename: 'someFileName',
        language: 'en',
        _id: 'someId',
      });

      expect(OcrModel.get).toHaveBeenCalledWith({ file: 'someId' });

      expect(status).toBe(OcrStatus.READY);
    });
  });
});
