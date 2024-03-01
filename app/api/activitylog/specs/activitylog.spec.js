import db from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import activitylog from '../activitylog';
import * as activityLogParser from '../activitylogParser';
import fixtures from './fixtures';

const assessResults = (results, expected) => {
  expect(results.rows.length).toBe(expected.size);
  expect(results.remainingRows).toBe(expected.remainingRows);
  expect(results.limit).toBe(expected.limit);
  expect(results.rows.map(r => r.time)).toEqual(expected.times);
  expect(results.query).toBe(expected.query);
};

describe('activitylog', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    jest.resetAllMocks();
    jest
      .spyOn(activityLogParser, 'getSemanticData')
      .mockReturnValue(Promise.resolve({ beautified: true }));
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('save()', () => {
    it('should save the entry', async () => {
      await activitylog.save({ method: 'DELETE', url: '/api/thesauri' });
      const {
        rows: [log],
      } = await activitylog.get({ url: '/api/thesauri' });
      expect(log.method).toBe('DELETE');
    });
  });

  describe('get()', () => {
    it('should return all entries', async () => {
      const { rows: entries } = await activitylog.get();
      expect(entries.length).toBe(5);
    });

    it('should include semantic info for each result', async () => {
      const { rows: entries } = await activitylog.get();
      expect(activityLogParser.getSemanticData.mock.calls.length).toBe(5);
      expect(activityLogParser.getSemanticData).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          query: '{"sharedId":"123"}',
          url: '/api/entities',
          username: 'admin',
        })
      );
      entries.forEach(e => {
        expect(e.semantic).toEqual({ beautified: true });
      });
    });

    describe('when filtering', () => {
      it('should filter by method', async () => {
        const { rows } = await activitylog.get({ method: ['POST'] });
        rows.forEach(row => {
          expect(row.method).toBe('POST');
        });
      });

      it('should filter by time', async () => {
        let { rows: entries } = await activitylog.get({ time: { from: 5, to: 6 } });
        expect(entries.length).toBe(2);
        expect(entries[0].time).toBe(6000);
        expect(entries[1].time).toBe(5000);

        ({ rows: entries } = await activitylog.get({ time: { from: null } }));
        expect(entries.length).toBe(5);

        ({ rows: entries } = await activitylog.get({ time: { to: null } }));
        expect(entries.length).toBe(5);
      });

      it('should filter by url', async () => {
        const { rows: entries } = await activitylog.get({ url: 'entities' });
        expect(entries.length).toBe(4);
      });

      it('should filter by query', async () => {
        const { rows: entries } = await activitylog.get({ query: '123' });
        expect(entries.length).toBe(1);
        expect(entries[0].query).toBe('{"sharedId":"123"}');
      });

      it('should filter by body', async () => {
        const { rows: entries } = await activitylog.get({ body: 'Hello' });
        expect(entries.length).toBe(1);
        expect(entries[0].body).toBe('{"_id":"123","title":"Hello"}');
      });

      it('should filter by username', async () => {
        const { rows: entries } = await activitylog.get({ username: 'admin' });
        expect(entries.length).toBe(2);
      });

      it('should filter by anonymous user', async () => {
        const { rows: entries } = await activitylog.get({ username: 'anonymous' });
        expect(entries.length).toBe(2);
        expect(entries[0].username).toBeUndefined();
      });

      it('should allow a general find query of terms', async () => {
        const { rows: entries } = await activitylog.get({ find: 'Hello' });
        expect(entries.length).toBe(3);
        expect(entries[0].time).toBe(8000);
        expect(entries[1].time).toBe(6000);
        expect(entries[2].time).toBe(5000);
      });
    });

    describe('Load More functionality', () => {
      it('should allow to load more via "before" param', async () => {
        const initialResults = await activitylog.get({ limit: 2 });
        assessResults(initialResults, { size: 2, remainingRows: 3, limit: 2, times: [8000, 6000] });

        const nextResults = await activitylog.get({ before: 6000, limit: 2 });
        assessResults(nextResults, { size: 2, remainingRows: 1, limit: 2, times: [5000, 2000] });
      });
    });

    describe('pagination via the "page" and "limit" keywords', () => {
      it('should paginate the results', async () => {
        let results = await activitylog.get({ limit: 2 });
        assessResults(results, {
          size: 2,
          remainingRows: 3,
          limit: 2,
          page: undefined,
          times: [8000, 6000],
        });

        results = await activitylog.get({ page: 1, limit: 2 });
        assessResults(results, {
          size: 2,
          remainingRows: 3,
          limit: 2,
          page: 1,
          times: [8000, 6000],
        });

        results = await activitylog.get({ page: 2, limit: 2 });
        assessResults(results, {
          size: 2,
          remainingRows: 1,
          limit: 2,
          page: 2,
          times: [5000, 2000],
        });

        results = await activitylog.get({ page: 3, limit: 2 });
        assessResults(results, { size: 1, remainingRows: 0, limit: 2, page: 3, times: [1000] });
      });

      it('should return an empty array if the page is out of range', async () => {
        const results = await activitylog.get({ page: 4, limit: 2 });
        assessResults(results, { size: 0, remainingRows: 0, limit: 2, page: 4, times: [] });
      });

      it('should still filter the results', async () => {
        let results = await activitylog.get({ page: 1, limit: 2, method: ['PUT'] });
        assessResults(results, {
          size: 2,
          remainingRows: 1,
          limit: 2,
          page: 1,
          times: [8000, 6000],
        });

        results = await activitylog.get({ page: 2, limit: 2, method: ['PUT'] });
        assessResults(results, { size: 1, remainingRows: 0, limit: 2, page: 2, times: [1000] });
      });
    });
  });
});
