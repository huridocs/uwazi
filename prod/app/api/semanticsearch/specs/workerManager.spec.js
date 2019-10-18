"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _worker = _interopRequireDefault(require("../worker"));
var _workerManager = require("../workerManager");
var _model = _interopRequireDefault(require("../model"));
var _workersFixtures = _interopRequireWildcard(require("./workersFixtures"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const mockWorkerOnFn = jest.fn();
jest.mock("../worker");

describe('WorkerManager', () => {
  beforeEach(done => {
    _worker.default.mockClear();
    _testing_db.default.clearAllAndLoad(_workersFixtures.default).then(done).catch(done);
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done).catch(done);
  });

  describe('notifyNewSearch', () => {
    it('should start a new worker for the search', () => {
      const manager = new _workerManager.WorkerManager();
      const searchId = 'search';
      manager.notifyNewSearch(searchId);
      expect(_worker.default).toHaveBeenCalledWith(searchId);
      const worker = _worker.default.mock.instances[0];
      expect(worker.start).toHaveBeenCalled();
      expect(manager.workers[searchId]).toEqual(worker);
      expect(Object.keys(manager.workers).length).toBe(1);
    });
    it('should not start a new worker if WorkerManager already has 3 workers', () => {
      const manager = new _workerManager.WorkerManager();
      manager.workers = {
        search1: {},
        search2: {},
        search3: {} };

      manager.notifyNewSearch('search4');
      expect(_worker.default).not.toHaveBeenCalled();
    });
  });

  describe('handling worker events', () => {
    beforeEach(() => {
      mockWorkerOnFn.mockClear();
      _worker.default.mockImplementation(() => ({
        on: mockWorkerOnFn,
        start: jest.fn() }));

    });
    function createManager() {
      const manager = new _workerManager.WorkerManager();
      jest.spyOn(manager, 'startNewSearchIfFree').mockImplementation(() => {});
      jest.spyOn(manager, 'emit');
      return manager;
    }
    function testWorkerDeletedAndReplaced(_manager, searchId) {
      expect(searchId in _manager.workers).toBe(false);
      expect(_manager.startNewSearchIfFree).toHaveBeenCalled();
    }
    describe('handling worker error event', () => {
      it('should replace worker and emit searchError event', () => {
        const manager = createManager();
        const searchId = 'search';
        const error = new Error('test error');
        manager.notifyNewSearch(searchId);
        const eventCall = mockWorkerOnFn.mock.calls.find(([event]) => event === 'error');
        const handler = eventCall[1];
        handler(error);
        expect(manager.emit).toHaveBeenCalledWith('searchError', searchId, error);
        testWorkerDeletedAndReplaced(manager, searchId);
      });
    });
    describe('handling worker update event', () => {
      it('should emit searchUpdated event', () => {
        const manager = createManager();
        const searchId = 'search';
        const update = { _id: searchId, status: 'inProgress' };
        manager.notifyNewSearch(searchId);
        const eventCall = mockWorkerOnFn.mock.calls.find(([event]) => event === 'update');
        const handler = eventCall[1];
        handler(update);
        expect(manager.emit).toHaveBeenCalledWith('searchUpdated', searchId, update);
      });
      it('should not replace worker', () => {
        const manager = createManager();
        const searchId = 'search';
        const update = { _id: searchId, status: 'inProgress' };
        manager.notifyNewSearch(searchId);
        const eventCall = mockWorkerOnFn.mock.calls.find(([event]) => event === 'update');
        const handler = eventCall[1];
        handler(update);
        expect(manager.startNewSearchIfFree).not.toHaveBeenCalled();
        expect(searchId in manager.workers).toBe(true);
      });
    });
    describe('handling worker done event', () => {
      it('should emit searchDone event and replace worker', () => {
        const manager = createManager();
        const searchId = 'search';
        manager.notifyNewSearch(searchId);
        const eventCall = mockWorkerOnFn.mock.calls.find(([event]) => event === 'done');
        const handler = eventCall[1];
        handler();
        expect(manager.emit).toHaveBeenCalledWith('searchDone', searchId);
        testWorkerDeletedAndReplaced(manager, searchId);
      });
    });
  });

  describe('startNewSearchIfFree', () => {
    let manager;
    beforeEach(() => {
      manager = new _workerManager.WorkerManager();
      jest.spyOn(manager, 'notifyNewSearch');
    });
    it('should start next inProgress search that is not assigned a worker', async () => {
      manager.workers = {
        [_workersFixtures.search1Id]: {},
        [_workersFixtures.search2Id]: {} };

      await manager.startNewSearchIfFree();
      expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search4Id);
    });
    describe('if there are no unassigned inProgress searches', () => {
      it('should start next pending search', async () => {
        await _model.default.save({ _id: _workersFixtures.search4Id, status: 'completed' });
        manager.workers = {
          [_workersFixtures.search1Id]: {},
          [_workersFixtures.search2Id]: {} };

        await manager.startNewSearchIfFree();
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search3Id);
      });
    });
    describe('if there are no available inProgress or pending searches', () => {
      it('should not start new search', async () => {
        await _model.default.save({ _id: _workersFixtures.search4Id, status: 'completed' });
        await _model.default.save({ _id: _workersFixtures.search3Id, status: 'completed' });
        manager.workers = {
          [_workersFixtures.search1Id]: {},
          [_workersFixtures.search2Id]: {} };

        await manager.startNewSearchIfFree();
        expect(manager.notifyNewSearch).not.toHaveBeenCalled();
      });
    });
    describe('if manager already has max number of workers', () => {
      it('should not start new search', async () => {
        manager.workers = {
          search1: {},
          search2: {},
          search3: {} };

        await manager.startNewSearchIfFree();
        expect(manager.notifyNewSearch).not.toHaveBeenCalled();
      });
    });
  });

  describe('start', () => {
    let manager;
    beforeEach(() => {
      manager = new _workerManager.WorkerManager();
      jest.spyOn(manager, 'notifyNewSearch');
    });
    it('should start an inProgress search for each worker', async () => {
      await manager.start();
      expect(manager.notifyNewSearch).toHaveBeenCalledTimes(3);
      expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search1Id);
      expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search2Id);
      expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search4Id);
    });
    describe('if there are fewer inProgress searches than workers', () => {
      it('should use assign pending searches to remaining workers', async () => {
        await _model.default.save({ _id: _workersFixtures.search1Id, status: 'completed' });
        await manager.start();
        expect(manager.notifyNewSearch).toHaveBeenCalledTimes(3);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search2Id);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search4Id);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search3Id);
      });
    });
    describe('if there are fewer inProgress and pending searches than workers', () => {
      it('should not start additional workers', async () => {
        await _model.default.save({ _id: _workersFixtures.search1Id, status: 'completed' });
        await _model.default.save({ _id: _workersFixtures.search2Id, status: 'completed' });
        await manager.start();
        expect(manager.notifyNewSearch).toHaveBeenCalledTimes(2);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search4Id);
        expect(manager.notifyNewSearch).toHaveBeenCalledWith(_workersFixtures.search3Id);
      });
    });
    describe('if there are no inProgress or pending searches', () => {
      it('should not start any search worker', async () => {
        await _model.default.db.updateMany({}, { status: 'completed' });
        await manager.start();
        expect(manager.notifyNewSearch).not.toHaveBeenCalled();
      });
    });
  });
});