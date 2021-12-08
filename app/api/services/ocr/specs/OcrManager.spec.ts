import * as files_api from 'api/files/filesystem';
import { OcrManager } from '../OcrManager';
import { OcrModel, OcrStatus } from '../ocrModel';
import settings from 'api/settings/settings';
import request from 'shared/JSONRequest';
import { Service, TaskManager, ResultsMessage } from '../../tasksmanager/TaskManager';

jest.mock('api/services/tasksmanager/TaskManager.ts');

describe('OcrManager', () => {
  describe('when creating a new task', () => {
    let mocks: { [k: string]: jest.SpyInstance };
    let taskManagerMock: Partial<TaskManager>;
    let taskManagerTrigger: Function;

    beforeAll(async () => {
      mocks = {
        'files_api.uploadsPath': jest.spyOn(files_api, 'uploadsPath').mockReturnValue('file_path'),
        'files_api.readFile': jest
          .spyOn(files_api, 'readFile')
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

      (TaskManager as jest.Mock<TaskManager>).mockImplementation(function(service: Service) {
        taskManagerTrigger = (result: ResultsMessage) => {
            // @ts-ignore
            service.processResults(result);
        }

        const mock = {
          startTask: jest.fn(),
        };

        taskManagerMock = mock;
        return mock as unknown as TaskManager;
      });

      const ocrManager = new OcrManager();

      await ocrManager.addToQueue(
        {
          filename: 'someFileName',
          language: 'en',
          _id: 'someId',
        },
        'someTenantId'
      );
    });

    afterAll(async () => {
      Object.values(mocks).forEach(m => m.mockRestore());
    });

    it('should upload the material', () => {
      expect(request.uploadFile).toHaveBeenCalledWith(
        'serviceUrl/upload/someTenantId',
        'someFileName',
        Buffer.from('file_content')
      );
    });

    it('should dispatch a job to the TaskManager', () => {
      expect(
        taskManagerMock.startTask
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: 'someTenantId',
          params: { filename: 'someFileName' },
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
      it('should update the job status and switch the files on success', () => {
        // TODO: this is failing on purpose. Needs work.
        taskManagerTrigger();
        expect(OcrModel.save).toHaveBeenCalledWith({
          language: 'en',
          file: 'someId',
          status: OcrStatus.READY,
        });
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
