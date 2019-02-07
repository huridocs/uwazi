import Worker from '../worker';
import { WorkerManager } from '../workerManager';

jest.mock('../worker');

describe('WorkerManager', () => {
  beforeEach(() => {
    Worker.mockClear();
  });

  describe('notifyNewSearch', () => {
    it('should start a new worker for the search', () => {
      const manager = new WorkerManager();
      const searchId = 'search';
      manager.notifyNewSearch(searchId);
      expect(Worker).toHaveBeenCalledWith(searchId);
      const worker = Worker.mock.instances[0];
      expect(worker.start).toHaveBeenCalled();
    });
    it('should not start a new worker if WorkerManager already has 3 workers', () => {
      const manager = new WorkerManager();
      manager.workers = {
        search1: {},
        search2: {},
        search3: {}
      };
      manager.notifyNewSearch('search4');
      expect(Worker).not.toHaveBeenCalled();
    });
  });
});
