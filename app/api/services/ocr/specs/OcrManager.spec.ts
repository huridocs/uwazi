import { getInstance, OcrManager } from '../OcrManager';
import { OcrModel, OcrStatus } from '../ocrModel';

describe('OcrManager', () => {
  it('should be singleton', () => {
    expect(getInstance()).toBe(getInstance());
  })

  describe('when creating a new task', () => {
    it('should add a record to the DB', async () => {
      jest.spyOn(OcrModel, 'save').mockResolvedValue(Promise.resolve() as any);
      const manager = new OcrManager();
      
      await manager.addToQueue({
        filename: 'someFileName',
        language: 'en',
        _id: 'someId'
      });

      expect(OcrModel.save).toHaveBeenCalledWith({
        language: 'en',
        file: 'someId',
        status: OcrStatus.PROCESSING,
      });
    });

    it.todo('should dispatch a job to the TaskManager');
    
    describe('when there are results', () => {
      it.todo('should update the job status');
    });
  });

  describe('when requesting the status of a file', () => {
    it('should read from the database', async () => {
      jest.spyOn(OcrModel, 'get').mockResolvedValue(Promise.resolve([{
        status: OcrStatus.READY,
      }]) as any);
      const manager = new OcrManager();
      
      const status = await manager.getStatus({
        filename: 'someFileName',
        language: 'en',
        _id: 'someId'
      });

      expect(OcrModel.get).toHaveBeenCalledWith({ file: 'someId' });

      expect(status).toBe(OcrStatus.READY);
    });
  });
});