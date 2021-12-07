import { mockCsvFileReadStream } from 'api/csv/specs/helpers';
import * as files_api from 'api/files/filesystem';
import OcrManager from '../OcrManager';
import { OcrModel, OcrStatus } from '../ocrModel';

jest.mock('api/services/tasksmanager/TaskManager.ts');

describe('OcrManager', () => {
  describe('when creating a new task', () => {
    let mocks: jest.SpyInstance[];
    beforeAll(async () => {
      mocks = [
        jest.spyOn(files_api, 'uploadsPath').mockReturnValue('file_path'),
        jest.spyOn(files_api, 'readFile').mockReturnValue('file_content'),
        jest.spyOn(OcrModel, 'save').mockResolvedValue(Promise.resolve() as any)
      ];

      await OcrManager.addToQueue({
        filename: 'someFileName',
        language: 'en',
        _id: 'someId'
      });
    })

    afterAll(async() => {
      mocks.forEach(m=>m.mockRestore())
    })

    it.todo('should upload the material');

    it.todo('should dispatch a job to the TaskManager');

    it('should add a record to the DB', async () => {      
      expect(OcrModel.save).toHaveBeenCalledWith({
        language: 'en',
        file: 'someId',
        status: OcrStatus.PROCESSING,
      });
    });

    describe('when there are results', () => {
      
      it.todo('should update the job status');
    });
  });

  describe('when requesting the status of a file', () => {
    it('should read from the database', async () => {
      jest.spyOn(OcrModel, 'get').mockResolvedValue(Promise.resolve([{
        status: OcrStatus.READY,
      }]) as any);
     
      const status = await OcrManager.getStatus({
        filename: 'someFileName',
        language: 'en',
        _id: 'someId'
      });

      expect(OcrModel.get).toHaveBeenCalledWith({ file: 'someId' });

      expect(status).toBe(OcrStatus.READY);
    });
  });
});