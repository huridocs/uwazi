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
      expect(entries.length).toBe(6);
    });

    it('should include semantic info for each result', async () => {
      const { rows: entries } = await activitylog.get();
      expect(activityLogParser.getSemanticData.mock.calls.length).toBe(6);
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

    // eslint-disable-next-line max-statements
    describe('when filtering', () => {
      it('should filter by method', async () => {
        const { rows } = await activitylog.get({ method: ['POST'] });
        rows.forEach(row => {
          expect(row.method).toBe('POST');
        });
      });

      it('should filter by time', async () => {
        let { rows: entries } = await activitylog.get({
          time: { from: 1200002400000, to: 1300003200000 },
        });
        expect(entries.length).toBe(2);
        expect(entries[0].time).toBe(1300003200000);
        expect(entries[1].time).toBe(1200002400000);

        ({ rows: entries } = await activitylog.get({ time: { from: null } }));
        expect(entries.length).toBe(6);

        ({ rows: entries } = await activitylog.get({ time: { to: null } }));
        expect(entries.length).toBe(6);
      });

      it('should filter by url', async () => {
        const { rows: entries } = await activitylog.get({ url: '/api/entities' });
        expect(entries.length).toBe(4);
      });

      it('should filter by query', async () => {
        const { rows: entries } = await activitylog.get({ query: '123' });
        expect(entries.length).toBe(2);
        expect(entries[0].query).toBe('{"sharedId":"123"}');
      });

      it('should filter by body', async () => {
        const { rows: entries } = await activitylog.get({ body: 'Hello' });
        expect(entries.length).toBe(1);
        expect(entries[0].body).toBe('{"title":"Hello"}');
      });

      it('should filter by username', async () => {
        const { rows: entries } = await activitylog.get({ username: 'admin' });
        expect(entries.length).toBe(2);
      });

      it('should filter by anonymous user', async () => {
        const { rows: entries } = await activitylog.get({ username: 'anonymous' });
        expect(entries.length).toBe(3);
        expect(entries[0].username).toBeUndefined();
      });

      it('should allow a general find query of terms', async () => {
        const { rows: entries } = await activitylog.get({ find: 'Hello' });
        expect(entries.length).toBe(3);
        expect(entries[0].time).toBe(1400000400000);
        expect(entries[1].time).toBe(1300003200000);
        expect(entries[2].time).toBe(1200002400000);
      });

      it('should filter by semantic text', async () => {
        const { rows: entries } = await activitylog.get({ search: 'Deleted entity' });
        expect(entries).toEqual([
          expect.objectContaining({
            method: 'DELETE',
            url: '/api/entities',
            query: '{"sharedId":"123"}',
            time: 1100001600000,
            username: 'admin',
          }),
        ]);
      });

      it('should filter by semantic method ', async () => {
        const { rows: entries } = await activitylog.get({ search: 'create' });
        expect(entries).toEqual([
          expect.objectContaining({
            method: 'POST',
            url: '/api/entities',
            query: '{"sharedId":"123"}',
            body: '{"_id":"456","title":"Entity 1"}',
            time: 1500008400000,
          }),
          expect.objectContaining({
            method: 'POST',
            url: '/api/entities',
            body: '{"title":"Hello"}',
            query: '{}',
            time: 1200002400000,
            username: 'admin',
          }),
        ]);
      });

      it('should filter by semantic method and a search term', async () => {
        const { rows: entries } = await activitylog.get({ method: ['create'], search: 'Hello' });
        expect(entries).toEqual([
          expect.objectContaining({
            method: 'POST',
            url: '/api/entities',
            body: '{"title":"Hello"}',
            query: '{}',
            time: 1200002400000,
            username: 'admin',
          }),
        ]);
      });

      it('should filter by a composed query ', async () => {
        const { rows: entries } = await activitylog.get({
          url: '/api/entities',
          username: 'admin',
          method: ['POST'],
        });
        expect(entries).toEqual([expect.objectContaining({ time: 1200002400000 })]);
      });
    });

    describe('Load More functionality', () => {
      it('should allow to load more via "before" param', async () => {
        const initialResults = await activitylog.get({ limit: 2 });
        assessResults(initialResults, {
          size: 2,
          remainingRows: 4,
          limit: 2,
          times: [1500008400000, 1400000400000],
        });

        const nextResults = await activitylog.get({ before: 1300003200000, limit: 2 });
        assessResults(nextResults, {
          size: 2,
          remainingRows: 1,
          limit: 2,
          times: [1200002400000, 1100001600000],
        });
      });
    });

    describe('pagination via the "page" and "limit" keywords', () => {
      it('should paginate the results', async () => {
        let results = await activitylog.get({ limit: 2 });
        assessResults(results, {
          size: 2,
          remainingRows: 4,
          limit: 2,
          page: undefined,
          times: [1500008400000, 1400000400000],
        });

        results = await activitylog.get({ page: 1, limit: 2 });
        assessResults(results, {
          size: 2,
          remainingRows: 4,
          limit: 2,
          page: 1,
          times: [1500008400000, 1400000400000],
        });

        results = await activitylog.get({ page: 2, limit: 2 });
        assessResults(results, {
          size: 2,
          remainingRows: 2,
          limit: 2,
          page: 2,
          times: [1300003200000, 1200002400000],
        });

        results = await activitylog.get({ page: 3, limit: 2 });
        assessResults(results, {
          size: 2,
          remainingRows: 0,
          limit: 2,
          page: 3,
          times: [1100001600000, 1000011600000],
        });
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
          times: [1400000400000, 1300003200000],
        });

        results = await activitylog.get({ page: 2, limit: 2, method: ['PUT'] });
        assessResults(results, {
          size: 1,
          remainingRows: 0,
          limit: 2,
          page: 2,
          times: [1000011600000],
        });
      });
    });

    describe('sorting through the "sort" keyword', () => {
      const checkSortResults = async (params, expectedTimeOrder) => {
        const results = await activitylog.get(params);
        expect(results.rows.map(r => r.time)).toEqual(expectedTimeOrder);
      };

      it('without the "sort" keyword, it should sort by time, descending as default', async () => {
        await checkSortResults(
          {},
          [1500008400000, 1400000400000, 1300003200000, 1200002400000, 1100001600000, 1000011600000]
        );
      });

      it('should sort by method', async () => {
        await checkSortResults(
          { sort: { prop: 'method', asc: 1 } },
          [1100001600000, 1500008400000, 1200002400000, 1400000400000, 1300003200000, 1000011600000]
        );

        await checkSortResults(
          { sort: { prop: 'method', asc: 0 } },
          [1400000400000, 1300003200000, 1000011600000, 1500008400000, 1200002400000, 1100001600000]
        );
      });

      it('should sort by user', async () => {
        await checkSortResults(
          { sort: { prop: 'username', asc: 1 } },
          [1500008400000, 1400000400000, 1300003200000, 1200002400000, 1100001600000, 1000011600000]
        );

        await checkSortResults(
          { sort: { prop: 'username', asc: 0 } },
          [1000011600000, 1200002400000, 1100001600000, 1500008400000, 1400000400000, 1300003200000]
        );
      });

      it('should sort by url', async () => {
        await checkSortResults(
          { sort: { prop: 'url', asc: 1 } },
          [1500008400000, 1400000400000, 1200002400000, 1100001600000, 1300003200000, 1000011600000]
        );
        await checkSortResults(
          { sort: { prop: 'url', asc: 0 } },
          [1000011600000, 1300003200000, 1500008400000, 1400000400000, 1200002400000, 1100001600000]
        );
      });

      it('should sort by time', async () => {
        await checkSortResults(
          { sort: { prop: 'time', asc: 1 } },
          [1000011600000, 1100001600000, 1200002400000, 1300003200000, 1400000400000, 1500008400000]
        );

        await checkSortResults(
          { sort: { prop: 'time', asc: 0 } },
          [1500008400000, 1400000400000, 1300003200000, 1200002400000, 1100001600000, 1000011600000]
        );
      });

      it('should respect filters', async () => {
        let results = await activitylog.get({
          sort: { prop: 'username', asc: 1 },
          method: ['PUT'],
        });
        expect(results.rows.map(r => r.time)).toEqual([
          1400000400000, 1300003200000, 1000011600000,
        ]);

        results = await activitylog.get({
          sort: { prop: 'username', asc: 0 },
          method: ['PUT'],
        });
        expect(results.rows.map(r => r.time)).toEqual([
          1000011600000, 1400000400000, 1300003200000,
        ]);
      });

      it('should respect pagination', async () => {
        let results = await activitylog.get({
          sort: { prop: 'username', asc: 1 },
          page: 1,
          limit: 2,
          method: ['PUT'],
        });
        assessResults(results, {
          size: 2,
          remainingRows: 1,
          limit: 2,
          page: 1,
          times: [1400000400000, 1300003200000],
        });

        results = await activitylog.get({
          sort: { prop: 'username', asc: 1 },
          page: 2,
          limit: 2,
          method: ['PUT'],
        });
        assessResults(results, {
          size: 1,
          remainingRows: 0,
          limit: 2,
          page: 2,
          times: [1000011600000],
        });

        results = await activitylog.get({
          sort: { prop: 'username', asc: 1 },
          page: 3,
          limit: 2,
          method: ['PUT'],
        });
        assessResults(results, { size: 0, remainingRows: 0, limit: 2, page: 3, times: [] });
      });
    });
  });
});
