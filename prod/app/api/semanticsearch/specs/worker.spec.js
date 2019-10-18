"use strict";var _worker = _interopRequireDefault(require("../worker"));
var _semanticSearch = _interopRequireDefault(require("../semanticSearch"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('worker', () => {
  afterEach(() => {
    if (_semanticSearch.default.processSearchLimit.mockClear) {
      _semanticSearch.default.processSearchLimit.mockClear();
    }
  });
  describe('start', () => {
    beforeEach(() => {
      jest.spyOn(_semanticSearch.default, 'processSearchLimit').
      mockResolvedValueOnce({ updatedSearch: { status: 'inProgress' } }).
      mockResolvedValueOnce({ updatedSearch: { status: 'inProgress' } }).
      mockResolvedValueOnce({ updatedSearch: { status: 'completed' } });
    });
    it('should process documents in the search in batches and emit event when done', done => {
      const searchId = 'search';
      const batchSize = 5;

      const worker = new _worker.default(searchId, batchSize);
      worker.start();

      worker.on('done', () => {
        expect(_semanticSearch.default.processSearchLimit).toHaveBeenCalledTimes(3);
        expect(_semanticSearch.default.processSearchLimit.mock.calls).toMatchSnapshot();
        done();
      });
    });
    it('should emit update event after each batch is processed', done => {
      const worker = new _worker.default('search', 5);
      jest.spyOn(worker, 'emit');

      worker.on('done', () => {
        expect(worker.emit.mock.calls).toMatchSnapshot();
        done();
      });

      worker.start();
    });
    it('should stop processing when search status is stopped and emit stopped event', done => {
      _semanticSearch.default.processSearchLimit.mockReset();
      jest.spyOn(_semanticSearch.default, 'processSearchLimit').
      mockResolvedValueOnce({ updatedSearch: { status: 'inProgress' } }).
      mockResolvedValueOnce({ updatedSearch: { status: 'stopped' } });

      const worker = new _worker.default('searchStop', 5);
      jest.spyOn(worker, 'emit');

      worker.on('stopped', () => {
        expect(_semanticSearch.default.processSearchLimit).toHaveBeenCalledTimes(2);
        expect(worker.emit.mock.calls).toMatchSnapshot();
        done();
      });
      worker.on('done', () => {
        fail('should emit stopped event instead');
        done();
      });
      worker.start();
    });
    it('should stop processing when error occurs and emit error event', done => {
      const error = new Error('error');
      _semanticSearch.default.processSearchLimit.mockReset();
      jest.spyOn(_semanticSearch.default, 'processSearchLimit').
      mockResolvedValueOnce({ updatedSearch: { status: 'inProgress' } }).
      mockRejectedValueOnce(error).
      mockResolvedValueOnce({ updatedSearch: { status: 'completed' } });

      const worker = new _worker.default('search', 5);
      worker.start();

      worker.on('error', e => {
        expect(e).toEqual(error);
        expect(_semanticSearch.default.processSearchLimit).toHaveBeenCalledTimes(2);
        done();
      });
      worker.on('done', () => {
        fail('should emit error');
        done();
      });
    });
  });
});