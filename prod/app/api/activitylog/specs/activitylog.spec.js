"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _activitylog = _interopRequireDefault(require("../activitylog"));
var activityLogParser = _interopRequireWildcard(require("../activitylogParser"));
var _fixtures = _interopRequireDefault(require("./fixtures"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('activitylog', () => {
  beforeEach(async () => {
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
    spyOn(activityLogParser, 'getSemanticData').and.returnValue(Promise.resolve({ beautified: true }));
  });

  afterAll(async () => {
    await _testing_db.default.disconnect();
  });

  describe('save()', () => {
    it('should save the entry', async () => {
      await _activitylog.default.save({ method: 'DELETE', url: '/api/thesauri' });
      const { rows: [log] } = await _activitylog.default.get({ url: '/api/thesauri' });
      expect(log.method).toBe('DELETE');
    });
  });

  describe('get()', () => {
    it('should return the entries, excluding certain routes (that should be logged, and not presented)', async () => {
      const { rows: entries } = await _activitylog.default.get();
      expect(entries.length).toBe(5);
    });

    it('should inlcude semantic info for each result', async () => {
      const { rows: entries } = await _activitylog.default.get();
      expect(activityLogParser.getSemanticData.calls.count()).toBe(5);
      expect(activityLogParser.getSemanticData).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE', query: '{"sharedId":"123"}', url: '/api/entities', username: 'admin' }));

      entries.forEach(e => {
        expect(e.semantic).toEqual({ beautified: true });
      });
    });

    it('should filter by method', async () => {
      const { rows: entries } = await _activitylog.default.get({ method: ['POST'] });
      expect(entries.length).toBe(1);
      expect(entries[0].method).toBe('POST');
    });

    it('should filter by time', async () => {
      let { rows: entries } = await _activitylog.default.get({ time: { from: 5, to: 6 } });
      expect(entries.length).toBe(2);
      expect(entries[0].time).toBe(6000);
      expect(entries[1].time).toBe(5000);

      ({ rows: entries } = await _activitylog.default.get({ time: { from: null } }));
      expect(entries.length).toBe(5);

      ({ rows: entries } = await _activitylog.default.get({ time: { to: null } }));
      expect(entries.length).toBe(5);
    });

    it('should filter by url', async () => {
      const { rows: entries } = await _activitylog.default.get({ url: 'entities' });
      expect(entries.length).toBe(4);
    });

    it('should filter by query', async () => {
      const { rows: entries } = await _activitylog.default.get({ query: '123' });
      expect(entries.length).toBe(1);
      expect(entries[0].query).toBe('{"sharedId":"123"}');
    });

    it('should filter by body', async () => {
      const { rows: entries } = await _activitylog.default.get({ body: 'Hello' });
      expect(entries.length).toBe(1);
      expect(entries[0].body).toBe('{"_id":"123","title":"Hello"}');
    });

    it('should filter by username', async () => {
      const { rows: entries } = await _activitylog.default.get({ username: 'admin' });
      expect(entries.length).toBe(2);
    });

    it('should allow a general find query of terms', async () => {
      const { rows: entries } = await _activitylog.default.get({ find: 'Hello' });
      expect(entries.length).toBe(3);
      expect(entries[0].time).toBe(8000);
      expect(entries[1].time).toBe(6000);
      expect(entries[2].time).toBe(5000);
    });

    describe('Load More functionality', () => {
      const assessResults = (results, expected) => {
        expect(results.rows.length).toBe(expected.size);
        expect(results.remainingRows).toBe(expected.remainingRows);
        expect(results.limit).toBe(expected.limit);
        expect(results.rows[0].time).toBe(expected.initialTime);
      };

      it('should allow to load more via "before" param', async () => {
        const initialResults = await _activitylog.default.get({ limit: 2 });
        assessResults(initialResults, { size: 2, remainingRows: 3, limit: 2, initialTime: 8000 });

        const nextResults = await _activitylog.default.get({ before: 6000, limit: 2 });
        assessResults(nextResults, { size: 2, remainingRows: 1, limit: 2, initialTime: 5000 });
      });
    });
  });
});