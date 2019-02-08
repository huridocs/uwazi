import db from 'api/utils/testing_db';
import Worker from '../worker';
import { WorkerManager } from '../workerManager';
import model from '../model';
import fixtures, { search1Id, search2Id, search3Id, search4Id } from './workersFixtures';


jest.mock('../worker');

describe('WorkerManager', () => {
  beforeEach((done) => {
    Worker.mockClear();
    db.clearAllAndLoad(fixtures).then(done).catch(done);
  });

  afterAll((done) => {
    db.disconnect().then(done).catch(done);
  });

  describe('notifyNewSearch', () => {
    it('should start a new worker for the search', () => {
      const manager = new WorkerManager();
      const searchId = 'search';
      manager.notifyNewSearch(searchId);
      expect(Worker).toHaveBeenCalledWith(searchId);
      const worker = Worker.mock.instances[0];
      expect(worker.start).toHaveBeenCalled();
      expect(manager.workers[searchId]).toEqual(worker);
      expect(Object.keys(manager.workers).length).toBe(1);
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

  describe('startNewSearchIfFree', () => {
    let manager;
    beforeEach(() => {
      manager = new WorkerManager();
      jest.spyOn(manager, 'notifyNewSearch');
    });
    it('should start next inProgress search that is not assigned a worker', async () => {
      manager.workers = {
        [search1Id]: {},
        [search2Id]: {},
      };
      await manager.startNewSearchIfFree();
      expect(manager.notifyNewSearch).toHaveBeenCalledWith(search4Id);
    });
    describe('if there are no unassigned inProgress searches', () => {
      it('should start next pending search', async () => {
        await model.save({ _id: search4Id, status: 'completed' });
        manager.workers = {
          [search1Id]: {},
          [search2Id]: {}
        };
        await manager.startNewSearchIfFree();
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(search3Id);
      });
    });
    describe('if there are no available inProgress or pending searches', () => {
      it('should not start new search', async () => {
        await model.save({ _id: search4Id, status: 'completed' });
        await model.save({ _id: search3Id, status: 'completed' });
        manager.workers = {
          [search1Id]: {},
          [search2Id]: {}
        };
        await manager.startNewSearchIfFree();
        expect(manager.notifyNewSearch).not.toHaveBeenCalled();
      });
    });
    describe('if manager already has max number of workers', () => {
      it('should not start new search', async () => {
        manager.workers = {
          search1: {},
          search2: {},
          search3: {}
        };
        await manager.startNewSearchIfFree();
        expect(manager.notifyNewSearch).not.toHaveBeenCalled();
      });
    });
  });

  describe('start', () => {
    let manager;
    beforeEach(() => {
      manager = new WorkerManager();
      jest.spyOn(manager, 'notifyNewSearch');
    });
    it('should start an inProgress search for each worker', async () => {
      await manager.start();
      expect(manager.notifyNewSearch).toHaveBeenCalledTimes(3);
      expect(manager.notifyNewSearch).toHaveBeenCalledWith(search1Id);
      expect(manager.notifyNewSearch).toHaveBeenCalledWith(search2Id);
      expect(manager.notifyNewSearch).toHaveBeenCalledWith(search4Id);
    });
    describe('if there are fewer inProgress searches than workers', () => {
      it('should use assign pending searches to remaining workers', async () => {
        await model.save({ _id: search1Id, status: 'completed' });
        await manager.start();
        expect(manager.notifyNewSearch).toHaveBeenCalledTimes(3);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(search2Id);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(search4Id);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(search3Id);
      });
    });
    describe('if there are fewer inProgress and pending searches than workers', () => {
      it('should not start additional workers', async () => {
        await model.save({ _id: search1Id, status: 'completed' });
        await model.save({ _id: search2Id, status: 'completed' });
        await manager.start();
        expect(manager.notifyNewSearch).toHaveBeenCalledTimes(2);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(search4Id);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(search3Id);
      });
    });
    describe('if there are no inProgress or pending searches', () => {
      it('should not start any search worker', async () => {
        await model.db.updateMany({}, { status: 'completed' });
        await manager.start();
        expect(manager.notifyNewSearch).not.toHaveBeenCalled();
      });
    });
  });
});
